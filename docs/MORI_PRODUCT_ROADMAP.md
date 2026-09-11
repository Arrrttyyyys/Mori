# Mori product roadmap

Last updated: September 10, 2026

This document is the ordered plan for taking Mori from its current working prototype to a supervised pilot and, later, a production service. Work through one phase at a time. Do not mark a phase complete until its exit criteria pass.

## Current baseline

- The connected-life product, family workspace, memory library, Life Map, session persistence, permissions, invitations, insights, plans, and exports are implemented.
- Eight Supabase migrations are applied.
- The local `mlx-community/Qwen3.5-2B-4bit` model has run successfully on the 8 GB M1 MacBook Air.
- The local communication evaluation passes 11 of 11 scripted scenarios.
- The production build, safety suite, permission checks, database regression, and browser workflow have passed.
- Mori and Qwen are currently stopped.
- This is a development prototype. It has not been clinically validated or approved for unsupervised participant use.

## Phase 0 — Protect the current baseline

**Goal:** Create a recoverable checkpoint before more product work.

- [x] Review the current Git changes and separate generated/local files from product code.
- [x] Confirm `.env.local`, database passwords, API keys, and downloaded model files are ignored by Git.
- [x] Commit the completed connected-life implementation in reviewable commits.
- [x] Push a private backup to the chosen Git host.
- [x] Record the migration state and current test results.

**Exit criteria**

- The working version can be restored on a clean machine without copying secrets.
- No secret or local model weight is tracked in Git.
- All baseline tests still pass from the saved revision.

**Completion record — September 10, 2026**

- Private backup: `https://github.com/Arrrttyyyys/Mori`
- `1877b57` — connected-life backend, database, verification, and local inference
- `762067d` — participant and caregiver interface
- `2e2f222` — implementation roadmap and pilot-readiness documentation
- Credential-shaped-value scan passed for every file eligible to be saved.
- `.env.local`, `.venv-mori`, `.local-models`, `node_modules`, and `.next` were verified as ignored.
- `npm run test:pilot` passed: types, memory engine, eight safety scenarios, 14 authenticated API contracts, and life-policy checks.
- `npm run build` passed with all 29 application routes compiled or generated.
- Eight database migrations remain recorded as applied in the configured Supabase project.

## Phase 1 — Finish the memory-session experience

**Goal:** Make the participant-facing session simple, calm, and consistent.

- [ ] Review the restored call-style interface at desktop, tablet, and phone sizes.
- [ ] Finalize Mori’s visual presence, spacing, typography, colors, and captions.
- [ ] Decide whether participant camera controls provide real value.
- [ ] Refine the start flow: `Start Session` → breathing moment → `Ready to begin`.
- [ ] Refine listening, thinking, speaking, paused, offline, and model-loading states.
- [ ] Make ending a session clear, reassuring, and reliably saved.
- [ ] Ensure the participant never chooses a technical session mode or memory category.
- [ ] Confirm every control is understandable with large text and touch targets.
- [ ] Test keyboard navigation, screen-reader labels, contrast, and reduced motion.

**Exit criteria**

- A caregiver can prepare and start a session without explanation.
- A participant can pause, continue, change direction, and finish without confusion.
- The layout works at the intended tablet size and has no overflow or hidden controls.
- Every failure state offers a calm recovery path.

## Phase 2 — Strengthen Mori’s conversation behavior

**Goal:** Make local-model behavior consistent across longer and more difficult conversations.

- [ ] Expand the communication suite beyond the current 11 scripted scenarios.
- [ ] Run each scenario repeatedly to measure variation between generations.
- [ ] Add multi-turn conversations lasting 10–15 minutes.
- [ ] Test repetition without Mori mentioning that the person repeated themselves.
- [ ] Test silence, short answers, interruptions, corrections, refusal, and changing topics.
- [ ] Test sadness, loneliness, confusion, wanting to go home, and unverifiable beliefs.
- [ ] Test urgent medical, abuse, and self-harm language through the deterministic safety layer.
- [ ] Test factual grounding against approved, unverified, restricted, and expired memories.
- [ ] Reduce generic, overly flowery, complex, or recall-demanding responses.
- [ ] Track response latency, malformed output, fallback frequency, memory use, and laptop temperature.

**Exit criteria**

- High-impact safety and dignity cases pass deterministically.
- Repeated evaluation runs meet an agreed pass threshold.
- Long sessions remain coherent and stay within the approved memory context.
- Response speed remains acceptable throughout a full session on the 8 GB M1 MacBook Air.

## Phase 3 — Validate speech and audio on target devices

**Goal:** Make voice interaction dependable for the people who will use Mori.

- [ ] Choose the first supported browser and device combination.
- [ ] Test microphone permission, denial, loss, and reconnection.
- [ ] Test older voices, quiet speech, pauses, accents, and background noise.
- [ ] Test speech-recognition mistakes and safe correction behavior.
- [ ] Tune Mori’s speaking rate, pitch, voice, volume, and pause timing.
- [ ] Prevent the microphone from transcribing Mori’s own spoken response.
- [ ] Test interruption while Mori is speaking.
- [ ] Test audio/photo/video playback interactions with listening and pause states.
- [ ] Validate Safari and iPad behavior if tablets are part of the pilot.
- [ ] Provide typed interaction whenever speech is unavailable.

**Exit criteria**

