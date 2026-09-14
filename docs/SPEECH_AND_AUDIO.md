# Mori speech and audio target

## First pilot target

The first supported voice setup is a recent iPad running the current stable iPadOS and Safari, used in a quiet room with a caregiver nearby. Typed input remains available throughout the session. Chrome on the development Mac is a secondary engineering target, not the pilot reference device.

## Implemented behavior

- Voice begins only after the participant selects **Turn voice on** and browser permission succeeds.
- Permission denial, missing audio capture, unsupported recognition, network interruption, and other recognition errors provide a typed recovery path.
- Recognition stops before Mori speaks and restarts only after speech ends or the participant selects **Stop Mori speaking**.
- Audio and video memories suspend recognition while playing. Listening resumes after pause or completion unless the session was already paused.
- Mori speaks at rate `0.85` and prefers an exact configured-language voice, then a same-language fallback.
- Duplicate recognition results received within 1.5 seconds are ignored.

## Hands-on test matrix

Run on the target iPad with the device volume at a comfortable level:

1. Allow microphone permission, complete three voice turns, pause, continue, and finish.
2. Deny permission and confirm typed input remains usable without reloading.
3. Remove microphone permission during a session, then restore it and turn voice on again.
4. Speak quietly, pause mid-sentence, use an older adult voice, and repeat with representative accents.
5. Repeat with television sound, conversation, and household background noise.
6. Correct a recognition error and confirm Mori accepts the correction without argument.
7. Stop Mori while it is speaking and begin a new voice turn.
8. Play, pause, resume, and finish approved audio and video memories; confirm Mori never transcribes its own audio.
9. Repeat after locking/unlocking the iPad and after temporary network loss.

Record browser/iPadOS versions, recognition text, expected text, response timing, failures, and whether recovery required a reload. Phase 3 is not complete until this matrix passes on physical hardware.
