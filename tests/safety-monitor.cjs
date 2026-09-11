const assert = require('node:assert/strict')
const { SafetyMonitor } = require('/tmp/mori-safety-test/safety-monitor.js')

const monitor = new SafetyMonitor()
const scenarios = [
  ['I have chest pain and trouble breathing', 'urgent_medical_concern', 'high'],
  ['My face is drooping and my speech is slurred', 'urgent_medical_concern', 'high'],
  ['I want to kill myself', 'self_harm_ideation', 'high'],
  ['He hit me and I am afraid', 'abuse_concern', 'high'],
  ["I'm having a panic attack", 'panic', 'medium'],
  ['I feel sad and lonely today', 'general_distress', 'medium'],
  ['I remember reading Heidi with my mother', 'none', 'low'],
  ["I don't recognize this photograph", 'none', 'low'],
]

for (const [message, flag, risk] of scenarios) {
  const result = monitor.checkSafety(message)
  assert.equal(result.riskLevel, risk, message)
  assert.equal(result.flags[0] || 'none', flag, message)
}
assert.equal(monitor.getSafetyResponse('high', ['urgent_medical_concern']).show_photo, false)
assert.equal(monitor.getSafetyResponse('high', ['self_harm_ideation']).emotional_state, 'distressed')
console.log(`Safety monitor checks passed (${scenarios.length} scenarios)`)
