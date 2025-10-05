const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const audioAnalysisService = require('../services/audioAnalysisService');
const fathomService = require('../services/fathomService');
const transcriptService = require('../services/transcriptService');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/backend-config');

const router = express.Router();

// Helper function to get or create demo user
async function getDemoUser() {
  try {
    let demoUser = await User.findOne({ email: 'demo@salescallanalyzer.com' });
    
    if (!demoUser) {
      demoUser = new User({
        name: 'Demo User',
        email: 'demo@salescallanalyzer.com',
        password: 'demo123', // This won't be used for authentication
        role: 'user'
      });
      await demoUser.save();
      logger.info('Created demo user for analysis');
    }
    
    return demoUser;
  } catch (error) {
    logger.error('Error getting demo user:', error);
    throw new Error('Failed to get demo user');
  }
}


// Helper function to get user data from request
function getUserDataFromRequest(req) {
  let userId = null;
  let email = null;
  let companyId = null;
  
  // Try to get user data from request body (FormData)
  if (req.body.userId) {
    userId = req.body.userId;
    email = req.body.email;
    companyId = req.body.companyId;
  }
  
  // Try to get user data from headers (JSON API calls)
  if (!userId && req.headers['x-user-data']) {
    try {
      const userData = JSON.parse(req.headers['x-user-data']);
      userId = userData.userId;
      email = userData.email;
      companyId = userData.companyId;
    } catch (error) {
      logger.warn('Failed to parse user data from headers:', error);
    }
  }
  
  // Only return non-null values if we have actual user data
  return {
    userId: userId && userId !== 'null' && userId !== '' ? userId : null,
    email: email && email !== 'null' && email !== '' ? email : null,
    companyId: companyId && companyId !== 'null' && companyId !== '' ? companyId : null
  };
}

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
    
    // Debug logging
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    // Check by file extension as fallback
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'pdf', 'txt', 'doc', 'docx'];
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log('File rejected:', { mimetype: file.mimetype, extension: fileExtension });
      cb(new Error('Invalid file type. Only audio files and documents are allowed.'), false);
    }
  }
});

// Get all analyses (no auth required)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType, status } = req.query;
    
    const demoUser = await getDemoUser();
    const query = { userId: demoUser._id };
    if (serviceType) query.serviceType = serviceType;
    if (status) query.status = status;

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email');

    const total = await Analysis.countDocuments(query);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses'
    });
  }
});

// Get specific analysis (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const demoUser = await getDemoUser();
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: demoUser._id
    }).populate('userId', 'name email');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis'
    });
  }
});

// Audio Service - Analyze uploaded audio file using Gemini Files API (no auth required)
router.post('/audio', upload.single('audioFile'), [
  body('additionalUrl').optional().isURL().withMessage('Invalid URL format'),
  body('additionalDocument').optional().isString(),
  body('analysisType').optional().isIn(['comprehensive', 'basic', 'transcript-only'])
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    // Validate audio file using the new service
    try {
      audioAnalysisService.validateAudioFile(req.file);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Get user data from request
    const userData = getUserDataFromRequest(req);
    
    // Use provided user data or fall back to demo user
    let userId;
    if (userData.userId) {
      userId = userData.userId;
    } else {
      const demoUser = await getDemoUser();
      userId = demoUser._id;
    }
    
    const { additionalUrl, additionalDocument, analysisType = 'comprehensive' } = req.body;
    
    // Prepare additional content
    let additionalContent = '';
    if (additionalUrl) {
      additionalContent = `Additional context from URL: ${additionalUrl}`;
    } else if (additionalDocument) {
      additionalContent = `Additional document context: ${additionalDocument}`;
    }

    logger.info('Starting audio analysis with Gemini Files API', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analysisType,
      hasAdditionalContent: !!additionalContent,
      userId: userId,
      userEmail: userData.email,
      companyId: userData.companyId
    });

    // Process audio file using the new audio analysis service
    const analysis = await audioAnalysisService.processAudioAnalysis(
      req.file,
      userId,
      {
        additionalContent,
        websiteUrl: additionalUrl,
        analysisType,
        userData: userData
      }
    );

    res.status(201).json({
      success: true,
      message: 'Audio file uploaded and analysis started using Gemini Files API',
      data: {
        analysisId: analysis._id,
        status: analysis.status,
        serviceType: analysis.serviceType,
        createdAt: analysis.createdAt,
        processing: {
          upload: analysis.processing?.upload ? {
            fileName: analysis.processing.upload.fileName,
            mimeType: analysis.processing.upload.mimeType,
            sizeBytes: analysis.processing.upload.sizeBytes
          } : null,
          transcript: analysis.processing?.transcript ? {
            wordCount: analysis.processing.transcript.wordCount,
            confidence: analysis.processing.transcript.confidence,
            language: analysis.processing.transcript.language
          } : null
        }
      }
    });

  } catch (error) {
    logger.error('Audio analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process audio analysis',
      error: config.isDevelopment ? error.stack : undefined
    });
  }
});

