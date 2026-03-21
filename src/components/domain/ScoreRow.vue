<script setup lang="ts">
import GlowImage from '@/components/common/GlowImage.vue';
import type { ScoreDisplay } from '@/types/display';
import { formatRelativeDate, isRecentDate } from '@/utils/formatters';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  score: ScoreDisplay
  rowIndex?: number
}>()

const router = useRouter()

const relativeDate = computed(() => formatRelativeDate(props.score.date))

const dateRecency = computed(() =>
  isRecentDate(props.score.date) ? 'var(--text-primary)' : 'var(--text-secondary)',
)

const modifiersText = computed(() =>
  props.score.modifiers.length > 0 ? props.score.modifiers.join(', ') : '-',
)

const mapHref = computed(() =>
  props.score.mapId ? router.resolve({ path: `/maps/${props.score.mapId}` }).href : undefined,
)

function handleClick(e: MouseEvent) {
  if (!mapHref.value) return
  if (e.ctrlKey || e.metaKey || e.button === 1) return // let the <a> handle it
  e.preventDefault()
  router.push({ path: `/maps/${props.score.mapId}` })
}
</script>

<template>
  <component
    :is="mapHref ? 'a' : 'div'"
    :href="mapHref"
    class="score-row"
    :class="{ 'score-row--clickable': !!score.mapId }"
    :style="{ '--row-index': rowIndex ?? 0 }"
    @click="handleClick"
  >
    <span class="score-row__rank">#{{ score.leaderboardRank }}</span>
    <GlowImage v-if="score.coverUrl" :src="score.coverUrl" :alt="score.mapName" />
    <span class="score-row__map">{{ score.mapName }}</span>
    <span class="score-row__difficulty">{{ score.difficulty }}</span>
    <span class="score-row__ap">{{ score.ap.toFixed(2) }}</span>
    <span class="score-row__accuracy">{{ (score.accuracy * 100).toFixed(2) }}%</span>
    <span class="score-row__score">{{ score.score.toLocaleString() }}</span>
    <span class="score-row__weighted">{{ score.weightedAp.toFixed(2) }}</span>
    <span class="score-row__date" :style="{ color: dateRecency }">{{ relativeDate }}</span>
    <span class="score-row__modifiers">{{ modifiersText }}</span>
  </component>
</template>

<style scoped>
.score-row {
  display: grid;
  text-decoration: none;
  color: inherit;
  grid-template-columns: 36px 36px 1fr 70px 80px 80px 80px 80px 90px 50px;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  min-height: 48px;
  border-left: 2px solid transparent;
  transition: border-color 120ms ease, background-color 120ms ease;
}


.score-row:nth-child(even) {
  background: var(--bg-surface);
}

.score-row:nth-child(odd) {
  background: var(--bg-elevated);
}

.score-row:hover {
  border-left-color: var(--accent);
}

.score-row--clickable {
  cursor: pointer;
}

.score-row__rank {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}


.score-row__map {
  font-size: var(--text-body);
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.score-row__difficulty {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  white-space: nowrap;
  text-align: center;
}

.score-row__accuracy,
.score-row__ap,
.score-row__weighted {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
  white-space: nowrap;
  text-align: center;
  animation: slide-in 300ms ease-out backwards;
  animation-delay: calc(var(--row-index) * 20ms);
}

.score-row__ap {
  font-weight: 500;
}

.score-row__score {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-tertiary);
  white-space: nowrap;
  text-align: center;
  animation: slide-in 300ms ease-out backwards;
  animation-delay: calc(var(--row-index) * 20ms);
}

.score-row__weighted {
  color: var(--text-secondary);
}

.score-row__modifiers {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.score-row__date {
  font-size: var(--text-caption);
  white-space: nowrap;
  text-align: center;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {

  .score-row__accuracy,
  .score-row__ap,
  .score-row__score,
  .score-row__weighted {
    animation: none;
  }
}

@media (max-width: 767px) {
  .score-row {
    grid-template-columns: 30px 36px 1fr 80px 80px;
    gap: var(--space-xs);
  }

  .score-row__difficulty,
  .score-row__modifiers,
  .score-row__score,
  .score-row__weighted,
  .score-row__date {
    display: none;
  }
}
</style>
