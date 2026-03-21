<script setup lang="ts">
import { usePanZoom } from '@/composables/usePanZoom'
import type { StarLayout } from '@/composables/useStarChart'
import type { MilestoneCompletionResponse, MilestoneSetResponse, PrerequisiteLinkResponse } from '@/types/api/milestones'
import { hashString, seededRandom, TIER_ORDER } from '@/utils/constants'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import MilestoneDetail from './MilestoneDetail.vue'
import MilestoneListView from './MilestoneListView.vue'
import StarNode from './StarNode.vue'

const props = defineProps<{
  set: MilestoneSetResponse
  milestones: MilestoneCompletionResponse[]
  prerequisites: PrerequisiteLinkResponse[]
  loggedIn?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

const constellationRef = ref<HTMLElement | null>(null)
const { scale, transformStyle, reset: resetZoom, setTransform } = usePanZoom(constellationRef, { minZoom: 0.5, maxZoom: 5 })
const pinnedMilestone = ref<MilestoneCompletionResponse | null>(null)
const hoveredMilestone = ref<MilestoneCompletionResponse | null>(null)
const previewMilestone = computed(() => hoveredMilestone.value ?? pinnedMilestone.value)

const sortedMilestones = computed(() =>
  [...props.milestones].sort((a, b) => (TIER_ORDER[a.tier] ?? 0) - (TIER_ORDER[b.tier] ?? 0)),
)

const completedCount = computed(() =>
  props.milestones.filter((m) => m.userCompleted).length,
)

const isSetComplete = computed(() =>
  props.milestones.length > 0 && completedCount.value === props.milestones.length,
)

const starPositions = computed<StarLayout[]>(() => {
  const sorted = sortedMilestones.value
  if (sorted.length === 0) return []

  if (props.prerequisites.length === 0) {
    const baseRadius = Math.min(35, 15 + sorted.length * 2)
    return sorted.map((m, i) => {
      const angle = (2 * Math.PI * i) / sorted.length - Math.PI / 2
      const r = baseRadius + seededRandom(hashString(m.milestoneId)) * 8 - 4
      return {
        milestone: m,
        position: {
          x: 50 + r * Math.cos(angle),
          y: 50 + r * Math.sin(angle),
        },
      }
    })
  }

  const prereqMap = new Map<string, string[]>()
  for (const p of props.prerequisites) {
    if (!prereqMap.has(p.milestoneId)) prereqMap.set(p.milestoneId, [])
    prereqMap.get(p.milestoneId)!.push(p.prerequisiteMilestoneId)
  }

  const depths = new Map<string, number>()
  function getDepth(id: string, visited: Set<string> = new Set()): number {
    if (visited.has(id)) return 0
    visited.add(id)
    if (depths.has(id)) return depths.get(id)!
    const prereqs = prereqMap.get(id) ?? []
    const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map((pid) => getDepth(pid, visited)))
    depths.set(id, d)
    return d
  }
  for (const m of sorted) getDepth(m.milestoneId)

  const maxDepth = Math.max(...depths.values(), 0)
  const byDepth = new Map<number, MilestoneCompletionResponse[]>()
  for (const m of sorted) {
    const d = depths.get(m.milestoneId) ?? 0
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(m)
  }

  const padding = 12
  const xRange = 100 - padding * 2
  const yRange = 100 - padding * 2

  const positions = new Map<string, { x: number; y: number }>()

  for (const m of sorted) {
    const d = depths.get(m.milestoneId) ?? 0
    const row = byDepth.get(d)!
    const indexInRow = row.indexOf(m)
    const prereqCount = prereqMap.get(m.milestoneId)?.length ?? 0
    const h = hashString(m.milestoneId)

    const depthSpacing = prereqCount > 1 ? 1.3 : 1
    const baseX = maxDepth === 0
      ? 50
      : padding + (d / maxDepth) * xRange * depthSpacing

    const x = Math.min(100 - padding, Math.max(padding, baseX + seededRandom(h) * 6 - 3))

    const rowSpacing = yRange / (row.length + 1)
    const baseY = padding + rowSpacing * (indexInRow + 1)

    let y = baseY + seededRandom(h + 1) * 8 - 4

    if (prereqCount >= 2) {
      const prereqIds = prereqMap.get(m.milestoneId)!
      const parentPositions = prereqIds.map((pid) => positions.get(pid)).filter(Boolean) as { x: number; y: number }[]
      if (parentPositions.length >= 2) {
        const avgY = parentPositions.reduce((s, p) => s + p.y, 0) / parentPositions.length
        const spread = Math.abs(parentPositions[0].y - parentPositions[1].y)
        if (spread < 15) {
          y = avgY + (seededRandom(h + 2) > 0.5 ? 1 : -1) * (15 + seededRandom(h + 3) * 8)
        }
      }
    }

    y = Math.min(100 - padding, Math.max(padding, y))
    positions.set(m.milestoneId, { x, y })
  }

  return sorted.map((m) => ({
    milestone: m,
    position: positions.get(m.milestoneId)!,
  }))
})

