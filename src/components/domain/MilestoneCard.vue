<script setup lang="ts">
import { useCategoryStore } from '@/stores/categories';
import type { MilestoneDisplay } from '@/types/display';
import { tierColor as getTierColor } from '@/utils/constants';
import { computed } from 'vue';

const props = defineProps<{
  milestone: MilestoneDisplay
  loggedIn?: boolean
}>()

const categoryStore = useCategoryStore()

const tierColor = computed(() => getTierColor(props.milestone.tier))

const accentColor = computed(() =>
  props.milestone.categoryCode ? categoryStore.getAccent(props.milestone.categoryCode) : undefined,
)

const completionText = computed(() => `${props.milestone.completionPercent.toFixed(1)}% of players`)
</script>

<template>
  <div class="milestone-card" :class="{
    'milestone-card--completed': milestone.isCompleted,
    'milestone-card--dim': loggedIn && !milestone.isCompleted,
  }" :style="accentColor ? { '--ms-accent': accentColor, '--tier-color': tierColor } : { '--tier-color': tierColor }">
    <div class="milestone-card__header">
      <span class="milestone-card__icon" :class="{
        'milestone-card__icon--completed': milestone.isCompleted,
        'milestone-card__icon--gray': loggedIn && !milestone.isCompleted,
      }">
        <svg v-if="milestone.type?.toUpperCase() === 'MILESTONE'" viewBox="0 0 20 20" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="3" x2="4" y2="17" />
          <path d="M4 3h10l-3 4 3 4H4" />
        </svg>
        <svg v-else viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <path d="M6 2h8v6a4 4 0 0 1-8 0V2z" />
          <path d="M6 4H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3h1" />
          <path d="M14 4h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3h-1" />
          <line x1="10" y1="12" x2="10" y2="15" />
          <path d="M6 15h8a1 1 0 0 1 1 1v1H5v-1a1 1 0 0 1 1-1z" />
        </svg>
      </span>
      <div class="milestone-card__header-text">
        <span class="milestone-card__tier">{{ milestone.tier }}</span>
        <span v-if="milestone.isCompleted === true" class="milestone-card__check" aria-label="Completed">
          &#10003;
        </span>
      </div>
    </div>
    <h3 class="milestone-card__title">{{ milestone.title }}</h3>
    <p class="milestone-card__desc">{{ milestone.description }}</p>
    <div class="milestone-card__footer">
      <span class="milestone-card__xp">{{ milestone.xp }} XP</span>
      <span class="milestone-card__completion">{{ completionText }}</span>
    </div>
  </div>
</template>

<style scoped>
.milestone-card {
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  padding: var(--space-lg) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: border-color 150ms ease;
}

.milestone-card--completed {
  border-color: var(--ms-accent, var(--accent));
}

.milestone-card__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
}

.milestone-card__icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  color: var(--tier-color);
}

.milestone-card__icon--completed {
  filter: drop-shadow(0 0 4px var(--tier-color));
}

.milestone-card__icon--gray {
  color: var(--text-secondary);
}

.milestone-card--dim {
  opacity: 0.5;
}

.milestone-card__icon svg {
  width: 100%;
  height: 100%;
}

.milestone-card__header-text {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-xs);
}

.milestone-card__tier {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tier-color);
}

.milestone-card__check {
  color: var(--success);
  font-size: 1rem;
}

.milestone-card__title {
  font-size: var(--text-card-title);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.milestone-card__desc {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.milestone-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--space-sm);
}

.milestone-card__xp {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--text-primary);
}

.milestone-card__completion {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}
</style>