// Fathom Service - Analyze Fathom video URL with embedded transcript (no auth required)
router.post('/fathom', [
  body('url').isURL().withMessage('Valid Fathom URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get user data from request
    const userData = getUserDataFromRequest(req);
    
    // Use provided user data or fall back to demo user
    let userId;
    if (userData.userId) {
      userId = userData.userId;
    } else {
      const demoUser = await getDemoUser();
      userId = demoUser._id;
    }
    
    const { url, additionalUrl, additionalDocument } = req.body;
    let additionalContent = null;

    if (additionalUrl) {
      additionalContent = { type: 'url', url: additionalUrl };
    } else if (additionalDocument) {
      additionalContent = { type: 'document', file: additionalDocument };
    }

    logger.info('Starting Fathom analysis', {
      url,
      userId: userId,
      userEmail: userData.email,
      companyId: userData.companyId
    });

    const analysis = await fathomService.processFathomCall(
      url,
      userId,
      additionalContent,
      userData
    );

    res.status(201).json({
      success: true,
      message: 'Fathom analysis started',
      data: analysis
    });
  } catch (error) {
    logger.error('Fathom analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process Fathom analysis'
    });
  }
});

// Keep phantom route for backward compatibility (redirects to fathom) - no auth required
router.post('/phantom', [
  body('url').isURL().withMessage('Valid URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const demoUser = await getDemoUser();
    const { url, additionalUrl, additionalDocument } = req.body;
    let additionalContent = null;

    if (additionalUrl) {
      additionalContent = { type: 'url', url: additionalUrl };
    } else if (additionalDocument) {
      additionalContent = { type: 'document', file: additionalDocument };
    }

    const analysis = await fathomService.processFathomCall(
      url,
      demoUser._id,
      additionalContent
    );

    res.status(201).json({
      success: true,
      message: 'Fathom analysis started (via phantom endpoint)',
      data: analysis
    });
  } catch (error) {
    logger.error('Fathom analysis error (via phantom):', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process Fathom analysis'
    });
  }
});

// Transcript Service - Analyze provided transcript (no auth required)
router.post('/transcript', [
  body('transcript').isLength({ min: 50 }).withMessage('Transcript must be at least 50 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get user data from request
    const userData = getUserDataFromRequest(req);
    
    // Use provided user data or fall back to demo user
    let userId;
    if (userData.userId) {
      userId = userData.userId;
    } else {
      const demoUser = await getDemoUser();
      userId = demoUser._id;
    }
    
    const { transcript, additionalUrl, additionalDocument } = req.body;
    let additionalContent = null;

    if (additionalUrl) {
      additionalContent = { type: 'url', url: additionalUrl };
    } else if (additionalDocument) {
      additionalContent = { type: 'document', file: additionalDocument };
    }

    logger.info('Starting transcript analysis', {
      transcriptLength: transcript.length,
      userId: userId,
      userEmail: userData.email,
      companyId: userData.companyId
    });

    const analysis = await transcriptService.processTranscriptCall(
      transcript,
      userId,
      additionalContent,
      userData
    );

    res.status(201).json({
      success: true,
      message: 'Transcript analysis started',
      data: analysis
    });
  } catch (error) {
    logger.error('Transcript analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process transcript analysis'
    });
  }
});

// Delete analysis (no auth required)
router.delete('/:id', async (req, res) => {
  try {
    const demoUser = await getDemoUser();
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: demoUser._id
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    logger.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis'
    });
  }
});

// Get analysis statistics (no auth required)
router.get('/stats/overview', async (req, res) => {
  try {
    const demoUser = await getDemoUser();
    const userId = demoUser._id;
    
    const stats = await Analysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          completedAnalyses: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedAnalyses: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalCost: { $sum: '$processing.llmAnalysis.cost' },
          avgProcessingTime: { $avg: '$processing.llmAnalysis.processingTime' }
        }
      }
    ]);

    const serviceStats = await Analysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgCost: { $avg: '$processing.llmAnalysis.cost' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAnalyses: 0,
          completedAnalyses: 0,
          failedAnalyses: 0,
          totalCost: 0,
          avgProcessingTime: 0
        },
        byService: serviceStats
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
