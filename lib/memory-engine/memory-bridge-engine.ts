import { ConversationState, MemoryBridge, MemoryGraph, StimulusObservation } from './types'
import { StimulusScoringEngine } from './stimulus-scoring-engine'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export class MemoryBridgeEngine {
  constructor(private readonly scoring = new StimulusScoringEngine()) {}

  findBridges(
    seedTerms: string[],
    graph: MemoryGraph,
    observations: StimulusObservation[],
    state: ConversationState,
    maxDepth = 3
  ): MemoryBridge[] {
    const normalizedTerms = seedTerms.map((term) => term.toLowerCase().trim()).filter(Boolean)
    const seeds = graph.stimuli.filter((stimulus) => {
      const searchable = [stimulus.title, ...(stimulus.tags ?? [])].join(' ').toLowerCase()
      return normalizedTerms.some((term) => searchable.includes(term))
    })
    const stimuliById = new Map(graph.stimuli.map((stimulus) => [stimulus.id, stimulus]))
    const queue = seeds.map((stimulus) => ({ id: stimulus.id, path: [stimulus.id], relationships: [] as MemoryBridge['relationships'], score: 1 }))
    const bestPathScore = new Map<string, number>()
    const bridges: MemoryBridge[] = []

    while (queue.length) {
      const current = queue.shift()!
      if (current.path.length > maxDepth + 1) continue

      for (const edge of graph.edges.filter((item) => item.sourceId === current.id || item.targetId === current.id)) {
        const nextId = edge.sourceId === current.id ? edge.targetId : edge.sourceId
        if (current.path.includes(nextId)) continue
        const next = stimuliById.get(nextId)
        if (!next) continue

        const edgeSafety = 1 - clamp(edge.distress)
        const edgeScore = clamp(
          edge.affinity * 0.3 + edge.recognition * 0.2 + edge.confidence * 0.2 + edgeSafety * 0.3
        )
        const pathScore = current.score * edgeScore * 0.92
        if (pathScore <= (bestPathScore.get(nextId) ?? 0)) continue
        bestPathScore.set(nextId, pathScore)

        const scored = this.scoring.score(next, observations, state)
        const path = [...current.path, nextId]
        const relationships = [...current.relationships, edge.relationship]
        bridges.push({ stimulus: next, path, relationships, graphScore: pathScore, stimulusScore: scored })
        queue.push({ id: nextId, path, relationships, score: pathScore })
      }
    }

    return bridges
      .filter((bridge) => bridge.stimulusScore.eligible)
      .sort((left, right) =>
        (right.graphScore * 0.45 + right.stimulusScore.score * 0.55) -
        (left.graphScore * 0.45 + left.stimulusScore.score * 0.55)
      )
  }
}
