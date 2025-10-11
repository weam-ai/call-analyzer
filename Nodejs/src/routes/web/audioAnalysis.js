const express = require('express');
const multer = require('multer');
const audioAnalysisController = require('../../controller/web/audioAnalysisController');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'audio/x-ms-wma',
      'audio/aiff',
      'audio/basic'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
});

// Upload and analyze audio file
router.post('/upload', upload.single('audioFile'), audioAnalysisController.uploadAudio);

// Get analysis statistics (must be before /:id)
router.get('/stats/overview', audioAnalysisController.getStatistics);

// Get file list (must be before /:id)
router.get('/files/list', audioAnalysisController.listFiles);

// Get file metadata
router.get('/files/:fileName/metadata', audioAnalysisController.getFileMetadata);

// Get all user analyses
router.get('/', audioAnalysisController.getUserAnalyses);

// Get analysis by ID
router.get('/:id', audioAnalysisController.getAnalysisById);

// Export analysis
router.get('/:id/export', audioAnalysisController.exportAnalysis);

// Delete analysis
router.delete('/:id', audioAnalysisController.deleteAnalysis);

// Retry failed analysis
router.post('/:id/retry', audioAnalysisController.retryAnalysis);

// Cleanup old files
router.post('/cleanup', audioAnalysisController.cleanupFiles);

module.exports = router;

