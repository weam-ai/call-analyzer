const playwright = require('playwright');
const llmService = require('./llmService');
const FileUtils = require('../utils/fileUtils');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');

class PhantomService {
  async processPhantomCall(url, userId, additionalContent = null) {
    let analysis = null;
    let browser = null;

    try {
      // Create analysis record
      analysis = new Analysis({
        userId,
        serviceType: 'phantom',
        status: 'processing',
        input: {
          url
        }
      });
      await analysis.save();

      logger.info('Starting phantom analysis', { analysisId: analysis._id, url });

      // Step 1: Initialize LLM (already done in llmService)

      // Step 2: Extract transcript data from URL using Playwright
      const transcriptResult = await this.extractTranscriptFromUrl(url);
      
      // Update analysis with transcript
      analysis.processing.transcript = {
        text: transcriptResult.text,
        confidence: transcriptResult.confidence || 0.8,
        language: transcriptResult.language || 'en',
        duration: transcriptResult.duration || 0,
        wordCount: transcriptResult.wordCount
      };
      await analysis.save();

      // Step 3: Process additional content if provided
      let scrapedContent = '';
      if (additionalContent) {
        if (additionalContent.type === 'url') {
          scrapedContent = await this.scrapeAdditionalUrl(additionalContent.url);
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

      // Step 6: Delete temporary files if any
      // (No temporary files in phantom service)

      // Step 7: Calculate final cost and update metadata
      analysis.metadata.processingTime = llmResult.processingTime;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('Phantom analysis completed', {
        analysisId: analysis._id,
        cost: llmResult.cost,
        processingTime: llmResult.processingTime
      });

      return analysis;

    } catch (error) {
      logger.error('Phantom analysis failed:', error);
      
      if (analysis) {
        analysis.status = 'failed';
        analysis.metadata.error = {
          message: error.message,
          code: error.code || 'PHANTOM_PROCESSING_ERROR',
          stack: error.stack
        };
        await analysis.save();
      }

      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async extractTranscriptFromUrl(url) {
    let browser = null;
    
    try {
      // Launch browser
      browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      const page = await context.newPage();

      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Extract transcript using various selectors
      const transcript = await page.evaluate(() => {
        // Common selectors for transcript content
        const selectors = [
          '[data-testid*="transcript"]',
          '[class*="transcript"]',
          '[id*="transcript"]',
          '[data-cy*="transcript"]',
          '.transcript',
          '#transcript',
          '[role="transcript"]',
          '[aria-label*="transcript"]',
          // Meeting platforms
          '[data-testid*="meeting"]',
          '[class*="meeting"]',
          '[id*="meeting"]',
          // Chat/Message content
          '[data-testid*="message"]',
          '[class*="message"]',
          '[class*="chat"]',
          // Generic content areas
          'main',
          '[role="main"]',
          '.content',
          '#content'
        ];

        let content = '';

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            content = Array.from(elements)
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 10)
              .join('\n');
            
            if (content.length > 100) {
              break;
            }
          }
        }

        // If no specific transcript found, try to get all text content
        if (!content || content.length < 100) {
          const body = document.body;
          if (body) {
            content = body.textContent?.trim() || '';
          }
        }

        return content;
      });

      // Extract additional metadata
      const metadata = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          url: window.location.href
        };
      });

      const wordCount = transcript.split(/\s+/).length;

      logger.info('Transcript extracted from URL', {
        url,
        transcriptLength: transcript.length,
        wordCount,
        title: metadata.title
      });

      return {
        text: transcript,
        confidence: transcript.length > 100 ? 0.8 : 0.5,
        language: 'en', // Could be detected
        duration: 0, // Would need audio analysis
        wordCount,
        url,
        title: metadata.title,
        description: metadata.description
      };

    } catch (error) {
      logger.error('Failed to extract transcript from URL:', error);
      throw new Error(`Failed to extract transcript from URL: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async scrapeAdditionalUrl(url) {
    try {
      const result = await llmService.extractTranscriptFromUrl(url);
      
      return {
        text: result.text,
        url,
        title: 'Additional Content',
        wordCount: result.wordCount
      };
    } catch (error) {
      logger.error('Additional URL scraping failed:', error);
      throw new Error(`Failed to scrape additional URL: ${error.message}`);
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

module.exports = new PhantomService();
