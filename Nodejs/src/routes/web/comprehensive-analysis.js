const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const comprehensiveAnalysisController = require('../../controller/web/comprehensiveAnalysisController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    const allowedExtensions = ['.m4a', '.mp4', '.mp3', '.wav', '.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .m4a, .mp3, .wav, .pdf, .docx, and .txt files are allowed.'), false);
    }
  }
});

// Process comprehensive analysis
router.post('/', upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'productServiceDocument', maxCount: 1 }
]), [
  body('callDataType').isIn(['audio', 'fathom', 'transcript']).withMessage('Call data type must be audio, fathom, or transcript'),
  body('productServiceType').isIn(['url', 'document']).withMessage('Product/service type must be url or document'),
  body('promptType').isIn(['default', 'custom']).withMessage('Prompt type must be default or custom'),
  body('fathomUrl').optional().isURL().withMessage('Fathom URL must be valid'),
  body('transcript').optional().isLength({ min: 50 }).withMessage('Transcript must be at least 50 characters'),
  body('productServiceUrl').optional().isURL().withMessage('Product/service URL must be valid'),
  body('customPrompt').optional().isLength({ min: 10 }).withMessage('Custom prompt must be at least 10 characters')
], comprehensiveAnalysisController.processAnalysis);

// Get statistics (must be before /:id)
router.get('/stats/overview', comprehensiveAnalysisController.getStatistics);

// Get API health status
router.get('/health', comprehensiveAnalysisController.getHealthStatus);

// Get all analyses
router.get('/', comprehensiveAnalysisController.getAllAnalyses);

// Get analysis by ID
router.get('/:id', comprehensiveAnalysisController.getAnalysisById);

// Delete analysis
router.delete('/:id', comprehensiveAnalysisController.deleteAnalysis);

module.exports = router;

