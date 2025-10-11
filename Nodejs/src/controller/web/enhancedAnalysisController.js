const { validationResult } = require('express-validator');
const enhancedFathomService = require('../../services/enhancedFathomService');
const Analysis = require('../../models/Analysis');
const User = require('../../models/User');
const logger = require('../../utils/logger');

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
      logger.info('Created demo user for enhanced analysis');
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
  
  if (req.body.userId) {
    userId = req.body.userId;
    email = req.body.email;
    companyId = req.body.companyId;
  }
  
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
  
  return {
    userId: userId && userId !== 'null' && userId !== '' ? userId : null,
    email: email && email !== 'null' && email !== '' ? email : null,
    companyId: companyId && companyId !== 'null' && companyId !== '' ? companyId : null
  };
}

/**
 * @desc    Process enhanced Fathom analysis
 * @route   POST /call-analyzer-api/enhanced/fathom
 * @access  Public
 */
exports.analyzeFathom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { url, additionalUrl, additionalDocument, options = {} } = req.body;
    
    const userData = getUserDataFromRequest(req);
    
    let userId;
    if (userData.userId) {
      userId = userData.userId;
    } else {
      const demoUser = await getDemoUser();
      userId = demoUser._id;
    }
    
    let additionalContent = null;
    if (additionalUrl) {
      additionalContent = { type: 'url', url: additionalUrl };
    } else if (additionalDocument) {
      additionalContent = { type: 'document', file: additionalDocument };
    }

    logger.info('Starting enhanced Fathom analysis', { 
      url, 
      options,
      userId: userId,
      userEmail: userData.email,
      companyId: userData.companyId
    });

    const analysis = await enhancedFathomService.processFathomCall(
      url,
      userId,
      additionalContent,
      userData
    );

    res.status(201).json({
      success: true,
      message: 'Enhanced Fathom analysis completed',
      data: analysis
    });

  } catch (error) {
    logger.error('Enhanced Fathom analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process enhanced Fathom analysis'
    });
  }
};

/**
 * @desc    Get analysis by ID
 * @route   GET /call-analyzer-api/enhanced/:id
 * @access  Public
 */
exports.getAnalysisById = async (req, res) => {
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
    logger.error('Get enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced analysis'
    });
  }
};

/**
 * @desc    Get all analyses
 * @route   GET /call-analyzer-api/enhanced
 * @access  Public
 */
exports.getAllAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType = 'fathom' } = req.query;
    
    const demoUser = await getDemoUser();
    const query = { 
      userId: demoUser._id,
      serviceType: serviceType
    };

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
    logger.error('Get enhanced analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced analyses'
    });
  }
};

/**
 * @desc    Delete analysis
 * @route   DELETE /call-analyzer-api/enhanced/:id
 * @access  Public
 */
exports.deleteAnalysis = async (req, res) => {
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
      message: 'Enhanced analysis deleted successfully'
    });
  } catch (error) {
    logger.error('Delete enhanced analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete enhanced analysis'
    });
  }
};

/**
 * @desc    Get statistics
 * @route   GET /call-analyzer-api/enhanced/stats/overview
 * @access  Public
 */
exports.getStatistics = async (req, res) => {
  try {
    const demoUser = await getDemoUser();
    const userId = demoUser._id;
    
    const stats = await Analysis.aggregate([
      { $match: { userId: userId, serviceType: 'fathom' } },
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
          avgConfidence: { $avg: '$processing.transcript.confidence' }
        }
      }
    ]);

    const recentAnalyses = await Analysis.find({ 
      userId: userId, 
      serviceType: 'fathom' 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id status createdAt processing.transcript.confidence processing.llmAnalysis.cost');

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAnalyses: 0,
          completedAnalyses: 0,
          failedAnalyses: 0,
          totalCost: 0,
          avgProcessingTime: 0,
          avgConfidence: 0
        },
        recentAnalyses
      }
    });
  } catch (error) {
    logger.error('Get enhanced stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced statistics'
    });
  }
};

