<script setup lang="ts">
import type { MilestoneSetResponse } from '@/types/api/milestones';
import { formatPercent } from '@/utils/constants';
import { computed } from 'vue';

const props = defineProps<{
  set: MilestoneSetResponse
  position: { x: number; y: number }
  milestoneCount: number
  completionPercentage: number
  locked?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  hover: [set: MilestoneSetResponse, position: { x: number; y: number }]
  leave: []
}>()

const completionFraction = computed(() => props.completionPercentage / 100)

const RING_CIRCUMFERENCE = 125.66
const ringDasharray = computed(() => {
  const filled = RING_CIRCUMFERENCE * completionFraction.value
  return `${filled} ${RING_CIRCUMFERENCE - filled}`
})

const glowIntensity = computed(() => 8 + 32 * completionFraction.value)

const ariaLabel = computed(() =>
  props.locked
    ? `${props.set.title} - Locked`
    : `${props.set.title} - ${props.milestoneCount} milestones - ${formatPercent(props.completionPercentage, 0)}% complete`,
)
</script>

<template>
  <button class="set-node" :class="{ 'set-node--locked': locked }" :style="{
    left: `${position.x}px`,
    top: `${position.y}px`,
    '--glow-spread': `${glowIntensity}px`,
  }" :aria-label="ariaLabel" :tabindex="locked ? -1 : 0" :aria-disabled="locked || undefined"
    @click="!locked && emit('select', set.id)" @keydown.enter="!locked && emit('select', set.id)"
    @keydown.space.prevent="!locked && emit('select', set.id)" @pointerenter="!locked && emit('hover', set, position)"
    @pointerleave="emit('leave')">
    <span class="set-node__glow" />

    <svg class="set-node__ring" viewBox="0 0 44 44" aria-hidden="true">
      <circle class="set-node__ring-track" cx="22" cy="22" r="20" fill="none" stroke-width="1.5" />
      <circle v-if="!locked" class="set-node__ring-fill" cx="22" cy="22" r="20" fill="none" stroke-width="2"
        :stroke-dasharray="ringDasharray" stroke-dashoffset="0" transform="rotate(-90, 22, 22)" />
    </svg>

    <span v-if="locked" class="set-node__lock">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <rect x="5" y="9" width="10" height="8" rx="1.5" />
        <path d="M7 9V6a3 3 0 0 1 6 0v3" />
      </svg>
    </span>
    <span v-else class="set-node__cluster">
      <span class="set-node__dot set-node__dot--1" />
      <span class="set-node__dot set-node__dot--2" />
      <span class="set-node__dot set-node__dot--3" />
      <span v-if="milestoneCount > 5" class="set-node__dot set-node__dot--4" />
      <span v-if="milestoneCount > 10" class="set-node__dot set-node__dot--5" />
    </span>

    <span class="set-node__label">{{ set.title }}</span>
  </button>
</template>

<style scoped>
.set-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  z-index: 2;
}

.set-node:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 8px;
  border-radius: 50%;
}

.set-node__glow {
  position: absolute;
  width: 64px;
  height: 64px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 10px));
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent), transparent 70%);
  opacity: 0.15;
  filter: blur(4px);
  transition: opacity 300ms ease, box-shadow 300ms ease;
  box-shadow: 0 0 var(--glow-spread) var(--accent);
}

.set-node:hover:not(.set-node--locked) .set-node__glow {
  opacity: 0.4;
}

.set-node__ring {
  width: 56px;
  height: 56px;
  position: relative;
  z-index: 1;
}

.set-node__ring-track {
  stroke: var(--bg-overlay);
}

.set-node__ring-fill {
  stroke: var(--accent);
  transition: stroke-dasharray 400ms ease;
}

.set-node__cluster {
  position: absolute;
  width: 24px;
  height: 24px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 10px));
  z-index: 2;
}

.set-node__dot {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.7;
}

.set-node__dot--1 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  opacity: 1;
}

.set-node__dot--2 {
  top: 25%;
  left: 70%;
}

.set-node__dot--3 {
  top: 70%;
  left: 30%;
}

.set-node__dot--4 {
  top: 30%;
  left: 20%;
}

.set-node__dot--5 {
  top: 75%;
  left: 72%;
}

.set-node__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms ease;
}

.set-node:hover:not(.set-node--locked) .set-node__label {
  color: var(--text-primary);
}

.set-node--locked {
  cursor: default;
}

.set-node--locked .set-node__glow {
  opacity: 0.04;
  box-shadow: none;
}

.set-node--locked:hover .set-node__glow {
  opacity: 0.08;
}

.set-node--locked .set-node__ring-track {
  stroke-dasharray: 4 4;
}

.set-node--locked .set-node__label {
  color: var(--text-tertiary);
}

.set-node__lock {
  position: absolute;
  width: 18px;
  height: 18px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 10px));
  z-index: 2;
  color: var(--text-tertiary);
}

.set-node__lock svg {
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {

  .set-node__glow,
  .set-node__ring-fill,
  .set-node__label {
    transition: none;
  }
}
</style>
