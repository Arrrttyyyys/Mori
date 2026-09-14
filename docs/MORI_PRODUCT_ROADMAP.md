# Mori product roadmap

Last updated: September 11, 2026

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
- [x] Decide whether participant camera controls provide real value.
- [x] Refine the start flow: `Start Session` → breathing moment → `Ready to begin`.
- [x] Refine listening, thinking, speaking, paused, offline, and model-loading states.
- [x] Make ending a session clear, reassuring, and reliably saved.
- [x] Ensure the participant never chooses a technical session mode or memory category.
- [x] Confirm every control is understandable with large text and touch targets.
- [ ] Test keyboard navigation, screen-reader labels, contrast, and reduced motion.

**Exit criteria**

- A caregiver can prepare and start a session without explanation.
- A participant can pause, continue, change direction, and finish without confusion.
- The layout works at the intended tablet size and has no overflow or hidden controls.
- Every failure state offers a calm recovery path.

**Progress record — September 10, 2026**

- Kept the familiar call-style layout and removed the participant camera because Mori does not process or respond to the camera feed. The participant presence remains visible without creating a misleading impression that Mori can see them.
- Reworked the start screen while preserving the two-step `Start Session` and `Ready to begin` flow.
- Added distinct listening, thinking, voice-ready, paused, model-error, session-ending, and closed states.
- Added retry for a failed typed or spoken message.
- Added a `Different memory` control without exposing technical modes or categories.
- Added an accessible end-session confirmation, safe initial focus, keyboard focus containment, Escape cancellation, save progress, and retry after a failed save.
- Added large touch targets, visible keyboard focus, semantic live regions, and reduced-motion behavior.
- Audited participant-facing labels and control dimensions in source. Primary controls are at least 48 pixels high; message and ending controls are at least 56 pixels high; start controls are 64 pixels high.
- Increased start-screen contrast, strengthened secondary text contrast, and changed the active voice control to a darker accessible sage.
- Allowed the session stage to shrink on short desktop and tablet viewports so the control bar is not hidden, and stacked the message field and Send button on narrow phones.
- Restored keyboard focus to `Finish for today` when the ending dialog is dismissed.
- `npm run test:pilot` and `npm run build` pass.
- Visual desktop/tablet/phone inspection and hands-on keyboard and screen-reader checks remain open because the in-app browser reported no available browser session on both review attempts. Static semantic, focus, contrast, touch-target, and reduced-motion checks are complete.

## Phase 2 — Strengthen Mori’s conversation behavior

**Goal:** Make local-model behavior consistent across longer and more difficult conversations.

- [x] Expand the communication suite beyond the current 11 scripted scenarios.
- [x] Run each scenario repeatedly to measure variation between generations.
- [x] Add multi-turn conversations lasting 10–15 minutes.
- [x] Test repetition without Mori mentioning that the person repeated themselves.
- [x] Test silence, short answers, interruptions, corrections, refusal, and changing topics.
- [x] Test sadness, loneliness, confusion, wanting to go home, and unverifiable beliefs.
- [x] Test urgent medical, abuse, and self-harm language through the deterministic safety layer.
- [x] Test factual grounding against approved, unverified, restricted, and expired memories.
- [x] Reduce generic, overly flowery, complex, or recall-demanding responses.
- [ ] Track response latency, malformed output, fallback frequency, memory use, and laptop temperature.

**Exit criteria**

- High-impact safety and dignity cases pass deterministically.
- Repeated evaluation runs meet an agreed pass threshold.
- Long sessions remain coherent and stay within the approved memory context.
- Response speed remains acceptable throughout a full session on the 8 GB M1 MacBook Air.

**Progress record — September 11, 2026**

- Expanded the live communication evaluation from 11 to 21 scenarios, adding loneliness, unexplained sadness, confusion, silence, short answers, unclear words, topic changes, approved-memory grounding, confirmed-photo context, and session closing.
- Added configurable repeated runs through `MORI_EVAL_RUNS`, per-scenario pass rates, fallback counts, and median, p95, and maximum latency.
- Added a separate 12-turn continuity evaluation that carries the conversation forward and checks topic changes, quiet-time requests, recall pressure, repetition language, response length, fallback use, and latency.
- Expanded the deterministic safety suite from 8 to 16 cases, including additional urgent medical, abuse, and general-distress language. All 16 cases pass.
- Ran three generations of all 21 communication scenarios. The initial baseline passed 54 of 63 (85.7%); after focused tuning, the final run passed 63 of 63 with no fallbacks. Model-generated turns had 3.75-second median, 4.55-second p95, and 4.82-second maximum latency.
- Added pre-generation guards for high-impact boundaries, a single retry for malformed structured output, approved-photo ID validation, and continuity repair for verbatim response repetition. Evaluation output distinguishes model generations from deterministic guard responses.
- The final 12-turn continuity session passed 12 of 12 checks. Model latency was 4.56 seconds median and 6.01 seconds p95; one malformed response was recovered by retry, producing a 9.58-second maximum.
- Removed memory-library dates from the model prompt because they describe when an item was added and could be mistaken for a date associated with the remembered event.
- Qwen was stopped after testing. The remaining Phase 2 measurement work is fallback/malformed-output tracking over more sessions and sustained-device temperature observation.

