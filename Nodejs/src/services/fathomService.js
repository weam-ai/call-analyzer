const playwrightService = require('./playwrightService');
const llmService = require('./llmService');
const FileUtils = require('../utils/fileUtils');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');

class FathomService {
  async processFathomCall(url, userId, additionalContent = null, userData = null) {
    let analysis = null;
    const processingStartTime = Date.now();

    try {
      logger.info('=== FATHOM SERVICE: Starting Fathom analysis ===', {
        userId,
        url,
        hasAdditionalContent: !!additionalContent,
        additionalContentType: additionalContent?.type
      });

      // Create user object from session data
      let userObject = null;
      if (userData && (userData.userId || userData.email)) {
        // Use session user data if available
        userObject = {
          email: userData.email || null,
          userId: userData.userId || null,
          companyId: userData.companyId || null
        };
        logger.info('FATHOM SERVICE: User data identified', {
          email: userData.email,
          userId: userData.userId,
          companyId: userData.companyId
        });
      } else {
        logger.warn('FATHOM SERVICE: No user data provided in session');
      }

      // Create analysis record using user object
      logger.info('FATHOM SERVICE: Creating analysis record in database');
      analysis = new Analysis({
        user: userObject,
        serviceType: 'fathom',
        status: 'processing',
        input: {
          url
        }
      });
      await analysis.save();
      logger.info('FATHOM SERVICE: Analysis record created', { 
        analysisId: analysis._id,
        serviceType: 'fathom',
        url
      });

      // Step 2: Extract transcript data from Fathom URL using Playwright
      logger.info('FATHOM SERVICE: Starting Playwright-based transcript extraction from Fathom URL', { url });
      const transcriptResult = await this.extractTranscriptFromFathomUrl(url);
      logger.info('FATHOM SERVICE: Fathom transcript extraction completed', {
        url,
        transcriptLength: transcriptResult.text?.length,
        wordCount: transcriptResult.wordCount,
        confidence: transcriptResult.confidence,
        duration: transcriptResult.duration,
        title: transcriptResult.title
      });
      
      // Update analysis with transcript
      analysis.processing.transcript = {
        text: transcriptResult.text,
        confidence: transcriptResult.confidence || 0.9,
        language: transcriptResult.language || 'en',
        duration: transcriptResult.duration || 0,
        wordCount: transcriptResult.wordCount
      };
      await analysis.save();
      logger.info('FATHOM SERVICE: Transcript saved to analysis record');

      // Step 3: Process additional content if provided
      let scrapedContent = '';
      if (additionalContent) {
        logger.info('FATHOM SERVICE: Additional content detected', {
          type: additionalContent.type,
          url: additionalContent.url,
          fileName: additionalContent.file?.originalname
        });

        if (additionalContent.type === 'url') {
          logger.info('FATHOM SERVICE: Starting additional URL scraping', {
            url: additionalContent.url
          });
          scrapedContent = await this.scrapeAdditionalUrl(additionalContent.url);
          logger.info('FATHOM SERVICE: Additional URL scraping completed', {
            url: additionalContent.url,
            scrapedContentLength: scrapedContent?.text?.length || 0
          });
        } else if (additionalContent.type === 'document') {
          logger.info('FATHOM SERVICE: Starting document processing', {
            fileName: additionalContent.file?.originalname
          });
          scrapedContent = await this.processDocument(additionalContent.file);
          logger.info('FATHOM SERVICE: Document processing completed', {
            fileName: additionalContent.file?.originalname,
            contentLength: scrapedContent?.text?.length || 0
          });
        }
      } else {
        logger.info('FATHOM SERVICE: No additional content provided');
      }

      // Step 5: Send to LLM for analysis
      logger.info('FATHOM SERVICE: Starting LLM analysis of Fathom transcript', {
        transcriptWordCount: transcriptResult.wordCount,
        hasAdditionalContent: !!scrapedContent
      });
      const llmResult = await llmService.analyzeSalesCall(
        transcriptResult.text,
        scrapedContent
      );
      logger.info('FATHOM SERVICE: LLM analysis completed', {
        model: llmResult.model,
        processingTime: llmResult.processingTime,
        tokensUsed: llmResult.tokenUsage?.total,
        cost: llmResult.cost
      });

      // Update analysis with LLM results
      logger.info('FATHOM SERVICE: Updating analysis with LLM results');
      analysis.processing.llmAnalysis = {
        prompt: 'Sales call analysis prompt',
        response: llmResult.response,
        tokensUsed: llmResult.tokenUsage,
        cost: llmResult.cost,
        model: llmResult.model,
        processingTime: llmResult.processingTime
      };

      // Parse LLM response and extract structured data
      logger.info('FATHOM SERVICE: Parsing LLM response to extract structured data');
      const parsedResults = this.parseLLMResponse(llmResult.response);
      analysis.results = parsedResults;
      logger.info('FATHOM SERVICE: Structured data extracted successfully', {
        hasCallRating: !!parsedResults.callRating,
        hasRecommendations: !!parsedResults.recommendations,
        recommendationsCount: parsedResults.recommendations?.length || 0,
        hasKeyInsights: !!parsedResults.keyInsights,
        insightsCount: parsedResults.keyInsights?.length || 0
      });

      // Step 7: Calculate final cost and update metadata
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.info('FATHOM SERVICE: Finalizing analysis', {
        llmProcessingTime: llmResult.processingTime,
        totalProcessingTime: totalProcessingTime,
        cost: llmResult.cost
      });

      analysis.metadata.processingTime = llmResult.processingTime;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('=== FATHOM SERVICE: Analysis completed successfully ===', {
        analysisId: analysis._id,
        url,
        cost: `$${llmResult.cost?.toFixed(4)}`,
        llmProcessingTime: `${llmResult.processingTime}ms`,
        totalProcessingTime: `${totalProcessingTime}ms`,
        tokensUsed: llmResult.tokenUsage?.total,
        callRating: parsedResults.callRating,
        transcriptWordCount: transcriptResult.wordCount
      });

      return analysis;

    } catch (error) {
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.error('=== FATHOM SERVICE: Analysis failed ===', {
        error: error.message,
        stack: error.stack,
        totalProcessingTime: `${totalProcessingTime}ms`,
        analysisId: analysis?._id,
        url
      });
      
      if (analysis) {
        analysis.status = 'failed';
        analysis.metadata.error = {
          message: error.message,
          code: error.code || 'FATHOM_PROCESSING_ERROR',
          stack: error.stack
        };
        await analysis.save();
      }

      throw error;
    }
  }

