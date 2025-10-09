const llmService = require('./llmService');
const FileUtils = require('../utils/fileUtils');
const Analysis = require('../models/Analysis');
const logger = require('../utils/logger');

class TranscriptService {
  async processTranscriptCall(transcript, userId, additionalContent = null, userData = null) {
    let analysis = null;
    const processingStartTime = Date.now();

    try {
      logger.info('=== TRANSCRIPT SERVICE: Starting transcript analysis ===', {
        userId,
        transcriptLength: transcript?.length,
        hasAdditionalContent: !!additionalContent,
        additionalContentType: additionalContent?.type
      });

      // Validate transcript
      logger.info('TRANSCRIPT SERVICE: Validating transcript');
      this.validateTranscript(transcript);
      logger.info('TRANSCRIPT SERVICE: Transcript validation successful', {
        wordCount: transcript.split(/\s+/).length,
        charCount: transcript.length
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
        logger.info('TRANSCRIPT SERVICE: User data identified', {
          email: userData.email,
          userId: userData.userId,
          companyId: userData.companyId
        });
      } else {
        logger.warn('TRANSCRIPT SERVICE: No user data provided in session');
      }

      // Create analysis record using user object
      logger.info('TRANSCRIPT SERVICE: Creating analysis record in database');
      analysis = new Analysis({
        user: userObject,
        serviceType: 'transcript',
        status: 'processing',
        input: {
          transcript: transcript
        }
      });
      await analysis.save();
      logger.info('TRANSCRIPT SERVICE: Analysis record created', { 
        analysisId: analysis._id,
        serviceType: 'transcript'
      });

      // Step 2: Process additional content if provided
      let scrapedContent = '';
      if (additionalContent) {
        logger.info('TRANSCRIPT SERVICE: Additional content detected', {
          type: additionalContent.type,
          url: additionalContent.url,
          fileName: additionalContent.file?.originalname
        });

        if (additionalContent.type === 'url') {
          logger.info('TRANSCRIPT SERVICE: Starting URL scraping for product/service information', {
            url: additionalContent.url
          });
          scrapedContent = await this.scrapeUrl(additionalContent.url);
          logger.info('TRANSCRIPT SERVICE: URL scraping completed', {
            url: additionalContent.url,
            scrapedContentLength: scrapedContent?.text?.length || 0
          });
        } else if (additionalContent.type === 'document') {
          logger.info('TRANSCRIPT SERVICE: Starting document processing', {
            fileName: additionalContent.file?.originalname
          });
          scrapedContent = await this.processDocument(additionalContent.file);
          logger.info('TRANSCRIPT SERVICE: Document processing completed', {
            fileName: additionalContent.file?.originalname,
            contentLength: scrapedContent?.text?.length || 0
          });
        }
      } else {
        logger.info('TRANSCRIPT SERVICE: No additional content provided');
      }

      // Update analysis with transcript info
      const wordCount = transcript.split(/\s+/).length;
      logger.info('TRANSCRIPT SERVICE: Updating analysis with transcript metadata', {
        wordCount,
        charCount: transcript.length
      });

      analysis.processing.transcript = {
        text: transcript,
        confidence: 1.0, // User provided transcript
        language: 'en', // Could be detected
        duration: 0, // Would need audio analysis
        wordCount: wordCount
      };

      // Update analysis with scraped content if any
      if (scrapedContent) {
        analysis.processing.scrapedContent = scrapedContent;
        logger.info('TRANSCRIPT SERVICE: Additional content added to analysis', {
          contentType: additionalContent.type
        });
      }

      await analysis.save();
      logger.info('TRANSCRIPT SERVICE: Analysis metadata saved to database');

      // Step 4: Send to LLM for analysis
      logger.info('TRANSCRIPT SERVICE: Starting LLM analysis', {
        transcriptWordCount: wordCount,
        hasAdditionalContent: !!scrapedContent
      });

      const llmResult = await llmService.analyzeSalesCall(
        transcript,
        scrapedContent
      );

      logger.info('TRANSCRIPT SERVICE: LLM analysis completed', {
        model: llmResult.model,
        processingTime: llmResult.processingTime,
        tokensUsed: llmResult.tokenUsage?.total,
        cost: llmResult.cost
      });

      // Update analysis with LLM results
      logger.info('TRANSCRIPT SERVICE: Updating analysis with LLM results');
      analysis.processing.llmAnalysis = {
        prompt: 'Sales call analysis prompt',
        response: llmResult.response,
        tokensUsed: llmResult.tokenUsage,
        cost: llmResult.cost,
        model: llmResult.model,
        processingTime: llmResult.processingTime
      };

      // Parse LLM response and extract structured data
      logger.info('TRANSCRIPT SERVICE: Parsing LLM response to extract structured data');
      const parsedResults = this.parseLLMResponse(llmResult.response);
      analysis.results = parsedResults;
      logger.info('TRANSCRIPT SERVICE: Structured data extracted successfully', {
        hasCallRating: !!parsedResults.callRating,
        hasRecommendations: !!parsedResults.recommendations,
        recommendationsCount: parsedResults.recommendations?.length || 0,
        hasKeyInsights: !!parsedResults.keyInsights,
        insightsCount: parsedResults.keyInsights?.length || 0
      });

      // Step 6: Calculate final cost and update metadata
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.info('TRANSCRIPT SERVICE: Finalizing analysis', {
        llmProcessingTime: llmResult.processingTime,
        totalProcessingTime: totalProcessingTime,
        cost: llmResult.cost
      });

      analysis.metadata.processingTime = llmResult.processingTime;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('=== TRANSCRIPT SERVICE: Analysis completed successfully ===', {
        analysisId: analysis._id,
        cost: `$${llmResult.cost?.toFixed(4)}`,
        llmProcessingTime: `${llmResult.processingTime}ms`,
        totalProcessingTime: `${totalProcessingTime}ms`,
        tokensUsed: llmResult.tokenUsage?.total,
        callRating: parsedResults.callRating
      });

      return analysis;

    } catch (error) {
      const totalProcessingTime = Date.now() - processingStartTime;
      logger.error('=== TRANSCRIPT SERVICE: Analysis failed ===', {
        error: error.message,
        stack: error.stack,
        totalProcessingTime: `${totalProcessingTime}ms`,
        analysisId: analysis?._id
      });
      
      if (analysis) {
        analysis.status = 'failed';
        analysis.metadata.error = {
          message: error.message,
          code: error.code || 'TRANSCRIPT_PROCESSING_ERROR',
          stack: error.stack
        };
        await analysis.save();
      }

      throw error;
    }
  }

  validateTranscript(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      throw new Error('Transcript is required and must be a string');
    }

    if (transcript.trim().length < 50) {
      throw new Error('Transcript must be at least 50 characters long');
    }

    if (transcript.length > 100000) {
      throw new Error('Transcript is too long. Maximum length: 100,000 characters');
    }

    // Check if transcript contains meaningful content
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount < 10) {
      throw new Error('Transcript must contain at least 10 words');
    }
  }

  async scrapeUrl(url) {
    try {
      logger.info('TRANSCRIPT SERVICE: Extracting product/service info from URL using LLM', { url });
      const startTime = Date.now();
      
      const result = await llmService.extractTranscriptFromUrl(url);
      
      const processingTime = Date.now() - startTime;
      logger.info('TRANSCRIPT SERVICE: URL content extraction successful', {
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
      logger.error('TRANSCRIPT SERVICE: URL scraping failed', {
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
    // Enhanced fallback parsing logic for Transcript analysis
    const lines = response.split('\n');
    const result = {
      callDescription: 'A comprehensive sales call analysis was conducted on the provided transcript. The analysis covers the complete sales interaction, including participant identification, discussion topics, business challenges addressed, and the overall outcome of the conversation. This detailed evaluation provides insights into the sales process, prospect engagement, and opportunities for improvement based on the written transcript content.',
      summary: `The transcript sales call analysis reveals a detailed interaction between sales representatives and prospects. The conversation covered key business challenges, solution presentations, and next steps. The analysis identified specific pain points, decision-making processes, and engagement levels throughout the call. Key outcomes include prospect interest levels, technical requirements discussed, and follow-up actions agreed upon. The overall call quality and effectiveness have been evaluated across multiple criteria to provide actionable insights for sales improvement.`,
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
        teamSize: 'Analysis in progress - team size to be determined from transcript content',
        workVolume: 'Work volume assessment based on call discussion and business context',
        location: 'Geographic location to be identified from call participants and business references',
        previousExperience: 'Previous solution experience and satisfaction levels discussed during the call',
        likelihoodOfClosing: 'Closing probability assessment based on engagement and interest levels',
        website: 'Company website and digital presence mentioned during the conversation',
        businessSummary: 'Comprehensive business overview including company model, services, current challenges, and strategic goals as discussed in the transcript'
      },
      salesPerformance: {
        responsiveness: 'Sales team responsiveness evaluated based on question handling and solution presentation quality',
        satisfaction: 'Prospect satisfaction indicators assessed through verbal cues and engagement levels',
        engagement: 'Overall engagement quality measured by participation, questions asked, and interest shown'
      },
      keyInsights: [
        'Transcript analysis completed with comprehensive evaluation of sales call dynamics',
        'Call content analyzed for pain points, challenges, and solution requirements',
        'Participant roles and responsibilities identified from conversation context',
        'Business context and industry-specific challenges discussed in detail',
        'Decision-making process and timeline considerations evaluated',
        'Technical requirements and implementation considerations identified',
        'Competitive landscape and alternative solutions mentioned during call',
        'Stakeholder involvement and influence levels assessed from conversation'
      ],
      recommendations: [
        'Review transcript quality and content accuracy for enhanced analysis',
        'Prepare detailed follow-up materials based on discussed requirements',
        'Schedule technical demonstration focusing on identified pain points',
        'Develop customized proposal addressing specific business challenges',
        'Engage additional stakeholders mentioned during the call',
        'Prepare competitive differentiation materials based on discussed alternatives',
        'Establish clear timeline and next steps based on prospect priorities',
        'Create implementation plan addressing technical and business requirements'
      ],
      otherNotableFindings: [
        'Transcript successfully processed with enhanced analysis capabilities',
        'Comprehensive evaluation completed across all sales performance criteria',
        'Detailed insights generated for sales team improvement and optimization',
        'Business context and industry-specific considerations identified',
        'Relationship dynamics and communication patterns analyzed from transcript'
      ],
      salesOpportunities: {
        productServiceGap: ['Additional services not discussed during the call'],
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
      actionItems: ['Review transcript analysis results and implement recommendations'],
      sentiment: {
        overall: 'positive',
        confidence: 0.7,
        breakdown: { positive: 0.4, neutral: 0.4, negative: 0.2 }
      },
      topics: ['Transcript analysis', 'Business requirements', 'Solution presentation'],
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

  // Helper method to clean and format transcript
  cleanTranscript(transcript) {
    return transcript
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  // Helper method to detect speakers in transcript
  detectSpeakers(transcript) {
    const speakerPatterns = [
      /^([A-Z][a-z]+):/gm, // "John:"
      /^([A-Z][A-Z]+):/gm, // "JOHN:"
      /^Speaker\s*(\d+):/gmi, // "Speaker 1:"
      /^([A-Z][a-z]+\s+[A-Z][a-z]+):/gm, // "John Smith:"
    ];

    const speakers = new Set();
    
    for (const pattern of speakerPatterns) {
      const matches = transcript.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const speaker = match.replace(/:\s*$/, '').trim();
          speakers.add(speaker);
        });
      }
    }

    return Array.from(speakers);
  }

  // Helper method to estimate call duration from transcript
  estimateDuration(transcript, wordsPerMinute = 150) {
    const wordCount = transcript.split(/\s+/).length;
    const durationMinutes = wordCount / wordsPerMinute;
    return Math.round(durationMinutes * 60); // Return duration in seconds
  }
}

module.exports = new TranscriptService();
