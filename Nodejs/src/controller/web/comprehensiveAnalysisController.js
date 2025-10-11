const { validationResult } = require('express-validator');
const comprehensiveAnalysisService = require('../../services/comprehensiveAnalysisService');
const Analysis = require('../../models/Analysis');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Simple in-memory cache for analysis lists
const analysisCache = new Map();
const CACHE_TTL = 30000; // 30 seconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

// Cache helper functions
function generateCacheKey(companyId, page, limit, search, status, serviceType) {
  return `${companyId}:${page}:${limit}:${search || ''}:${status}:${serviceType}`;
}

function getCachedData(cacheKey) {
  try {
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
    return null;
  } catch (error) {
    logger.error('Error getting cached data:', error);
    return null;
  }
}

function setCachedData(cacheKey, data) {
  try {
    // Clean up old entries if cache is getting too large
    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) {
        analysisCache.delete(oldestKey);
      }
    }
    
    analysisCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error setting cached data:', error);
    // Don't throw error - caching is not critical
  }
}

function invalidateCacheForCompany(companyId) {
  try {
    if (!companyId) return;
    
    // Remove all cache entries for a specific company
    const keysToDelete = [];
    for (const [key, value] of analysisCache.entries()) {
      if (key.startsWith(companyId + ':')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      analysisCache.delete(key);
    });
    
    logger.info(`Invalidated ${keysToDelete.length} cache entries for company ${companyId}`);
  } catch (error) {
    logger.error('Error invalidating cache for company:', error);
    // Don't throw error - cache invalidation is not critical
  }
}

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

    // Invalidate cache for this company since we added a new analysis
    if (userData.companyId) {
      invalidateCacheForCompany(userData.companyId);
    }

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

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100'
      });
    }

    // Check cache first
    const cacheKey = generateCacheKey(companyId, pageNum, limitNum, search, status, serviceType);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      logger.info('Returning cached analysis data', { cacheKey, companyId });
      return res.json({
        success: true,
        data: cachedData
      });
    }
    
    // Optimize query by using the most likely companyId field first
    let userQuery = { 'user.companyId': companyId };
    
    // Note: We're using the simplified query structure for better performance
    // If this causes issues with older records, we can add fallback logic here

    let searchQuery = {};
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      const searchConditions = [];
      
      // Optimize common search patterns first
      if (['audio', 'fathom', 'transcript'].includes(searchTerm.toLowerCase())) {
        searchConditions.push({ serviceType: searchTerm.toLowerCase() });
      } else if (['pending', 'processing', 'completed', 'failed'].includes(searchTerm.toLowerCase())) {
        searchConditions.push({ status: searchTerm.toLowerCase() });
      } else if (!isNaN(searchTerm) && parseInt(searchTerm) >= 1 && parseInt(searchTerm) <= 10) {
        searchConditions.push({ 'results.callRating': parseInt(searchTerm) });
      } else if (searchTerm.toLowerCase() === 'high') {
        searchConditions.push({ 'results.callRating': { $gte: 8 } });
      } else {
        // Only use regex searches for text that doesn't match predefined patterns
        searchConditions.push(
          { 'input.audioFile.originalName': { $regex: searchTerm, $options: 'i' } },
          { 'input.fathomUrl': { $regex: searchTerm, $options: 'i' } }
        );
      }
      
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

    // Define field selection for optimal performance
    const fieldSelection = {
      _id: 1,
      serviceType: 1,
      status: 1,
      'results.callRating': 1,
      'results.callDescription': 1,
      'results.summary': 1,
      'results.callRatingBreakdown': 1,
      'results.prospectDemographics': 1,
      'results.salesPerformance': 1,
      'results.keyInsights': 1,
      'results.recommendations': 1,
      'results.salesOpportunities': 1,
      'results.otherNotableFindings': 1,
      'results.actionItems': 1,
      'results.sentiment': 1,
      'results.topics': 1,
      'results.participants': 1,
      'results.riskFactors': 1,
      'results.opportunities': 1,
      'input.audioFile.originalName': 1,
      'input.fathomUrl': 1,
      'input.transcript': 1,
      createdAt: 1,
      'metadata.completedAt': 1,
      'processing.llmAnalysis.processingTime': 1,
      'processing.llmAnalysis.cost': 1
    };

    // Execute database queries with error handling
    let analyses, total;
    
    try {
      [analyses, total] = await Promise.all([
        Analysis.find(query, fieldSelection)
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(), // Use lean() for better performance
        Analysis.countDocuments(query)
      ]);
    } catch (dbError) {
      logger.error('Database query error in getAllAnalyses:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while fetching analyses'
      });
    }

    // Validate and sanitize response data
    const sanitizedAnalyses = analyses.map(analysis => {
      // Ensure all required fields exist with default values
      return {
        ...analysis,
        results: {
          callRating: analysis.results?.callRating || 0,
          callDescription: analysis.results?.callDescription || '',
          summary: analysis.results?.summary || '',
          callRatingBreakdown: analysis.results?.callRatingBreakdown || {},
          prospectDemographics: analysis.results?.prospectDemographics || {},
          salesPerformance: analysis.results?.salesPerformance || {},
          keyInsights: analysis.results?.keyInsights || [],
          recommendations: analysis.results?.recommendations || [],
          salesOpportunities: analysis.results?.salesOpportunities || {},
          otherNotableFindings: analysis.results?.otherNotableFindings || [],
          actionItems: analysis.results?.actionItems || [],
          sentiment: analysis.results?.sentiment || {},
          topics: analysis.results?.topics || [],
          participants: analysis.results?.participants || [],
          riskFactors: analysis.results?.riskFactors || [],
          opportunities: analysis.results?.opportunities || []
        },
        input: {
          audioFile: analysis.input?.audioFile || null,
          fathomUrl: analysis.input?.fathomUrl || '',
          transcript: analysis.input?.transcript || ''
        },
        processing: {
          llmAnalysis: {
            processingTime: analysis.processing?.llmAnalysis?.processingTime || 0,
            cost: analysis.processing?.llmAnalysis?.cost || 0
          }
        }
      };
    });

    const responseData = {
      analyses: sanitizedAnalyses,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total || 0
      }
    };

    // Cache the response (non-blocking)
    setCachedData(cacheKey, responseData);

    logger.info('Successfully fetched analyses', { 
      companyId, 
      count: analyses.length, 
      total, 
      page: pageNum, 
      limit: limitNum 
    });

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    logger.error('Get analyses error:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to fetch analyses';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid query parameters';
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format in request';
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate entry found';
      statusCode = 409;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get API health status and cache statistics
 * @route   GET /call-analyzer-api/comprehensive/health
 * @access  Public
 */
exports.getHealthStatus = async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: {
        size: analysisCache.size,
        maxSize: MAX_CACHE_SIZE,
        ttl: CACHE_TTL
      },
      database: {
        status: 'connected'
      }
    };

    // Test database connection
    try {
      await Analysis.findOne().limit(1);
      healthData.database.status = 'connected';
    } catch (dbError) {
      healthData.database.status = 'disconnected';
      healthData.status = 'unhealthy';
      healthData.database.error = dbError.message;
    }

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Invalidate cache for this company since we deleted an analysis
    invalidateCacheForCompany(companyId);

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