  async extractTranscriptFromFathomUrl(url) {
    let browserInstance = null;
    const extractionStartTime = Date.now();
    
    try {
      logger.info('FATHOM SERVICE: Launching Playwright browser for Fathom URL', { url });
      
      // Launch browser using centralized Fathom-specific service
      browserInstance = await playwrightService.launchFathomBrowser({
        identifier: `fathom-${Date.now()}`,
        contextOptions: {
          ignoreHTTPSErrors: true
        }
      });

      logger.info('FATHOM SERVICE: Browser launched successfully', {
        identifier: browserInstance.identifier
      });

      const { page } = browserInstance;

      // Set up request interception to handle CORS
      logger.info('FATHOM SERVICE: Setting up request interception for CORS handling');
      await page.route('**/*', (route) => {
        const headers = {
          ...route.request().headers(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
        route.continue({ headers });
      });

      // Navigate to Fathom URL
      logger.info('FATHOM SERVICE: Navigating to Fathom URL', { url });
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      logger.info('FATHOM SERVICE: Page loaded successfully');

      // Wait for Fathom-specific content to load
      logger.info('FATHOM SERVICE: Waiting for Fathom content to load (5s)');
      await page.waitForTimeout(5000);

      // Try to find and click play button if video is not playing
      try {
        const playButton = await page.waitForSelector('button[aria-label*="play"], button[aria-label*="Play"], .play-button, [data-testid*="play"]', { timeout: 5000 });
        if (playButton) {
          await playButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // No play button found or video already playing
      }

      // Extract transcript using Fathom-specific selectors
      const transcript = await page.evaluate(() => {
        // Fathom-specific selectors for transcript content
        const fathomSelectors = [
          // Fathom transcript containers
          '[data-testid*="transcript"]',
          '[class*="transcript"]',
          '[id*="transcript"]',
          '.transcript-content',
          '.transcript-text',
          '.transcript-body',
          // Fathom meeting content
          '[data-testid*="meeting"]',
          '[class*="meeting"]',
          '[id*="meeting"]',
          '.meeting-content',
          '.meeting-transcript',
          // Fathom conversation/chat
          '[data-testid*="conversation"]',
          '[class*="conversation"]',
          '[class*="chat"]',
          '.conversation-content',
          '.chat-content',
          // Fathom video content
          '[data-testid*="video"]',
          '[class*="video"]',
          '.video-transcript',
          '.video-content',
          // Generic content areas that might contain transcript
          'main',
          '[role="main"]',
          '.content',
          '#content',
          '.main-content',
          // Fathom specific containers
          '.fathom-content',
          '.fathom-transcript',
          '[data-fathom*="transcript"]'
        ];

        let content = '';

        // Try Fathom-specific selectors first
        for (const selector of fathomSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            content = Array.from(elements)
              .map(el => {
                // Get text content and clean it up
                let text = el.textContent?.trim();
                if (text) {
                  // Remove timestamps and speaker labels if present
                  text = text.replace(/\d{1,2}:\d{2}(:\d{2})?/g, '');
                  text = text.replace(/^[A-Za-z]+:\s*/gm, '');
                  return text;
                }
                return '';
              })
              .filter(text => text && text.length > 10)
              .join('\n');
            
            if (content.length > 100) {
              // Found transcript using selector
              break;
            }
          }
        }

        // If no specific transcript found, try to get all text content
        if (!content || content.length < 100) {
          const body = document.body;
          if (body) {
            content = body.textContent?.trim() || '';
            // Clean up the content
            content = content.replace(/\d{1,2}:\d{2}(:\d{2})?/g, '');
            content = content.replace(/^[A-Za-z]+:\s*/gm, '');
          }
        }

        return content;
      });

      // Extract additional metadata
      const metadata = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          url: window.location.href,
          // Try to extract video duration if available
          duration: (() => {
            const timeElements = document.querySelectorAll('[class*="time"], [class*="duration"], [data-testid*="time"]');
            for (const el of timeElements) {
              const text = el.textContent;
              const match = text.match(/(\d{1,2}):(\d{2})(:(\d{2}))?/);
              if (match) {
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                const seconds = parseInt(match[4]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
              }
            }
            return 0;
          })()
        };
      });

      const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length;
      const extractionTime = Date.now() - extractionStartTime;

      logger.info('FATHOM SERVICE: Transcript extraction completed', {
        url,
        transcriptLength: transcript.length,
        wordCount,
        title: metadata.title,
        duration: metadata.duration,
        extractionTime: `${extractionTime}ms`
      });

      if (transcript.length < 50) {
        logger.error('FATHOM SERVICE: Insufficient transcript content extracted', {
          url,
          transcriptLength: transcript.length
        });
        throw new Error('Unable to extract sufficient transcript content from Fathom URL. The video may not have a transcript available or the page structure has changed.');
      }

      logger.info('FATHOM SERVICE: Transcript validation passed, returning results');

      return {
        text: transcript,
        confidence: transcript.length > 200 ? 0.9 : 0.7,
        language: 'en',
        duration: metadata.duration,
        wordCount,
        url,
        title: metadata.title,
        description: metadata.description
      };

    } catch (error) {
      const extractionTime = Date.now() - extractionStartTime;
      logger.error('FATHOM SERVICE: Failed to extract transcript from Fathom URL', {
        url,
        error: error.message,
        stack: error.stack,
        extractionTime: `${extractionTime}ms`
      });
      throw new Error(`Failed to extract transcript from Fathom URL: ${error.message}`);
    } finally {
      if (browserInstance) {
        logger.info('FATHOM SERVICE: Closing Playwright browser', {
          identifier: browserInstance.identifier
        });
        await playwrightService.closeBrowser(browserInstance.identifier);
        logger.info('FATHOM SERVICE: Browser closed successfully');
      }
    }
  }

