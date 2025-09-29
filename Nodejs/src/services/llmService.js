const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/backend-config');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.tokenCosts = {
      'gemini-2.0-flash': {
        input: 0.000075, // per 1K tokens
        output: 0.0003 // per 1K tokens
      }
    };
  }

  async analyzeSalesCall(transcript, additionalContent = '') {
    try {
      const startTime = Date.now();
      
      // Prepare the analysis prompt
      const prompt = this.buildAnalysisPrompt(transcript, additionalContent);
      
      // Generate content
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Calculate token usage and cost
      const processingTime = Date.now() - startTime;
      const tokenUsage = this.estimateTokenUsage(prompt, text);
      const cost = this.calculateCost(tokenUsage);
      
      logger.info('LLM analysis completed', {
        processingTime: `${processingTime}ms`,
        tokensUsed: tokenUsage,
        cost: `$${cost.toFixed(4)}`
      });

      return {
        response: text,
        tokenUsage,
        cost,
        processingTime,
        model: 'gemini-2.0-flash'
      };
    } catch (error) {
      logger.error('LLM analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  buildAnalysisPrompt(transcript, additionalContent) {
    return `
You are the "Sales Call Analyzer," an advanced AI-powered analytical tool designed to provide comprehensive, detailed insights from sales call transcripts. Your analysis should be thorough, actionable, and provide deep understanding of the sales interaction.

**ANALYSIS REQUIREMENTS:**
Generate a professional, concise analysis that provides actionable insights. Focus on creating content that is:
- **Concise and Professional**: Keep content brief and to the point, following standard business report formats
- **Specific and Actionable**: Provide concrete recommendations that sales teams can implement
- **Contextual**: Consider the business context, industry, and specific pain points discussed
- **Standard Length**: Follow professional content length guidelines (Call Description: 150-200 words, Summary: 200-300 words)

Website Analysis Context:
URL: {url}

Page Analysis from website:
${additionalContent || 'No website content available'}

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

1. **callDescription**: A comprehensive 2-3 paragraph description that includes:
   - Who participated in the call (names, roles, companies)
   - The primary purpose and context of the call
   - Key topics discussed and business challenges addressed
   - The overall tone and atmosphere of the conversation
   - Any important background information or previous interactions

2. **summary**: A detailed 4-5 paragraph summary covering:
   - Opening and rapport building (how the call started, relationship building)
   - Discovery phase (what questions were asked, what pain points were uncovered)
   - Solution presentation (how the product/service was presented, key benefits discussed)
   - Objection handling (any concerns raised and how they were addressed)
   - Closing and next steps (how the call concluded, what follow-up actions were agreed upon)
   - Overall call outcome and prospect's level of interest

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

**SCORING REMINDER:**
- A 7/10 call should be genuinely good with strong performance across most areas
- A 6/10 call is average with some good elements but room for improvement
- A 5/10 call is below average with several weaknesses
- Only give 8+ for truly excellent calls with exceptional performance
- This specific call is professional but basic - consider scoring it 5-6/10, not 7/10

**JSON Response Format Must Include:**
- callDescription: Brief description of the call
- summary: Detailed summary of the call  
- callRating: Overall rating (1-10)
- callRatingBreakdown: Object with detailed scores for each criterion
- prospectDemographics: Object with prospect information
- salesPerformance: Object with performance metrics
- keyInsights: Array of strings (e.g., ["Insight 1", "Insight 2"])
- recommendations: Array of strings (e.g., ["Recommendation 1", "Recommendation 2"])
- otherNotableFindings: Array of strings (e.g., ["Finding 1", "Finding 2"])
- salesOpportunities: Object with opportunity analysis containing:
  - productServiceGap: Array of strings
  - upsellingOpportunities: Array of objects with {opportunity: String, relevance: Number, likelihood: Number, revenueImpact: Number}
  - crossSellingOpportunities: Array of objects with {opportunity: String, relevance: Number, likelihood: Number, revenueImpact: Number}

**CRITICAL: keyInsights, recommendations, and otherNotableFindings must be arrays of strings, NOT arrays of objects.**
**CRITICAL: upsellingOpportunities and crossSellingOpportunities must be arrays of objects with the exact structure shown above.**

**EXAMPLE of correct salesOpportunities format:**
{
  "salesOpportunities": {
    "productServiceGap": ["Service A not mentioned", "Feature B not discussed"],
    "upsellingOpportunities": [
      {
        "opportunity": "Premium analytics package",
        "relevance": 4,
        "likelihood": 3,
        "revenueImpact": 4
      }
    ],
    "crossSellingOpportunities": [
      {
        "opportunity": "SEO optimization service",
        "relevance": 3,
        "likelihood": 2,
        "revenueImpact": 3
      }
    ]
  }
}

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
By adhering to these guidelines, provide sales teams with actionable insights and practical evaluations that enable them to close deals more effectively and build stronger engagements with prospects.

SALES CALL TRANSCRIPT:
${transcript}
`;
  }

  estimateTokenUsage(input, output) {
    // Rough estimation - in production, you'd want more accurate token counting
    const inputTokens = Math.ceil(input.length / 4);
    const outputTokens = Math.ceil(output.length / 4);
    
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    };
  }

  calculateCost(tokenUsage) {
    const modelCosts = this.tokenCosts['gemini-2.0-flash'];
    const inputCost = (tokenUsage.input / 1000) * modelCosts.input;
    const outputCost = (tokenUsage.output / 1000) * modelCosts.output;
    
    return inputCost + outputCost;
  }

  async transcribeAudio(audioFile) {
    try {
      const startTime = Date.now();
      
      // Determine correct MIME type based on file extension
      const getMimeType = (filename, originalMimeType) => {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypeMap = {
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'm4a': 'audio/mp4',
          'aac': 'audio/aac',
          'ogg': 'audio/ogg',
          'flac': 'audio/flac'
        };
        
        // If original MIME type is valid, use it
        if (originalMimeType && originalMimeType.startsWith('audio/')) {
          return originalMimeType;
        }
        
        // Otherwise, determine from extension
        return mimeTypeMap[extension] || 'audio/mpeg'; // Default to MP3
      };
      
      const correctMimeType = getMimeType(audioFile.originalname, audioFile.mimetype);
      
      console.log('Audio transcription:', {
        originalName: audioFile.originalname,
        originalMimeType: audioFile.mimetype,
        correctedMimeType: correctMimeType,
        bufferSize: audioFile.buffer ? audioFile.buffer.length : 'No buffer',
        hasBuffer: !!audioFile.buffer
      });
      
      // Check if audio file has content
      if (!audioFile.buffer || audioFile.buffer.length === 0) {
        throw new Error('Audio file is empty or invalid');
      }
      
      // Upload file to Gemini
      const fileData = {
        inlineData: {
          data: audioFile.buffer.toString('base64'),
          mimeType: correctMimeType
        }
      };

      const result = await this.model.generateContent([
        "Transcribe this audio file. Provide the transcript with timestamps and speaker identification if possible.",
        fileData
      ]);

      const response = await result.response;
      const transcript = response.text();
      
      const processingTime = Date.now() - startTime;
      
      logger.info('Audio transcription completed', {
        fileName: audioFile.originalname,
        processingTime: `${processingTime}ms`,
        transcriptLength: transcript.length
      });

      return {
        text: transcript,
        processingTime,
        wordCount: transcript.split(/\s+/).length,
        language: 'en' // You might want to detect this
      };
    } catch (error) {
      logger.error('Audio transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  async extractTranscriptFromUrl(url) {
    try {
      const startTime = Date.now();
      
      const prompt = `
Extract the transcript or conversation content from this URL: ${url}

Look for:
1. Meeting transcripts
2. Call recordings with text
3. Interview transcripts
4. Conversation logs
5. Chat logs
6. Any text content that represents spoken conversation

Return only the transcript text, formatted clearly with speaker identification if available.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const transcript = response.text();
      
      const processingTime = Date.now() - startTime;
      
      logger.info('URL transcript extraction completed', {
        url,
        processingTime: `${processingTime}ms`,
        transcriptLength: transcript.length
      });

      return {
        text: transcript,
        processingTime,
        wordCount: transcript.split(/\s+/).length,
        url
      };
    } catch (error) {
      logger.error('URL transcript extraction failed:', error);
      throw new Error(`Transcript extraction failed: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
