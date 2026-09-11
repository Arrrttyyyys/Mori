const assert = require('node:assert/strict')
const {
  LongitudinalMemoryModel,
  MemoryBridgeEngine,
  MemorySafetyController,
  StimulusScoringEngine,
} = require('/tmp/mori-engine-test/index.js')

const now = new Date()
const safe = {
  id: 'garden', kind: 'photo', title: 'Family garden', tags: ['comforting'],
  caregiverPriority: 0.8, consentStatus: 'allowed', createdAt: now,
}
const risky = {
  id: 'hospital', kind: 'memory', title: 'Hospital stay',
  caregiverPriority: 0.4, consentStatus: 'allowed', createdAt: now,
}
const observations = [
  { stimulusId: 'hospital', observedAt: now, engagement: 0.2, recognition: 0.5, emotionalValence: -0.8, confusion: 0.7, distress: 0.9, durationSeconds: 8 },
  { stimulusId: 'garden', observedAt: now, engagement: 0.9, recognition: 0.8, emotionalValence: 0.8, confusion: 0.1, distress: 0.05, durationSeconds: 70, caregiverAssessment: 'helpful' },
]
const distressedState = {
  recentStimulusIds: [], sessionStartedAt: now, turnCount: 2,
  engagement: 0.4, confusion: 0.75, distress: 0.72, emotionalValence: -0.4,
}

const scoring = new StimulusScoringEngine()
const ranked = scoring.select([risky, safe], observations, distressedState).ranked
const decision = new MemorySafetyController().evaluate(
  ranked.find((item) => item.stimulus.id === 'hospital'), ranked, distressedState
)
assert.equal(decision.action, 'substitute')
assert.equal(decision.selectedStimulusId, 'garden')

const graphStimuli = [
  { ...safe, id: 'cars', title: 'Cars', tags: ['cars'] },
  { ...safe, id: 'college', title: 'College' },
  { ...safe, id: 'david', title: 'David' },
  { ...safe, id: 'graduation', title: 'Graduation photo' },
]
const edge = (sourceId, targetId, relationship) => ({
  sourceId, targetId, relationship, affinity: 0.9, recognition: 0.8,
  distress: 0.05, confidence: 0.9, lastObservedAt: now,
})
const bridges = new MemoryBridgeEngine().findBridges(
  ['cars'],
  { stimuli: graphStimuli, edges: [edge('cars', 'college', 'related_to'), edge('college', 'david', 'person_in'), edge('david', 'graduation', 'reminds_of')] },
  [],
  { ...distressedState, confusion: 0.1, distress: 0.1 }
)
assert.ok(bridges.some((item) => item.stimulus.id === 'graduation'))

const state = new LongitudinalMemoryModel().update(null, observations[1])
assert.equal(state.exposureCount, 1)
assert.equal(new LongitudinalMemoryModel().introductionStyle(state), 'supported')

console.log('Memory engine checks passed')
