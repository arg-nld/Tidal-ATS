import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUploadedFile } from '../middleware/uploadSecurity.js';
import { validateParsedResume } from '../services/aiValidation.js';
import { validEmail, validUrl } from '../middleware/inputValidation.js';

test('rejects a fake PDF whose extension is .pdf but content is HTML', () => {
  const result = validateUploadedFile({ originalname: 'resume.pdf', mimetype: 'application/pdf', size: 40, buffer: Buffer.from('<html><script>alert(1)</script></html>') }, { kind: 'resume' });
  assert.equal(result.ok, false);
});

test('accepts a minimal valid PDF signature', () => {
  const result = validateUploadedFile({ originalname: 'resume.pdf', mimetype: 'application/pdf', size: 5, buffer: Buffer.from('%PDF-') }, { kind: 'resume' });
  assert.equal(result.ok, true);
  assert.equal(result.type, 'pdf');
});

test('rejects executable-like resume MIME types', () => {
  const result = validateUploadedFile({ originalname: 'resume.exe', mimetype: 'application/x-msdownload', size: 10, buffer: Buffer.from('MZ') }, { kind: 'resume' });
  assert.equal(result.ok, false);
});

test('rejects unsafe meeting links', () => {
  assert.throws(() => validUrl('javascript:alert(1)', 'Meeting link'));
  assert.equal(validUrl('https://meet.google.com/example', 'Meeting link'), 'https://meet.google.com/example');
});

test('validates and restricts AI resume output to the expected structure', () => {
  const result = validateParsedResume({
    name: 'Jane Doe', email: 'jane@example.com', phone: '+1 555 1234', role: 'Data Analyst',
    skills: ['Python', 'SQL'], experienceSummary: 'Analyst with five years of experience.',
    education: 'BS Computer Science', resumeText: 'Jane Doe\nData Analyst\nPython\nSQL',
    maliciousField: 'should be dropped'
  });
  assert.deepEqual(result, {
    name: 'Jane Doe', email: 'jane@example.com', phone: '+1 555 1234', role: 'Data Analyst',
    skills: ['Python', 'SQL'], experienceSummary: 'Analyst with five years of experience.',
    education: 'BS Computer Science', resumeText: 'Jane Doe\nData Analyst\nPython\nSQL'
  });
});

test('rejects malformed AI email output', () => {
  assert.throws(() => validateParsedResume({ name: 'Jane Doe', email: 'not-an-email', phone: '', role: 'Analyst', skills: [], experienceSummary: '', education: '', resumeText: 'Resume' }));
});

test('rejects malformed email addresses', () => {
  assert.throws(() => validEmail('invalid-email'));
  assert.equal(validEmail('Jane@example.com'), 'jane@example.com');
});

test('accepts valid interview email attachments including JPEG, PNG, and ICS', () => {
  const jpgResult = validateUploadedFile({ originalname: 'photo.jpg', mimetype: 'image/jpg', size: 3, buffer: Buffer.from([0xFF, 0xD8, 0xFF]) }, { kind: 'attachment' });
  assert.equal(jpgResult.ok, true);
  assert.equal(jpgResult.type, 'jpeg');

  const pngResult = validateUploadedFile({ originalname: 'diagram.png', mimetype: 'image/png', size: 8, buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }, { kind: 'attachment' });
  assert.equal(pngResult.ok, true);
  assert.equal(pngResult.type, 'png');

  const icsResult = validateUploadedFile({ originalname: 'invite.ics', mimetype: 'text/calendar', size: 20, buffer: Buffer.from('BEGIN:VCALENDAR\nEND:VCALENDAR') }, { kind: 'attachment' });
  assert.equal(icsResult.ok, true);
  assert.equal(icsResult.type, 'ics');
});

test('rejects unsupported attachment types for interview emails', () => {
  const zipResult = validateUploadedFile({ originalname: 'archive.zip', mimetype: 'application/zip', size: 10, buffer: Buffer.from('PK\x03\x04') }, { kind: 'attachment' });
  assert.equal(zipResult.ok, false);
});