## Phase 3 — Validate speech and audio on target devices

**Goal:** Make voice interaction dependable for the people who will use Mori.

- [x] Choose the first supported browser and device combination.
- [ ] Test microphone permission, denial, loss, and reconnection.
- [ ] Test older voices, quiet speech, pauses, accents, and background noise.
- [ ] Test speech-recognition mistakes and safe correction behavior.
- [ ] Tune Mori’s speaking rate, pitch, voice, volume, and pause timing.
- [x] Prevent the microphone from transcribing Mori’s own spoken response.
- [x] Test interruption while Mori is speaking.
- [x] Test audio/photo/video playback interactions with listening and pause states.
- [ ] Validate Safari and iPad behavior if tablets are part of the pilot.
- [x] Provide typed interaction whenever speech is unavailable.

**Exit criteria**

- A complete voice session works on every supported device.
- Common microphone and speech errors recover without restarting the session.
- Mori does not talk over the participant or listen to its own voice.
- The participant always has a visible non-voice alternative.

**Progress record — September 11, 2026**

- Selected current iPadOS Safari on a recent iPad as the first supervised-pilot target; Chrome on the development Mac remains a secondary engineering target.
- Added a visible `Stop Mori speaking` control. Recognition stays off during speech synthesis and resumes after the participant interrupts Mori or speech finishes.
- Audio and video memories now suspend recognition only while media is playing and restore it after pause or completion without leaving the whole session paused.
- Added calm recovery messages for permission denial, missing audio capture, recognition-network interruption, unsupported speech recognition, and unrecognized speech. Typed input remains available.
- Documented the physical-device test matrix in `docs/SPEECH_AND_AUDIO.md`. Microphone quality, representative voices and accents, background noise, and Safari/iPad lifecycle behavior still require hands-on testing.

## Phase 4 — Choose and implement the model deployment architecture

**Goal:** Decide where Qwen runs when Mori is used beyond the development MacBook.

- [x] Define the expected pilot size, concurrent sessions, locations, and internet availability.
- [x] Compare a dedicated local Mori device, a private hosted model server, and managed Hugging Face inference.
- [x] Compare privacy, latency, reliability, maintenance, hardware, and monthly cost.
- [x] Decide whether Supabase data may be sent to a hosted inference service.
- [x] Document exactly which approved context is sent to the model.
- [x] Implement authentication and encrypted transport for any remote model server.
- [x] Add model health checks, startup readiness, timeouts, and safe fallback behavior.
- [x] Add version pinning and a controlled model-update process.
- [x] Load-test the chosen architecture at expected concurrency.

**Exit criteria**

- The deployment decision and data flow are documented and approved.
- Mori can reach the model reliably without depending on the developer’s laptop.
- Model failure never loses a session or exposes restricted memory context.
- Latency and operating cost meet the pilot target.

**Architecture record — September 11, 2026**

- Selected one dedicated Apple-silicon model host per active generated session for the first supervised pilot. The planning baseline is up to 10 enrolled participants and one concurrent generated turn per host.
- Kept participant inference local. Supabase context is not approved for transmission to a hosted model provider during the first pilot.
- Compared local, private-hosted, and managed Hugging Face options in `docs/MODEL_DEPLOYMENT_ARCHITECTURE.md`, including current official pricing references and promotion gates.
- Documented the bounded model data flow. Media bytes, credentials, contact details, unrelated notes, restricted memories, and expired memories are excluded.
- No remote inference server is selected, so remote authentication and TLS are not applicable to the pilot architecture. The local endpoint remains loopback-only.
- Added `npm run model:health` to verify the pinned model and local endpoint readiness. Existing request timeouts, schema fallback, single malformed-output retry, and calm participant recovery remain active.
- The model identifier and MLX dependencies are pinned. Model changes require the full Phase 2 evaluation before promotion.
- Phase 2 exercised the selected concurrency of one generated turn at a time. The final repeated suite passed 63 of 63 and the long session passed 12 of 12.

