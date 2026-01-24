import { TherapyResponse, SessionContext } from './types'

const THERAPY_SYSTEM_PROMPT = `You are Mori, a calm and gentle reminiscence companion.

You guide memory conversations for older adults using warmth, patience, and emotional presence.

You are not a chatbot.
You are not an assistant.
You are a listener and a companion.

Your role is to help people reflect on their life through conversation, photos, and stories.

There are no right or wrong answers.
The user's story is always accepted as truth in the moment.

CORE PRINCIPLES:

1. READ THE ENTIRE MESSAGE: Never respond to just one word or phrase. Read the complete message from start to finish. If someone says "I'm doing pretty well I'm feeling a little sick today", you must acknowledge BOTH parts - don't just respond to "well" and ignore "sick".

2. DETECT CONTRADICTIONS: If someone says something positive but also mentions something negative (e.g., "I'm fine but I'm sick"), acknowledge the full picture. Don't respond as if everything is positive.

3. EMOTIONAL AWARENESS: Pay attention to emotional cues. If someone mentions feeling unwell, sad, or struggling, respond with empathy and understanding - never with "I'm glad to hear that" or other positive responses that don't match their emotional state.

4. LISTEN DEEPLY: Pay close attention to what the user is actually saying. Reference specific details they've shared. Show you remember and understand.

5. RESPOND THOUGHTFULLY: Your responses should demonstrate that you've heard and understood what they said. Acknowledge their feelings, validate their experiences, and show genuine interest.

6. BUILD ON CONVERSATION: Reference things mentioned earlier in the conversation. Connect related topics. Show continuity and presence.

7. BE WARM AND PRESENT: Use gentle, warm language. Show emotional attunement. Match their emotional tone (if they're nostalgic, be nostalgic with them; if they're sad, be gentle and understanding).

8. ASK MEANINGFUL QUESTIONS: Questions should flow naturally from what they've shared. Don't ask generic questions - ask about specific things they mentioned.

You must:

- speak slowly and warmly
- keep responses short (1–3 sentences)
- ask only one question at a time
- validate every response
- accept uncertainty
- respect silence
- never rush
- reference specific details from the conversation
- show you're listening and understanding

You must never:

- correct the user
- argue
- say "actually"
- test memory
- challenge reality
- give medical advice
- diagnose conditions
- pressure the user for answers
- ask generic questions when you have context
- ignore what they just said

If the user is confused, respond with comfort.
If the user is distressed, respond with reassurance.
If the user is joyful, reflect that joy.

CRITICAL: If the user mentions feeling unwell, sick, or any negative health concern, NEVER respond with "I'm glad to hear that" or other positive responses. Instead, acknowledge their concern with empathy, for example: "I'm sorry to hear you're not feeling well. How are you doing right now?"

EXAMPLE OF WHAT NOT TO DO:
User: "I'm doing pretty well I'm feeling a little sick today"
WRONG: "I'm glad to hear that. Is there something you'd like to share?"
CORRECT: "I'm sorry to hear you're not feeling well. How are you doing right now?"

If the user says they don't remember, respond:
"That's okay. Sometimes memories come and go. We can take our time."

Your goal is emotional comfort, connection, and dignity.

Always return structured JSON in the required schema.`

export class TherapyBrain {
  private apiKey: string

  constructor() {
    // In production, use environment variable
    this.apiKey = process.env.OPENAI_API_KEY || ''
    
    // Log API key status (without exposing the key)
    if (this.apiKey) {
      console.log('🔑 OpenAI API key loaded successfully')
    } else {
      console.log('ℹ️ No OpenAI API key found - using intelligent mock responses')
    }
  }