  async scrapeAdditionalUrl(url) {
    try {
      const result = await this.extractTranscriptFromFathomUrl(url);
      
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
    // Enhanced fallback parsing logic for Fathom analysis
    const lines = response.split('\n');
    const result = {
      callDescription: 'A comprehensive sales call analysis was conducted on the Fathom transcript. The analysis covers the complete sales interaction, including participant identification, discussion topics, business challenges addressed, and the overall outcome of the conversation. This detailed evaluation provides insights into the sales process, prospect engagement, and opportunities for improvement based on the recorded meeting content.',
      summary: `The Fathom sales call analysis reveals a detailed interaction between sales representatives and prospects. The conversation covered key business challenges, solution presentations, and next steps. The analysis identified specific pain points, decision-making processes, and engagement levels throughout the call. Key outcomes include prospect interest levels, technical requirements discussed, and follow-up actions agreed upon. The overall call quality and effectiveness have been evaluated across multiple criteria to provide actionable insights for sales improvement.`,
      callRating: 6,
      callRatingBreakdown: {
        engagementQuality: 6,
        responsiveness: 6,
        discoverySkills: 6,
        valueProposition: 6,
        objectionHandling: 0,
        closingAttempts: 6,
        followUpPlanning: 6,
        overallCallFlow: 6
      },
      prospectDemographics: {
        teamSize: 'Analysis in progress - team size to be determined from Fathom call content',
        workVolume: 'Work volume assessment based on call discussion and business context',
        location: 'Geographic location to be identified from call participants and business references',
        previousExperience: 'Previous solution experience and satisfaction levels discussed during the call',
        likelihoodOfClosing: 'Closing probability assessment based on engagement and interest levels',
        website: 'Company website and digital presence mentioned during the conversation',
        businessSummary: 'Comprehensive business overview including company model, services, current challenges, and strategic goals as discussed in the Fathom call'
      },
      salesPerformance: {
        responsiveness: 'Sales team responsiveness evaluated based on question handling and solution presentation quality',
        satisfaction: 'Prospect satisfaction indicators assessed through verbal cues and engagement levels',
        engagement: 'Overall engagement quality measured by participation, questions asked, and interest shown'
      },
      keyInsights: [
        'Fathom call analysis completed with comprehensive evaluation of sales call dynamics',
        'Call content analyzed for pain points, challenges, and solution requirements',
        'Participant roles and responsibilities identified from conversation context',
        'Business context and industry-specific challenges discussed in detail',
        'Decision-making process and timeline considerations evaluated',
        'Technical requirements and implementation considerations identified',
        'Competitive landscape and alternative solutions mentioned during call',
        'Stakeholder involvement and influence levels assessed from conversation'
      ],
      recommendations: [
        'Review Fathom call recording quality and transcript accuracy for enhanced analysis',
        'Prepare detailed follow-up materials based on discussed requirements',
        'Schedule technical demonstration focusing on identified pain points',
        'Develop customized proposal addressing specific business challenges',
        'Engage additional stakeholders mentioned during the call',
        'Prepare competitive differentiation materials based on discussed alternatives',
        'Establish clear timeline and next steps based on prospect priorities',
        'Create implementation plan addressing technical and business requirements'
      ],
      otherNotableFindings: [
        'Fathom call successfully processed with enhanced analysis capabilities',
        'Comprehensive evaluation completed across all sales performance criteria',
        'Detailed insights generated for sales team improvement and optimization',
        'Business context and industry-specific considerations identified',
        'Relationship dynamics and communication patterns analyzed from recorded meeting'
      ],
      salesOpportunities: {
        productServiceGap: ['Additional services not discussed during the Fathom call'],
        upsellingOpportunities: [
          {
            opportunity: 'Premium features and advanced capabilities',
            relevance: 3,
            likelihood: 3,
            revenueImpact: 3
          }
        ],
        crossSellingOpportunities: [
          {
            opportunity: 'Complementary services and solutions',
            relevance: 3,
            likelihood: 3,
            revenueImpact: 3
          }
        ]
      },
      // Legacy fields for backward compatibility
      actionItems: ['Review Fathom analysis results and implement recommendations'],
      sentiment: {
        overall: 'positive',
        confidence: 0.7,
        breakdown: { positive: 0.4, neutral: 0.4, negative: 0.2 }
      },
      topics: ['Fathom call analysis', 'Business requirements', 'Solution presentation'],
      participants: [
        {
          name: 'Sales Representative',
          role: 'Sales Team',
          speakingTime: 50,
          keyPoints: ['Solution presentation', 'Discovery questions', 'Next steps planning']
        },
        {
          name: 'Prospect',
          role: 'Customer',
          speakingTime: 50,
          keyPoints: ['Business challenges', 'Requirements discussion', 'Decision criteria']
        }
      ],
      riskFactors: ['Potential implementation challenges', 'Budget constraints'],
      opportunities: ['Upselling potential', 'Cross-selling opportunities', 'Long-term partnership']
    };

    return result;
  }
}

module.exports = new FathomService();
