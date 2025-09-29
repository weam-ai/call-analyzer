const express = require('express');
const multer = require('multer');
const audioAnalysisService = require('../services/audioAnalysisService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

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
router.post('/upload', upload.single('audioFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    // Validate audio file
    try {
      audioAnalysisService.validateAudioFile(req.file);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    const { additionalContent, websiteUrl, analysisType } = req.body;
    const userId = req.user.id;

    logger.info('Starting audio upload and analysis', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      userId,
      analysisType
    });

    // Process audio file
    const analysis = await audioAnalysisService.processAudioAnalysis(
      req.file,
      userId,
      {
        additionalContent,
        websiteUrl,
        analysisType
      }
    );

    res.status(201).json({
      success: true,
      message: 'Audio file uploaded and analysis started',
      data: {
        analysisId: analysis._id,
        status: analysis.status,
        serviceType: analysis.serviceType,
        createdAt: analysis.createdAt
      }
    });

  } catch (error) {
    logger.error('Audio upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Audio upload and analysis failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis/:id
 * @desc    Get analysis by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await audioAnalysisService.getAnalysis(id, userId);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Failed to get analysis:', error);
    
    if (error.message === 'Analysis not found') {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get analysis',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis
 * @desc    Get all analyses for user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {

    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      serviceType,
      status
    } = req.query;

    const result = await audioAnalysisService.getUserAnalyses(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      serviceType,
      status
    });

    res.json({
      success: true,
      data: result.analyses,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get user analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analyses',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/audio-analysis/:id
 * @desc    Delete analysis and associated files
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await audioAnalysisService.deleteAnalysis(id, userId);

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete analysis:', error);
    
    if (error.message === 'Analysis not found') {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/audio-analysis/:id/retry
 * @desc    Retry failed analysis
 * @access  Private
 */
router.post('/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await audioAnalysisService.retryAnalysis(id, userId);

    res.json({
      success: true,
      message: 'Analysis retry started',
      data: {
        analysisId: analysis._id,
        status: analysis.status
      }
    });

  } catch (error) {
    logger.error('Failed to retry analysis:', error);
    
    if (error.message === 'Failed analysis not found') {
      return res.status(404).json({
        success: false,
        message: 'Failed analysis not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retry analysis',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis/:id/export
 * @desc    Export analysis data
 * @access  Private
 */
router.get('/:id/export', async (req, res) => {
  try {

    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    const exportData = await audioAnalysisService.exportAnalysis(id, userId, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analysis_${id}.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    logger.error('Failed to export analysis:', error);
    
    if (error.message === 'Analysis not found') {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to export analysis',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis/stats/overview
 * @desc    Get analysis statistics
 * @access  Private
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await audioAnalysisService.getAnalysisStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get analysis stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analysis statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis/files/list
 * @desc    List uploaded files
 * @access  Private
 */
router.get('/files/list', async (req, res) => {
  try {

    const { pageSize = 10 } = req.query;
    const files = await audioAnalysisService.listUploadedFiles(parseInt(pageSize));

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    logger.error('Failed to list uploaded files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list uploaded files',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audio-analysis/files/:fileName/metadata
 * @desc    Get file metadata
 * @access  Private
 */
router.get('/files/:fileName/metadata', async (req, res) => {
  try {
    const { fileName } = req.params;
    const metadata = await audioAnalysisService.getFileMetadata(fileName);

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    logger.error('Failed to get file metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file metadata',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/audio-analysis/cleanup
 * @desc    Cleanup old files
 * @access  Private
 */
router.post('/cleanup', async (req, res) => {
  try {
    const result = await audioAnalysisService.cleanupOldFiles();

    res.json({
      success: true,
      message: 'Cleanup completed',
      data: result
    });

  } catch (error) {
    logger.error('Failed to cleanup old files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old files',
      error: error.message
    });
  }
});

module.exports = router;
