<script setup lang="ts">
import type { Highway, SetNodeLayout } from '@/composables/useStarChart'
import { computeGridPosition, useStarChart } from '@/composables/useStarChart'
import type { MilestoneCompletionResponse, MilestoneSetResponse } from '@/types/api/milestones'
import { hashString } from '@/utils/constants'
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue'
import SetHighway from './SetHighway.vue'
import SetNode from './SetNode.vue'

const props = defineProps<{
  sets: MilestoneSetResponse[]
  milestonesBySet: Map<string, MilestoneCompletionResponse[]>
  selectedSetId: string | null
  lockedSets?: { id: string; title: string; index: number }[]
}>()

const emit = defineEmits<{
  'select-set': [id: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)
const containerHeight = ref(500)

const hoveredSet = ref<MilestoneSetResponse | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const { computeSetPositions, computeHighways } = useStarChart(
  toRef(props, 'sets'),
  toRef(props, 'milestonesBySet'),
)

const setNodes = computed<SetNodeLayout[]>(() =>
  computeSetPositions(containerWidth.value, containerHeight.value),
)

const totalNodeCount = computed(() => props.sets.length + (props.lockedSets?.length ?? 0))

const lockedPositions = computed(() =>
  (props.lockedSets ?? []).map((ls) => ({
    ...ls,
    position: computeGridPosition(
      ls.index,
      totalNodeCount.value,
      containerWidth.value,
      containerHeight.value,
      hashString(ls.id),
    ),
  })),
)

const allNodesForHighways = computed<SetNodeLayout[]>(() => [
  ...setNodes.value,
  ...lockedPositions.value.map((ls) => ({
    id: ls.id,
    set: { id: ls.id, title: ls.title, description: '', setBonusXp: 0, createdAt: '' },
    position: ls.position,
    milestoneCount: 0,
    completionPercentage: 0,
  })),
])

const highways = computed<Highway[]>(() => computeHighways(allNodesForHighways.value))

const hoveredMilestoneCount = computed(() => {
  if (!hoveredSet.value) return 0
  return props.milestonesBySet.get(hoveredSet.value.id)?.length ?? 0
})

const hoveredCompletedCount = computed(() => {
  if (!hoveredSet.value) return 0
  return props.milestonesBySet.get(hoveredSet.value.id)?.filter((m) => m.userCompleted).length ?? 0
})

const NODE_TOOLTIP_OFFSET = 50

function onSetHover(set: MilestoneSetResponse, position: { x: number; y: number }) {
  hoveredSet.value = set
  tooltipPos.value = { x: position.x, y: position.y - NODE_TOOLTIP_OFFSET }
}

function onResize() {
  if (!containerRef.value) return
  containerWidth.value = containerRef.value.clientWidth
  containerHeight.value = containerRef.value.clientHeight
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="containerRef" class="set-chart-map" :class="{ 'set-chart-map--zoomed': selectedSetId !== null }">
    <svg class="set-chart-map__highways" :viewBox="`0 0 ${containerWidth} ${containerHeight}`" aria-hidden="true">
      <SetHighway v-for="(hw, i) in highways" :key="i" :from="hw.from" :to="hw.to" :opacity="hw.opacity" />
    </svg>

    <SetNode v-for="node in setNodes" :key="node.id" :set="node.set" :position="node.position"
      :milestone-count="node.milestoneCount" :completion-percentage="node.completionPercentage"
      :class="{ 'set-chart-map__node--hidden': selectedSetId !== null && selectedSetId !== node.id }"
      @select="emit('select-set', $event)" @hover="onSetHover" @leave="hoveredSet = null" />

    <SetNode v-for="ls in lockedPositions" :key="`locked-${ls.id}`"
      :set="{ id: ls.id, title: ls.title, description: '', setBonusXp: 0, createdAt: '' }" :position="ls.position"
      :milestone-count="0" :completion-percentage="0" :locked="true"
      :class="{ 'set-chart-map__node--hidden': selectedSetId !== null }" />

    <Transition name="tooltip">
      <div v-if="hoveredSet" class="set-chart-map__tooltip"
        :style="{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }">
        <span class="set-chart-map__tooltip-title">{{ hoveredSet.title }}</span>
        <span v-if="hoveredSet.description" class="set-chart-map__tooltip-desc">{{ hoveredSet.description }}</span>
        <span class="set-chart-map__tooltip-stat">
          {{ hoveredMilestoneCount }} milestones
          <template v-if="hoveredCompletedCount > 0">
            <br> {{ hoveredCompletedCount }} completed</template>
        </span>
        <span v-if="hoveredSet.setBonusXp > 0" class="set-chart-map__tooltip-xp">+{{ hoveredSet.setBonusXp }} XP
          bonus</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.set-chart-map {
  position: relative;
  width: 100%;
  min-height: 60vh;
  overflow: hidden;
}

.set-chart-map__highways {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.set-chart-map__node--hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 400ms ease;
}

.set-chart-map__tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 10;
  pointer-events: none;
  background: var(--bg-elevated);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.set-chart-map__tooltip-title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.set-chart-map__tooltip-desc {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.set-chart-map__tooltip-stat {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.set-chart-map__tooltip-xp {
  font-size: var(--text-caption);
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 500;
}

.tooltip-enter-active {
  transition: opacity 100ms ease, transform 100ms ease;
}

.tooltip-leave-active {
  transition: opacity 80ms ease;
}

.tooltip-enter-from {
  opacity: 0;
  transform: translate(-50%, calc(-100% + 4px));
}

.tooltip-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

  .set-chart-map__node--hidden,
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }
}
</style>
