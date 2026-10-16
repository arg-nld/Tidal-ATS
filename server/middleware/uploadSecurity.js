import path from 'node:path';

const RESUME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/octet-stream'
]);

const ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/png',
  'image/x-png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/webp',
  'text/calendar',
  'application/ics',
  'text/x-vcalendar',
  'application/octet-stream'
]);

function hasPrefix(buffer, bytes) {
  return buffer?.subarray(0, bytes.length).equals(Buffer.from(bytes));
}

function hasAscii(buffer, text) {
  return buffer?.includes(Buffer.from(text, 'utf8'));
}

export function detectFileType(file) {
  const buffer = file?.buffer;
  const ext = path.extname(file?.originalname || '').toLowerCase();
  const mime = String(file?.mimetype || '').toLowerCase();

  if (!buffer || !buffer.length) return null;

  if (mime === 'application/pdf' || mime === 'application/x-pdf' || ext === '.pdf') {
    return hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46, 0x2D]) ? 'pdf' : null;
  }

  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    const looksLikeZip = hasPrefix(buffer, [0x50, 0x4B, 0x03, 0x04]) || hasPrefix(buffer, [0x50, 0x4B, 0x05, 0x06]) || hasPrefix(buffer, [0x50, 0x4B, 0x07, 0x08]);
    if (looksLikeZip && hasAscii(buffer, 'word/document.xml') && hasAscii(buffer, '[Content_Types].xml')) return 'docx';
    return null;
  }

  if (mime === 'application/msword' || ext === '.doc') {
    return hasPrefix(buffer, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) ? 'doc' : null;
  }

  if (mime === 'text/calendar' || mime === 'application/ics' || mime === 'text/x-vcalendar' || ext === '.ics') {
    if (hasAscii(buffer, 'BEGIN:VCALENDAR')) return 'ics';
    return null;
  }

  if (mime === 'text/plain' || ext === '.txt') {
    if (buffer.includes(0x00)) return null;
    return 'txt';
  }

  if (mime === 'image/png' || mime === 'image/x-png' || ext === '.png') {
    return hasPrefix(buffer, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) ? 'png' : null;
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/pjpeg' || ext === '.jpg' || ext === '.jpeg') {
    return hasPrefix(buffer, [0xFF, 0xD8, 0xFF]) ? 'jpeg' : null;
  }

  if (mime === 'image/webp' || ext === '.webp') {
    return hasAscii(buffer.subarray(0, 16), 'WEBP') && hasAscii(buffer.subarray(0, 4), 'RIFF') ? 'webp' : null;
  }

  return null;
}

function isExtensionConsistent(file, detectedType) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const expected = {
    pdf: ['.pdf'],
    docx: ['.docx'],
    doc: ['.doc'],
    txt: ['.txt'],
    png: ['.png'],
    jpeg: ['.jpg', '.jpeg'],
    webp: ['.webp'],
    ics: ['.ics']
  }[detectedType] || [];
  return expected.includes(ext);
}

export function validateUploadedFile(file, { kind = 'resume' } = {}) {
  if (!file) return { ok: true, type: null };

  const maxBytes = kind === 'resume' ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: 'Uploaded file is empty.' };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `Uploaded file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.` };
  }

  const allowed = kind === 'resume' ? RESUME_TYPES : ATTACHMENT_TYPES;
  const mime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = kind === 'resume'
    ? new Set(['.pdf', '.docx', '.doc', '.txt'])
    : new Set(['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.ics']);

  if (!allowed.has(mime) && !allowedExts.has(ext)) {
    return { ok: false, error: 'File type is not allowed.' };
  }

  const detectedType = detectFileType(file);
  if (!detectedType) return { ok: false, error: 'The file contents do not match a supported file type.' };
  if (!isExtensionConsistent(file, detectedType)) return { ok: false, error: 'The file extension does not match the detected file type.' };

  if (kind === 'resume' && !['pdf', 'docx', 'doc', 'txt'].includes(detectedType)) {
    return { ok: false, error: 'Only PDF, DOCX, DOC, and TXT resumes are supported.' };
  }

  if (kind === 'attachment' && !['pdf', 'docx', 'doc', 'txt', 'png', 'jpeg', 'webp', 'ics'].includes(detectedType)) {
    return { ok: false, error: 'Only PDF, DOCX, DOC, TXT, PNG, JPG/JPEG, WEBP, and ICS attachments are supported.' };
  }

  return { ok: true, type: detectedType };
}

export function validateInterviewAttachments(req, res, next) {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length > 5) {
    return res.status(400).json({ error: 'You can attach at most 5 files.' });
  }
  const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  if (totalBytes > 20 * 1024 * 1024) {
    return res.status(413).json({ error: 'Combined email attachments cannot exceed 20 MB.' });
  }

  for (const file of files) {
    const result = validateUploadedFile(file, { kind: 'attachment' });
    if (!result.ok) return res.status(400).json({ error: `${file.originalname || 'Attachment'}: ${result.error}` });
  }

  next();
}

export { RESUME_TYPES, ATTACHMENT_TYPES };
