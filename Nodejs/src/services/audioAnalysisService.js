const audioUploadService = require('./audioUploadService');
const logger = require('../utils/logger');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

class AudioAnalysisService {
  constructor() {
    this.audioUploadService = audioUploadService;
  }

  /**
   * Process audio file upload and comprehensive analysis
   */
  async processAudioAnalysis(audioFile, userId, options = {}) {
    try {
      const {
        additionalContent = '',
        websiteUrl = '',
        analysisType = 'comprehensive'
      } = options;

      logger.info('Starting audio analysis process', {
        fileName: audioFile.originalname,
        fileSize: audioFile.size,
        userId,
        analysisType
      });

      // Create temporary file path
      const tempFilePath = path.join(__dirname, '../../temp', `${Date.now()}_${audioFile.originalname}`);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, audioFile.buffer);

      try {
        // Process the audio file
        const analysis = await this.audioUploadService.processAudioFile(
          tempFilePath,
          userId,
          additionalContent
        );

        // Add website context if provided
        if (websiteUrl) {
          analysis.input.websiteUrl = websiteUrl;
          await analysis.save();
        }

        logger.info('Audio analysis completed successfully', {
          analysisId: analysis._id,
          status: analysis.status
        });

        return analysis;

      } finally {
        // Clean up temporary file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temporary file:', cleanupError.message);
        }
      }

    } catch (error) {
      logger.error('Audio analysis process failed:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(analysisId, userId) {
    try {
      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        throw new Error('Analysis not found');
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to get analysis:', error);
      throw error;
    }
  }

  /**
   * Get all analyses for a user
   */
  async getUserAnalyses(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        serviceType = null,
        status = null
      } = options;

      const query = { userId };
      if (serviceType) query.serviceType = serviceType;
      if (status) query.status = status;

      const analyses = await Analysis.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Analysis.countDocuments(query);

      return {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get user analyses:', error);
      throw error;
    }
  }

  /**
   * Delete analysis and associated files
   */
  async deleteAnalysis(analysisId, userId) {
    try {
      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        throw new Error('Analysis not found');
      }

      // Delete uploaded file from Gemini if it exists
      if (analysis.processing?.upload?.fileName) {
        try {
          await this.audioUploadService.deleteFile(analysis.processing.upload.fileName);
        } catch (deleteError) {
          logger.warn('Failed to delete file from Gemini:', deleteError.message);
        }
      }

      // Delete analysis record
      await Analysis.findByIdAndDelete(analysisId);

      logger.info('Analysis deleted successfully', { analysisId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete analysis:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName) {
    try {
      return await this.audioUploadService.getFileMetadata(fileName);
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  /**
   * List uploaded files
   */
  async listUploadedFiles(pageSize = 10) {
    try {
      return await this.audioUploadService.listUploadedFiles(pageSize);
    } catch (error) {
      logger.error('Failed to list uploaded files:', error);
      throw error;
    }
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles() {
    try {
      return await this.audioUploadService.cleanupOldFiles();
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      throw error;
    }
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(userId) {
    try {
      const stats = await Analysis.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$serviceType',
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            processing: {
              $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
            }
          }
        }
      ]);

      const totalAnalyses = await Analysis.countDocuments({ userId });
      const recentAnalyses = await Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id serviceType status createdAt');

      return {
        totalAnalyses,
        byServiceType: stats,
        recentAnalyses
      };
    } catch (error) {
      logger.error('Failed to get analysis stats:', error);
      throw error;
    }
  }

  /**
   * Retry failed analysis
   */
  async retryAnalysis(analysisId, userId) {
    try {
      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId,
        status: 'failed'
      });

      if (!analysis) {
        throw new Error('Failed analysis not found');
      }

      // Reset status
      analysis.status = 'processing';
      analysis.metadata.error = null;
      await analysis.save();

      // Retry processing if it's an audio upload
      if (analysis.serviceType === 'audio' && analysis.processing?.upload?.uri) {
        try {
          const analysisResult = await this.audioUploadService.analyzeAudioFile(
            analysis.processing.upload.uri,
            analysis.processing.upload.mimeType,
            analysis.input.additionalContent || ''
          );

          analysis.processing.llmAnalysis = {
            prompt: 'Comprehensive audio analysis prompt (retry)',
            response: JSON.stringify(analysisResult.analysis),
            model: analysisResult.model,
            processingTime: analysisResult.processingTime
          };

          analysis.results = analysisResult.analysis;
          analysis.status = 'completed';
          analysis.metadata.completedAt = new Date();

          await analysis.save();

          logger.info('Analysis retry completed successfully', { analysisId });
          return analysis;
        } catch (retryError) {
          analysis.status = 'failed';
          analysis.metadata.error = {
            message: retryError.message,
            code: 'RETRY_FAILED',
            timestamp: new Date()
          };
          await analysis.save();
          throw retryError;
        }
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to retry analysis:', error);
      throw error;
    }
  }

  /**
   * Export analysis data
   */
  async exportAnalysis(analysisId, userId, format = 'json') {
    try {
      const analysis = await this.getAnalysis(analysisId, userId);

      if (format === 'json') {
        return {
          analysisId: analysis._id,
          serviceType: analysis.serviceType,
          status: analysis.status,
          createdAt: analysis.createdAt,
          completedAt: analysis.metadata.completedAt,
          results: analysis.results,
          processing: analysis.processing
        };
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(analysis);
        return csvData;
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      logger.error('Failed to export analysis:', error);
      throw error;
    }
  }

  /**
   * Convert analysis to CSV format
   */
  convertToCSV(analysis) {
    const headers = [
      'Analysis ID',
      'Service Type',
      'Status',
      'Created At',
      'Call Rating',
      'Engagement Quality',
      'Responsiveness',
      'Discovery Skills',
      'Value Proposition',
      'Objection Handling',
      'Closing Attempts',
      'Follow-up Planning',
      'Overall Call Flow'
    ];

    const row = [
      analysis._id,
      analysis.serviceType,
      analysis.status,
      analysis.createdAt,
      analysis.results?.callRating || 'N/A',
      analysis.results?.callRatingBreakdown?.engagementQuality || 'N/A',
      analysis.results?.callRatingBreakdown?.responsiveness || 'N/A',
      analysis.results?.callRatingBreakdown?.discoverySkills || 'N/A',
      analysis.results?.callRatingBreakdown?.valueProposition || 'N/A',
      analysis.results?.callRatingBreakdown?.objectionHandling || 'N/A',
      analysis.results?.callRatingBreakdown?.closingAttempts || 'N/A',
      analysis.results?.callRatingBreakdown?.followUpPlanning || 'N/A',
      analysis.results?.callRatingBreakdown?.overallCallFlow || 'N/A'
    ];

    return headers.join(',') + '\n' + row.join(',');
  }

  /**
   * Validate audio file
   */
  validateAudioFile(file) {
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

    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!file) {
      throw new Error('No file provided');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.size} bytes. Maximum size is ${maxSize} bytes`);
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File is empty');
    }

    return true;
  }
}

module.exports = new AudioAnalysisService();
