# Technical Invention Disclosure: Adaptive Reminiscence Stimulus Selection

> Draft for discussion with a registered patent attorney or agent. This is not
> a patentability opinion, legal advice, or a filing-ready application. A prior-art
> search and inventorship review are still required.

## 1. Working title

**Safety-Constrained Adaptive Reminiscence Stimulus Selection Using Longitudinal Response Signals and Patient-Specific Memory Graphs**

## 2. Technical field

The disclosure concerns computer-implemented selection and sequencing of multimedia
and conversational stimuli. More particularly, it concerns state-dependent selection
of patient-specific reminiscence stimuli using longitudinal interaction signals, graph
relationships, and a deterministic safety controller external to a generative model.

## 3. Technical problem

Conventional conversational retrieval systems generally rank content according to
semantic similarity between a current utterance and stored content. That approach can
retrieve a semantically relevant memory that is unsuitable in the person's present
emotional or cognitive context. A generative model may also inconsistently follow a
prompt-based instruction to avoid distressing content.

The technical problem is therefore to select a contextually continuous stimulus while:

1. incorporating time-varying, patient-specific response history;
2. traversing relationships beyond direct semantic similarity;
3. controlling repetition and uncertainty;
4. suppressing paths associated with distress or confusion;
5. adapting the presentation strategy without diagnosing or testing the patient; and
6. enforcing safety outside the probabilistic language model.

## 4. System overview

The system includes:

1. a patient context store;
2. a multimedia stimulus store;
3. a patient-specific memory graph;
4. a longitudinal stimulus-state store;
5. a conversation-state estimator;
6. a candidate-generation and graph-traversal engine;
7. a dynamic stimulus scoring engine;
8. a deterministic memory safety controller;
9. a response-generation component; and
10. an observation processor that updates future selection state.

The language model may propose wording or a candidate stimulus. It does not have final
authority to expose a stimulus. The safety controller evaluates the proposed stimulus,
selects a lower-risk substitute, or suppresses retrieval and directs the system toward
present-focused reassurance.

## 5. Dynamic stimulus state

Each memory, person, place, topic, photograph, video, or other stimulus has a dynamic
state rather than a single static embedding. Example state variables include:

- recognition strength;
- engagement strength;
- positive-affect strength;
- confusion risk;
- distress risk;
- exposure count and recent exposure;
- caregiver preference;
- patient consent state;
- relationship relevance;
- confidence and last-observation time.

After an interaction, bounded observations update the state using time decay and an
evidence weight. A simplified implementation is:

`new_state = retained_prior × (1 - evidence_weight) + observation × evidence_weight`

where retained prior state decreases according to elapsed time. Evidence weight can
increase with sustained voluntary engagement. Missing recognition evidence does not
become a negative recognition event.

## 6. Context-dependent utility

For candidate stimulus `m`, patient profile `p`, and current session state `s`, the
engine computes a bounded utility from positive and negative terms:

`U(m,p,s) = familiarity + engagement + emotional_safety + caregiver_signal + present_state_fit + controlled_novelty - distress_risk - confusion_risk - repetition - uncertainty`

Weights may be fixed, configured by a care organization, or learned within safety
bounds. Consent blocks and recent high-distress observations are hard exclusions rather
than merely negative score components.

The same stimulus can therefore be selected in a calm, engaged state but suppressed
during acute distress or confusion.

## 7. Safety-constrained memory graph

Stimuli are nodes in a patient-specific graph. Edges represent relationships such as:

- a person appearing in a photograph;
- an event occurring at a place;
- two memories sharing a person, era, activity, or object;
- a memory that voluntarily followed another topic during a prior conversation; or
- a caregiver-confirmed association.

Each edge can store affinity, recognition, distress, confidence, and recency values.
Graph traversal multiplies or otherwise aggregates edge suitability across a bounded
path. Candidate paths are then combined with node-level stimulus utility.

A path with strong semantic or personal affinity can still be excluded when an edge or
terminal node exceeds a distress threshold. This allows the controller to avoid a
high-risk path and select a safer adjacent path.

## 8. Memory bridges

The bridge engine extracts or receives entities from the current conversation and finds
seed nodes in the patient graph. It traverses a bounded number of edges to locate a
personally connected stimulus that ordinary similarity retrieval may miss.

Example:

`cars → Ford Mustang → college → David → graduation photograph`

Each candidate bridge records its complete path and relationship types. The final rank
combines graph-path suitability with stimulus utility, giving the system an auditable
reason for the transition.

## 9. Adaptive introduction strategy

Longitudinal state changes how a stimulus is introduced:

1. **Open introduction** — used when recognition is strong and confidence is adequate;
   the system may ask an open, non-testing preference or sensory question.
2. **Supported introduction** — used at intermediate recognition; the system supplies a
   caregiver-confirmed fact and asks a simple question.
3. **Descriptive introduction** — used when recognition is low or uncertain; the system
   neutrally describes visible content without claiming a relationship or requiring recall.

