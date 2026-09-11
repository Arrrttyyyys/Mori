# Mori adaptive memory engine

This module ranks possible reminiscence stimuli using patient-approved context,
prior observations, caregiver feedback, and the current conversation state.

The engine intentionally uses deterministic scoring before any language-model
generation. This makes selection inspectable, testable, and overrideable. The
language model's job is to phrase one gentle invitation around the selected
stimulus—not to invent patient history or select sensitive content on its own.

## Important boundaries

- Score a stimulus, never a patient's worth, cognition, or dementia severity.
- Recognition is an inferred interaction signal, never the result of a quiz.
- Treat observations as uncertain and time-bounded rather than permanent facts.
- Patient consent and distress suppression override engagement optimization.
- Caregiver feedback informs future selection but does not override patient refusal.
- Fall back to a neutral present-focused conversation when nothing is eligible.
