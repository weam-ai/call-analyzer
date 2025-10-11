const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const analysisController = require('../../controller/web/analysisController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac',
      'audio/x-ms-wma', 'audio/aiff', 'audio/basic',
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'pdf', 'txt', 'doc', 'docx'];
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files and documents are allowed.'), false);
    }
  }
});

// Get all analyses
router.get('/', analysisController.getAllAnalyses);

// Get analysis statistics (must be before /:id)
router.get('/stats/overview', analysisController.getStatistics);

// Get specific analysis
router.get('/:id', analysisController.getAnalysisById);

// Analyze uploaded audio file
router.post('/audio', upload.single('audioFile'), [
  body('additionalUrl').optional().isURL().withMessage('Invalid URL format'),
  body('additionalDocument').optional().isString(),
  body('analysisType').optional().isIn(['comprehensive', 'basic', 'transcript-only'])
], analysisController.analyzeAudio);

// Analyze Fathom video URL
router.post('/fathom', [
  body('url').isURL().withMessage('Valid Fathom URL is required')
], analysisController.analyzeFathom);

// Backward compatibility - phantom redirects to fathom
router.post('/phantom', [
  body('url').isURL().withMessage('Valid URL is required')
], analysisController.analyzeFathom);

// Analyze transcript
router.post('/transcript', [
  body('transcript').isLength({ min: 50 }).withMessage('Transcript must be at least 50 characters long')
], analysisController.analyzeTranscript);

// Delete analysis
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router;

