<script setup lang="ts">
import type { MilestoneCompletionResponse } from '@/types/api/milestones';
import { tierColor as getTierColor } from '@/utils/constants';
import { formatDifficulty } from '@/utils/mappers';
import { computed, ref } from 'vue';

const props = defineProps<{
  milestone: MilestoneCompletionResponse
  compact?: boolean
  loggedIn?: boolean
}>()

const tierColor = computed(() => getTierColor(props.milestone.tier))
const isCompleted = computed(() => props.milestone.userCompleted === true)
const isNotCompleted = computed(() => !!props.loggedIn && !isCompleted.value)
const isMilestoneType = computed(() => props.milestone.type?.toUpperCase() === 'MILESTONE')
const hasScoreInfo = computed(() => isCompleted.value && !!props.milestone.achievedWithScoreId && !!accuracy.value)
const typeLabel = computed(() => isMilestoneType.value ? 'milestone' : 'achievement')
const blTooltip = computed(() => `This ${typeLabel.value} is exclusive to players with the BeatLeader mod.`)

const expanded = ref(false)

const completionText = computed(() => {
  const { completions, totalPlayers, completionPercentage } = props.milestone
  return `${completions ?? 0}/${totalPlayers ?? 0} players (${(completionPercentage ?? 0).toFixed(1)}%)`
})

const accuracy = computed(() => {
  if (!props.milestone.score || !props.milestone.maxScore) return null
  return ((props.milestone.score / props.milestone.maxScore) * 100).toFixed(2)
})

const progressPercent = computed(() => {
  if (props.milestone.userProgress == null || !props.milestone.targetValue) return null
  return Math.min(100, (props.milestone.userProgress / props.milestone.targetValue) * 100)
})

