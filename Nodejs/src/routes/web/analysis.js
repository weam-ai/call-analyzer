const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const analysisController = require('../../controller/web/analysisController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB (increased for audio files)
  },
  fileFilter: (req, file, cb) => {
    // Allow audio files and documents
    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac',
      'audio/x-ms-wma', 'audio/aiff', 'audio/basic', // Additional audio formats
      'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Check by file extension as fallback
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'pdf', 'txt', 'doc', 'docx'];
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files and documents are allowed.'), false);
    }
  }
});

// Get all analyses (no auth required)
router.get('/', analysisController.getAllAnalyses);

// Get specific analysis (no auth required)
router.get('/:id', analysisController.getAnalysisById);

// Audio Service - Analyze uploaded audio file using Gemini Files API (no auth required)
router.post('/audio', upload.single('audioFile'), [
  body('additionalUrl').optional().isURL().withMessage('Invalid URL format'),
  body('additionalDocument').optional().isString(),
  body('analysisType').optional().isIn(['comprehensive', 'basic', 'transcript-only'])
], analysisController.analyzeAudio);

// Fathom Service - Analyze Fathom video URL with embedded transcript (no auth required)
router.post('/fathom', [
  body('url').isURL().withMessage('Valid Fathom URL is required')
], analysisController.analyzeFathom);

// Keep phantom route for backward compatibility (redirects to fathom) - no auth required
router.post('/phantom', [
  body('url').isURL().withMessage('Valid URL is required')
], analysisController.analyzeFathom);

// Transcript Service - Analyze provided transcript (no auth required)
router.post('/transcript', [
  body('transcript').isLength({ min: 50 }).withMessage('Transcript must be at least 50 characters long')
], analysisController.analyzeTranscript);

// Delete analysis (no auth required)
router.delete('/:id', analysisController.deleteAnalysis);

// Get analysis statistics (no auth required)
router.get('/stats/overview', analysisController.getStatistics);

module.exports = router;