- A complete voice session works on every supported device.
- Common microphone and speech errors recover without restarting the session.
- Mori does not talk over the participant or listen to its own voice.
- The participant always has a visible non-voice alternative.

## Phase 4 — Choose and implement the model deployment architecture

**Goal:** Decide where Qwen runs when Mori is used beyond the development MacBook.

- [ ] Define the expected pilot size, concurrent sessions, locations, and internet availability.
- [ ] Compare a dedicated local Mori device, a private hosted model server, and managed Hugging Face inference.
- [ ] Compare privacy, latency, reliability, maintenance, hardware, and monthly cost.
- [ ] Decide whether Supabase data may be sent to a hosted inference service.
- [ ] Document exactly which approved context is sent to the model.
- [ ] Implement authentication and encrypted transport for any remote model server.
- [ ] Add model health checks, startup readiness, timeouts, and safe fallback behavior.
- [ ] Add version pinning and a controlled model-update process.
- [ ] Load-test the chosen architecture at expected concurrency.

**Exit criteria**

- The deployment decision and data flow are documented and approved.
- Mori can reach the model reliably without depending on the developer’s laptop.
- Model failure never loses a session or exposes restricted memory context.
- Latency and operating cost meet the pilot target.

## Phase 5 — Complete privacy, security, and recovery operations

**Goal:** Make data handling operationally complete rather than UI-only.

- [ ] Implement and verify full account deletion across database rows and stored media.
- [ ] Define retention periods for transcripts, observations, media, invitations, and audit records.
- [ ] Add caregiver-visible consent withdrawal and data-removal controls.
- [ ] Verify that withdrawing sharing immediately blocks family access.
- [ ] Test database backups and perform a documented restore exercise.
- [ ] Test storage recovery and orphaned-file cleanup.
- [ ] Define access-review, incident-response, breach-response, and privacy-request procedures.
- [ ] Commission an appropriate manual security review or penetration test.
- [ ] Review logs to ensure secrets and sensitive memory text are not exposed.
- [ ] Add dependency and secret-scanning checks to the development workflow.

**Exit criteria**

- A test account can be exported and completely deleted on request.
- A backup can be restored successfully using written instructions.
- Consent withdrawal and role revocation pass end-to-end tests.
- Material security findings are resolved or explicitly accepted before the pilot.

## Phase 6 — Prepare and conduct a supervised pilot

**Goal:** Evaluate usability and appropriateness with qualified oversight.

- [ ] Ask qualified dementia-care advisors to review prompts, safeguards, and evaluation cases.
- [ ] Define participant inclusion, exclusion, consent, assent, and stopping rules.
- [ ] Prepare caregiver instructions and participant-friendly explanations.
- [ ] Train supervisors on pause, stop, escalation, and incident procedures.
- [ ] Define pilot measures without presenting heuristics as clinical outcomes.
- [ ] Run internal role-play sessions before involving participants.
- [ ] Begin with a very small number of supervised sessions.
- [ ] Record usability issues, safety events, refusals, fallbacks, and caregiver feedback.
- [ ] Review each pilot stage before expanding participation.

**Exit criteria**

- Advisors approve the supervised protocol and communication materials.
- Consent, assent, stopping, and incident procedures work in practice.
- Pilot findings support a documented decision to continue, revise, or stop.
- No claim of clinical effectiveness is made without suitable evidence.

## Phase 7 — Production deployment and monitoring

**Goal:** Operate Mori reliably for its approved audience.

- [ ] Deploy the website, database migrations, storage configuration, and chosen model service.
- [ ] Separate development, staging, and production environments.
- [ ] Configure production secrets and rotate any credentials used during development.
- [ ] Add application error monitoring without capturing unnecessary sensitive content.
- [ ] Monitor model latency, fallback rate, API errors, Supabase CPU, memory, Disk IO, connections, and storage.
- [ ] Add alerts with clear owners and response procedures.
- [ ] Test login recovery, invitation expiry, workspace switching, and account revocation in production.
- [ ] Perform a production backup-and-restore rehearsal.
- [ ] Document routine updates, model restarts, migrations, and rollback procedures.

**Exit criteria**

- A staging release passes the complete automated and manual checklist.
- Production monitoring and alerts reach a responsible person.
- A failed deployment can be rolled back without losing participant data.
- Supabase remains within resource limits during representative load.

## Phase 8 — Later product expansion

**Goal:** Add capabilities only after the core session is dependable.

- [ ] Reviewed image-context suggestions that never silently identify people.
- [ ] Optional semantic retrieval after privacy and grounding evaluation.
- [ ] A more expressive Mori avatar and carefully tested lip synchronization.
- [ ] Caregiver reminders and notifications with explicit opt-in controls.
- [ ] Broader multilingual model, speech, and safety evaluation.
- [ ] Care-facility organizations, resident provisioning, staff rosters, and permissions.
- [ ] Facility operations, reporting, subscriptions, and billing.

**Exit criteria**

- Each feature has a defined user need, privacy assessment, acceptance criteria, and test plan.
- Expansion does not weaken consent, memory restrictions, or the simplicity of participant sessions.

## Working rule

At the start of each work session, select the first unchecked item in the current phase. Record the result here, run the relevant checks, and only then move to the next item. If priorities change, update this roadmap so it remains the single source of truth.

## Next action

Start with **Phase 0 — Protect the current baseline**. The current workspace contains substantial completed work that has not yet been organized into a recoverable Git checkpoint.
