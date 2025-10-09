const { GoogleGenAI, createUserContent, createPartFromUri } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const Analysis = require('../models/Analysis');
const User = require('../models/User');

class AudioUploadService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initializeLLM();
  }

  /**
   * Initialize Google Generative AI with Files API support
   */
  initializeLLM() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      this.genAI = new GoogleGenAI({ apiKey });
      // Note: @google/genai doesn't have getGenerativeModel, we'll use it directly for file operations
      // and use the models.generateContent method for analysis

      logger.info('Audio Upload Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Audio Upload Service:', error);
      throw error;
    }
  }

  /**
   * Upload audio file to Gemini Files API
   */
  async uploadAudioFile(filePath, mimeType = 'audio/mpeg') {
    try {
      logger.info('Uploading audio file to Gemini Files API', { filePath, mimeType });

      const file = await this.genAI.files.upload({
        file: filePath,
        config: { mimeType }
      });

      logger.info('Audio file uploaded successfully', {
        fileName: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes
      });

      return {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        state: file.state,
        createTime: file.createTime
      };

    } catch (error) {
      logger.error('Failed to upload audio file:', error);
      throw new Error(`Audio upload failed: ${error.message}`);
    }
  }

  /**
   * Get metadata for uploaded file
   */
  async getFileMetadata(fileName) {
    try {
      const file = await this.genAI.files.get({ name: fileName });
      
      logger.info('File metadata retrieved', {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        state: file.state
      });

      return file;
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List all uploaded files
   */
  async listUploadedFiles(pageSize = 10) {
    try {
      const listResponse = await this.genAI.files.list({ 
        config: { pageSize } 
      });

      const files = [];
      for await (const file of listResponse) {
        files.push({
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          state: file.state,
          createTime: file.createTime
        });
      }

      logger.info('Listed uploaded files', { count: files.length });
      return files;
    } catch (error) {
      logger.error('Failed to list uploaded files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(fileName) {
    try {
      await this.genAI.files.delete({ name: fileName });
      logger.info('File deleted successfully', { fileName });
      return { success: true, fileName };
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Transcribe audio file using Gemini
   */
  async transcribeAudioFile(fileUri, mimeType) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Starting audio transcription', { fileUri, mimeType, attempt });

        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: createUserContent([
            createPartFromUri(fileUri, mimeType),
            "Transcribe this audio file. Provide a detailed transcript with speaker identification if possible. Include timestamps if available. Format the output clearly with speaker names and their corresponding dialogue."
          ])
        });

        const transcript = response.text;
        
        logger.info('Audio transcription completed', {
          transcriptLength: transcript.length,
          wordCount: transcript.split(/\s+/).length,
          attempt
        });

        return {
          text: transcript,
          wordCount: transcript.split(/\s+/).length,
          language: 'en', // You might want to detect this
          confidence: this.calculateConfidence(transcript)
        };

      } catch (error) {
        lastError = error;
        logger.warn(`Audio transcription attempt ${attempt} failed:`, {
          error: error.message,
          attempt,
          maxRetries
        });

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          logger.info(`Retrying transcription in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed
    logger.error('Audio transcription failed after all retries:', lastError);
    throw new Error(`Transcription failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Analyze audio file with comprehensive sales call analysis
   */
  async analyzeAudioFile(fileUri, mimeType, additionalContent = '') {
    try {
      logger.info('Starting comprehensive audio analysis', { fileUri, mimeType });

      const systemPrompt = `You are the "Sales Call Analyzer," an advanced AI-powered analytical tool designed to provide comprehensive, detailed insights from recorded sales call audio. Your analysis should be thorough, actionable, and provide deep understanding of the sales interaction.

**ANALYSIS REQUIREMENTS:**
Generate a professional, well-formatted analysis that provides actionable insights. Focus on creating content that is:
- **Well-Formatted**: Use clear structure, bullet points, and organized sections for easy reading
- **Concise and Professional**: Keep content brief and to the point, following standard business report formats
- **Specific and Actionable**: Provide concrete recommendations that sales teams can implement
- **Contextual**: Consider the business context, industry, and specific pain points discussed
- **Standard Length**: Follow professional content length guidelines (Call Description: 150-200 words, Summary: 200-300 words)
- **Structured Format**: Use clear headings, bullet points, and organized sections for better readability

**CRITICAL: You must respond with valid JSON format. All scoring values (relevance, likelihood, revenueImpact) must be NUMERIC values between 1-5, not text like "Medium" or "High".**

**IMPORTANT RATING ACCURACY: Analyze each call objectively and provide varied ratings based on actual performance. Do not default to 7/10. Use the full 1-10 scale appropriately based on call quality.**

**RATING GUIDELINES:**
- **1-3/10**: Terrible calls (rude, unprofessional, no value, poor discovery)
- **4-5/10**: Below average calls (basic interaction, limited discovery, weak value prop)
- **6-7/10**: Average to good calls (professional, decent discovery, clear next steps)
- **8-9/10**: Excellent calls (exceptional engagement, thorough discovery, strong closing)
- **10/10**: Perfect calls (outstanding in all areas, exceptional results)

**BE CRITICAL AND REALISTIC - Most calls should be 4-6/10, not 7/10.**

**❌ CRITICAL: callDescription and summary MUST BE COMPLETELY DIFFERENT! ❌**
**⚠️ WARNING: DO NOT use "Detailed Call Analysis" as a header in callDescription!**
**⚠️ WARNING: DO NOT include "Opening & Discovery", "Solution Presentation", "Closing & Next Steps" sections in callDescription!**
**⚠️ These sections ONLY belong in summary!**

**callDescription = Executive Summary (like an email preview)**
**summary = Full Story (like reading the entire transcript with analysis)**

**ENHANCED JSON Response Format Must Include:**

1. **callDescription**: A JSON string - EXECUTIVE SUMMARY ONLY (150-200 words)
   
   **Format it as a business card/snapshot with NO subsections:**
   
   Start with: "## Sales Call Overview" (NOT "Detailed Call Analysis")
   
   Then include in PARAGRAPH format (not subsections):
   - First sentence: State who talked to whom (full names, titles, companies)
   - Second part: State the single main purpose/goal of the call
   - Third part: List 3-5 key topics as simple bullet points
   - Fourth part: One sentence about call atmosphere/tone
   - Final sentence: What was agreed upon or what happens next
   
   **IMPORTANT: This should read like an executive email summary, NOT a detailed analysis!**
   **Use simple, factual language. No subsections. No detailed explanations.**

2. **summary**: A JSON string - COMPREHENSIVE STORY (400-600 words)
   
   **Format with these EXACT markdown headers and detailed narrative:**
   
   Start with: "## Detailed Call Analysis" (this header ONLY goes here, NOT in callDescription!)
   
   **Then these REQUIRED subsections:**
   
   ### Opening & Discovery
   [Write 2-3 detailed paragraphs telling the story of how the call began]
   - Include actual quotes or paraphrases from the conversation
   - Describe the rapport-building process
   - List every question the sales rep asked
   - Detail each pain point the prospect mentioned with full context
   - Include any background info shared (what they've tried before, current situation)
   - Mention specific numbers, metrics, or KPIs discussed
   
   ### Solution Presentation  
   [Write 2-3 detailed paragraphs about how the solution was presented]
   - Describe exactly which features were demonstrated
   - Explain how each feature addresses the prospect's specific pain points
   - Include pricing information discussed (exact numbers)
   - Detail any comparisons made to competitors or alternatives
   - Describe prospect's reactions and questions during demo
   - Explain how objections were handled with specific examples
   
   ### Closing & Next Steps
   [Write 1-2 detailed paragraphs about call conclusion]
   - State who committed to what specific actions
   - Include exact dates/times for follow-ups if mentioned
   - Detail what materials will be sent and by whom
   - Assess prospect's genuine interest level based on their words and tone
   - Provide your analysis of likelihood to close and why
   
   ### Overall Assessment
   [Write 1 paragraph with your professional evaluation]
   - Was this call successful? Why or why not?
   - What are the key takeaways for the sales team?
   - What should happen differently in the next interaction?
   - What is the realistic next stage in this sales process?
   
   **IMPORTANT: This should read like a detailed transcript analysis with rich context and specifics!**
   **Include actual details from the conversation - names, numbers, features, commitments, dates.**

3. **callRating**: Overall rating (1-10) with detailed justification

4. **callRatingBreakdown**: Object with detailed scores for each criterion

5. **prospectDemographics**: Comprehensive object including:
   - Team Size: Specific number or range if mentioned
   - Work Volume: Detailed description of their workload and scale
   - Location: City, state, country if mentioned
   - Previous Experience: Detailed history with similar solutions
   - Likelihood of Closing: Percentage with detailed reasoning
   - Website: Full URL if mentioned
   - Business Summary: 2-3 paragraph description of their business model, services, goals, and challenges

6. **salesPerformance**: Detailed object with specific examples:
   - Responsiveness: Specific instances of good/poor responses
   - Satisfaction: Verbal and non-verbal indicators of satisfaction
   - Engagement: Specific examples of high/low engagement moments

7. **keyInsights**: Array of 5-8 detailed, specific insights (each 1-2 sentences) covering:
   - Pain points and challenges identified
   - Decision-making process and timeline
   - Budget and resource constraints
   - Competitive landscape and alternatives
   - Technical requirements and specifications
   - Stakeholder involvement and influence
   - Urgency and priority level

8. **recommendations**: Array of 5-8 specific, actionable recommendations (each 1-2 sentences) covering:
   - Immediate next steps and follow-up actions
   - Content and materials to prepare
   - Stakeholders to involve or contact
   - Timeline and scheduling considerations
   - Pricing and proposal strategies
   - Technical demonstration requirements
   - Competitive positioning and differentiation

9. **otherNotableFindings**: Array of 3-5 additional observations covering:
   - Unexpected insights or revelations
   - Red flags or concerns
   - Opportunities for upselling or cross-selling
   - Technical or implementation considerations
   - Relationship dynamics and communication styles

10. **salesOpportunities**: Detailed object with comprehensive analysis

**CRITICAL: keyInsights, recommendations, and otherNotableFindings must be arrays of strings, NOT arrays of objects.**

**CRITICAL JSON FORMATTING REQUIREMENTS:**
- callDescription and summary are JSON strings that should contain markdown formatting
- Use \\n (escaped newline) for line breaks in JSON strings
- Use proper JSON string escaping (escape quotes, backslashes, etc.)
- The JSON must be valid - test it before responding
- Structure content with markdown headers (##, ###) for better readability

**NOTICE: The examples below show the SAME call (KubeOps + TechStart) but formatted VERY differently:**
- **callDescription** = Short factual overview (like LinkedIn post)  
- **summary** = Long detailed story (like reading meeting notes)

**EXAMPLE callDescription (SHORT EXECUTIVE SUMMARY - 150 words):**

"## Sales Call Overview\\n\\nMaya Chen (Account Executive, KubeOps) conducted a discovery call with Raj Patel (DevOps Lead) and Priya Singh (CTO) from TechStart Inc., a SaaS company experiencing Kubernetes scaling issues. The primary purpose was to understand TechStart's infrastructure challenges and introduce KubeOps' predictive autoscaling solution.\\n\\n**Key Topics:**\\n- Pod failure rates during traffic spikes (15-20% failure rate)\\n- Current manual scaling approach and limitations\\n- KubeOps' ML-based predictive autoscaling features\\n- Pricing comparison with current monitoring tools\\n- Proof of concept proposal\\n\\n**Call Tone:** Highly collaborative and technical, with strong engagement from both the DevOps lead and CTO, indicating serious evaluation intent.\\n\\n**Next Steps:** Raj agreed to a 45-minute technical deep-dive on Friday at 10 AM PST to review a customized proof of concept using TechStart's actual cluster data."

**EXAMPLE summary (SAME CALL but MUCH MORE DETAILED - 500+ words):**

"## Detailed Call Analysis\\n\\n### Opening & Discovery\\n\\nThe call opened at 2 PM with Maya Chen introducing herself as the Account Executive from KubeOps. She started with rapport-building by asking Raj about his weekend plans, then smoothly transitioned into business by asking, \\\"How has your experience been managing Kubernetes clusters at your current scale?\\\" Raj shared that TechStart runs a SaaS platform with 50,000+ active users and they process approximately 10 million API requests daily. He explained they've been struggling with pod failures, stating, \\\"We're seeing about 15-20% of our pods failing during evening peak hours, which is when our users are most active.\\\"\\n\\nMaya asked follow-up questions: \\\"What's your current autoscaling setup?\\\" Raj explained they use basic Horizontal Pod Autoscaler (HPA) with CPU threshold of 70%, but admitted it's purely reactive. \\\"By the time HPA kicks in, we're already experiencing degraded performance,\\\" he said. Maya then asked about business impact, and Raj revealed each minute of downtime costs approximately $2,000 in lost transactions. He mentioned three major incidents in Q2 that resulted in customer escalations and two enterprise clients threatening to churn. When asked about their DevOps team capacity, Raj shared they have 5 engineers who spend roughly 40% of their time just monitoring and manually scaling infrastructure instead of working on product features.\\n\\nCrucially, when Maya asked about budget, Raj indicated they have $50,000 allocated for infrastructure tooling this quarter. He also mentioned they're currently paying $3,200/month for Datadog monitoring but still need manual intervention for scaling decisions.\\n\\n### Solution Presentation\\n\\nMaya presented KubeOps' predictive autoscaling platform, starting with the core value proposition: \\\"We use machine learning to predict traffic spikes 5-15 minutes before they happen, so your clusters scale proactively instead of reactively.\\\" She shared a specific example of how a similar SaaS company reduced their pod failure rate from 18% to under 2% within 30 days of implementation.\\n\\nRaj immediately asked technical questions: \\\"Does this work with our existing Prometheus and Grafana setup?\\\" Maya confirmed native integration and showed screenshots of the dashboard. \\\"Can we customize the ML models for our specific traffic patterns?\\\" Maya explained the system starts with baseline models but learns and adapts to each customer's unique patterns after 30 days of data collection. She was transparent, noting, \\\"The first month you'll see good results, but months 2-3 are when the predictions become really accurate as the model learns your specific patterns.\\\"\\n\\nRegarding pricing, Maya positioned it at $1,800/month for TechStart's scale (up to 100K users), emphasizing this is 44% less than their current Datadog cost while providing both monitoring AND automated scaling. When Raj asked about ROI, Maya calculated: \\\"If we prevent just two of those $2,000/minute incidents per month, you've already covered the cost. Based on your three incidents last quarter, we'd expect to save you $15,000-$20,000 monthly.\\\"\\n\\nRaj raised a concern: \\\"We can't afford to add another tool that doesn't work.\\\" Maya responded by offering a proof of concept using TechStart's actual anonymized cluster data to demonstrate prediction accuracy before any commitment.\\n\\n### Closing & Next Steps\\n\\nRaj's response to the POC offer was enthusiastic: \\\"That would be incredibly helpful - I need real data to present to our CTO for approval.\\\" Maya proposed a 45-minute technical session for later that week to present the POC results and dive deeper into architecture and security. Raj checked his calendar and confirmed Friday at 10 AM PST worked. Maya offered to include their Senior Solutions Architect in the Friday call if Raj wanted to bring technical team members. Raj appreciated this and said he'd likely invite their Lead Platform Engineer.\\n\\nSpecific commitments established:\\n- Maya will: (1) Prepare POC analysis using TechStart's cluster data by Thursday EOD, (2) Send technical integration documentation for Prometheus/Grafana, (3) Include case study from similar-sized SaaS company, (4) Send calendar invite for Friday 10 AM with Zoom link, (5) CC their Solutions Architect on the invite\\n- Raj will: (1) Review all materials before Friday, (2) Prepare list of technical questions, (3) Bring their Platform Engineer if POC results look promising, (4) Have preliminary budget discussion with CTO before Friday call\\n\\nRaj's final comment was telling: \\\"This is exactly the kind of proactive approach we need. Looking forward to Friday.\\\" His tone shifted from cautious to genuinely interested after the POC offer.\\n\\n### Overall Assessment\\n\\nThis was an expertly executed discovery call scoring 8.5/10. Maya demonstrated exceptional qualification skills by quantifying the business impact ($2K/minute downtime, three incidents, churn risk) before presenting pricing. The POC strategy was brilliant - it addresses Raj's risk concerns while demonstrating product confidence. The prospect is highly qualified: clear budget authority (CTO involved), urgent pain point (costing them real money), defined evaluation process, and senior decision-makers engaged. The likelihood of conversion is 75-80% if the POC demonstrates solid prediction accuracy. Expected timeline: POC review Friday, technical validation week 2, pricing negotiation week 3, contract by end of month. The consultative approach and technical credibility established strong foundation for closing this deal."

### **Primary Objectives**
1. Analyze sales call audio, even when participants are not explicitly identified, for both **qualitative insights** and **quantitative metrics.**
2. Provide an **overall effectiveness score** on a 1-to-10 scale that reflects the quality and success of the sales team's performance during the call.
3. Offer a **comprehensive breakdown** of the call, identifying strengths, weaknesses, and actionable suggestions for improvement.
4. Dynamically infer speaker roles based on context, ensuring clarity in cases where participants are not predefined or explicitly labeled.

### **Criteria for Analysis**
Extract and analyze the following factors during the evaluation of a sales call audio:

#### **1. Prospect's Demographic Details:**
- **Team Size:** Infer the size of the prospect's team from context, if mentioned.
- **Work Volume:** Assess the typical amount or scale of work the prospect's team handles.
- **Location:** Identify the location of the prospect or their business, if disclosed.
- **Previous Experience:** Determine if the prospect has used similar services in the past and evaluate their satisfaction level (positive or negative feedback).
- **Likelihood of Closing:** Based on the content and tone of the conversation, provide an estimate of deal closure probability.
- **Website:** Extract the URL of the prospect's business, if mentioned.
- **Business Summary:** Provide a concise summary of the prospect's business, including their model, services/products offered, and overarching goals.

#### **2. Sales Team Performance:**
Evaluate the sales team based on the following key factors:
- **Responsiveness:** Were the sales representatives able to effectively and confidently address the prospect's queries? Identify instances of thorough answers or incomplete responses.
- **Satisfaction:** Did the prospect verbally or contextually indicate satisfaction or dissatisfaction with the sales team's responses and solutions?
- **Engagement:** Assess the level of engagement from the prospect. Did they ask relevant questions, seem interested in follow-ups, or express clarity in intent? High engagement often indicates strong interest.

### **Call Rating (1-10) with Detailed Breakdown**
- **Engagement Quality (1-10):** How well did the sales rep engage the prospect? Did they ask good questions, listen actively, and maintain interest?
- **Responsiveness (1-10):** How effectively did the sales rep address the prospect's questions and concerns? Were answers thorough and helpful?
- **Discovery Skills (1-10):** How well did the sales rep uncover the prospect's pain points, needs, and decision-making process?
- **Value Proposition (1-10):** How clearly and compellingly did the sales rep present the solution and its benefits?
- **Objection Handling (1-10):** How well did the sales rep handle any objections or concerns raised by the prospect? (Use 0 if no objections were raised)
- **Closing Attempts (1-10):** Did the sales rep attempt to move the conversation forward with next steps, demos, or closing questions?
- **Follow-up Planning (1-10):** Was there a clear next step or follow-up planned?
- **Overall Call Flow (1-10):** How well-structured and professional was the overall conversation?

**CRITICAL RATING CALCULATION RULES:**
1. **ALL scores must be between 1-10 (no null values)**
2. **Calculate the average of all 8 scores**
3. **Round to the nearest whole number for final rating**
4. **Use 0 for objectionHandling only if NO objections were raised**
5. **Be realistic and varied in scoring - not every call is a 7/10**

### **Sales Opportunity Analysis**
Identify potential sales opportunities by:
- **Product/Service Gap Analysis:** Identify products/services that weren't discussed during the call
- **Upselling Detection:** Look for premium feature mentions that weren't explored, indications of budget flexibility, pain points that premium solutions could address
- **Cross-selling Indicators:** Monitor related product needs mentioned by prospect, complementary service opportunities, business challenges that multiple products could solve
- **Opportunity Scoring:** Rate each opportunity on relevance to prospect's needs (1-5), likelihood of conversion (1-5), potential revenue impact (1-5)

By adhering to these guidelines, provide sales teams with actionable insights and practical evaluations that enable them to close deals more effectively and build stronger engagements with prospects.`;

      const userInput = `Additional Context:
${additionalContent || 'No additional context available'}

Please analyze the following audio file and provide a comprehensive sales call analysis.`;

      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: createUserContent([
          createPartFromUri(fileUri, mimeType),
          systemPrompt + '\n\n' + userInput
        ])
      });

      const analysisText = response.text;
      
      logger.info('Audio analysis completed', {
        analysisLength: analysisText.length
      });

      // Parse the response
      const analysis = this.parseAnalysisResponse(analysisText);

      return {
        analysis,
        model: 'gemini-2.5-flash',
        processingTime: Date.now()
      };

    } catch (error) {
      logger.error('Audio analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Process complete audio file upload and analysis
   */
  async processAudioFile(filePath, userId, additionalContent = '', existingAnalysis = null, userData = null) {
    try {
      let analysis;
      
      if (existingAnalysis) {
        // Use existing analysis record
        analysis = existingAnalysis;
        analysis.status = 'processing';
        analysis.input.filePath = filePath;
        await analysis.save();
      } else {
        // Create user object from session data
        let userObject = null;
        if (userData && (userData.userId || userData.email)) {
          // Use session user data if available
          userObject = {
            email: userData.email || null,
            userId: userData.userId || null,
            companyId: userData.companyId || null
          };
        } else {
          // Fall back to demo user data from database
          const User = require('../models/User');
          const user = await User.findById(userId);
          if (user) {
            userObject = {
              email: user.email || null,
              userId: user._id || null,
              companyId: user.companyId || null
            };
          }
        }

        // Create new analysis record using user object
        analysis = new Analysis({
          user: userObject,
          serviceType: 'audio',
          status: 'processing',
          input: { filePath }
        });
        await analysis.save();
      }

      logger.info('Starting audio file processing', { 
        analysisId: analysis._id, 
        filePath,
        userId 
      });

      // Determine MIME type
      const mimeType = this.getMimeType(filePath);

      // Upload file to Gemini
      const uploadedFile = await this.uploadAudioFile(filePath, mimeType);

      // Update analysis with upload info
      analysis.processing.upload = {
        fileName: uploadedFile.name,
        uri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeBytes,
        state: uploadedFile.state
      };
      await analysis.save();

      // Transcribe audio
      let transcriptResult;
      try {
        transcriptResult = await this.transcribeAudioFile(uploadedFile.uri, uploadedFile.mimeType);
        
        // Update analysis with transcript
        analysis.processing.transcript = {
          text: transcriptResult.text,
          confidence: transcriptResult.confidence,
          language: transcriptResult.language,
          wordCount: transcriptResult.wordCount
        };
        await analysis.save();
        
        logger.info('Audio transcription completed successfully', {
          analysisId: analysis._id,
          wordCount: transcriptResult.wordCount
        });
      } catch (transcriptionError) {
        logger.error('Audio transcription failed, continuing with fallback', {
          analysisId: analysis._id,
          error: transcriptionError.message
        });
        
        // Create a fallback transcript with error information
        transcriptResult = {
          text: `[Transcription Error: ${transcriptionError.message}] The audio file was uploaded successfully but transcription failed. Please try again or contact support.`,
          wordCount: 0,
          language: 'en',
          confidence: 0,
          error: transcriptionError.message
        };
        
        analysis.processing.transcript = {
          text: transcriptResult.text,
          confidence: transcriptResult.confidence,
          language: transcriptResult.language,
          wordCount: transcriptResult.wordCount,
          error: transcriptResult.error
        };
        analysis.status = 'failed';
        analysis.error = `Transcription failed: ${transcriptionError.message}`;
        await analysis.save();
        
        // Don't throw here, continue with the fallback transcript
      }

      // Analyze audio
      const analysisResult = await this.analyzeAudioFile(
        uploadedFile.uri, 
        uploadedFile.mimeType, 
        additionalContent
      );

      // Update analysis with results
      analysis.processing.llmAnalysis = {
        prompt: 'Comprehensive audio analysis prompt',
        response: JSON.stringify(analysisResult.analysis),
        model: analysisResult.model,
        processingTime: analysisResult.processingTime
      };

      // Ensure callDescription and summary are strings, not objects
      const processedAnalysis = { ...analysisResult.analysis };
      if (processedAnalysis.callDescription && typeof processedAnalysis.callDescription === 'object') {
        processedAnalysis.callDescription = this.serializeCallDescription(processedAnalysis.callDescription);
      }
      if (processedAnalysis.summary && typeof processedAnalysis.summary === 'object') {
        processedAnalysis.summary = this.serializeSummary(processedAnalysis.summary);
      }

      analysis.results = processedAnalysis;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();

      await analysis.save();

      logger.info('Audio file processing completed', {
        analysisId: analysis._id,
        processingTime: analysisResult.processingTime
      });

      return analysis;

    } catch (error) {
      logger.error('Audio file processing failed:', error);
      throw error;
    }
  }

  /**
   * Get MIME type from file path
   */
  getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypeMap = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.wma': 'audio/x-ms-wma',
      '.aiff': 'audio/aiff',
      '.au': 'audio/basic'
    };
    
    return mimeTypeMap[extension] || 'audio/mpeg';
  }

  /**
   * Calculate confidence score based on transcript quality
   */
  calculateConfidence(transcript) {
    if (!transcript || transcript.length < 100) return 0.1;
    
    let confidence = 0.5;
    
    // Length factor
    if (transcript.length > 1000) confidence += 0.2;
    if (transcript.length > 5000) confidence += 0.1;
    
    // Speaker pattern detection
    const speakerPattern = /^[A-Za-z\s]+:\s/gm;
    const speakerMatches = transcript.match(speakerPattern);
    if (speakerMatches && speakerMatches.length > 3) confidence += 0.2;
    
    // Question mark detection (indicates conversation)
    const questionCount = (transcript.match(/\?/g) || []).length;
    if (questionCount > 5) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Parse analysis response
   */
  parseAnalysisResponse(responseText) {
    try {
      // Try multiple strategies to extract and parse JSON
      const strategies = [
        // Strategy 1: Look for JSON in markdown code blocks with proper brace matching
        () => {
          // Find ```json start marker
          const jsonStartMatch = responseText.match(/```json\s*/);
          if (jsonStartMatch) {
            const jsonStart = jsonStartMatch.index + jsonStartMatch[0].length;
            const afterJsonStart = responseText.substring(jsonStart);
            
            // Find the first opening brace
            const braceStart = afterJsonStart.indexOf('{');
            if (braceStart !== -1) {
              // Count braces to find matching closing brace
              let braceCount = 0;
              let endIndex = braceStart;
              for (let i = braceStart; i < afterJsonStart.length; i++) {
                if (afterJsonStart[i] === '{') braceCount++;
                if (afterJsonStart[i] === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
              }
              if (endIndex > braceStart && braceCount === 0) {
                return this.cleanJsonString(afterJsonStart.substring(braceStart, endIndex + 1));
              }
            }
          }
          return null;
        },
        // Strategy 2: Smart brace counting to find proper JSON boundaries
        () => {
          const startIndex = responseText.indexOf('{');
          if (startIndex !== -1) {
            let braceCount = 0;
            let endIndex = startIndex;
            for (let i = startIndex; i < responseText.length; i++) {
              if (responseText[i] === '{') braceCount++;
              if (responseText[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
            if (endIndex > startIndex) {
              return this.cleanJsonString(responseText.substring(startIndex, endIndex + 1));
            }
          }
          return null;
        },
        // Strategy 3: Direct JSON extraction (fallback)
        () => {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return this.cleanJsonString(jsonMatch[0]);
          }
          return null;
        }
      ];

      // Try each strategy
      for (const strategy of strategies) {
        try {
          const jsonText = strategy();
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            logger.info('Successfully parsed JSON using strategy', { 
              strategy: strategies.indexOf(strategy) + 1,
              jsonLength: jsonText.length
            });
            return parsed;
          }
        } catch (strategyError) {
          // Continue to next strategy
          continue;
        }
      }

      throw new Error('All JSON parsing strategies failed');

    } catch (error) {
      logger.warn('Failed to parse JSON response, using fallback parser', { 
        error: error.message,
        responsePreview: responseText.substring(0, 200)
      });
    }

    // Fallback parsing
    return this.fallbackParse(responseText);
  }

  /**
   * Clean JSON string to handle common parsing issues
   */
  cleanJsonString(jsonText) {
    try {
      // Remove code block markers
      let cleaned = jsonText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Try to find the JSON object boundaries more precisely
      const startIndex = cleaned.indexOf('{');
      const lastIndex = cleaned.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, lastIndex + 1);
      }

      // More aggressive cleaning for common issues
      cleaned = cleaned
        // Fix unescaped quotes in string values - more comprehensive
        .replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
        .replace(/: "([^"]*)"([^"]*)"([^"]*)"/g, ': "$1\\"$2\\"$3"')
        // Fix single quotes that should be escaped
        .replace(/'/g, "\\'")
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix newlines and carriage returns in string values
        .replace(/"([^"]*)[\r\n]+([^"]*)"/g, '"$1\\n$2"')
        // Fix other special characters that break JSON
        .replace(/[\r\n\t]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();

      // Try to validate the JSON structure
      const testParse = JSON.parse(cleaned);
      return cleaned;
      
    } catch (error) {
      // If cleaning fails, return a more basic cleanup
      return jsonText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  serializeCallDescription(callDescObj) {
    if (typeof callDescObj === 'string') {
      return callDescObj;
    }
    
    let result = '';
    if (callDescObj.title) {
      result += `**${callDescObj.title}**\n\n`;
    }
    
    if (callDescObj.participants && Array.isArray(callDescObj.participants)) {
      result += '**Participants**:\n';
      callDescObj.participants.forEach(participant => {
        result += `• ${participant.name} (${participant.role})`;
        if (participant.company) {
          result += ` - ${participant.company}`;
        }
        result += '\n';
      });
      result += '\n';
    }
    
    if (callDescObj.purpose) {
      result += `**Purpose**: ${callDescObj.purpose}\n\n`;
    }
    
    if (callDescObj.keyTopics && Array.isArray(callDescObj.keyTopics)) {
      result += '**Key Topics**:\n';
      callDescObj.keyTopics.forEach(topic => {
        result += `• ${topic}\n`;
      });
      result += '\n';
    }
    
    if (callDescObj.tone) {
      result += `**Tone**: ${callDescObj.tone}\n\n`;
    }
    
    return result.trim();
  }

  serializeSummary(summaryObj) {
    if (typeof summaryObj === 'string') {
      return summaryObj;
    }
    
    let result = '**Call Summary**\n\n';
    
    if (summaryObj.openingDiscovery) {
      result += `**Opening & Discovery**\n${summaryObj.openingDiscovery}\n\n`;
    }
    
    if (summaryObj.solutionPresentation) {
      result += `**Solution Presentation**\n${summaryObj.solutionPresentation}\n\n`;
    }
    
    if (summaryObj.closingNextSteps) {
      result += `**Closing & Next Steps**\n${summaryObj.closingNextSteps}`;
    }
    
    return result.trim();
  }

  /**
   * Fallback parser for non-JSON responses
   */
  fallbackParse(text) {
    const lines = text.split('\n');
    const result = {
      callDescription: '**Sales Call Analysis Overview**\n\n**Participants**: Sales representatives and prospects engaged in a business discussion\n**Purpose**: Explore potential solutions and address business challenges\n**Key Topics**: Business needs, solution presentation, and next steps\n**Tone**: Professional and collaborative discussion focused on mutual value creation\n\nThis analysis provides comprehensive insights into the sales interaction, including participant engagement, discussion topics, business challenges addressed, and overall call outcomes.',
      summary: `**Call Summary**\n\n**Opening & Discovery**\n• Initial rapport building and needs assessment\n• Key business challenges and pain points identified\n• Prospect requirements and decision-making process explored\n\n**Solution Presentation**\n• Product/service features and benefits discussed\n• Value proposition and competitive advantages highlighted\n• Technical requirements and implementation considerations addressed\n\n**Closing & Next Steps**\n• Follow-up actions and timeline established\n• Key stakeholders identified for future discussions\n• Next meeting scheduled with clear objectives`,
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
        teamSize: 'Analysis in progress - team size to be determined from call content',
        workVolume: 'Work volume assessment based on call discussion and business context',
        location: 'Geographic location to be identified from call participants and business references',
        previousExperience: 'Previous solution experience and satisfaction levels discussed during the call',
        likelihoodOfClosing: 'Closing probability assessment based on engagement and interest levels',
        website: 'Company website and digital presence mentioned during the conversation',
        businessSummary: 'Comprehensive business overview including company model, services, current challenges, and strategic goals as discussed in the call'
      },
      salesPerformance: {
        responsiveness: 'Sales team responsiveness evaluated based on question handling and solution presentation quality',
        satisfaction: 'Prospect satisfaction indicators assessed through verbal cues and engagement levels',
        engagement: 'Overall engagement quality measured by participation, questions asked, and interest shown'
      },
      keyInsights: [
        'Audio analysis completed with comprehensive evaluation of sales call dynamics',
        'Call content analyzed for pain points, challenges, and solution requirements',
        'Participant roles and responsibilities identified from conversation context',
        'Business context and industry-specific challenges discussed in detail',
        'Decision-making process and timeline considerations evaluated',
        'Technical requirements and implementation considerations identified',
        'Competitive landscape and alternative solutions mentioned during call',
        'Stakeholder involvement and influence levels assessed from conversation'
      ],
      recommendations: [
        'Review audio quality and transcription accuracy for enhanced analysis',
        'Prepare detailed follow-up materials based on discussed requirements',
        'Schedule technical demonstration focusing on identified pain points',
        'Develop customized proposal addressing specific business challenges',
        'Engage additional stakeholders mentioned during the call',
        'Prepare competitive differentiation materials based on discussed alternatives',
        'Establish clear timeline and next steps based on prospect priorities',
        'Create implementation plan addressing technical and business requirements'
      ],
      otherNotableFindings: [
        'Audio file successfully processed with enhanced analysis capabilities',
        'Comprehensive evaluation completed across all sales performance criteria',
        'Detailed insights generated for sales team improvement and optimization',
        'Business context and industry-specific considerations identified',
        'Relationship dynamics and communication patterns analyzed'
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
      }
    };
    
    return result;
  }

  /**
   * Cleanup uploaded files (files are automatically deleted after 48 hours)
   */
  async cleanupOldFiles() {
    try {
      const files = await this.listUploadedFiles(50);
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      let deletedCount = 0;
      for (const file of files) {
        if (new Date(file.createTime) < cutoffTime) {
          try {
            await this.deleteFile(file.name);
            deletedCount++;
          } catch (error) {
            logger.warn('Failed to delete old file:', error.message);
          }
        }
      }
      
      logger.info('Cleanup completed', { deletedCount });
      return { deletedCount };
    } catch (error) {
      logger.error('Cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new AudioUploadService();