const constellationLines = computed(() => {
  if (props.prerequisites.length === 0) return []

  const posMap = new Map<string, { x: number; y: number }>()
  for (const star of starPositions.value) {
    posMap.set(star.milestone.milestoneId, star.position)
  }

  return props.prerequisites
    .filter((p) => posMap.has(p.prerequisiteMilestoneId) && posMap.has(p.milestoneId))
    .map((p) => {
      const from = posMap.get(p.prerequisiteMilestoneId)!
      const to = posMap.get(p.milestoneId)!
      return { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
    })
})

function focusOnStars() {
  const positions = starPositions.value
  if (positions.length === 0) return

  const el = constellationRef.value
  if (!el) return

  let minX = 100, maxX = 0, minY = 100, maxY = 0
  for (const s of positions) {
    if (s.position.x < minX) minX = s.position.x
    if (s.position.x > maxX) maxX = s.position.x
    if (s.position.y < minY) minY = s.position.y
    if (s.position.y > maxY) maxY = s.position.y
  }

  const w = el.clientWidth
  const h = el.clientHeight
  const padding = 15
  const spanX = (maxX - minX) + padding * 2
  const spanY = (maxY - minY) + padding * 2
  const s = Math.max(1.2, Math.min(2.5, Math.min(100 / spanX, 100 / spanY, 2.5)))

  const centerPxX = ((minX + maxX) / 2 / 100) * w
  const centerPxY = ((minY + maxY) / 2 / 100) * h

  setTransform(s, (w / (2 * s)) - centerPxX, (h / (2 * s)) - centerPxY)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('back')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  nextTick(focusOnStars)
})

onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="set-detail">
    <header class="set-detail__header">
      <button class="set-detail__back" @click="emit('back')" aria-label="Back to milestones">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div class="set-detail__title-group">
        <h2 class="set-detail__title">{{ set.title }}</h2>
        <p v-if="set.description" class="set-detail__desc">{{ set.description }}</p>
      </div>

      <div class="set-detail__meta">
        <span class="set-detail__progress">{{ completedCount }}/{{ milestones.length }}</span>
        <svg v-if="isSetComplete" class="set-detail__check" viewBox="0 0 20 20" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-label="Set complete">
          <polyline points="4 10 8 14 16 6" />
        </svg>
        <span v-if="set.setBonusXp > 0" class="set-detail__bonus">+{{ set.setBonusXp }} XP bonus</span>
      </div>
    </header>

    <div class="set-detail__chart-area">
      <div ref="constellationRef" class="set-detail__constellation" @click.self="pinnedMilestone = null">
        <div class="set-detail__constellation-inner" :style="{ transform: transformStyle }"
          @click.self="pinnedMilestone = null">
          <svg class="set-detail__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line v-for="(l, i) in constellationLines" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
              class="set-detail__constellation-line" />
          </svg>

          <StarNode v-for="star in starPositions" :key="star.milestone.milestoneId" :milestone="star.milestone"
            :position="star.position" :logged-in="loggedIn"
            @select="pinnedMilestone = pinnedMilestone?.milestoneId === $event.milestoneId ? null : $event"
            @hover="hoveredMilestone = $event" @leave="hoveredMilestone = null" />
        </div>

        <button v-if="Math.abs(scale - 1) > 0.01" class="set-detail__reset-zoom" @click="resetZoom" aria-label="Reset zoom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      <div class="set-detail__preview">
        <MilestoneDetail v-if="previewMilestone" :key="previewMilestone.milestoneId" :milestone="previewMilestone" />
        <p v-else class="set-detail__preview-hint">Hover or click a milestone to preview</p>
      </div>
    </div>

    <MilestoneListView :milestones="milestones" :sets="[set]" :logged-in="loggedIn" />
  </div>
</template>

<style scoped>
.set-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-lg);
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.set-detail__header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.set-detail__back {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  padding: var(--space-xs) var(--space-sm);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
  flex-shrink: 0;
}

.set-detail__back:hover {
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

.set-detail__title-group {
  flex: 1;
  min-width: 0;
}

.set-detail__title {
  font-size: var(--text-section-heading);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.set-detail__desc {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0;
}

.set-detail__meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.set-detail__progress {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--text-primary);
}

.set-detail__check {
  width: 18px;
  height: 18px;
  color: var(--success);
  flex-shrink: 0;
}

.set-detail__bonus {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--accent);
  font-weight: 500;
}

.set-detail__chart-area {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-md);
  align-items: start;
}

.set-detail__constellation {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  background:
    radial-gradient(ellipse at 30% 40%, color-mix(in srgb, var(--accent) 6%, transparent), transparent 60%),
    radial-gradient(ellipse at 70% 60%, color-mix(in srgb, var(--accent) 4%, transparent), transparent 50%),
    var(--bg-base);
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}

.set-detail__constellation:active {
  cursor: grabbing;
}

.set-detail__constellation-inner {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
}

.set-detail__reset-zoom {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease;
}

.set-detail__reset-zoom:hover {
  border-color: var(--text-tertiary);
  color: var(--text-primary);
}

.set-detail__constellation::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 15%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 25% 70%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 40% 30%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 55% 85%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 70% 20%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 85% 55%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1.5px 1.5px at 15% 50%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1.5px 1.5px at 60% 45%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 90% 80%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 35% 90%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 78% 12%, var(--text-tertiary) 50%, transparent 100%),
    radial-gradient(1px 1px at 48% 65%, var(--text-tertiary) 50%, transparent 100%);
  opacity: 0.3;
  pointer-events: none;
}

.set-detail__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.set-detail__constellation-line {
  stroke: var(--accent);
  stroke-width: 0.3;
  opacity: 0.25;
}

.set-detail__preview {
  min-height: 180px;
}

.set-detail__preview-hint {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin: 0;
  padding: var(--space-lg);
  text-align: center;
  border: 1px dashed var(--bg-overlay);
  border-radius: var(--radius-card);
}

@media (max-width: 767px) {
  .set-detail__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .set-detail__chart-area {
    grid-template-columns: 1fr;
  }

  .set-detail__constellation {
    aspect-ratio: 1;
    max-height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .set-detail__back {
    transition: none;
  }
}
</style>
