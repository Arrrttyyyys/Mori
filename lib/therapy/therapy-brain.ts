import { TherapyResponse, SessionContext, MemoryLibraryItem } from './types'

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

9. DEEPER EMPATHY (not generic validation): Briefly mirror what they said in your own words so it feels personal — e.g. if they are sad but unsure why, acknowledge that mixed feeling ("sometimes sadness shows up without a clear reason, and that can feel confusing") before you ask anything. Avoid repeating the same stock line twice in a row (e.g. don't keep saying only "I hear you"). Name the emotional texture when it helps (lonely, heavy, tender, mixed).

10. WHEN THEY DON'T KNOW WHAT TO SAY OR HOW THEY FEEL: If the user is vague, stuck, says they don't know what they're feeling, or isn't sure what to talk about, do NOT only ask "what else would you like to share?" Instead:
    - Normalize: it's okay not to have words for everything; there's no quiz.
    - Lead gently: offer ONE concrete thread they can take or leave — preferably from the Memory Library list below (mention a specific saved title) OR from Family Space (a topic a loved one noted) OR a simple sensory/seasonal opener only if those lists are empty.
    - Keep it invitational, never testing: "We could wander toward…" / "I'm curious, when you see the title '…' — does anything stir, or shall we skip it?"
    - You may weave the memory offer into spoken_response and still end with one gentle next_question (or combine into a single warm invitation if that flows better).

11. USE SAVED MEMORIES PROACTIVELY: The Memory Library and Family Space sections are there so you can bring warmth and direction when conversation slows. Use them especially after sadness, uncertainty, or short answers — always one idea at a time, always gentle.

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
- ask generic questions when you have context (especially when Memory Library or Family Space lists are non-empty — use them instead of "what else?")
- ignore what they just said
- loop on vague prompts like "what else would you like to share?" when the user already said they are unsure — pivot to a memory or family-space thread instead

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
    const memoryLibraryContext = this.buildMemoryLibraryContext(context)
    const familySpaceContext = this.buildFamilySpaceContext(context)

    const userPrompt = `${THERAPY_SYSTEM_PROMPT}

${photoContext}${previousSessionsContext}${memoryLibraryContext}${familySpaceContext}

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
      const unsure =
        /\bnot\s+sure\b/.test(msg) ||
        /\bnot\s+exactly\s+sure\b/.test(msg) ||
        /\bunsure\b/.test(msg) ||
        msg.includes("don't know") ||
        msg.includes('dont know') ||
        msg.includes('confus')
      if (unsure) {
        spoken =
          "Thank you for saying that. Sadness can show up without a clear story, and that can feel unsettling — you're not doing anything wrong."
        const mem = this.pickMemoryLibraryOffer(context)
        const fam = this.pickFamilySpaceOffer(context)
        if (mem) {
          question = `We don't have to figure it all out. When you're ready, we could gently visit a saved memory — you have one called "${mem.title}". Does that sound okay, or would you rather stay with how you feel right now?`
        } else if (fam) {
          question = `There's no rush to name it. Your family once noted something about "${fam.topic}" — would you like to wander that way, or just sit with this feeling a little?`
        } else {
          question =
            "Would it help to describe it in the body — heavy, quiet, tight — or shall we take a slow breath together and see what comes?"
        }
      } else {
        spoken = "That sounds really hard. I'm glad you're telling me."
        question = "What part of it feels heaviest today?"
      }
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
    // Stuck / don't know what to talk about (but not memory-loss wording)
    else if (
      msg.match(/\b(don't know what to (say|talk)|nothing to (say|talk)|not sure what to (say|talk)|no idea what to)\b/) ||
      (msg.includes('nothing') && msg.includes('mind'))
    ) {
      spoken = "That's all right. You don't need a topic — I'm right here with you."
      const mem = this.pickMemoryLibraryOffer(context)
      if (mem) {
        question = `If a little direction would feel kind, we could look toward a photo you saved — "${mem.title}". Only if you'd like; we can also stay quiet.`
      } else {
        const fam = this.pickFamilySpaceOffer(context)
        if (fam) {
          question = `Sometimes a small thread helps: your loved ones left a note about "${fam.topic}". Curious to explore that, or would you prefer I share something gentle about the season?`
        } else {
          question = "Would you enjoy hearing a tiny story about a summer afternoon, or shall we simply be still for a moment?"
        }
      }
      emotionalState = "calm"
    }
    // Confusion or uncertainty (memory recall)
    else if (msg.includes('don\'t remember') || msg.includes('forgot') || msg.includes('can\'t recall')) {
      spoken = "That's okay. Sometimes memories take time to come back."
      question = "Is there anything that does come to mind?"
      emotionalState = "calm"
    }
    else if (
      (/\bnot\s+sure\b/.test(msg) || /\bnot\s+exactly\s+sure\b/.test(msg) || /\bunsure\b/.test(msg)) &&
      (msg.includes('feel') || msg.includes('feeling') || msg.includes('about') || msg.includes('why'))
    ) {
      spoken =
        "Mixed or unclear feelings are so human. You don't owe me a neat label."
      const mem = this.pickMemoryLibraryOffer(context)
      if (mem) {
        question = `When you're ready, we could let your mind drift toward "${mem.title}" — no quiz, just company. Does that feel okay?`
      } else {
        question = "What would feel kindest right now — a little silence, or a soft question from me?"
      }
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
      } else if (
        /\bnot\s+exactly\s+sure\b/.test(msg) ||
        (msg.includes('sure') && msg.includes('feel'))
      ) {
        spoken =
          "It makes sense you'd feel a little lost when the feeling doesn't have a clear name yet. I'm still right here with you."
        const mem = this.pickMemoryLibraryOffer(context)
        question = mem
          ? `When you want a soft place to land, we could visit the memory "${mem.title}" — only if it feels right.`
          : "Would a quiet moment feel better, or one small question from me?"
        emotionalState = "calm"
      } else {
        spoken = "I'm taking that in with you — thank you for trusting me with it."
        question = "What feels most true for you in this moment, even in a word or two?"
        emotionalState = "reflective"
      }
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

  /** First saved memory title for gentle prompts when user is stuck (mock + aligns with LLM instructions). */
  private pickMemoryLibraryOffer(context?: SessionContext): MemoryLibraryItem | null {
    const items = context?.memory_library
    if (!items?.length) return null
    return items[0]
  }

  private pickFamilySpaceOffer(context?: SessionContext): { topic: string } | null {
    const summaries = context?.family_space?.session_summaries
    if (summaries?.length) return { topic: summaries[0].topic }
    return null
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

  private buildMemoryLibraryContext(context: SessionContext): string {
    const items = context.memory_library
    if (!items || items.length === 0) return ''

    const lines = items
      .slice(0, 20) // Limit to 20 for prompt size
      .map((m) => `- "${m.title}" (added ${m.date})`)
      .join('\n')
    return `\n\nMemory Library (photos/memories the person has saved; titles only):\n${lines}\nWhen the user is sad, quiet, or unsure what to talk about, warmly offer ONE of these titles as a possible path — quote the title naturally, no pressure. If they decline, accept that and try another angle later.`
  }

  private buildFamilySpaceContext(context: SessionContext): string {
    const fs = context.family_space
    if (!fs) return ''

    const parts: string[] = []
    if (fs.session_summaries && fs.session_summaries.length > 0) {
      const summaries = fs.session_summaries
        .slice(0, 10)
        .map((s) => `- ${s.date}: ${s.topic}. ${s.summary}`)
        .join('\n')
      parts.push(`Recent session summaries (from family/caregiver space):\n${summaries}`)
    }
    if (fs.reflections && fs.reflections.length > 0) {
      const reflections = fs.reflections
        .slice(0, 5)
        .map((r) => `- ${r.text}`)
        .join('\n')
      parts.push(`Mori's reflections (gentle observations to build on):\n${reflections}`)
    }
    if (parts.length === 0) return ''
    return `\n\nFamily Space context (from loved ones — use to gently suggest topics when the user feels stuck):\n${parts.join('\n\n')}\nWhen conversation stalls, you may reference ONE topic or reflection here as a soft invitation, not as fact about the user.`
  }
}