const completedAtFormatted = computed(() => {
  if (!props.milestone.userCompletedAt) return null
  return new Date(props.milestone.userCompletedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

function toggleExpand() {
  if (props.compact && hasScoreInfo.value) {
    expanded.value = !expanded.value
  }
}
</script>

<template>
  <div class="milestone-detail" :class="{
    'milestone-detail--compact': compact,
    'milestone-detail--expandable': compact && hasScoreInfo,
    'milestone-detail--expanded': expanded,
    'milestone-detail--dim': isNotCompleted,
  }" :style="{ '--tier-color': tierColor }">
    <div class="milestone-detail__header" :tabindex="compact && hasScoreInfo ? 0 : undefined"
      :role="compact && hasScoreInfo ? 'button' : undefined"
      :aria-expanded="compact && hasScoreInfo ? expanded : undefined" @click="toggleExpand"
      @keydown.enter="toggleExpand" @keydown.space.prevent="toggleExpand">
      <span class="milestone-detail__icon" :class="{
        'milestone-detail__icon--completed': isCompleted,
        'milestone-detail__icon--gray': isNotCompleted,
      }">
        <svg v-if="isMilestoneType" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="3" x2="4" y2="17" />
          <path d="M4 3h10l-3 4 3 4H4" />
        </svg>
        <svg v-else viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3h8v5a4 4 0 0 1-8 0V3z" />
          <path d="M14 5h1a2 2 0 0 1 0 4h-1" />
          <path d="M6 5H5a2 2 0 0 0 0 4h1" />
          <line x1="10" y1="12" x2="10" y2="15" />
          <line x1="7" y1="15" x2="13" y2="15" />
        </svg>
      </span>
      <div class="milestone-detail__title-group">
        <div class="milestone-detail__tier-row">
          <span class="milestone-detail__tier">{{ milestone.tier }}</span>
          <span v-if="milestone.blExclusive" class="milestone-detail__bl-badge" :title="blTooltip">BL</span>
        </div>
        <h4 class="milestone-detail__title">
          {{ milestone.title }}
          <span v-if="compact && milestone.description" class="milestone-detail__inline-desc">
            · {{ milestone.description }}
          </span>
        </h4>
      </div>
      <div v-if="compact" class="milestone-detail__compact-meta">
        <span class="milestone-detail__xp">{{ milestone.xp }} XP</span>
        <span v-if="progressPercent != null && !isCompleted" class="milestone-detail__progress-label">{{
          progressPercent.toFixed(1) }}%</span>
        <span class="milestone-detail__completion">{{ completionText }}</span>
        <svg v-if="isCompleted" class="milestone-detail__check-icon" viewBox="0 0 20 20" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="4 10 8 14 16 6" />
        </svg>
        <svg v-if="hasScoreInfo" class="milestone-detail__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </div>
    </div>

    <div v-if="compact && progressPercent != null && !isCompleted"
      class="milestone-detail__progress milestone-detail__progress--compact">
      <div class="milestone-detail__progress-bar" :style="{ width: `${progressPercent}%` }" />
    </div>

    <div v-if="compact && hasScoreInfo" class="milestone-detail__dropdown"
      :class="{ 'milestone-detail__dropdown--open': expanded }">
      <div class="milestone-detail__dropdown-inner">
        <div class="milestone-detail__score">
          <img v-if="milestone.coverUrl" :src="milestone.coverUrl" :alt="milestone.songName ?? 'Cover'"
            class="milestone-detail__cover" loading="lazy" />
          <div class="milestone-detail__score-info">
            <span class="milestone-detail__score-text">
              <strong>{{ accuracy }}%</strong> on
              <em>{{ milestone.songName ?? 'Unknown Song' }}{{ milestone.songAuthor ? ` - ${milestone.songAuthor}` : ''
                }}</em>
              <template v-if="milestone.difficulty"> ({{ formatDifficulty(milestone.difficulty) }})</template>
            </span>
            <span v-if="milestone.mapAuthor" class="milestone-detail__mapper">Mapped by {{ milestone.mapAuthor }}</span>
            <span v-if="completedAtFormatted" class="milestone-detail__date">{{ completedAtFormatted }}</span>
          </div>
        </div>
      </div>
    </div>

    <template v-if="!compact">
      <p class="milestone-detail__desc">{{ milestone.description }}</p>

      <div class="milestone-detail__stats">
        <span class="milestone-detail__xp">{{ milestone.xp }} XP</span>
        <span class="milestone-detail__completion">{{ completionText }}</span>
      </div>

      <div v-if="progressPercent != null && !isCompleted" class="milestone-detail__progress">
        <div class="milestone-detail__progress-bar" :style="{ width: `${progressPercent}%` }" />
        <span class="milestone-detail__progress-text">{{ progressPercent.toFixed(1) }}%</span>
      </div>

      <div v-if="hasScoreInfo" class="milestone-detail__score">
        <img v-if="milestone.coverUrl" :src="milestone.coverUrl" :alt="milestone.songName ?? 'Cover'"
          class="milestone-detail__cover" loading="lazy" />
        <div class="milestone-detail__score-info">
          <span class="milestone-detail__score-text">
            Completed with <strong>{{ accuracy }}%</strong> on
            <em>{{ milestone.songName ?? 'Unknown Song' }}{{ milestone.songAuthor ? ` - ${milestone.songAuthor}` : ''
              }}</em>
            <template v-if="milestone.difficulty"> ({{ formatDifficulty(milestone.difficulty) }})</template>
          </span>
          <span v-if="milestone.mapAuthor" class="milestone-detail__mapper">Mapped by {{ milestone.mapAuthor }}</span>
          <span v-if="completedAtFormatted" class="milestone-detail__date">{{ completedAtFormatted }}</span>
        </div>
      </div>

      <div v-else-if="isCompleted && completedAtFormatted" class="milestone-detail__completed-note">
        <svg class="milestone-detail__check-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="4 10 8 14 16 6" />
        </svg>
        Completed on {{ completedAtFormatted }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.milestone-detail {
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  padding: var(--space-lg) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.milestone-detail__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
}

.milestone-detail__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: var(--tier-color);
}

.milestone-detail__icon--completed {
  filter: drop-shadow(0 0 4px var(--tier-color));
}

.milestone-detail__icon--gray {
  color: var(--text-secondary);
}

.milestone-detail--dim {
  opacity: 0.5;
}

.milestone-detail__icon svg {
  width: 100%;
  height: 100%;
}

.milestone-detail__title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.milestone-detail__tier-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.milestone-detail__tier {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tier-color);
}

.milestone-detail__bl-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0 4px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--info) 15%, transparent);
  color: var(--info);
  line-height: 1.4;
}

