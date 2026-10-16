import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import {
  getApplications,
  getApplicationById,
  getResumeFile,
  getInterviewAvailability,
  createApplication,
  updateStage,
  updateRecruiterNotes,
  scheduleInterview,
  recordEvaluation,
  recordScorecard,
  getScorecards,
  getTimeline,
  getDuplicates,
  getAllDuplicates,
  mergeCandidates,
  createOrUpdateOffer,
  approveOffer,
  sendOffer,
  respondToOffer,
  withdrawOffer,
  deleteApplication
} from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validateApplicationBody, validateStageBody, validateNotesBody, validateInterviewBody, validateEvaluationBody } from '../middleware/inputValidation.js';
import { validateUploadedFile, validateInterviewAttachments, RESUME_TYPES, ATTACHMENT_TYPES } from '../middleware/uploadSecurity.js';
import { resumeUploadRateLimiter, interviewEmailRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const applicationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const allowedExts = new Set(['.pdf', '.docx', '.doc', '.txt']);
    if (!RESUME_TYPES.has(mime) && !allowedExts.has(ext)) {
      return cb(Object.assign(new Error('Only PDF, DOCX, DOC, and TXT resumes are supported.'), { status: 400 }));
    }
    cb(null, true);
  }
});

const interviewUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const allowedExts = new Set(['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.ics']);
    if (!ATTACHMENT_TYPES.has(mime) && !allowedExts.has(ext)) {
      return cb(Object.assign(new Error('Only PDF, DOCX, DOC, TXT, PNG, JPG/JPEG, WEBP, and ICS attachments are supported.'), { status: 400 }));
    }
    cb(null, true);
  }
});

// General application listing & creation
router.get('/', requireAuth, getApplications);
router.get('/availability', requireRole('hr'), getInterviewAvailability);
router.get('/duplicates/all', requireRole('hr'), getAllDuplicates);
router.post('/merge', requireRole('hr'), mergeCandidates);

router.post('/', requireRole('applicant'), resumeUploadRateLimiter, applicationUpload.single('resumeFile'), (req, res, next) => {
  const result = validateUploadedFile(req.file, { kind: 'resume' });
  if (!result.ok) return res.status(400).json({ error: result.error });
  next();
}, validateApplicationBody, createApplication);

// Specific application operations
router.get('/:id', requireAuth, getApplicationById);
router.get('/:id/resume', requireAuth, getResumeFile);
router.patch('/:id/stage', requireRole('hr'), validateStageBody, updateStage);
router.patch('/:id/notes', requireRole('hr'), validateNotesBody, updateRecruiterNotes);
router.post('/:id/interview', requireRole('hr'), interviewEmailRateLimiter, interviewUpload.array('emailAttachments', 5), validateInterviewAttachments, validateInterviewBody, scheduleInterview);
router.post('/:id/evaluation', requireRole('hr'), validateEvaluationBody, recordEvaluation);

// A. Interview Scorecards
router.get('/:id/scorecards', requireRole('hr'), getScorecards);
router.post('/:id/scorecards', requireRole('hr'), recordScorecard);

// B. Candidate Activity Timeline
router.get('/:id/timeline', requireAuth, getTimeline);

// C. Duplicate Candidate Detection
router.get('/:id/duplicates', requireRole('hr'), getDuplicates);

// D. Offer Management
router.post('/:id/offer', requireRole('hr'), createOrUpdateOffer);
router.post('/:id/offer/approve', requireRole('hr'), approveOffer);
router.post('/:id/offer/send', requireRole('hr'), sendOffer);
router.post('/:id/offer/respond', requireAuth, respondToOffer);
router.post('/:id/offer/withdraw', requireRole('hr'), withdrawOffer);

router.delete('/:id', requireRole('hr'), deleteApplication);

export default router;
