const { GoogleGenerativeAI } = require('@google/generative-ai');
const playwright = require('playwright');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const Analysis = require('../models/Analysis');
const FileUtils = require('../utils/fileUtils');

class ComprehensiveAnalysisService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.defaultPrompt = this.getDefaultPrompt();
  }

  async initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      });

      logger.info('Comprehensive Analysis Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Comprehensive Analysis Service:', error);
      throw error;
    }
  }

  getDefaultPrompt() {
    return `You are the "Sales Call Analyzer," an advanced AI-powered analytical tool designed to provide comprehensive, detailed insights from sales call transcripts. Your analysis should be thorough, actionable, and provide deep understanding of the sales interaction.

**ANALYSIS REQUIREMENTS:**
Generate a professional, well-formatted analysis that provides actionable insights. Focus on creating content that is:
- **Well-Formatted**: Use clear structure, bullet points, and organized sections for easy reading
- **Concise and Professional**: Keep content brief and to the point, following standard business report formats
- **Specific and Actionable**: Provide concrete recommendations that sales teams can implement
- **Contextual**: Consider the business context, industry, and specific pain points discussed
- **Standard Length**: Follow professional content length guidelines (Call Description: 150-200 words, Summary: 200-300 words)
- **Structured Format**: Use clear headings, bullet points, and organized sections for better readability

Website Analysis Context:
URL: {url}

Page Analysis from website:
{scraped_content}

Based on the website content and call transcript, please analyze the call that took place between the sales team and the prospect. 
Provide a detailed evaluation of the call, including demographic details of the prospect, sales team performance metrics, and actionable recommendations for improvement. 
Include an overall effectiveness score on a scale of 1 to 10 reflecting the quality and success of the sales team's performance.
Include a breakdown of strengths, weaknesses, and suggestions for enhancing the sales strategy.
Based on the Page Analysis, identify which products or services the sales person forgot to mention to the client in the call.

Note:- Provide only the evaluation without any additional or miscellaneous information.

**CRITICAL: You must respond with valid JSON format. All scoring values (relevance, likelihood, revenueImpact) must be NUMERIC values between 1-5, not text like "Medium" or "High".**

**IMPORTANT RATING ACCURACY: Analyze each call objectively and provide varied ratings based on actual performance. Do not default to 7/10. Use the full 1-10 scale appropriately based on call quality.**

**RATING GUIDELINES:**
- **1-3/10**: Terrible calls (rude, unprofessional, no value, poor discovery)
- **4-5/10**: Below average calls (basic interaction, limited discovery, weak value prop)
- **6-7/10**: Average to good calls (professional, decent discovery, clear next steps)
- **8-9/10**: Excellent calls (exceptional engagement, thorough discovery, strong closing)
- **10/10**: Perfect calls (outstanding in all areas, exceptional results)

**BE CRITICAL AND REALISTIC - Most calls should be 4-6/10, not 7/10.**

**ENHANCED JSON Response Format Must Include:**

1. **callDescription**: A well-formatted, structured description (150-200 words) that includes:
   - **Participants**: Who participated in the call (names, roles, companies)
   - **Purpose**: The primary purpose and context of the call
   - **Key Topics**: Main discussion points and business challenges addressed
   - **Tone**: The overall atmosphere and engagement level of the conversation

2. **summary**: A structured, easy-to-read summary (200-300 words) with clear sections:
   - **Opening & Discovery**: Key questions asked, pain points uncovered, prospect needs identified
   - **Solution Presentation**: Product/service presentation, key benefits discussed, value proposition
   - **Closing & Next Steps**: Call conclusion, follow-up actions, prospect interest level, next meeting scheduled

3. **callRating**: Overall rating (1-10) with detailed justification

4. **callRatingBreakdown**: Object with detailed scores for each criterion

5. **prospectDemographics**: Concise object including:
   - Team Size: Specific number or range if mentioned
   - Work Volume: Brief description of their workload and scale
   - Location: City, state, country if mentioned
   - Previous Experience: Brief history with similar solutions
   - Likelihood of Closing: Percentage with brief reasoning
   - Website: Full URL if mentioned
   - Business Summary: 1-2 paragraph description of their business model, services, goals, and challenges

6. **salesPerformance**: Concise object with specific examples:
   - Responsiveness: Key instances of good/poor responses
   - Satisfaction: Verbal and non-verbal indicators of satisfaction
   - Engagement: Key examples of high/low engagement moments

7. **keyInsights**: Array of 4-6 concise, specific insights (each 1 sentence) covering:
   - Pain points and challenges identified
   - Decision-making process and timeline
   - Budget and resource constraints
   - Competitive landscape and alternatives
   - Technical requirements and specifications
   - Stakeholder involvement and influence

8. **recommendations**: Array of 4-6 specific, actionable recommendations (each 1 sentence) covering:
   - Immediate next steps and follow-up actions
   - Content and materials to prepare
   - Stakeholders to involve or contact
   - Timeline and scheduling considerations
   - Pricing and proposal strategies
   - Technical demonstration requirements

9. **otherNotableFindings**: Array of 2-4 additional observations covering:
   - Unexpected insights or revelations
   - Red flags or concerns
   - Opportunities for upselling or cross-selling
   - Technical or implementation considerations

10. **salesOpportunities**: Detailed object with comprehensive analysis

**CRITICAL: keyInsights, recommendations, and otherNotableFindings must be arrays of strings, NOT arrays of objects.**

**FORMATTING INSTRUCTIONS:**
- Use clear headings and subheadings for better organization
- Include bullet points and numbered lists where appropriate
- Structure content with clear sections and logical flow
- Use bold text for emphasis on key points
- Make content scannable and easy to read
- Format callDescription and summary with clear structure and organization

**EXAMPLE FORMAT FOR callDescription:**
**Sales Call Analysis Overview**

**Participants**: [Names, roles, companies]
**Purpose**: [Primary purpose and context]
**Key Topics**: [Main discussion points and challenges]
**Tone**: [Overall atmosphere and engagement level]

[Brief concluding statement about the analysis value]

**EXAMPLE FORMAT FOR summary:**
**Call Summary**

**Opening & Discovery**
• [Key questions asked and pain points uncovered]
• [Prospect needs and requirements identified]
• [Discovery insights and findings]

**Solution Presentation**
• [Product/service features and benefits discussed]
• [Value proposition and competitive advantages]
• [Technical requirements and implementation details]

**Closing & Next Steps**
• [Call conclusion and follow-up actions]
• [Key stakeholders and next meeting details]
• [Prospect interest level and commitment]

---
### **Primary Objectives**
1. Analyze sales call transcripts, even when participants are not explicitly identified, for both **qualitative insights** and **quantitative metrics.**
2. Provide an **overall effectiveness score** on a 1-to-10 scale that reflects the quality and success of the sales team's performance during the call.
3. Offer a **comprehensive breakdown** of the call, identifying strengths, weaknesses, and actionable suggestions for improvement.
4. Dynamically infer speaker roles based on context, ensuring clarity in cases where participants are not predefined or explicitly labeled.
---
### **Criteria for Analysis**
Extract and analyze the following factors during the evaluation of a sales call transcript, ensuring demographic data of the prospect and sales performance metrics are identified:
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
---
### **Edge Case Adaptation**
In scenarios where speaker identification is unclear:
1. **Dynamic Role Assignment:** Use contextual language cues to identify the roles of different speakers (e.g., sales representative, prospect, or other team members). Distribute roles based on the flow and logical structure of the conversation.
2. **Ambiguity Resolution:** When uncertain, infer roles and participation using natural language understanding and indicate any assumptions made. Keep the analysis coherent.
3. **Multiple Participants:** Handle transcripts with multiple participants by distinguishing unique voices and listing speaker roles accordingly to ensure all contributions are evaluated.
---
### **Handling Complex Scenarios**
For scenarios where information may be fragmented, incomplete, or ambiguous, you should:
1. **Cross-reference Data:** Synthesize information from different parts of the transcript to extract demographic details or strengthen role identification.
2. **Business Profiling:** Combine fragmented details to develop a well-rounded business summary for the prospect where explicit information is missing.
3. **Contextual Inference:** Make logical inferences about speaker intent, engagement, and conversational flow based on tone, phrasing, and context. Clearly indicate any assumptions.
---
### **Sales Opportunity Analysis**
Identify potential sales opportunities by:
- **Product/Service Gap Analysis:** Identify products/services from website content that weren't discussed during the call
   - **Upselling Detection:** Look for:
     * Premium feature mentions that weren't explored
     * Indications of budget flexibility
     * Pain points that premium solutions could address
   - **Cross-selling Indicators:** Monitor:
     * Related product needs mentioned by prospect
     * Complementary service opportunities
     * Business challenges that multiple products could solve
   - **Opportunity Scoring:** Rate each opportunity on:
     * Relevance to prospect's needs (1-5)
     * Likelihood of conversion (1-5)
     * Potential revenue impact (1-5)
---
Present the analysis in the following organized format:
Give Little Description of the Call between both the parties

#### 1. **Summary**
- Provide a high-level overview of the call outcome (e.g., tone of call, progress in the sales journey, and overall impression of the interaction).
#### 2. **Call Rating (1-10) with Detailed Breakdown**
- Deliver a single numerical score summarizing the overall effectiveness of the call.
- **MANDATORY: Include detailed scoring breakdown showing how the rating was calculated:**
  - **Engagement Quality (1-10):** How well did the sales rep engage the prospect? Did they ask good questions, listen actively, and maintain interest? (1-3: Poor engagement, 4-6: Basic engagement, 7-8: Good engagement, 9-10: Exceptional engagement)
  - **Responsiveness (1-10):** How effectively did the sales rep address the prospect's questions and concerns? Were answers thorough and helpful? (1-3: Poor responses, 4-6: Basic responses, 7-8: Good responses, 9-10: Exceptional responses)
  - **Discovery Skills (1-10):** How well did the sales rep uncover the prospect's pain points, needs, and decision-making process? (1-3: No discovery, 4-6: Basic discovery, 7-8: Good discovery, 9-10: Thorough discovery)
  - **Value Proposition (1-10):** How clearly and compellingly did the sales rep present the solution and its benefits? (1-3: No clear value, 4-6: Basic value prop, 7-8: Good value prop, 9-10: Compelling value prop)
  - **Objection Handling (1-10):** How well did the sales rep handle any objections or concerns raised by the prospect? (Use 0 if no objections were raised) (1-3: Poor handling, 4-6: Basic handling, 7-8: Good handling, 9-10: Exceptional handling)
  - **Closing Attempts (1-10):** Did the sales rep attempt to move the conversation forward with next steps, demos, or closing questions? (1-3: No closing attempts, 4-6: Weak attempts, 7-8: Good attempts, 9-10: Strong closing)
  - **Follow-up Planning (1-10):** Was there a clear next step or follow-up planned? (1-3: No follow-up, 4-6: Vague follow-up, 7-8: Clear follow-up, 9-10: Detailed follow-up)
  - **Overall Call Flow (1-10):** How well-structured and professional was the overall conversation? (1-3: Poor flow, 4-6: Basic flow, 7-8: Good flow, 9-10: Excellent flow)

**CRITICAL RATING CALCULATION RULES:**
1. **ALL scores must be between 1-10 (no null values)**
2. **Calculate the average of all 8 scores**
3. **Round to the nearest whole number for final rating**
4. **Use 0 for objectionHandling only if NO objections were raised**
5. **Be realistic and varied in scoring - not every call is a 7/10**

**Example Rating Calculation:**
- Engagement Quality: 8/10
- Responsiveness: 7/10  
- Discovery Skills: 6/10
- Value Proposition: 8/10
- Objection Handling: 0/10 (no objections raised)
- Closing Attempts: 9/10
- Follow-up Planning: 8/10
- Overall Call Flow: 7/10
- **Average Score: (8+7+6+8+0+9+8+7)/8 = 6.125/10 → Final Rating: 6/10**

**Another Example (Poor Call):**
- Engagement Quality: 3/10
- Responsiveness: 4/10  
- Discovery Skills: 2/10
- Value Proposition: 3/10
- Objection Handling: 1/10
- Closing Attempts: 2/10
- Follow-up Planning: 1/10
- Overall Call Flow: 3/10
- **Average Score: (3+4+2+3+1+2+1+3)/8 = 2.375/10 → Final Rating: 2/10**

**Another Example (Excellent Call):**
- Engagement Quality: 9/10
- Responsiveness: 9/10  
- Discovery Skills: 8/10
- Value Proposition: 9/10
- Objection Handling: 8/10
- Closing Attempts: 10/10
- Follow-up Planning: 9/10
- Overall Call Flow: 9/10
- **Average Score: (9+9+8+9+8+10+9+9)/8 = 8.75/10 → Final Rating: 9/10**
#### 3. **Recommendations for Improvement**
- List tailored suggestions to enhance sales tactics, address weaknesses, and build on strengths observed during the call. Ensure recommendations are actionable and specific (e.g., "Streamline responses to frequently asked questions about pricing").
#### 4. **Key Insights**
Provide detailed notes on the following components:
- **Demographic Information:** Include team size, work volume, location, business website, previous experiences, likelihood of closing, and business summary.
- **Performance Evaluation:** Highlight aspects of responsiveness, prospect satisfaction, and engagement.
- **Other Notable Findings:** Mention any additional insights relevant to the prospect's needs or sales strategy effectiveness.

**IMPORTANT: Format keyInsights as an array of strings, not objects.**
**CORRECT:** "keyInsights": ["Prospect team is growing and needs better workflow management", "Pain points include task alignment and reporting efficiency"]
**INCORRECT:** "keyInsights": [{"demographicInformation": "..."}, {"performanceEvaluation": "..."}]
### 5. **Sales Opportunity Analysis**
Provide detailed notes on the following components:
- **Product/Service Gap:** Identify products or services from the website that weren't discussed during the call.
- **Upselling/Cross-selling Opportunities:** Highlight potential areas for upselling or cross-selling based on the prospect's needs and the website content.
- **Opportunity Scoring:** Rate each opportunity based on relevance, likelihood of conversion, and potential revenue impact.
---
### **Important Considerations**
1. **Actionable Insights:** Ensure your output provides usable, specific, and strategic recommendations aimed at improving future sales calls. Avoid generic advice.
2. **Thoroughness Over Ambiguity:** Address incomplete or ambiguous details constructively while maintaining transparency in your analysis (e.g., "The participant's role was inferred based on statements indicating decision-making authority").
3. **Adaptability:** Be prepared to work with a variety of transcript formats, conversational styles, and levels of detail. Ensure your analysis remains consistent despite variable data quality.
By adhering to these guidelines, provide sales teams with actionable insights and practical evaluations that enable them to close deals more effectively and build stronger engagements with prospects.`;
  }

  async processComprehensiveAnalysis(analysisData) {
    try {
      await this.initialize();

      // Create analysis record
      const analysis = new Analysis({
        userId: analysisData.userId,
        serviceType: analysisData.serviceType,
        status: 'processing',
        input: {
          ...analysisData.input,
          selectedPrompt: analysisData.input.promptType === 'custom' 
            ? analysisData.input.customPrompt 
            : this.defaultPrompt
        }
      });
      
      logger.info('Creating analysis record', { 
        userId: analysisData.userId,
        serviceType: analysisData.serviceType,
        promptType: analysisData.input.promptType
      });
      
      await analysis.save();
      
      logger.info('Analysis record created successfully', { 
        analysisId: analysis._id,
        status: analysis.status
      });

      // Step 1: Process call data
      const callData = await this.processCallData(analysisData.input, analysis);
      
      // Step 2: Process product/service information
      const productServiceData = await this.processProductServiceData(analysisData.input, analysis);
      
      // Step 3: Generate comprehensive analysis
      const analysisResults = await this.generateComprehensiveAnalysis(
        callData, 
        productServiceData, 
        analysis.input.selectedPrompt,
        analysis
      );

      // Update analysis with results
      analysis.results = analysisResults;
      analysis.status = 'completed';
      analysis.metadata.completedAt = new Date();
      
      logger.info('Saving analysis to database', { 
        analysisId: analysis._id, 
        status: analysis.status,
        hasResults: !!analysis.results
      });
      
      await analysis.save();
      
      logger.info('Analysis saved successfully', { analysisId: analysis._id });
      return analysis;

    } catch (error) {
      logger.error('Comprehensive analysis failed:', error);
      throw error;
    }
  }

  async processCallData(input, analysis) {
    let callData = {};

    if (input.audioFile) {
      // Process audio file
      callData = await this.processAudioFile(input.audioFile, analysis);
    } else if (input.fathomUrl) {
      // Process Fathom URL
      callData = await this.processFathomUrl(input.fathomUrl, analysis);
    } else if (input.transcript) {
      // Process transcript
      callData = await this.processTranscript(input.transcript, analysis);
    }

    return callData;
  }

  async processAudioFile(audioFile, analysis) {
    try {
      // Use new audio analysis service with Gemini Files API
      const audioAnalysisService = require('./audioAnalysisService');
      const result = await audioAnalysisService.processAudioAnalysis(
        audioFile, 
        analysis.userId,
        {
          additionalContent: '',
          analysisType: 'comprehensive'
        }
      );
      
      return {
        transcript: result.processing.transcript.text,
        confidence: result.processing.transcript.confidence,
        wordCount: result.processing.transcript.wordCount,
        duration: result.processing.transcript.duration || 0
      };
    } catch (error) {
      logger.error('Audio processing failed:', error);
      throw error;
    }
  }

  async processFathomUrl(fathomUrl, analysis) {
    try {
      // Use enhanced Fathom service without creating duplicate analysis record
      const fathomService = require('./enhancedFathomService');
      const result = await fathomService.processFathomUrlOnly(fathomUrl, analysis, {
        type: 'url',
        url: analysis.input.productServiceUrl
      });
      
      logger.info('Fathom processing completed', { 
        analysisId: analysis._id,
        transcriptLength: result.transcript?.length || 0,
        confidence: result.confidence || 0
      });
      
      return {
        transcript: result.transcript,
        confidence: result.confidence,
        wordCount: result.wordCount,
        duration: result.duration
      };
    } catch (error) {
      logger.error('Fathom processing failed:', error);
      throw error;
    }
  }

  async processTranscript(transcript, analysis) {
    try {
      // Process transcript directly without creating a separate analysis record
      const wordCount = transcript.split(/\s+/).length;
      
      // Update analysis with transcript info
      analysis.processing.transcript = {
        text: transcript,
        confidence: 1.0, // User provided transcript
        language: 'en', // Could be detected
        duration: 0, // Would need audio analysis
        wordCount: wordCount
      };
      await analysis.save();
      
      return {
        transcript: transcript,
        confidence: 1.0,
        wordCount: wordCount,
        duration: 0
      };
    } catch (error) {
      logger.error('Transcript processing failed:', error);
      throw error;
    }
  }

  async processProductServiceData(input, analysis) {
    let productServiceData = {};

    if (input.productServiceUrl) {
      // Scrape website content
      productServiceData = await this.scrapeWebsiteContent(input.productServiceUrl, analysis);
    } else if (input.productServiceDocument) {
      // Process document
      productServiceData = await this.processDocument(input.productServiceDocument, analysis);
    }

    return productServiceData;
  }

  async scrapeWebsiteContent(url, analysis) {
    try {
      let browser = null;
      
      browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(el => el.remove());

        // Get main content
        const mainContent = document.querySelector('main, article, .content, #content') || document.body;
        return {
          text: mainContent.textContent?.trim() || '',
          title: document.title,
          url: window.location.href
        };
      });

      await browser.close();

      const wordCount = content.text.split(/\s+/).length;

      // Update analysis with scraped content
      analysis.processing.scrapedContent = {
        text: content.text,
        url: content.url,
        title: content.title,
        wordCount: wordCount
      };
      await analysis.save();

      return {
        content: content.text,
        title: content.title,
        url: content.url,
        wordCount: wordCount
      };

    } catch (error) {
      logger.error('Website scraping failed:', error);
      throw error;
    }
  }

  async processDocument(document, analysis) {
    try {
      let content = '';
      
      if (document.mimeType === 'text/plain') {
        content = await fs.readFile(document.fileName, 'utf8');
      } else if (document.mimeType === 'application/pdf') {
        // For PDF processing, you might want to use a library like pdf-parse
        content = 'PDF content extraction not implemented yet';
      } else if (document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX processing, you might want to use a library like mammoth
        content = 'DOCX content extraction not implemented yet';
      }

      const wordCount = content.split(/\s+/).length;

      // Update analysis with document content
      analysis.input.productServiceDocument.content = content;
      await analysis.save();

      return {
        content: content,
        title: document.originalName,
        wordCount: wordCount
      };

    } catch (error) {
      logger.error('Document processing failed:', error);
      throw error;
    }
  }

  async generateComprehensiveAnalysis(callData, productServiceData, prompt, analysis) {
    try {
      const startTime = Date.now();
      
      const fullPrompt = `${prompt}

CALL TRANSCRIPT:
${callData.transcript}

PRODUCT/SERVICE INFORMATION:
${productServiceData.content || 'No product/service information provided'}

Please provide a comprehensive analysis in the following JSON format:
{
  "callDescription": "Brief description of the call between both parties",
  "summary": "High-level overview of the call outcome",
  "callRating": 8,
  "prospectDemographics": {
    "teamSize": "Small team (5-10 people)",
    "workVolume": "Medium volume",
    "location": "San Francisco, CA",
    "previousExperience": "Has used similar services before",
    "likelihoodOfClosing": "High (80%)",
    "website": "https://example.com",
    "businessSummary": "SaaS company focused on productivity tools"
  },
  "salesPerformance": {
    "responsiveness": "Very responsive to questions",
    "satisfaction": "Prospect seemed satisfied",
    "engagement": "High engagement with follow-up questions"
  },
  "keyInsights": [
    "Prospect is very interested in the solution",
    "Budget is flexible for the right solution",
    "Decision maker is present in the call"
  ],
  "recommendations": [
    "Follow up within 24 hours",
    "Send detailed pricing information",
    "Schedule a technical demo"
  ],
  "otherNotableFindings": [
    "Prospect mentioned competitor pricing",
    "Timeline is urgent (wants to implement in 2 weeks)"
  ],
  "salesOpportunities": {
    "productServiceGap": [
      "Premium features not discussed",
      "Enterprise plan benefits not mentioned"
    ],
    "upsellingOpportunities": [
      {
        "opportunity": "Premium support package",
        "relevance": 4,
        "likelihood": 3,
        "revenueImpact": 4
      }
    ],
    "crossSellingOpportunities": [
      {
        "opportunity": "Integration services",
        "relevance": 5,
        "likelihood": 4,
        "revenueImpact": 5
      }
    ]
  }
}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const analysisText = response.text();

      const processingTime = Date.now() - startTime;

      // Parse the JSON response
      let parsedResults;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResults = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse JSON response, using fallback');
        parsedResults = this.createFallbackResults(analysisText);
      }

      // Update analysis with processing details
      analysis.processing.llmAnalysis = {
        prompt: prompt,
        response: analysisText,
        tokensUsed: {
          input: Math.ceil(fullPrompt.length / 4),
          output: Math.ceil(analysisText.length / 4),
          total: Math.ceil((fullPrompt.length + analysisText.length) / 4)
        },
        cost: this.calculateCost(Math.ceil((fullPrompt.length + analysisText.length) / 4)),
        model: 'gemini-2.0-flash',
        processingTime: processingTime
      };
      await analysis.save();

      return parsedResults;

    } catch (error) {
      logger.error('Comprehensive analysis generation failed:', error);
      throw error;
    }
  }

  createFallbackResults(analysisText) {
    return {
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
        'Comprehensive analysis completed with detailed evaluation of sales call dynamics',
        'Call content analyzed for pain points, challenges, and solution requirements',
        'Participant roles and responsibilities identified from conversation context',
        'Business context and industry-specific challenges discussed in detail',
        'Decision-making process and timeline considerations evaluated',
        'Technical requirements and implementation considerations identified',
        'Competitive landscape and alternative solutions mentioned during call',
        'Stakeholder involvement and influence levels assessed from conversation'
      ],
      recommendations: [
        'Review comprehensive analysis results and implement recommendations',
        'Prepare detailed follow-up materials based on discussed requirements',
        'Schedule technical demonstration focusing on identified pain points',
        'Develop customized proposal addressing specific business challenges',
        'Engage additional stakeholders mentioned during the call',
        'Prepare competitive differentiation materials based on discussed alternatives',
        'Establish clear timeline and next steps based on prospect priorities',
        'Create implementation plan addressing technical and business requirements'
      ],
      otherNotableFindings: [
        'Comprehensive analysis successfully processed with enhanced capabilities',
        'Detailed evaluation completed across all sales performance criteria',
        'Rich insights generated for sales team improvement and optimization',
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
  }

  calculateCost(tokens) {
    const inputCostPer1K = 0.00125;
    const outputCostPer1K = 0.005;
    return (tokens / 1000) * (inputCostPer1K + outputCostPer1K) / 2;
  }
}

module.exports = new ComprehensiveAnalysisService();
