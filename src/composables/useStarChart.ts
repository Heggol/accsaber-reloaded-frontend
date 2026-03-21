import type { MilestoneCompletionResponse, MilestoneSetResponse } from '@/types/api/milestones'
import { hashString, seededRandom } from '@/utils/constants'
import type { Ref } from 'vue'

export { hashString, seededRandom }

export interface Position {
  x: number
  y: number
}

export interface SetNodeLayout {
  id: string
  set: MilestoneSetResponse
  position: Position
  milestoneCount: number
  completionPercentage: number
}

export interface StarLayout {
  milestone: MilestoneCompletionResponse
  position: Position
}

export interface Highway {
  from: Position
  to: Position
  opacity: number
}

export function computeGridPosition(
  index: number,
  totalCount: number,
  width: number,
  height: number,
  jitterSeed: number,
): Position {
  if (totalCount <= 0) return { x: width / 2, y: height / 2 }
  const cols = Math.ceil(Math.sqrt(totalCount))
  const rows = Math.ceil(totalCount / cols)
  const cellW = width / cols
  const cellH = height / rows
  const col = index % cols
  const row = Math.floor(index / cols)

  return {
    x: cellW * (col + 0.5) + seededRandom(jitterSeed) * 40 - 20,
    y: cellH * (row + 0.5) + seededRandom(jitterSeed + 1) * 40 - 20,
  }
}

export function useStarChart(
  sets: Ref<MilestoneSetResponse[]>,
  milestonesBySet: Ref<Map<string, MilestoneCompletionResponse[]>>,
) {
  function computeSetPositions(containerWidth: number, containerHeight: number): SetNodeLayout[] {
    const count = sets.value.length
    if (count === 0) return []

    return sets.value.map((set, i) => {
      const milestones = milestonesBySet.value.get(set.id) ?? []
      const completedCount = milestones.filter((m) => m.userCompleted === true).length
      const completionPct = milestones.length > 0
        ? (completedCount / milestones.length) * 100
        : 0

      return {
        id: set.id,
        set,
        position: computeGridPosition(i, count, containerWidth, containerHeight, hashString(set.id)),
        milestoneCount: milestones.length,
        completionPercentage: set.userCompletionPercentage ?? completionPct,
      }
    })
  }

  function computeHighways(nodes: SetNodeLayout[]): Highway[] {
    if (nodes.length < 2) return []

    const highways: Highway[] = []
    const connected = new Set<string>()

    for (const node of nodes) {
      const distances = nodes
        .filter((n) => n.id !== node.id)
        .map((n) => ({
          neighbor: n,
          dist: Math.sqrt(
            (n.position.x - node.position.x) ** 2 +
            (n.position.y - node.position.y) ** 2,
          ),
        }))
        .sort((a, b) => a.dist - b.dist)

      const maxConnections = Math.min(3, distances.length)
      let connectionCount = 0
      const maxDist = Math.max(...distances.map((d) => d.dist), 1)

      for (const { neighbor, dist } of distances) {
        if (connectionCount >= maxConnections) break

        const key = [node.id, neighbor.id].sort().join('-')
        if (connected.has(key)) {
          connectionCount++
          continue
        }

        connected.add(key)
        connectionCount++

        highways.push({
          from: node.position,
          to: neighbor.position,
          opacity: Math.max(0.08, 0.3 - (dist / maxDist) * 0.25),
        })
      }
    }

    return highways
  }

  return { computeSetPositions, computeHighways }
}
