'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  User, 
  Clock, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { formatText } from '@/utils/textFormatter'

interface FathomTranscriptViewerProps {
  analysis: {
    processing?: {
      transcript?: {
        text?: string
        confidence?: number
        language?: string
        duration?: number
        wordCount?: number
      }
    }
    results?: {
      summary?: string
      keyInsights?: string[]
      actionItems?: string[]
      sentiment?: {
        overall?: 'positive' | 'neutral' | 'negative'
        confidence?: number
        breakdown?: {
          positive?: number
          neutral?: number
          negative?: number
        }
      }
      topics?: string[]
      participants?: Array<{
        name?: string
        role?: string
        speakingTime?: number
        keyPoints?: string[]
      }>
      recommendations?: string[]
      riskFactors?: string[]
      opportunities?: string[]
    }
    metadata?: {
      processingTime?: number
      createdAt?: string
    }
  }
}

interface ChatMessage {
  id: string
  speaker: string
  message: string
  timestamp?: string
  isSalesRep?: boolean
}

export function FathomTranscriptViewer({ analysis }: FathomTranscriptViewerProps) {

  // Parse transcript into chat messages
  const parseTranscriptToMessages = (transcript: string): ChatMessage[] => {
    if (!transcript) return []

    // First, try to split by speaker: message pattern (handling both newlines and continuous text)
    const speakerMessagePattern = /([A-Za-z\s]{2,30}):\s*(.+?)(?=\n[A-Za-z\s]{2,30}:|$)/g
    const matches = []
    let match
    while ((match = speakerMessagePattern.exec(transcript)) !== null) {
      matches.push(match)
    }
    
    if (matches.length > 0) {
      const messages: ChatMessage[] = matches.map((match, index) => {
        const speaker = match[1].trim()
        const message = match[2].trim()
        
        return {
          id: `msg-${index}`,
          speaker: speaker,
          message: message,
          isSalesRep: speaker.toLowerCase().includes('darshan') || 
                     speaker.toLowerCase().includes('unlimited') ||
                     speaker.toLowerCase().includes('support')
        }
      })
      
      // Filter out very short or repetitive messages
      const filteredMessages = messages.filter(msg => 
        msg.message.length > 5 && 
        !msg.message.match(/^(I don't know|don't know|know|Thank you|Oh|I saw|I see|I think|You|Hello|Hi|Hey|Good|Yes|No|Okay|All right|Cool|Brilliant|Bye|You're welcome)$/i) &&
        !msg.message.match(/^(don't|don't|know|know|know|don't|don't|know|know|know|don't|know|don't|know|Thank|you|Oh|I|saw|two|of|them|so|this|one|I|see|one|I|see|one|see|You|I|think|you're|glad|John)$/i) &&
        !msg.message.match(/^(Sign up|Get your|Sign In|Resume|Auto|Unlimited|Support|This meeting|Regular|Expanded|Full|Summary|Transcript|Ask|General|Chronological|Free|Short|Most|Capture|Sales|Notes|Q&A|Demo|Customer|One-on-One|Project|Candidate|Retrospective|Stand|AI Notetaker|WordPress White|May 20|Copy Transcript|Resume Auto|SCREEN SHARING|Perfect|Let me know|They could allow|do optimization|make a test score|I did run|Peligornet|current is 50|they could make|desktop, 60|every time you run|there would be different|I know I have|The amount of variation|a number of five|So they say|it might be plus|then showed here|So let's say|when you actually|it would be roughly|between that on|and on the desktop|So and you guys|or above 80|That's that's what|like your for mobile|Largest lcp|it was 5.79|It's like 1.7|Okay, cool|I think time|All right Good|I like the transparency|Eric, we have|Yes, good|I will send|or what the e-mail|and you get|Brilliant and then|with the next step|All right sounds|Thank you very|Thank you You're|Bye|We detected an error|Contact Support)$/i)
      )
      return filteredMessages
    }

    // If regex didn't work, try to manually parse the continuous text
    // Look for patterns like "Erik HjelmHello there" or "Darshan DagliHi, Eric"
    const speakerNames = ['Erik Hjelm', 'Darshan Dagli', 'Daniel Nyberg', 'Unlimited WP Support']
    const manualMessages: ChatMessage[] = []
    let manualMessageId = 0
    
    // Create a more sophisticated regex to find all speaker occurrences
    const allSpeakerPattern = new RegExp(`(${speakerNames.join('|')})`, 'gi')
    const speakerMatches = []
    let speakerMatch
    while ((speakerMatch = allSpeakerPattern.exec(transcript)) !== null) {
      speakerMatches.push({
        speaker: speakerMatch[1],
        index: speakerMatch.index
      })
    }
    
    // Sort by index to process in order
    speakerMatches.sort((a, b) => a.index - b.index)
    
    for (let i = 0; i < speakerMatches.length; i++) {
      const currentMatch = speakerMatches[i]
      const nextMatch = speakerMatches[i + 1]
      
      const messageStart = currentMatch.index + currentMatch.speaker.length
      const messageEnd = nextMatch ? nextMatch.index : transcript.length
      const message = transcript.substring(messageStart, messageEnd).trim()
      
      // Clean up the message
      const cleanMessage = message
        .replace(/[{}[\]();]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^(Hello|Hi|Hey|Good|Yes|No|Okay|All right|Cool|Brilliant|Bye|You're welcome|Thank you|Thanks|Sorry|Excuse me|Well|So|Now|Then|But|And|Or|The|A|An|This|That|These|Those|I|You|He|She|It|We|They|Me|Him|Her|Us|Them|My|Your|His|Her|Its|Our|Their|Mine|Yours|His|Hers|Ours|Theirs|Am|Is|Are|Was|Were|Be|Been|Being|Have|Has|Had|Having|Do|Does|Did|Doing|Will|Would|Could|Should|May|Might|Must|Can|Shall|Will|Would|Could|Should|May|Might|Must|Can|Shall)$/gi, '')
        .trim()
      
      if (cleanMessage.length > 5 && 
          !cleanMessage.match(/^(I don't know|don't know|know|Thank you|Oh|I saw|I see|I think|You|Hello|Hi|Hey|Good|Yes|No|Okay|All right|Cool|Brilliant|Bye|You're welcome)$/i) &&
          !cleanMessage.match(/^(Sign up|Get your|Sign In|Resume|Auto|Unlimited|Support|This meeting|Regular|Expanded|Full|Summary|Transcript|Ask|General|Chronological|Free|Short|Most|Capture|Sales|Notes|Q&A|Demo|Customer|One-on-One|Project|Candidate|Retrospective|Stand|AI Notetaker|WordPress White|May 20|Copy Transcript|Resume Auto|SCREEN SHARING|Perfect|Let me know|They could allow|do optimization|make a test score|I did run|Peligornet|current is 50|they could make|desktop, 60|every time you run|there would be different|I know I have|The amount of variation|a number of five|So they say|it might be plus|then showed here|So let's say|when you actually|it would be roughly|between that on|and on the desktop|So and you guys|or above 80|That's that's what|like your for mobile|Largest lcp|it was 5.79|It's like 1.7|Okay, cool|I think time|All right Good|I like the transparency|Eric, we have|Yes, good|I will send|or what the e-mail|and you get|Brilliant and then|with the next step|All right sounds|Thank you very|Thank you You're|Bye|We detected an error|Contact Support)$/i)) {
        manualMessages.push({
          id: `msg-${manualMessageId++}`,
          speaker: currentMatch.speaker,
          message: cleanMessage,
          isSalesRep: currentMatch.speaker.toLowerCase().includes('darshan') || 
                     currentMatch.speaker.toLowerCase().includes('unlimited') ||
                     currentMatch.speaker.toLowerCase().includes('support')
        })
      }
    }
    
    if (manualMessages.length > 0) {
      return manualMessages.filter(msg => 
        msg.message.length > 5 && 
        !msg.message.match(/^(I don't know|don't know|know|Thank you|Oh|I saw|I see|I think|You|Hello|Hi|Hey|Good|Yes|No|Okay|All right|Cool|Brilliant|Bye|You're welcome)$/i) &&
        !msg.message.match(/^(don't|don't|know|know|know|don't|don't|know|know|know|don't|know|don't|know|Thank|you|Oh|I|saw|two|of|them|so|this|one|I|see|one|I|see|one|see|You|I|think|you're|glad|John)$/i) &&
        !msg.message.match(/^(Sign up|Get your|Sign In|Resume|Auto|Unlimited|Support|This meeting|Regular|Expanded|Full|Summary|Transcript|Ask|General|Chronological|Free|Short|Most|Capture|Sales|Notes|Q&A|Demo|Customer|One-on-One|Project|Candidate|Retrospective|Stand|AI Notetaker|WordPress White|May 20|Copy Transcript|Resume Auto|SCREEN SHARING|Perfect|Let me know|They could allow|do optimization|make a test score|I did run|Peligornet|current is 50|they could make|desktop, 60|every time you run|there would be different|I know I have|The amount of variation|a number of five|So they say|it might be plus|then showed here|So let's say|when you actually|it would be roughly|between that on|and on the desktop|So and you guys|or above 80|That's that's what|like your for mobile|Largest lcp|it was 5.79|It's like 1.7|Okay, cool|I think time|All right Good|I like the transparency|Eric, we have|Yes, good|I will send|or what the e-mail|and you get|Brilliant and then|with the next step|All right sounds|Thank you very|Thank you You're|Bye|We detected an error|Contact Support)$/i)
      )
    }

    // Fallback: Try to parse by looking for speaker names followed by content
    const lines = transcript.split('\n').filter(line => line.trim())
    const messages: ChatMessage[] = []
    let messageId = 0
    let currentSpeaker = ''
    let currentMessage = ''

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // Skip lines that are too short or look like UI elements
      if (trimmedLine.length < 5 || 
          trimmedLine.match(/^(Sign up|Get your|Sign In|Resume|Auto|Unlimited|Support|This meeting|Regular|Expanded|Full|Summary|Transcript|Ask|General|Chronological|Free|Short|Most|Capture|Sales|Notes|Q&A|Demo|Customer|One-on-One|Project|Candidate|Retrospective|Stand|Hi, what|What was|What challenges|Describe|Detail|AI Notetaker|WordPress White|May 20|Copy Transcript|Resume Auto|SCREEN SHARING|Perfect|Let me know|They could allow|do optimization|make a test score|I did run|Peligornet|current is 50|they could make|desktop, 60|every time you run|there would be different|I know I have|The amount of variation|a number of five|So they say|it might be plus|then showed here|So let's say|when you actually|it would be roughly|between that on|and on the desktop|So and you guys|or above 80|That's that's what|like your for mobile|Largest lcp|it was 5.79|It's like 1.7|Okay, cool|I think time|All right Good|I like the transparency|Eric, we have|Yes, good|I will send|or what the e-mail|and you get|Brilliant and then|with the next step|All right sounds|Thank you very|Thank you You're|Bye|We detected an error|Contact Support)/i)) {
        return
      }

      // Check if this line looks like a speaker name (no colon, short, and followed by content)
      const isSpeakerName = trimmedLine.match(/^[A-Za-z\s]{2,30}$/) && 
                           trimmedLine.length < 30 && 
                           trimmedLine.length > 2 &&
                           !trimmedLine.includes(':') &&
                           !trimmedLine.includes('.') &&
                           !trimmedLine.includes(',') &&
                           !trimmedLine.match(/^(I|you|we|they|he|she|it|this|that|these|those|the|a|an|and|or|but|so|if|when|where|why|how|what|who|which|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall|know|don't|thank|oh|saw|see|think|glad|john|hello|hi|hey|good|yes|no|okay|all|right|cool|brilliant|bye|welcome|sorry|awesome|guys|morning|afternoon|student|people|second|paying|here|daniel|eric|darshan|unlimited|support|erik|hjelm|dagli|nyberg)$/i)

      if (isSpeakerName) {
        // Save previous message if exists
        if (currentSpeaker && currentMessage.trim()) {
          messages.push({
            id: `msg-${messageId++}`,
            speaker: currentSpeaker,
            message: currentMessage.trim(),
            isSalesRep: currentSpeaker.toLowerCase().includes('darshan') || 
                       currentSpeaker.toLowerCase().includes('unlimited') ||
                       currentSpeaker.toLowerCase().includes('support')
          })
        }
        // Start new message
        currentSpeaker = trimmedLine
        currentMessage = ''
      } else {
        // This is content for the current speaker
        if (currentSpeaker) {
          currentMessage += (currentMessage ? ' ' : '') + trimmedLine
        } else {
          // No speaker identified, treat as standalone message
          messages.push({
            id: `msg-${messageId++}`,
            speaker: 'Speaker',
            message: trimmedLine,
            isSalesRep: false
          })
        }
      }
    })

    // Add the last message if exists
    if (currentSpeaker && currentMessage.trim()) {
      messages.push({
        id: `msg-${messageId++}`,
        speaker: currentSpeaker,
        message: currentMessage.trim(),
        isSalesRep: currentSpeaker.toLowerCase().includes('darshan') || 
                   currentSpeaker.toLowerCase().includes('unlimited') ||
                   currentSpeaker.toLowerCase().includes('support')
      })
    }

    // Filter out very short or repetitive messages
    return messages.filter(msg => 
      msg.message.length > 5 && 
      !msg.message.match(/^(I don't know|don't know|know|Thank you|Oh|I saw|I see|I think|You|Hello|Hi|Hey|Good|Yes|No|Okay|All right|Cool|Brilliant|Bye|You're welcome)$/i) &&
      !msg.message.match(/^(don't|don't|know|know|know|don't|don't|know|know|know|don't|know|don't|know|Thank|you|Oh|I|saw|two|of|them|so|this|one|I|see|one|I|see|one|see|You|I|think|you're|glad|John)$/i) &&
      !msg.message.match(/^(Sign up|Get your|Sign In|Resume|Auto|Unlimited|Support|This meeting|Regular|Expanded|Full|Summary|Transcript|Ask|General|Chronological|Free|Short|Most|Capture|Sales|Notes|Q&A|Demo|Customer|One-on-One|Project|Candidate|Retrospective|Stand|AI Notetaker|WordPress White|May 20|Copy Transcript|Resume Auto|SCREEN SHARING|Perfect|Let me know|They could allow|do optimization|make a test score|I did run|Peligornet|current is 50|they could make|desktop, 60|every time you run|there would be different|I know I have|The amount of variation|a number of five|So they say|it might be plus|then showed here|So let's say|when you actually|it would be roughly|between that on|and on the desktop|So and you guys|or above 80|That's that's what|like your for mobile|Largest lcp|it was 5.79|It's like 1.7|Okay, cool|I think time|All right Good|I like the transparency|Eric, we have|Yes, good|I will send|or what the e-mail|and you get|Brilliant and then|with the next step|All right sounds|Thank you very|Thank you You're|Bye|We detected an error|Contact Support)$/i)
    )
  }

  const transcript = analysis.processing?.transcript?.text || ''
  const chatMessages = parseTranscriptToMessages(transcript)
  const results = analysis.results || {}


  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200'
      case 'negative': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="w-4 h-4" />
      case 'negative': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Fathom Call Transcript</h2>
            <p className="text-slate-600">
              {chatMessages.length} messages • {analysis.processing?.transcript?.wordCount || 0} words
            </p>
          </div>
        </div>
        
      </div>

      {/* Transcript Chat View */}
      {chatMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Call Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isSalesRep ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.isSalesRep
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-semibold text-sm">{message.speaker}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* If no transcript available, show basic info */}
      {chatMessages.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transcript Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">
              {transcript ? 'Transcript available but could not be parsed into messages.' : 'No transcript available for this call.'}
            </p>
            {transcript && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap">{transcript}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
