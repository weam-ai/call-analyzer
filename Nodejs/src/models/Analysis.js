const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['audio', 'fathom', 'transcript'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  input: {
    // Step 1: Call Data Input (only one can be used)
    audioFile: {
      originalName: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      duration: Number
    },
    fathomUrl: String,
    transcript: String,
    
    // Step 2: Product/Service Information (only one can be used)
    productServiceUrl: String,
    productServiceDocument: {
      originalName: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      content: String // Extracted text content
    },
    
    // Step 3: Prompt Selection
    promptType: {
      type: String,
      enum: ['default', 'custom'],
      default: 'default'
    },
    customPrompt: String,
    selectedPrompt: String // The actual prompt used for analysis
  },
  processing: {
    transcript: {
      text: String,
      confidence: Number,
      language: String,
      duration: Number,
      wordCount: Number
    },
    scrapedContent: {
      text: String,
      url: String,
      title: String,
      wordCount: Number
    },
    llmAnalysis: {
      prompt: String,
      response: String,
      tokensUsed: {
        input: Number,
        output: Number,
        total: Number
      },
      cost: Number,
      model: String,
      processingTime: Number
    }
  },
  results: {
    // Call Overview
    callDescription: String,
    summary: String,
    callRating: Number, // 1-10 scale
    callRatingBreakdown: {
      engagementQuality: Number, // 1-10
      responsiveness: Number, // 1-10
      discoverySkills: Number, // 1-10
      valueProposition: Number, // 1-10
      objectionHandling: Number, // 1-10
      closingAttempts: Number, // 1-10
      followUpPlanning: Number, // 1-10
      overallCallFlow: Number, // 1-10
      averageScore: Number, // calculated average
      finalRating: Number // final rating (1-10)
    },
    
    // Demographic Information
    prospectDemographics: {
      teamSize: String,
      workVolume: String,
      location: String,
      previousExperience: String,
      likelihoodOfClosing: String,
      website: String,
      businessSummary: String
    },
    
    // Sales Team Performance
    salesPerformance: {
      responsiveness: String,
      satisfaction: String,
      engagement: String
    },
    
    // Analysis Results
    keyInsights: [String],
    recommendations: [String],
    otherNotableFindings: [String],
    
    // Sales Opportunity Analysis
    salesOpportunities: {
      productServiceGap: [String],
      upsellingOpportunities: [{
        opportunity: String,
        relevance: Number, // 1-5
        likelihood: Number, // 1-5
        revenueImpact: Number // 1-5
      }],
      crossSellingOpportunities: [{
        opportunity: String,
        relevance: Number, // 1-5
        likelihood: Number, // 1-5
        revenueImpact: Number // 1-5
      }]
    },
    
    // Legacy fields for backward compatibility
    actionItems: [String],
    sentiment: {
      overall: String,
      confidence: Number,
      breakdown: {
        positive: Number,
        neutral: Number,
        negative: Number
      }
    },
    topics: [String],
    participants: [{
      name: String,
      role: String,
      speakingTime: Number,
      keyPoints: [String]
    }],
    riskFactors: [String],
    opportunities: [String]
  },
  metadata: {
    processingTime: Number,
    fileSize: Number,
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    error: {
      message: String,
      code: String,
      stack: String
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ serviceType: 1, status: 1 });
analysisSchema.index({ 'metadata.createdAt': -1 });

// Virtual for total processing time
analysisSchema.virtual('totalProcessingTime').get(function() {
  if (this.metadata.completedAt && this.metadata.createdAt) {
    return this.metadata.completedAt - this.metadata.createdAt;
  }
  return null;
});

// Method to update status
analysisSchema.methods.updateStatus = function(status, error = null) {
  this.status = status;
  if (error) {
    this.metadata.error = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      stack: error.stack
    };
  }
  if (status === 'completed') {
    this.metadata.completedAt = new Date();
  }
  return this.save();
};

// Method to add processing results
analysisSchema.methods.addProcessingResult = function(type, data) {
  this.processing[type] = data;
  return this.save();
};

// Method to add analysis results
analysisSchema.methods.addAnalysisResults = function(results) {
  this.results = { ...this.results, ...results };
  return this.save();
};

module.exports = mongoose.model('Analysis', analysisSchema);
