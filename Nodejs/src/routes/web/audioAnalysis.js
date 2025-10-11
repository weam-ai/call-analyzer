const express = require('express');
const multer = require('multer');
const audioAnalysisController = require('../../controller/web/audioAnalysisController');
const auth = require('../../middleware/auth');

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
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

/**
 * @route   POST /api/audio-analysis/upload
 * @desc    Upload audio file and start analysis
 * @access  Private
 */
router.post('/upload', upload.single('audioFile'), audioAnalysisController.uploadAudio);

/**
 * @route   GET /api/audio-analysis/:id
 * @desc    Get analysis by ID
 * @access  Private
 */
router.get('/:id', audioAnalysisController.getAnalysisById);

/**
 * @route   GET /api/audio-analysis
 * @desc    Get all analyses for user
 * @access  Private
 */
router.get('/', audioAnalysisController.getUserAnalyses);

/**
 * @route   DELETE /api/audio-analysis/:id
 * @desc    Delete analysis and associated files
 * @access  Private
 */
router.delete('/:id', audioAnalysisController.deleteAnalysis);

/**
 * @route   POST /api/audio-analysis/:id/retry
 * @desc    Retry failed analysis
 * @access  Private
 */
router.post('/:id/retry', audioAnalysisController.retryAnalysis);

/**
 * @route   GET /api/audio-analysis/:id/export
 * @desc    Export analysis data
 * @access  Private
 */
router.get('/:id/export', audioAnalysisController.exportAnalysis);

/**
 * @route   GET /api/audio-analysis/stats/overview
 * @desc    Get analysis statistics
 * @access  Private
 */
router.get('/stats/overview', audioAnalysisController.getStatistics);

/**
 * @route   GET /api/audio-analysis/files/list
 * @desc    List uploaded files
 * @access  Private
 */
router.get('/files/list', audioAnalysisController.listFiles);

/**
 * @route   GET /api/audio-analysis/files/:fileName/metadata
 * @desc    Get file metadata
 * @access  Private
 */
router.get('/files/:fileName/metadata', audioAnalysisController.getFileMetadata);

/**
 * @route   POST /api/audio-analysis/cleanup
 * @desc    Cleanup old files
 * @access  Private
 */
router.post('/cleanup', audioAnalysisController.cleanupFiles);

module.exports = router;