.milestone-detail__title {
  font-size: var(--text-card-title);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.milestone-detail__desc {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.milestone-detail__stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.milestone-detail__xp {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--text-primary);
}

.milestone-detail__completion {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}

.milestone-detail__score {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-elevated);
  border-radius: var(--radius-btn);
}

.milestone-detail__cover {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-btn);
  object-fit: cover;
  flex-shrink: 0;
}

.milestone-detail__score-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.milestone-detail__score-text {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  line-height: 1.4;
}

.milestone-detail__score-text strong {
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.milestone-detail__score-text em {
  font-style: normal;
  color: var(--text-primary);
}

.milestone-detail__mapper,
.milestone-detail__date {
  font-size: 0.625rem;
  color: var(--text-tertiary);
}

.milestone-detail__date {
  font-family: var(--font-mono);
}

.milestone-detail__completed-note {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-caption);
  color: var(--success);
  margin-top: var(--space-xs);
}

.milestone-detail__check-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.milestone-detail--compact {
  padding: var(--space-sm) var(--space-md);
  gap: 0;
}

.milestone-detail--compact .milestone-detail__header {
  flex: 1;
  min-width: 0;
  align-items: center;
}

.milestone-detail--compact .milestone-detail__icon {
  width: 20px;
  height: 20px;
}

.milestone-detail--compact .milestone-detail__title-group {
  flex-direction: row;
  align-items: baseline;
  gap: var(--space-sm);
}

.milestone-detail--compact .milestone-detail__title {
  font-size: var(--text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.milestone-detail__inline-desc {
  font-weight: 400;
  color: var(--text-tertiary);
  font-size: var(--text-caption);
}

.milestone-detail__compact-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
  margin-left: auto;
}

.milestone-detail__compact-meta .milestone-detail__check-icon {
  color: var(--success);
}

.milestone-detail__chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: transform 150ms ease;
}

.milestone-detail--expanded .milestone-detail__chevron {
  transform: rotate(180deg);
}

.milestone-detail--expandable .milestone-detail__header {
  cursor: pointer;
}

.milestone-detail--expandable:hover {
  border-color: var(--text-tertiary);
}

.milestone-detail__dropdown {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease;
}

.milestone-detail__dropdown--open {
  grid-template-rows: 1fr;
}

.milestone-detail__dropdown-inner {
  overflow: hidden;
}

.milestone-detail__dropdown--open .milestone-detail__dropdown-inner {
  padding-top: var(--space-sm);
}

.milestone-detail__dropdown .milestone-detail__cover {
  width: 40px;
  height: 40px;
}

.milestone-detail__progress-label {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--tier-color);
  font-weight: 500;
}

.milestone-detail__progress {
  position: relative;
  height: 4px;
  background: var(--bg-overlay);
  border-radius: 2px;
  overflow: hidden;
}

.milestone-detail__progress--compact {
  margin-top: var(--space-xs);
}

.milestone-detail__progress-bar {
  height: 100%;
  background: var(--tier-color);
  border-radius: 2px;
  transition: width 300ms ease;
}

.milestone-detail__progress-bar--done {
  background: var(--success);
}

.milestone-detail__progress-text {
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--text-tertiary);
}

@media (max-width: 767px) {
  .milestone-detail--compact {
    padding: var(--space-md);
    gap: var(--space-xs);
  }

  .milestone-detail--compact .milestone-detail__header {
    flex-wrap: wrap;
  }

  .milestone-detail--compact .milestone-detail__title {
    white-space: normal;
    font-size: var(--text-card-title);
  }

  .milestone-detail--compact .milestone-detail__title-group {
    flex-direction: column;
    gap: 2px;
  }

  .milestone-detail__inline-desc {
    display: none;
  }

  .milestone-detail__compact-meta {
    width: 100%;
    padding-top: var(--space-xs);
    padding-left: calc(20px + var(--space-md));
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .milestone-detail__tier {
    font-size: var(--text-caption);
  }

  .milestone-detail:not(.milestone-detail--compact) {
    padding: var(--space-md);
  }

  .milestone-detail__desc {
    font-size: var(--text-body);
  }

  .milestone-detail__score-text {
    font-size: var(--text-body);
  }
}

@media (prefers-reduced-motion: reduce) {

  .milestone-detail__chevron,
  .milestone-detail__dropdown,
  .milestone-detail__progress-bar {
    transition: none;
  }
}
</style>