## Phase 5 — Complete privacy, security, and recovery operations

**Goal:** Make data handling operationally complete rather than UI-only.

- [ ] Implement and verify full account deletion across database rows and stored media.
- [x] Define retention periods for transcripts, observations, media, invitations, and audit records.
- [x] Add caregiver-visible consent withdrawal and data-removal controls.
- [ ] Verify that withdrawing sharing immediately blocks family access.
- [ ] Test database backups and perform a documented restore exercise.
- [ ] Test storage recovery and orphaned-file cleanup.
- [x] Define access-review, incident-response, breach-response, and privacy-request procedures.
- [ ] Commission an appropriate manual security review or penetration test.
- [x] Review logs to ensure secrets and sensitive memory text are not exposed.
- [x] Add dependency and secret-scanning checks to the development workflow.

**Exit criteria**

- A test account can be exported and completely deleted on request.
- A backup can be restored successfully using written instructions.
- Consent withdrawal and role revocation pass end-to-end tests.
- Material security findings are resolved or explicitly accepted before the pilot.

**Phase 5 implementation record (September 11, 2026)**

- Added an owner-only account-deletion endpoint and confirmation UI. It removes the owner's private media objects before deleting the Supabase Auth user so application rows cascade away.
- Added one-step withdrawal of all family sharing. It disables active memberships, cancels pending invitations, records withdrawal in pilot consent, and writes an audit event.
- Added the proposed retention migration and service-role-only purge routine. It has not been applied because retention periods require privacy/legal approval and a staging rehearsal first.
- Added `docs/PRIVACY_SECURITY_OPERATIONS.md` with deletion, restore, access-review, orphaned-media, incident, breach, and privacy-request procedures.
- Removed raw error-object logging from participant-facing session, storage, memory, and family paths.
- Added a repository secret scan to the pilot test suite and a high-severity dependency audit to continuous integration.
- Updated Next.js and React to supported patched releases; the final dependency audit reports zero known vulnerabilities.
- Replaced browser-local Supabase sessions with server-set `HttpOnly`, same-site authentication cookies, server refresh and logout routes, same-origin checks for mutations, and authenticated server-mediated media operations. Added API no-cache, CSP, HSTS, and a participant-facing cookie explanation.
- Added a guarded disposable-account staging drill that verifies immediate sharing withdrawal, orphan detection and removal, and full Auth/database/storage deletion. It refuses to run when dedicated staging settings or the exact destructive-test phrase are absent.
- Added a restore comparison command and `docs/pilot/STAGING_PRIVACY_EVIDENCE.md` for recording database counts, migrations, storage hashes, RLS checks, signed URLs, recovery time, and approvals.
- The unchecked items require a disposable staging project, a real backup/restore and storage drill, or an independent reviewer. They are pilot blockers rather than documentation-only tasks.

## Phase 6 — Prepare and conduct a supervised pilot

**Goal:** Evaluate usability and appropriateness with qualified oversight.

- [ ] Ask qualified dementia-care advisors to review prompts, safeguards, and evaluation cases.
- [x] Define participant inclusion, exclusion, consent, assent, and stopping rules.
- [x] Prepare caregiver instructions and participant-friendly explanations.
- [ ] Train supervisors on pause, stop, escalation, and incident procedures.
- [x] Define pilot measures without presenting heuristics as clinical outcomes.
- [ ] Run internal role-play sessions before involving participants.
- [ ] Begin with a very small number of supervised sessions.
- [ ] Record usability issues, safety events, refusals, fallbacks, and caregiver feedback.
- [ ] Review each pilot stage before expanding participation.

**Exit criteria**

- Advisors approve the supervised protocol and communication materials.
- Consent, assent, stopping, and incident procedures work in practice.
- Pilot findings support a documented decision to continue, revise, or stop.
- No claim of clinical effectiveness is made without suitable evidence.

**Phase 6 preparation record (September 11, 2026)**

- Prepared an advisor outreach list, review packet, and email template using publicly listed professional contacts.
- Prepared participant and caregiver explanations, including fresh assent, refusal, stopping, privacy choices, and human escalation.
- Defined feasibility, usability, safety, and technical measures without treating automated signals as clinical scores.
- Added a 12-scenario internal role-play rehearsal with pass conditions and corrective-action tracking.
- Advisor outreach, supervisor training, role-play execution, enrollment, and stage-gate review remain unchecked because they require real people and recorded evidence.

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

Provision the dedicated pilot model host, repeat `npm run model:health` and the Phase 2 suites on that host, and record its sustained-load temperature before treating Phase 4 as operationally complete.
