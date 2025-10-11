const audioAnalysisService = require('../../services/audioAnalysisService');
const logger = require('../../utils/logger');

/**
 * @desc    Upload audio file and start analysis
 * @route   POST /call-analyzer-api/audio-analysis/upload
 * @access  Private
 */
exports.uploadAudio = async (req, res) => {
  try {
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
};

/**
 * @desc    Get analysis by ID
 * @route   GET /call-analyzer-api/audio-analysis/:id
 * @access  Private
 */
exports.getAnalysisById = async (req, res) => {
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
};

/**
 * @desc    Get all analyses for user
 * @route   GET /call-analyzer-api/audio-analysis
 * @access  Private
 */
exports.getUserAnalyses = async (req, res) => {
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
};

/**
 * @desc    Delete analysis
 * @route   DELETE /call-analyzer-api/audio-analysis/:id
 * @access  Private
 */
exports.deleteAnalysis = async (req, res) => {
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
};

/**
 * @desc    Retry failed analysis
 * @route   POST /call-analyzer-api/audio-analysis/:id/retry
 * @access  Private
 */
exports.retryAnalysis = async (req, res) => {
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
};

/**
 * @desc    Export analysis data
 * @route   GET /call-analyzer-api/audio-analysis/:id/export
 * @access  Private
 */
exports.exportAnalysis = async (req, res) => {
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
};

/**
 * @desc    Get analysis statistics
 * @route   GET /call-analyzer-api/audio-analysis/stats/overview
 * @access  Private
 */
exports.getStatistics = async (req, res) => {
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
};

/**
 * @desc    List uploaded files
 * @route   GET /call-analyzer-api/audio-analysis/files/list
 * @access  Private
 */
exports.listFiles = async (req, res) => {
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
};

/**
 * @desc    Get file metadata
 * @route   GET /call-analyzer-api/audio-analysis/files/:fileName/metadata
 * @access  Private
 */
exports.getFileMetadata = async (req, res) => {
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
};

/**
 * @desc    Cleanup old files
 * @route   POST /call-analyzer-api/audio-analysis/cleanup
 * @access  Private
 */
exports.cleanupFiles = async (req, res) => {
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
};

