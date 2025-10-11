const { validationResult } = require('express-validator');
const comprehensiveAnalysisService = require('../../services/comprehensiveAnalysisService');
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
      logger.info('Created demo user for comprehensive analysis');
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
      // Silently ignore parsing errors
    }
  }
  
  return {
    userId: userId && userId !== 'null' && userId !== '' ? userId : null,
    email: email && email !== 'null' && email !== '' ? email : null,
    companyId: companyId && companyId !== 'null' && companyId !== '' ? companyId : null
  };
}

// Helper function to get company ID from request (for GET requests)
function getCompanyIdFromRequest(req) {
  let companyId = req.query.companyId;
  
  if (!companyId && req.headers['x-user-data']) {
    try {
      const userData = JSON.parse(req.headers['x-user-data']);
      companyId = userData.companyId;
    } catch (error) {
      // Silently ignore parsing errors
    }
  }
  
  return companyId && companyId !== 'null' && companyId !== '' ? companyId : null;
}

/**
 * @desc    Process comprehensive analysis
 * @route   POST /call-analyzer-api/comprehensive
 * @access  Public
 */
exports.processAnalysis = async (req, res) => {
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

    const userData = getUserDataFromRequest(req);
    
    let userId;
    if (userData.userId) {
      userId = userData.userId;
    } else {
      const demoUser = await getDemoUser();
      userId = demoUser._id;
    }

    // Validate inputs
    let callDataCount = 0;
    if (req.files?.audioFile) callDataCount++;
    if (fathomUrl) callDataCount++;
    if (transcript) callDataCount++;

    if (callDataCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one call data input must be provided'
      });
    }

    let productServiceCount = 0;
    if (productServiceUrl) productServiceCount++;
    if (req.files?.productServiceDocument) productServiceCount++;

    if (productServiceCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one product/service input must be provided'
      });
    }

    // Prepare analysis data
    const analysisData = {
      userId: userId,
      serviceType: callDataType,
      userData: userData,
      input: {
        promptType: promptType,
        customPrompt: customPrompt
      }
    };

    // Add call data
    if (callDataType === 'audio' && req.files?.audioFile) {
      analysisData.input.audioFile = req.files.audioFile[0];
    } else if (callDataType === 'fathom' && fathomUrl) {
      analysisData.input.fathomUrl = fathomUrl;
    } else if (callDataType === 'transcript' && transcript) {
      analysisData.input.transcript = transcript;
    }

    // Add product/service data
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
};

/**
 * @desc    Get analysis by ID
 * @route   GET /call-analyzer-api/comprehensive/:id
 * @access  Public
 */
exports.getAnalysisById = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch analysis'
      });
    }
    
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      $or: [
        { 'user.companyId': companyId },
        { 'companyId': companyId }
      ]
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
};

/**
 * @desc    Get all analyses
 * @route   GET /call-analyzer-api/comprehensive
 * @access  Public
 */
exports.getAllAnalyses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'all', 
      serviceType = 'all'
    } = req.query;
    
    const companyId = getCompanyIdFromRequest(req);
    
    if (!companyId) {
      return res.json({
        success: true,
        data: {
          analyses: [],
          pagination: {
            current: parseInt(page),
            pages: 0,
            total: 0
          }
        }
      });
    }
    
    let userQuery = {
      $or: [
        { 'user.companyId': companyId },
        { 'companyId': companyId }
      ]
    };

    let searchQuery = {};
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      const searchConditions = [];
      
      if (['audio', 'fathom', 'transcript'].includes(searchTerm.toLowerCase())) {
        searchConditions.push({ serviceType: searchTerm.toLowerCase() });
      }
      
      if (['pending', 'processing', 'completed', 'failed'].includes(searchTerm.toLowerCase())) {
        searchConditions.push({ status: searchTerm.toLowerCase() });
      }
      
      if (!isNaN(searchTerm) && parseInt(searchTerm) >= 1 && parseInt(searchTerm) <= 10) {
        searchConditions.push({ 'results.callRating': parseInt(searchTerm) });
      }
      
      if (searchTerm.toLowerCase() === 'high') {
        searchConditions.push({ 'results.callRating': { $gte: 8 } });
      }
      
      searchConditions.push(
        { 'input.audioFile.originalName': { $regex: searchTerm, $options: 'i' } }
      );
      
      searchConditions.push(
        { 'input.fathomUrl': { $regex: searchTerm, $options: 'i' } }
      );
      
      searchQuery = {
        $or: searchConditions
      };
    }

    let query = { ...userQuery };
    if (Object.keys(searchQuery).length > 0) {
      query = { $and: [userQuery, searchQuery] };
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
};

/**
 * @desc    Delete analysis
 * @route   DELETE /call-analyzer-api/comprehensive/:id
 * @access  Public
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to delete analysis'
      });
    }
    
    let query = {
      _id: req.params.id,
      $or: [
        { 'user.companyId': companyId },
        { 'companyId': companyId }
      ]
    };

    const analysis = await Analysis.findOneAndDelete(query);

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
};

/**
 * @desc    Get analysis statistics
 * @route   GET /call-analyzer-api/comprehensive/stats/overview
 * @access  Public
 */
exports.getStatistics = async (req, res) => {
  try {
    const companyId = getCompanyIdFromRequest(req);
    
    if (!companyId) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalAnalyses: 0,
            completedAnalyses: 0,
            failedAnalyses: 0,
            totalCost: 0,
            avgProcessingTime: 0,
            avgCallRating: 0
          },
          byService: []
        }
      });
    }
    
    let matchQuery = { 
      $or: [
        { 'user.companyId': companyId },
        { 'companyId': companyId }
      ]
    };
    
    const stats = await Analysis.aggregate([
      { $match: matchQuery },
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
      { $match: matchQuery },
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
};

