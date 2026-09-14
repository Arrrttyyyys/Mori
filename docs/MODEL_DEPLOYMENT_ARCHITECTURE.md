# Mori model deployment architecture

## Pilot decision

Use one dedicated Apple-silicon Mori host at the pilot site, running the pinned `mlx-community/Qwen3.5-2B-4bit` model through MLX. Support one active generated turn at a time. The model endpoint stays on loopback and is never exposed directly to participant devices.

Planning assumption: up to 10 enrolled participants, no more than two scheduled sessions at once, and one supervised voice session per model host. Add a second host before allowing two simultaneous generated turns. Revise this assumption when an actual site and schedule are selected.

## Options considered

### Dedicated local host — selected for the first pilot

- Keeps approved prompt context at the site.
- Uses the Qwen/MLX configuration measured on the 8 GB M1 MacBook Air.
- Avoids an external inference vendor and keeps predictable latency.
- Each host supports one generation at a time and requires local startup, monitoring, updates, and recovery.

### Private hosted model server — later scale option

- Supports centralized operations and more concurrency with suitable GPU capacity.
- Requires TLS, service authentication, network isolation, monitoring, and privacy/vendor review.
- Cost depends on reserved GPU size and uptime. This becomes reasonable when several sites need concurrent sessions.

### Managed Hugging Face inference — evaluation option

- Hugging Face Inference Providers offers routed, pay-as-you-go access to third-party providers. Availability and pricing vary by model and provider.
- Dedicated Inference Endpoints are billed by selected hardware and replicas, calculated by the minute while deployed resources initialize or run.
- As of September 11, 2026, Hugging Face lists a single AWS T4 endpoint at $0.50/hour (about $365 for 730 continuously running hours) and an AWS L4 at $0.80/hour (about $584 for 730 hours), before scale-out. Scale-to-zero can reduce idle compute charges but adds cold-start behavior that must be tested.
- Participant use requires a compatible model, regional and retention review, contractual approval, a server-only scoped token, spending limits, and explicit approval to send participant context outside the site.

Current references: [Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing), [Inference Endpoints pricing](https://huggingface.co/docs/inference-endpoints/pricing), and [endpoint access requirements](https://huggingface.co/docs/inference-endpoints/guides/access).

## Approved data flow

Supabase supplies only consent-allowed context to the Mori server. Policy code removes restricted or expired memories and bounds recent turns. The model receives text instructions, recent safe turns, approved memory titles, confirmed photo metadata, and the family-approved session plan. It receives no media bytes, passwords, access tokens, email addresses, unrelated family notes, or Supabase credentials. Output passes schema validation, communication guards, media-ID grounding, and the safety monitor before storage or display.

## Operations

- Start: `npm run model:start`
- Readiness: `npm run model:health`
- Stop: `pkill -f "mlx_lm.server"`
- Verify stopped: `lsof -nP -iTCP:8080 -sTCP:LISTEN`

The launcher binds to `127.0.0.1`, allows one decode and prompt at a time, disables model thinking, caps output at 220 tokens, and pins the model identifier. Runtime packages are pinned in `scripts/local-model-requirements.txt`. Any model change requires the full Phase 2 evaluation.

## Promotion gates

Do not move to hosted inference until concurrency exceeds a dedicated host or multi-site operations require it. Promotion requires privacy/vendor approval, authenticated encrypted transport, staging evaluation, failure testing, representative load testing, cost limits, and rollback to the last pinned model.
