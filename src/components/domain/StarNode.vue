<script setup lang="ts">
import type { MilestoneCompletionResponse } from '@/types/api/milestones';
import { tierColor as getTierColor, TIER_SCALES } from '@/utils/constants';
import { computed } from 'vue';

const props = defineProps<{
  milestone: MilestoneCompletionResponse
  position: { x: number; y: number }
  loggedIn?: boolean
}>()

const emit = defineEmits<{
  select: [milestone: MilestoneCompletionResponse]
  hover: [milestone: MilestoneCompletionResponse]
  leave: []
}>()

const tierKey = computed(() => props.milestone.tier.toUpperCase())
const tierColor = computed(() => getTierColor(props.milestone.tier))
const tierScale = computed(() => TIER_SCALES[tierKey.value] ?? 1)
const isCompleted = computed(() => props.milestone.userCompleted === true)
const isNotCompleted = computed(() => !!props.loggedIn && !isCompleted.value)
const isMilestoneType = computed(() => props.milestone.type?.toUpperCase() === 'MILESTONE')

const ariaLabel = computed(() => {
  const status = isCompleted.value ? 'Completed' : 'Not completed'
  return `${props.milestone.title} - ${props.milestone.tier} - ${status}`
})
</script>

<template>
  <button class="star-node" :class="{
    'star-node--completed': isCompleted,
    'star-node--dim': isNotCompleted,
  }" :style="{
    left: `${position.x}%`,
    top: `${position.y}%`,
    '--tier-color': tierColor,
    '--tier-scale': tierScale,
  }" :aria-label="ariaLabel" tabindex="0" @click="emit('select', milestone)" @pointerenter="emit('hover', milestone)"
    @pointerleave="emit('leave')" @focus="emit('hover', milestone)" @blur="emit('leave')">
    <span class="star-node__glow" />
    <span class="star-node__core">
      <svg v-if="isMilestoneType" class="star-node__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="4" y1="3" x2="4" y2="17" />
        <path d="M4 3h10l-3 4 3 4H4" />
      </svg>
      <svg v-else class="star-node__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 3h8v5a4 4 0 0 1-8 0V3z" />
        <path d="M14 5h1a2 2 0 0 1 0 4h-1" />
        <path d="M6 5H5a2 2 0 0 0 0 4h1" />
        <line x1="10" y1="12" x2="10" y2="15" />
        <line x1="7" y1="15" x2="13" y2="15" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.star-node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.star-node:focus-visible {
  outline: 2px solid var(--tier-color);
  outline-offset: 4px;
  border-radius: 50%;
}

.star-node__glow {
  position: absolute;
  inset: calc(-8px * var(--tier-scale, 1));
  border-radius: 50%;
  background: radial-gradient(circle, var(--tier-color), transparent 70%);
  opacity: 0;
  transition: opacity 200ms ease;
}

.star-node--completed .star-node__glow {
  opacity: 0.4;
}

.star-node__core {
  position: relative;
  width: calc(14px * var(--tier-scale, 1));
  height: calc(14px * var(--tier-scale, 1));
  border-radius: 50%;
  background: var(--tier-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-base);
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.star-node--completed .star-node__core {
  box-shadow:
    0 0 calc(8px * var(--tier-scale, 1)) var(--tier-color),
    0 0 calc(16px * var(--tier-scale, 1)) color-mix(in srgb, var(--tier-color) 30%, transparent);
}

.star-node--completed .star-node__core::before,
.star-node--completed .star-node__core::after {
  content: '';
  position: absolute;
  background: var(--tier-color);
  opacity: 0.4;
}

.star-node--completed .star-node__core::before {
  width: 1px;
  height: calc(24px * var(--tier-scale, 1));
}

.star-node--completed .star-node__core::after {
  width: calc(24px * var(--tier-scale, 1));
  height: 1px;
}

.star-node--dim .star-node__core {
  opacity: 0.3;
}

.star-node__icon {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.star-node:hover .star-node__core {
  transform: scale(1.3);
}

.star-node:hover .star-node__glow {
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {

  .star-node__glow,
  .star-node__core {
    transition: none;
  }
}
</style>
