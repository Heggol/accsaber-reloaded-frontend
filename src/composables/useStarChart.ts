import type { MilestoneCompletionResponse, MilestoneSetResponse } from '@/types/api/milestones'
import type { CrossSetEdge } from '@/types/milestones'
import { hashString, seededRandom } from '@/utils/constants'
import type { Ref } from 'vue'

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

function scatterPosition(
  index: number,
  totalCount: number,
  width: number,
  height: number,
  seed: number,
): Position {
  if (totalCount <= 0) return { x: width / 2, y: height / 2 }

  const padX = width * 0.1
  const padY = height * 0.15
  const usableW = width - padX * 2
  const usableH = height - padY * 2

  const r1 = seededRandom(seed)
  const r2 = seededRandom(seed + 1)
  const r3 = seededRandom(seed + 5)

  const xBase = totalCount <= 1 ? width / 2 : padX + (index / (totalCount - 1)) * usableW
  const xJitter = (r1 - 0.5) * (usableW / totalCount) * 0.4
  const yBase = padY + usableH * 0.5
  const yOffset = (r2 - 0.5) * usableH * 0.8
  const yWobble = (r3 - 0.5) * 30

  return {
    x: Math.max(padX, Math.min(width - padX, xBase + xJitter)),
    y: Math.max(padY, Math.min(height - padY, yBase + yOffset + yWobble)),
  }
}

export { scatterPosition }

export function useStarChart(
  sets: Ref<MilestoneSetResponse[]>,
  milestonesBySet: Ref<Map<string, MilestoneCompletionResponse[]>>,
) {
  function computeSetPositions(containerWidth: number, containerHeight: number, lockedCount = 0): SetNodeLayout[] {
    if (sets.value.length === 0) return []

    const sorted = [...sets.value].sort((a, b) => a.title.localeCompare(b.title))
    const totalCount = sorted.length + lockedCount

    return sorted.map((set, i) => {
      const milestones = milestonesBySet.value.get(set.id) ?? []
      const completedCount = milestones.filter((m) => m.userCompleted === true).length
      const completionPct = milestones.length > 0
        ? (completedCount / milestones.length) * 100
        : 0

      return {
        id: set.id,
        set,
        position: scatterPosition(i, totalCount, containerWidth, containerHeight, hashString(set.id)),
        milestoneCount: milestones.length,
        completionPercentage: set.userCompletionPercentage ?? completionPct,
      }
    })
  }

  function computeHighways(nodes: SetNodeLayout[], crossSetEdges?: CrossSetEdge[]): Highway[] {
    if (nodes.length < 2) return []

    const nodeMap = new Map<string, SetNodeLayout>()
    for (const n of nodes) nodeMap.set(n.id, n)

    const highways: Highway[] = []
    const connected = new Set<string>()

    if (crossSetEdges && crossSetEdges.length > 0) {
      for (const edge of crossSetEdges) {
        const from = nodeMap.get(edge.fromSetId)
        const to = nodeMap.get(edge.toSetId)
        if (!from || !to) continue

        const key = [edge.fromSetId, edge.toSetId].sort().join('-')
        if (connected.has(key)) continue
        connected.add(key)

        highways.push({
          from: from.position,
          to: to.position,
          opacity: Math.min(0.6, 0.3 + edge.count * 0.08),
        })
      }
    }

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
          opacity: Math.max(0.15, 0.35 - (dist / maxDist) * 0.2),
        })
      }
    }

    return highways
  }

  return { computeSetPositions, computeHighways }
}
