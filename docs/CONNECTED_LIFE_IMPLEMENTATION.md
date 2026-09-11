# Connected-life implementation

Implemented on 8 September 2026 against the master product brief. This is a working implementation with explicit limits, not a claim that every research ambition is complete.

## Family workflow

- Profile and progressive setup: preferred name, life context, languages, communication, session duration, topics to avoid, and permissions.
- Persistent people, aliases and relationships; albums with multiple membership per memory.
- Bulk photo/audio/video upload and written memories; editable dates, locations, family context, people, albums, topics, certainty and source.
- Per-memory review, preferred, safe, neutral, sensitive, avoid and temporary restrictions.
- Life Map with decade grouping and person filtering.
- Caregiver notes with expiry, durable per-memory feedback, exact-excerpt story candidates and explicit confirm/edit/dismiss.
- Family invitations with hashed, expiring, single-use codes; viewer/contributor/caregiver roles and workspace switching.
- Caregiver session plans across accessible workspaces. Plans are manual coordination; no reminder messages or automatic session starts.
- Downloadable JSON archive and data-request submission. Full deletion requests require operational handling; they do not silently erase the account.

## Session workflow

The server authenticates the acting person and checks workspace membership. Real sessions require profile permission and transcript storage permission. If pilot consent exists, its current assent, consent, expiry and transcript settings are checked too.

Every turn rechecks memory eligibility and current distress. A separate deterministic safety controller surrounds scoring. Context contains an approved bounded memory set, safe recent conversation, confirmed stories and current notes. Unverified memory descriptions are withheld from factual model context. The output is checked against forbidden topics/titles and the server controls the selected media ID.

Observations, learned reinforcement/decay state, inferred graph links and selection decisions persist in Supabase. Graph links derive from family-tagged people, places and topics. Ranking includes a bounded learned-state adjustment and graph affinity. The graph candidate pass is capped at 200 recent memories and 2,000 links; all loaded memories are still evaluated for eligibility.

Database leases serialize turns and session closure across workers. Sessions, turns and summaries are saved. Photo/audio/video playback, voice on/off, pause, finish, typed input and transcript disclosure are available in the patient view. Voice input and output use browser speech services; target-device voice behavior still needs hands-on validation.

## What is deliberately uncertain

Recognition, engagement, confusion and distress inferred from text are heuristics, not clinical measurements. Elapsed turn time includes playback and silence. Insights describe counts and observations rather than presenting precise cognitive percentages.

New stories are exact patient utterance excerpts, not verified historical facts. Text-based AI context suggestions are optional and require family review. There is no automatic face identification, image understanding pipeline or semantic vector index. The avatar is a static companion image, without lip synchronization. Multilingual settings and model context exist; per-language conversational and safety evaluation remains necessary.

The care workspace supports multiple separately authorized accounts. A complete care-facility organization model, resident provisioning, staffing roster, billing and operational notification service are not implemented.

## Database and configuration

Eight migrations are tracked in `mori_schema_migrations`. They were applied to the configured Supabase project during this implementation. Future additive migrations can use `npm run db:migrate`; `npm run db:status` prints table names without secrets. The runner intentionally refuses to guess the baseline of an existing untracked Mori schema.

Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and either `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. `DATABASE_URL` is only needed for migrations. Live generation can use Mori's loopback-only local MLX provider or a configured cloud provider. Never prefix privileged keys or the database URL with `NEXT_PUBLIC_`.

## Verification

- `npm run build`: production compilation and page generation passed.
- `npm run test:pilot`: TypeScript, engine/safety checks, security contracts covering 14 authenticated API routes, and new life-policy tests.
- `npm run test:workflow`: fictional-demo API integration against `MORI_TEST_URL` (defaults to port 3010).
- `tests/life-rls.sql`: disposable-database checks of owner, stranger, contributor, caregiver, revocation, single-use invitations and pilot-sharing refusal. Fixtures roll back.
- Production-server API and real Supabase regressions also passed after the final integration changes. A real Supabase test created temporary fictional accounts, exercised profile/people/memory creation, invitations, RLS, contributor limits, sessions, persisted observations and learned state, story candidates, summaries and revocation; accounts were deleted afterward.
- Isolated Chrome tested profile/person/memory creation, Life Map rendering, phone-width overflow, workspace pages, typed session and closure. Desktop/phone/tablet screenshots were inspected.

The local `mlx-community/Qwen3.5-2B-4bit` provider was downloaded and successfully tested on the 8 GB M1 MacBook Air. Direct generation, the connected-life workflow, and the 11-scenario communication evaluation passed. OpenAI and Gemini remain unconfigured alternatives and are not used when `MORI_AI_PROVIDER=local`.

Remaining release work includes microphone/TTS testing on actual target tablets, supervised scenario evaluation, provider/factual-grounding evaluation, deployment verification, backup restore and operational completion of privacy requests and incident responses. See the existing pilot documents for the separate supervised-pilot process.
