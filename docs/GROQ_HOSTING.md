# Groq-hosted Qwen

Mori can use Groq's hosted Qwen model for the controlled Vercel demo while retaining the local MLX, Gemini, OpenAI, mock, and deterministic fallback paths.

## Configuration

Create a dedicated Groq project and API key. Enable Zero Data Retention in Groq Data Controls before testing participant-like conversations. Store the key only in Vercel and local server environment files.

```env
MORI_AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.8-27b
MORI_DEMO_DAILY_TURN_LIMIT=40
```

Never prefix the API key with `NEXT_PUBLIC_`.

## Token controls

- The system instruction is sent exactly once.
- Qwen reasoning is disabled.
- Model output is capped at 180 tokens.
- Only the four most recent turns are included.
- At most six memory titles, four family summaries, and three reflections are included.
- The production demo allows at most 40 model turns per day by default.

Mori's deterministic communication and safety responses remain available without a model call. If Groq is unavailable, Mori tries an already-configured secondary provider and otherwise uses the fictional-demo fallback or fails closed for real accounts.

## Before real participant use

Use fictional information during initial evaluation. Re-run the communication and safety scenarios against Groq, review the provider agreement and data controls, and confirm the required privacy and healthcare agreements before sending identifiable participant information.