The system does not tell the person that recognition has declined and does not use the
model to diagnose cognitive change.

## 10. Observation and feedback update

Following exposure, the system records interaction-level signals such as response
latency, response duration, voluntary continuation, speech energy, expressed affect,
confusion language, distress language, topic duration, and caregiver assessment.

Signals are stored with evidence and confidence. They remain time-bounded observations,
not permanent patient attributes. A caregiver can mark a stimulus helpful, neutral, or
to be avoided. Patient refusal always overrides caregiver preference.

## 11. Example control sequence

1. Receive a current utterance and conversation state.
2. Extract entities or select graph seed nodes.
3. Generate candidate graph paths of bounded length.
4. Read longitudinal state for each terminal stimulus.
5. calculate node utility and graph-path utility.
6. remove stimuli blocked by consent or recent high distress.
7. rank remaining stimuli.
8. receive an optional generative-model proposal.
9. independently evaluate that proposal in the safety controller.
10. allow, substitute, or suppress the proposal.
11. generate one low-load conversational invitation for the authorized stimulus.
12. measure response signals and update the longitudinal state and graph edges.

## 12. Alternative embodiments

- The response generator may be template-based rather than generative.
- Signals may be obtained from text only, audio features, video features with explicit
  consent, caregiver input, or combinations thereof.
- Scoring may use rules, constrained machine learning, Bayesian updating, contextual
  bandits, or calibrated ensembles.
- Graph edges may be manually curated, inferred, or both, with inferred edges requiring
  human confirmation above a sensitivity threshold.
- The engine may operate during a session, between sessions, or in a caregiver planning
  interface.
- The system may select activities, music, objects, questions, or environmental cues in
  addition to photos and autobiographical memories.

## 13. Candidate inventive concepts for counsel

### Concept A: state-dependent stimulus utility

A computer-implemented method that maintains a time-varying state for each patient-
specific stimulus, combines that state with current conversation state, and selects a
stimulus using both expected engagement and safety penalties.

### Concept B: independent generative-output safety controller

A system in which a generative model proposes a reminiscence stimulus, while a separate
deterministic controller evaluates a patient-specific safety graph and causes the system
to allow, substitute, or suppress the proposal.

### Concept C: safety-weighted personal graph traversal

A method that traverses a patient-specific semantic, temporal, and relational graph,
propagates affinity and safety values along candidate paths, and selects a terminal
multimedia stimulus based on combined path and node utility.

### Concept D: longitudinally adaptive presentation mode

A method that changes from open to supported to descriptive introduction based on a
decayed longitudinal stimulus state, without presenting a memory test to the person.

## 14. Illustrative independent claim skeleton

1. A computer-implemented method comprising:
   - maintaining, for a plurality of patient-specific stimuli, respective dynamic state
     records containing at least an engagement value, a recognition value, and a distress
     value;
   - receiving a current conversation state;
   - identifying candidate paths through a patient-specific graph whose nodes represent
     the stimuli and whose edges represent personal relationships;
   - computing, for terminal stimuli of the candidate paths, respective utilities using
     the dynamic state records, the current conversation state, and safety values of the
     candidate paths;
   - receiving a proposed stimulus from a probabilistic response generator;
   - evaluating the proposed stimulus in a safety controller separate from the
     probabilistic response generator;
   - causing the proposed stimulus to be presented, substituted, or suppressed according
     to the evaluation;
   - obtaining response signals following presentation; and
   - updating at least one dynamic state record using the response signals.

Dependent claims could address consent gates, time decay, caregiver assessments,
bounded traversal, substitution, controlled novelty, presentation modes, confidence,
and explicit non-update when recognition evidence is absent.

## 15. Figures to prepare

1. Overall feedback-loop architecture.
2. Patient-specific memory graph with safety-valued edges.
3. Candidate generation, scoring, safety decision, and substitution sequence.
4. Longitudinal stimulus-state update over multiple sessions.
5. Open, supported, and descriptive introduction modes.
6. Example memory bridge traversal.

## 16. Evidence and implementation support

Repository implementations supporting this disclosure include:

- `lib/memory-engine/stimulus-scoring-engine.ts`
- `lib/memory-engine/memory-safety-controller.ts`
- `lib/memory-engine/memory-bridge-engine.ts`
- `lib/memory-engine/longitudinal-memory-model.ts`
- `supabase/migrations/202608220002_adaptive_memory_engine.sql`

## 17. Work still required before filing

1. Identify every human inventor who contributed to each claimed concept.
2. Record conception dates and preserve dated technical materials.
3. Conduct professional patent and non-patent prior-art searches.
4. Decide whether any public disclosure, demo, sale, or publication has occurred.
5. Add complete drawings and implementation variations before filing; new matter cannot
   simply be added later while retaining the original filing date.
6. Have registered patent counsel determine claim scope, eligibility, novelty,
   non-obviousness, enablement, and filing jurisdictions.
