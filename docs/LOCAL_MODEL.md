# Mori local model

The local conversation provider targets `mlx-community/Qwen3.5-2B-4bit` on an 8 GB Apple silicon Mac. MLX runs a loopback-only server. Supabase still stores account data online; browser speech services are separate from this text model.

Runtime dependencies are isolated in `.venv-mori` and pinned in `scripts/local-model-requirements.txt`. Model downloads go in `.local-models`. Both folders are ignored by Git.

After runtime approval and validation, configure these server-only settings in `.env.local`:

```
MORI_AI_PROVIDER=local
MORI_LOCAL_URL=http://127.0.0.1:8080
MORI_LOCAL_MODEL=mlx-community/Qwen3.5-2B-4bit
```

`npm run model:start` starts the model server and downloads missing weights. Restart Mori after changing its environment. Keep the model process running during sessions. The launcher uses one concurrent generation, a 256-token prefill step, one cached prompt, and a 256 MB prompt-cache budget. These settings reduce memory pressure but do not guarantee a total memory ceiling.

Local mode never falls back to a cloud model. If the local server fails, Mori uses its existing safe fallback response. Output still passes the existing response validator and backend memory restrictions. Requests disable thinking, cap output at 220 tokens, and time out after 40 seconds. The system instructions are included only once in local requests.

## Communication evaluation

Run the local behavioral suite while the model server is active:

```
npm run test:communication
```

The suite checks recall difficulty, unverifiable whereabouts, wanting to go home, mixed health signals, declining conversation, AI identity disclosure, photograph identity, dignified language, repeated questions, corrections, and memory refusal. It rejects common harmful phrases, requires an appropriate supportive element, limits each response to one question, and reports generation latency and the complete structured response.

The first baseline passed 6 of 8 checks. It pressed for a specific memory after “I can't remember” and stated that an unverified person was waiting outside. The photograph case also exposed an assumption that the named person appeared in the image. Mori now applies narrow deterministic communication guards after generation for these high-impact boundaries. The expanded suite passes 11 of 11 checks, with observed local responses taking roughly 4–8 seconds each.

Status: local mode is configured. The 1.75 GB model was downloaded and loaded successfully on the M1 MacBook Air. Direct generation, the full connected-life workflow, and the communication suite pass. This is engineering verification from scripted examples, not evidence of clinical safety or effectiveness. Before a participant pilot, the suite should be reviewed by qualified dementia-care advisors and expanded with repeated runs, longer conversations, accent/language testing, adversarial phrasing, and supervised usability testing. The model and Mori preview are currently stopped and can be started when needed.
