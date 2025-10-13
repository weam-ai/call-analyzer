const llmService = require('./llmService');
const FileUtils = require('../utils/fileUtils');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');
const config = require('../config/backend-config');

class AudioService {
  async processAudioCall(audioFile, userId, additionalContent = null) {
    let analysis = null;
    let savedFile = null;
    const processingStartTime = Date.now();

    try {
      logger.info('=== AUDIO SERVICE: Starting audio analysis ===', {
        userId,
        fileName: audioFile?.originalname,
        fileSize: audioFile?.size,
        mimeType: audioFile?.mimetype,
        hasAdditionalContent: !!additionalContent,
        additionalContentType: additionalContent?.type
      });

      // Validate file
      logger.info('AUDIO SERVICE: Validating audio file', {
        fileName: audioFile.originalname,
        fileSize: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`
      });
      this.validateAudioFile(audioFile);
      logger.info('AUDIO SERVICE: Audio file validation successful');

      // Get user information for the user object
      logger.info('AUDIO SERVICE: Fetching user information', { userId });
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (user) {
        logger.info('AUDIO SERVICE: User information retrieved', {
          email: user.email,
          userId: user._id,
          companyId: user.companyId
        });
      } else {
        logger.warn('AUDIO SERVICE: User not found in database', { userId });
      }

      // Create analysis record
      logger.info('AUDIO SERVICE: Creating analysis record in database');
      analysis = new Analysis({
        user: user ? {
          email: user.email || null,
          userId: user._id || null,
          companyId: user.companyId || null
        } : null,
        serviceType: 'audio',
        status: 'processing',
        input: {
          audioFile: {
            originalName: audioFile.originalname,
            fileName: '',
            fileSize: audioFile.size,
            mimeType: audioFile.mimetype
          }
        }
      });
      await analysis.save();
      logger.info('AUDIO SERVICE: Analysis record created', { 
        analysisId: analysis._id,
        serviceType: 'audio'
      });

      // Save file temporarily
      logger.info('AUDIO SERVICE: Saving audio file temporarily', {
        fileName: audioFile.originalname
      });
      savedFile = await FileUtils.saveFile(audioFile, 'audio');
      analysis.input.audioFile.fileName = savedFile.fileName;
      await analysis.save();
      logger.info('AUDIO SERVICE: Audio file saved', {
        savedFileName: savedFile.fileName,
        filePath: savedFile.filePath
      });

      // Step 2: Upload audio to Gemini and get transcript
      logger.info('AUDIO SERVICE: Starting audio transcription using Gemini LLM', {
        fileName: audioFile.originalname,
        fileSize: audioFile.size
      });
      const transcriptResult = await llmService.transcribeAudio(audioFile);
      logger.info('AUDIO SERVICE: Audio transcription completed', {
        transcriptLength: transcriptResult.text?.length,
        wordCount: transcriptResult.wordCount,
        language: transcriptResult.language,
        processingTime: transcriptResult.processingTime
      });
      
      // Update analysis with transcript
      analysis.processing.transcript = {
        text: transcriptResult.text,
        confidence: 0.9, // Gemini doesn't provide confidence scores
        language: transcriptResult.language,
        duration: 0, // Would need audio analysis for this
        wordCount: transcriptResult.wordCount
      };
      await analysis.save();
      logger.info('AUDIO SERVICE: Transcript saved to analysis record');

      // Step 3: Process additional content if provided
      let scrapedContent = '';
      if (additionalContent) {
        logger.info('AUDIO SERVICE: Additional content detected', {
          type: additionalContent.type,
          url: additionalContent.url,
          fileName: additionalContent.file?.originalname
        });

        if (additionalContent.type === 'url') {
          logger.info('AUDIO SERVICE: Starting URL scraping for product/service information', {
            url: additionalContent.url
          });
          scrapedContent = await this.scrapeUrl(additionalContent.url);
          logger.info('AUDIO SERVICE: URL scraping completed', {
            url: additionalContent.url,
            scrapedContentLength: scrapedContent?.text?.length || 0
          });
        } else if (additionalContent.type === 'document') {
          logger.info('AUDIO SERVICE: Starting document processing', {
            fileName: additionalContent.file?.originalname
          });
          scrapedContent = await this.processDocument(additionalContent.file);
          logger.info('AUDIO SERVICE: Document processing completed', {
            fileName: additionalContent.file?.originalname,
            contentLength: scrapedContent?.text?.length || 0
          });
        }
      } else {
        logger.info('AUDIO SERVICE: No additional content provided');
      }

      // Step 5: Send to LLM for analysis
      logger.info('AUDIO SERVICE: Starting LLM analysis of transcript', {
        transcriptWordCount: transcriptResult.wordCount,
        hasAdditionalContent: !!scrapedContent
      });
      const llmResult = await llmService.analyzeSalesCall(
        transcriptResult.text,
        scrapedContent
      );
      logger.info('AUDIO SERVICE: LLM analysis completed', {
        model: llmResult.model,
        processingTime: llmResult.processingTime,
        tokensUsed: llmResult.tokenUsage?.total,
        cost: llmResult.cost
      });

      // Update analysis with LLM results
      logger.info('AUDIO SERVICE: Updating analysis with LLM results');
      analysis.processing.llmAnalysis = {
        prompt: 'Sales call analysis prompt',
        response: llmResult.response,
        tokensUsed: llmResult.tokenUsage,
        cost: llmResult.cost,
        model: llmResult.model,
        processingTime: llmResult.processingTime
      };

      // Parse LLM response and extract structured data
      logger.info('AUDIO SERVICE: Parsing LLM response to extract structured data');
      const parsedResults = this.parseLLMResponse(llmResult.response);
      analysis.results = parsedResults;
      logger.info('AUDIO SERVICE: Structured data extracted successfully', {
        hasCallRating: !!parsedResults.callRating,
        hasRecommendations: !!parsedResults.recommendations,
        recommendationsCount: parsedResults.recommendations?.length || 0,
        hasKeyInsights: !!parsedResults.keyInsights,
        insightsCount: parsedResults.keyInsights?.length || 0
      });

      // Step 6: Delete uploaded audio file
      if (savedFile) {
        logger.info('AUDIO SERVICE: Deleting temporary audio file', {
          fileName: savedFile.fileName,
          filePath: savedFile.filePath
        });
        await FileUtils.deleteFile(savedFile.filePath);
        logger.info('AUDIO SERVICE: Temporary audio file deleted');
      }

      // Step 7: Calculate final cost and update metadata
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.info('AUDIO SERVICE: Finalizing analysis', {
        transcriptionTime: transcriptResult.processingTime,
        llmProcessingTime: llmResult.processingTime,
        totalProcessingTime: totalProcessingTime,
        cost: llmResult.cost,
        fileSize: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`
      });

      analysis.metadata.processingTime = llmResult.processingTime;
      analysis.metadata.fileSize = audioFile.size;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('=== AUDIO SERVICE: Analysis completed successfully ===', {
        analysisId: analysis._id,
        cost: `$${llmResult.cost?.toFixed(4)}`,
        transcriptionTime: `${transcriptResult.processingTime}ms`,
        llmProcessingTime: `${llmResult.processingTime}ms`,
        totalProcessingTime: `${totalProcessingTime}ms`,
        tokensUsed: llmResult.tokenUsage?.total,
        callRating: parsedResults.callRating,
        audioFileSize: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`
      });

      return analysis;

    } catch (error) {
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.error('=== AUDIO SERVICE: Analysis failed ===', {
        error: error.message,
        stack: error.stack,
        totalProcessingTime: `${totalProcessingTime}ms`,
        analysisId: analysis?._id,
        fileName: audioFile?.originalname
      });
      
      if (analysis) {
        analysis.status = 'failed';
        analysis.metadata.error = {
          message: error.message,
          code: error.code || 'AUDIO_PROCESSING_ERROR',
          stack: error.stack
        };
        await analysis.save();
      }

      // Cleanup files
      if (savedFile) {
        await FileUtils.deleteFile(savedFile.filePath);
      }

      throw error;
    }
  }

  validateAudioFile(audioFile) {
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    if (!FileUtils.isValidAudioFile(audioFile.originalname)) {
      throw new Error('Invalid audio file format. Supported formats: mp3, wav, m4a, aac, ogg, flac');
    }

    if (audioFile.size > config.geminiMaxFileSize) {
      throw new Error(`File too large. Maximum size: ${FileUtils.formatFileSize(config.geminiMaxFileSize)}`);
    }

    // Additional validation for duration would require audio analysis
    // For now, we'll rely on Gemini's limits
  }

  async scrapeUrl(url) {
    try {
      logger.info('AUDIO SERVICE: Extracting product/service info from URL using LLM', { url });
      const startTime = Date.now();
      
      const result = await llmService.extractTranscriptFromUrl(url);
      
      const processingTime = Date.now() - startTime;
      logger.info('AUDIO SERVICE: URL content extraction successful', {
        url,
        contentLength: result.text?.length,
        wordCount: result.wordCount,
        processingTime: `${processingTime}ms`
      });
      
      return {
        text: result.text,
        url,
        title: result.title || 'Scraped Content',
        wordCount: result.wordCount
      };
    } catch (error) {
      logger.error('AUDIO SERVICE: URL scraping failed', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }

  async processDocument(file) {
    try {
      const content = await FileUtils.readTextFile(file.path);
      
      return {
        text: content,
        documentName: file.originalname,
        wordCount: content.split(/\s+/).length
      };
    } catch (error) {
      logger.error('Document processing failed:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  parseLLMResponse(response) {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: extract structured data from text
      return this.extractStructuredData(response);
    } catch (error) {
      logger.warn('Failed to parse LLM response as JSON, using fallback:', error);
      return this.extractStructuredData(response);
    }
  }

  extractStructuredData(response) {
    // Fallback parsing logic
    const lines = response.split('\n');
    const result = {
      summary: '',
      keyInsights: [],
      actionItems: [],
      sentiment: {
        overall: 'neutral',
        confidence: 0.5,
        breakdown: { positive: 0.33, neutral: 0.34, negative: 0.33 }
      },
      topics: [],
      participants: [],
      recommendations: [],
      riskFactors: [],
      opportunities: []
    };

    // Basic text parsing logic here
    // This is a simplified version - in production you'd want more sophisticated parsing

    return result;
  }
}

module.exports = new AudioService();