  async generateResponse(
    userMessage: string,
    context: SessionContext
  ): Promise<TherapyResponse> {
    const conversationHistory = this.buildConversationHistory(context)
    const photoContext = this.buildPhotoContext(context)
    const previousSessionsContext = context.previous_sessions_summary
      ? `\n\nPrevious sessions context: ${context.previous_sessions_summary}`
      : ''

    const userPrompt = `${THERAPY_SYSTEM_PROMPT}

${photoContext}${previousSessionsContext}

Current conversation:
${conversationHistory}

User's latest message: "${userMessage}"

Respond with ONLY valid JSON in this exact format:
{
  "spoken_response": "your warm, brief response (1-3 sentences)",
  "next_question": "one gentle question",
  "show_photo": true or false,
  "photo_id": "photo_id_string or null",
  "emotional_state": "calm | reflective | nostalgic | confused | distressed | joyful",
  "session_action": "continue | close"
}`

    try {
      const response = await this.callLLM(userPrompt, userMessage, context)
      const parsed = this.parseAndValidateResponse(response)
      return parsed
    } catch (error) {
      console.error('Therapy Brain error:', error)
      return this.getFallbackResponse(userMessage)
    }
  }

  private async callLLM(prompt: string, userMessage: string, context?: SessionContext): Promise<string> {
    if (!this.apiKey || this.apiKey === '') {
      console.warn('⚠️ No API key found. Using contextual mock responses.')
      console.warn('   To use OpenAI, add OPENAI_API_KEY to your .env.local file and restart the server.')
      return this.getMockResponse(userMessage, context)
    }
    
    console.log('✅ OpenAI API key detected. Using real LLM for thoughtful responses.')

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using more cost-effective model, can change to 'gpt-4' for better quality
          messages: [
            { role: 'system', content: THERAPY_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8, // Slightly higher for more natural, thoughtful responses
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ OpenAI API error (${response.status}):`, errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Received thoughtful response from OpenAI')
      return data.choices[0].message.content
    } catch (error) {
      console.error('❌ LLM API call failed:', error)
      console.warn('⚠️ Falling back to contextual mock response')
      return this.getMockResponse(userMessage, context)
    }
  }

  private getMockResponse(userMessage: string, context?: SessionContext): string {
    // More thoughtful mock responses that use conversation history
    const msg = (userMessage || '').toLowerCase().trim()
    const turns = context?.session.turns || []
    const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null
    
    // Extract key topics from conversation history
    const allMessages = turns.map(t => t.user_message.toLowerCase()).join(' ')
    const hasMentionedFamily = allMessages.includes('family') || allMessages.includes('mother') || allMessages.includes('father') || allMessages.includes('grand')
    const hasMentionedPlace = allMessages.includes('place') || allMessages.includes('house') || allMessages.includes('home') || allMessages.includes('garden')
    const hasMentionedWork = allMessages.includes('work') || allMessages.includes('job') || allMessages.includes('career')
    const hasMentionedChildhood = allMessages.includes('childhood') || allMessages.includes('young') || allMessages.includes('kid')
    
    let spoken = "I hear you."
    let question = "What comes to mind when you think about that?"
    let emotionalState = "reflective"

    // Greetings
    if (msg.match(/^(hey|hi|hello|good morning|good afternoon|good evening)/)) {
      spoken = "Hi there. It's so nice to see you today."
      question = "How're you feeling?"
      emotionalState = "calm"
    }
    // How are you responses
    else if (msg.includes('how are you') || msg.includes('how you doing')) {
      spoken = "I'm here with you, and I'm listening."
      question = "How're you doing today? What's on your mind?"
      emotionalState = "calm"
    }
    // HEALTH CONCERNS - Check for negative health indicators FIRST (before positive responses)
    // This must come before the "positive responses" check to catch cases like "I'm doing well but I'm sick"
    else if (msg.match(/\b(sick|ill|unwell|not feeling|not well|pain|ache|hurt|tired|exhausted|dizzy|nauseous|fever|feeling.*sick|feeling.*ill)\b/)) {
      // Even if they say "pretty well" but mention being sick, acknowledge the concern
      spoken = "Oh, I'm sorry to hear you're not feeling well."
      question = "How're you doing right now?"
      emotionalState = "calm"
    }
    // NEGATIVE EMOTIONS - Check for these before positive responses
    else if (msg.match(/\b(sad|lonely|miss|missed|hard|difficult|tough|struggling|worried|anxious|scared|afraid|down|upset)\b/)) {
      spoken = "I understand that feeling."
      question = "Would you like to talk about it?"
      emotionalState = "reflective"
    }
    // Positive responses - BUT check for contradictions first
    else if (msg.match(/\b(good|great|fine|okay|ok|well|wonderful|lovely)\b/)) {
      // Check if there's a negative context in the same message (contradiction)
      const hasNegativeContext = msg.match(/\b(but|however|though|although|sick|not|can't|cannot|don't|doesn't|didn't|won't|wouldn't|shouldn't|couldn't|bad|worse|worst|terrible|awful)\b/)
      
      if (hasNegativeContext) {
        // They said something positive but also something negative - acknowledge both
        spoken = "I hear you. Sounds like things are a bit mixed right now."
        question = "How're you feeling about that?"
        emotionalState = "reflective"
      } else {
        // Genuinely positive
        spoken = "That's good to hear."
        if (turns.length === 0) {
          question = "Is there something you'd like to share or remember today?"
        } else {
          question = "What would you like to talk about?"
        }
        emotionalState = "joyful"
      }
    }
    // Family mentions
    else if (msg.includes('family') || msg.includes('mother') || msg.includes('father') || msg.includes('grand') || msg.includes('sister') || msg.includes('brother') || msg.includes('son') || msg.includes('daughter')) {
      if (hasMentionedFamily && lastTurn?.user_message.toLowerCase().includes('family')) {
        spoken = "Family really means a lot to you, doesn't it?"
        question = "What's a favorite memory you have with them?"
      } else {
        spoken = "Sounds like family's really important to you."
        question = "What's a memory of them that stands out?"
      }
      emotionalState = "nostalgic"
    }
    // Place mentions
    else if (msg.includes('place') || msg.includes('house') || msg.includes('home') || msg.includes('garden') || msg.includes('town') || msg.includes('city') || msg.includes('country')) {
      if (hasMentionedPlace && lastTurn?.user_message.toLowerCase().match(/\b(place|house|home|garden|town|city)\b/)) {
        spoken = "That place holds special memories for you, doesn't it?"
        question = "What made it feel like home?"
      } else {
        spoken = "That sounds like a special place."
        question = "What did you love most about it?"
      }
      emotionalState = "nostalgic"
    }
    // Work/career
    else if (msg.includes('work') || msg.includes('job') || msg.includes('career') || msg.includes('office')) {
      spoken = "Your work was an important part of your life, wasn't it?"
      question = "What did you enjoy most about it?"
      emotionalState = "reflective"
    }
    // Childhood
    else if (msg.includes('childhood') || msg.includes('young') || msg.includes('kid') || msg.includes('school')) {
      spoken = "Childhood memories can be so vivid, can't they?"
      question = "What stands out most from those times?"
      emotionalState = "nostalgic"
    }
    // Memory/remember mentions
    else if (msg.includes('remember') || msg.includes('memory') || msg.includes('memories') || msg.includes('recall')) {
      if (turns.length > 2) {
        spoken = "You've shared some beautiful memories with me."
        question = "Is there another one that comes to mind?"
      } else {
        spoken = "Memories can be so powerful, can't they?"
        question = "Would you like to tell me more about that?"
      }
      emotionalState = "reflective"
    }
    // Confusion or uncertainty
    else if (msg.includes('don\'t remember') || msg.includes('forgot') || msg.includes('not sure') || msg.includes('confused') || msg.includes('can\'t recall')) {
      spoken = "That's okay. Sometimes memories take time to come back."
      question = "Is there anything that does come to mind?"
      emotionalState = "calm"
    }
    // Questions about Mori
    else if (msg.includes('who are you') || msg.includes('what are you') || msg.includes('your name')) {
      spoken = "I'm Mori. I'm here to listen and be with you."
      question = "What would you like to share today?"
      emotionalState = "calm"
    }
    // Longer, detailed messages - acknowledge specifics
    else if (msg.length > 30) {
      // Try to extract a key topic from the longer message
      if (msg.includes('when i') || msg.includes('i used to') || msg.includes('i remember')) {
        spoken = "Thanks for sharing that with me. That sounds meaningful."
        question = "What else comes up when you think about that time?"
      } else {
        spoken = "I hear what you're saying. That's important."
        question = "What else would you like to share about that?"
      }
      emotionalState = "reflective"
    }
    // Short responses - encourage more
    else if (msg.length < 10) {
      spoken = "I'm here with you."
      if (turns.length === 0) {
        question = "What would you like to talk about today?"
      } else {
        question = "What else comes to mind?"
      }
      emotionalState = "calm"
    }
    // Default - acknowledge and gently probe
    else {
      if (turns.length > 2) {
        // We have context, reference the conversation
        spoken = "I'm listening."
        question = "What else would you like to share?"
      } else {
        spoken = "I hear you."
        question = "Tell me more about that."
      }
      emotionalState = "reflective"
    }

    return JSON.stringify({
      spoken_response: spoken,
      next_question: question,
      show_photo: false,
      photo_id: null,
      emotional_state: emotionalState,
      session_action: "continue"
    })
  }

  private parseAndValidateResponse(response: string): TherapyResponse {
    try {
      const parsed = JSON.parse(response)
      
      // Validate required fields
      if (!parsed.spoken_response || !parsed.next_question) {
        throw new Error('Invalid response structure')
      }

      // Validate emotional_state
      const validEmotionalStates = ['calm', 'reflective', 'nostalgic', 'confused', 'distressed', 'joyful']
      if (!validEmotionalStates.includes(parsed.emotional_state)) {
        parsed.emotional_state = 'calm'
      }

      // Validate session_action
      const validActions = ['continue', 'close']
      if (!validActions.includes(parsed.session_action)) {
        parsed.session_action = 'continue'
      }

      return {
        spoken_response: parsed.spoken_response,
        next_question: parsed.next_question,
        show_photo: parsed.show_photo || false,
        photo_id: parsed.photo_id || null,
        emotional_state: parsed.emotional_state,
        session_action: parsed.session_action,
      }
    } catch (error) {
      console.error('Failed to parse therapy response:', error)
      return this.getFallbackResponse('')
    }
  }

  private getFallbackResponse(userMessage: string): TherapyResponse {
    // Safe fallback that follows therapy principles
    return {
      spoken_response: "I'm here with you. Take your time.",
      next_question: "What would you like to share?",
      show_photo: false,
      photo_id: null,
      emotional_state: 'calm',
      session_action: 'continue',
    }
  }

  private buildConversationHistory(context: SessionContext): string {
    if (context.session.turns.length === 0) {
      return 'This is the beginning of the conversation.'
    }

    return context.session.turns
      .slice(-6) // Last 6 turns for context
      .map((turn, idx) => {
        return `Turn ${idx + 1}:
User: ${turn.user_message}
Mori: ${turn.therapist_response.spoken_response} ${turn.therapist_response.next_question}`
      })
      .join('\n\n')
  }

  private buildPhotoContext(context: SessionContext): string {
    if (!context.photo_metadata) {
      return ''
    }

    const photo = context.photo_metadata
    let photoContext = `\n\nCurrent photo context:\n`
    
    if (photo.people) {
      photoContext += `People in photo: ${photo.people.join(', ')}\n`
    }
    if (photo.place) {
      photoContext += `Place: ${photo.place}\n`
    }
    if (photo.year) {
      photoContext += `Year: ${photo.year}\n`
    }
    if (photo.memory_hint) {
      photoContext += `Memory hint: ${photo.memory_hint}\n`
    }

    photoContext += `\nIMPORTANT: Ask about the photo, do not state facts. For example, ask "Do you recognize anyone in this picture?" not "This is your sister."`

    return photoContext
  }
}
