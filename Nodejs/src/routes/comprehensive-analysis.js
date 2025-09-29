const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const comprehensiveAnalysisService = require('../services/comprehensiveAnalysisService');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const logger = require('../utils/logger');

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
    
    // Also check file extension as fallback
    const allowedExtensions = ['.m4a', '.mp4', '.mp3', '.wav', '.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log('File validation failed:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: fileExtension
      });
      cb(new Error('Invalid file type. Only .m4a, .mp3, .wav, .pdf, .docx, and .txt files are allowed.'), false);
    }
  }
});

// Helper function to get or create demo user
async function getDemoUser() {
  try {
    let demoUser = await User.findOne({ email: 'demo@salescallanalyzer.com' });
    
    if (!demoUser) {
      demoUser = new User({
        name: 'Demo User',
        email: 'demo@salescallanalyzer.com',
        password: 'demo123',
        role: 'user'
      });
      await demoUser.save();
      logger.info('Created demo user for comprehensive analysis');
    }
    
    return demoUser;
  } catch (error) {
    logger.error('Error getting demo user:', error);
    throw new Error('Failed to get demo user');
  }
}

// Comprehensive Analysis - Main endpoint
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

    const {
      callDataType,
      productServiceType,
      promptType,
      fathomUrl,
      transcript,
      productServiceUrl,
      customPrompt
    } = req.body;

    const demoUser = await getDemoUser();

    // Validate that only one call data type is provided
    let callDataCount = 0;
    if (req.files?.audioFile) callDataCount++;
    if (fathomUrl) callDataCount++;
    if (transcript) callDataCount++;

    if (callDataCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one call data input must be provided (audio file, Fathom URL, or transcript)'
      });
    }

    // Validate that only one product/service type is provided
    let productServiceCount = 0;
    if (productServiceUrl) productServiceCount++;
    if (req.files?.productServiceDocument) productServiceCount++;

    if (productServiceCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one product/service input must be provided (URL or document)'
      });
    }

    // Prepare analysis data
    const analysisData = {
      userId: demoUser._id,
      serviceType: callDataType,
      input: {
        promptType: promptType,
        customPrompt: customPrompt
      }
    };

    // Add call data based on type
    if (callDataType === 'audio' && req.files?.audioFile) {
      const audioFile = req.files.audioFile[0];
      analysisData.input.audioFile = audioFile; // Pass the actual multer file object
    } else if (callDataType === 'fathom' && fathomUrl) {
      analysisData.input.fathomUrl = fathomUrl;
    } else if (callDataType === 'transcript' && transcript) {
      analysisData.input.transcript = transcript;
    }

    // Add product/service data based on type
    if (productServiceType === 'url' && productServiceUrl) {
      analysisData.input.productServiceUrl = productServiceUrl;
    } else if (productServiceType === 'document' && req.files?.productServiceDocument) {
      const document = req.files.productServiceDocument[0];
      analysisData.input.productServiceDocument = {
        originalName: document.originalname,
        fileName: document.filename || 'temp_document',
        fileSize: document.size,
        mimeType: document.mimetype
      };
    }

    logger.info('Starting comprehensive analysis', { 
      callDataType, 
      productServiceType, 
      promptType 
    });

    const analysis = await comprehensiveAnalysisService.processComprehensiveAnalysis(analysisData);

    logger.info('Analysis processing completed', { 
      analysisId: analysis._id, 
      status: analysis.status,
      hasResults: !!analysis.results
    });

    res.status(201).json({
      success: true,
      message: 'Comprehensive analysis completed',
      data: analysis
    });

  } catch (error) {
    logger.error('Comprehensive analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process comprehensive analysis'
    });
  }
});

// Get analysis by ID
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

// Get all analyses (call history)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const demoUser = await getDemoUser();
    const query = { userId: demoUser._id };

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

// Delete analysis
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

// Get analysis statistics
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
          avgProcessingTime: { $avg: '$processing.llmAnalysis.processingTime' },
          avgCallRating: { $avg: '$results.callRating' }
        }
      }
    ]);

    const serviceStats = await Analysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgCost: { $avg: '$processing.llmAnalysis.cost' },
          avgRating: { $avg: '$results.callRating' }
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
          avgProcessingTime: 0,
          avgCallRating: 0
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
