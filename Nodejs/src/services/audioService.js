const llmService = require('./llmService');
const FileUtils = require('../utils/fileUtils');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');
const config = require('../config/backend-config');

class AudioService {
  async processAudioCall(audioFile, userId, additionalContent = null) {
    let analysis = null;
    let savedFile = null;

    try {
      // Validate file
      this.validateAudioFile(audioFile);

      // Create analysis record
      analysis = new Analysis({
        userId,
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

      // Save file temporarily
      savedFile = await FileUtils.saveFile(audioFile, 'audio');
      analysis.input.audioFile.fileName = savedFile.fileName;
      await analysis.save();

      // Step 1: Initialize LLM (already done in llmService)
      logger.info('Starting audio analysis', { analysisId: analysis._id });

      // Step 2: Upload audio to Gemini and get transcript
      const transcriptResult = await llmService.transcribeAudio(audioFile);
      
      // Update analysis with transcript
      analysis.processing.transcript = {
        text: transcriptResult.text,
        confidence: 0.9, // Gemini doesn't provide confidence scores
        language: transcriptResult.language,
        duration: 0, // Would need audio analysis for this
        wordCount: transcriptResult.wordCount
      };
      await analysis.save();

      // Step 3: Process additional content if provided
      let scrapedContent = '';
      if (additionalContent) {
        if (additionalContent.type === 'url') {
          scrapedContent = await this.scrapeUrl(additionalContent.url);
        } else if (additionalContent.type === 'document') {
          scrapedContent = await this.processDocument(additionalContent.file);
        }
      }

      // Step 4: Initialize Repository & History (handled by LLM service)
      // Step 5: Add prompt templates and send to LLM
      const llmResult = await llmService.analyzeSalesCall(
        transcriptResult.text,
        scrapedContent
      );

      // Update analysis with LLM results
      analysis.processing.llmAnalysis = {
        prompt: 'Sales call analysis prompt',
        response: llmResult.response,
        tokensUsed: llmResult.tokenUsage,
        cost: llmResult.cost,
        model: llmResult.model,
        processingTime: llmResult.processingTime
      };

      // Parse LLM response and extract structured data
      const parsedResults = this.parseLLMResponse(llmResult.response);
      analysis.results = parsedResults;

      // Step 6: Delete uploaded audio file
      if (savedFile) {
        await FileUtils.deleteFile(savedFile.filePath);
      }

      // Step 7: Calculate final cost and update metadata
      analysis.metadata.processingTime = llmResult.processingTime;
      analysis.metadata.fileSize = audioFile.size;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('Audio analysis completed', {
        analysisId: analysis._id,
        cost: llmResult.cost,
        processingTime: llmResult.processingTime
      });

      return analysis;

    } catch (error) {
      logger.error('Audio analysis failed:', error);
      
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
      // This would typically use a web scraping service
      // For now, we'll use the LLM to extract content
      const result = await llmService.extractTranscriptFromUrl(url);
      
      return {
        text: result.text,
        url,
        title: 'Scraped Content',
        wordCount: result.wordCount
      };
    } catch (error) {
      logger.error('URL scraping failed:', error);
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
