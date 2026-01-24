# Mori Therapy System

## Overview

The core AI therapy system for Mori - a digital reminiscence companion that guides calm, emotionally safe memory conversations.

## Architecture

### Components

1. **TherapyBrain** (`therapy-brain.ts`)
   - LLM integration with structured JSON output
   - Enforces therapy principles through system prompts
   - Handles conversation context and photo metadata

2. **SessionOrchestrator** (`session-orchestrator.ts`)
   - Controls turn-taking and pacing
   - Manages session lifecycle
   - Handles session closure

3. **SafetyMonitor** (`safety-monitor.ts`)
   - Detects distress, abuse, and panic indicators
   - Triggers appropriate responses
   - Escalates high-risk situations

4. **SessionStore** (`session-store.ts`)
   - In-memory session storage (replace with database in production)
   - Tracks session history
   - Provides context from previous sessions

## LLM Integration

### Current Implementation

The `TherapyBrain` class uses intelligent contextual mock responses that:
- Analyze conversation history
- Reference previous topics mentioned
- Respond thoughtfully to different types of messages
- Adapt based on conversation length and context

**For best results, use a real LLM:**

1. **OpenAI Integration** (Recommended)

The system is already set up to use OpenAI. Just add your API key:

**Setup:**

1. Create a `.env.local` file in the project root:
```
OPENAI_API_KEY=your_api_key_here
```

2. Get your API key from: https://platform.openai.com/api-keys

3. Restart your development server

The system will automatically use OpenAI when the API key is detected. Without it, intelligent mock responses are used.

**Current API Configuration:**
```typescript
model: 'gpt-4o-mini', // Cost-effective, can change to 'gpt-4' for better quality
temperature: 0.8, // Natural, thoughtful responses
max_tokens: 500,
      messages: [
        { role: 'system', content: THERAPY_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
}
```

2. **Anthropic Claude Integration**

```typescript
private async callLLM(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  })

  const data = await response.json()
  return data.content[0].text
}
```

## API Routes

### POST `/api/therapy/session`
Process a turn in a therapy session.

**Request:**
```json
{
  "session_id": "session_123",
  "user_message": "I remember my grandmother's house...",
  "photo_metadata": {
    "photo_id": "photo_123",
    "people": ["Grandmother", "Sarah"],
    "place": "Family home",
    "year": "1965"
  }
}
```

**Response:**
```json
{
  "response": {
    "spoken_response": "That sounds meaningful to you.",
    "next_question": "What comes to mind when you think about that?",
    "show_photo": false,
    "photo_id": null,
    "emotional_state": "reflective",
    "session_action": "continue"
  },
  "session": { ... }
}
```

### GET `/api/therapy/session?session_id=xxx&user_id=xxx`
Get or create a therapy session.

### DELETE `/api/therapy/session?session_id=xxx`
Close a therapy session.

## Therapy Principles

The system enforces:

- **Never corrects** the user
- **Never tests** memory
- **Always validates** emotions
- **Always asks** one question at a time
- **Always keeps** responses short (1-3 sentences)
- **Always moves** at the user's pace

## Safety Features

The SafetyMonitor detects:
- Self-harm ideation
- Abuse concerns
- Panic attacks
- General distress

High-risk situations trigger:
- Immediate comfort response
- Session pause
- Escalation hook (implement in production)

## Production Considerations

1. **Database Storage**: Replace in-memory SessionStore with database (PostgreSQL, MongoDB, etc.)

2. **User Authentication**: Integrate with your auth system to get real user IDs

3. **Photo Storage**: Implement photo upload and metadata management

4. **Escalation System**: Implement real escalation hooks (notify caregivers, emergency contacts)

5. **Rate Limiting**: Add rate limiting to API routes

6. **Error Handling**: Enhance error handling and logging

7. **Monitoring**: Add monitoring for therapy quality and safety incidents

## Testing

Test the therapy system with scenarios:
- Normal reminiscence conversation
- User expressing confusion
- User expressing distress
- Photo-based reminiscence
- Session closure
- Safety escalation
