<script setup lang="ts">
import BaseTabs from '@/components/common/BaseTabs.vue'
import ScoreDetailModal from '@/components/domain/ScoreDetailModal.vue'
import ScoreFeedCard from '@/components/domain/ScoreFeedCard.vue'
import { useScoreWebSocket } from '@/composables/useScoreWebSocket'
import { useCategoryStore } from '@/stores/categories'
import type { ScoreDisplay, ScoreFeedEntry } from '@/types/display'
import { computed, onMounted, ref } from 'vue'

const categoryStore = useCategoryStore()
const { scores, status, connect } = useScoreWebSocket()
const activeTab = ref('all')

const tabs = computed(() => {
  const categoryTabs = categoryStore.categoryInfoList
    .filter((c) => c.code !== 'overall' && c.code !== 'xp')
    .map((c) => ({
      key: c.code,
      label: c.name,
      accentColor: c.accent,
    }))
  return [{ key: 'all', label: 'All' }, ...categoryTabs]
})

const filteredScores = computed(() => {
  if (activeTab.value === 'all') return scores.value
  return scores.value.filter((s) => s.categoryCode === activeTab.value)
})

const modalOpen = ref(false)
const modalScore = ref<ScoreDisplay | null>(null)
const modalUserId = ref('')

function toScoreDisplay(entry: ScoreFeedEntry): ScoreDisplay {
  return {
    mapId: entry.mapId,
    mapDifficultyId: entry.mapDifficultyId,
    mapName: entry.mapName,
    artistName: entry.artistName,
    difficulty: entry.difficulty,
    categoryCode: entry.categoryCode,
    coverUrl: entry.coverUrl,
    leaderboardRank: entry.rank,
    score: entry.score,
    accuracy: entry.accuracy,
    ap: entry.ap,
    weightedAp: entry.weightedAp,
    modifiers: entry.modifiers,
    date: entry.timeSet,
    misses: entry.misses,
    badCuts: entry.badCuts,
    wallHits: entry.wallHits,
    bombHits: entry.bombHits,
    streak115: entry.streak115,
    blScoreId: entry.blScoreId,
    userName: entry.userName,
    mapAuthor: entry.mapAuthor,
  }
}

function onSelectScore(entry: ScoreFeedEntry) {
  modalScore.value = toScoreDisplay(entry)
  modalUserId.value = entry.userId
  modalOpen.value = true
}

onMounted(connect)
</script>

<template>
  <div class="score-feed-page">
    <div class="score-feed-page__header">
      <h1 class="score-feed-page__title">Score Feed</h1>
      <div class="score-feed-page__status" :class="`score-feed-page__status--${status}`">
        <span class="score-feed-page__status-dot" />
        <span v-if="status === 'connected'">Live</span>
        <span v-else-if="status === 'reconnecting'">Reconnecting...</span>
        <span v-else>Disconnected</span>
      </div>
    </div>

    <BaseTabs :tabs="tabs" v-model="activeTab" />

    <div class="score-feed-page__list">
      <TransitionGroup name="feed">
        <ScoreFeedCard
          v-for="entry in filteredScores"
          :key="entry.key"
          :entry="entry"
          @select="onSelectScore"
        />
      </TransitionGroup>

      <div v-if="filteredScores.length === 0" class="score-feed-page__empty">
        <span class="score-feed-page__empty-text">Waiting for scores...</span>
      </div>
    </div>

    <ScoreDetailModal
      :open="modalOpen"
      :score="modalScore"
      :user-id="modalUserId"
      @close="modalOpen = false"
    />
  </div>
</template>

<style scoped>
.score-feed-page {
  padding: var(--space-xl);
  max-width: 900px;
  margin: 0 auto;
}

.score-feed-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.score-feed-page__title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
}

.score-feed-page__status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.score-feed-page__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.score-feed-page__status--connected .score-feed-page__status-dot {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse-dot 3s ease-in-out infinite;
}

.score-feed-page__status--reconnecting .score-feed-page__status-dot {
  background: var(--warning);
  box-shadow: 0 0 6px var(--warning);
  animation: pulse-dot 1s ease-in-out infinite;
}

.score-feed-page__status--disconnected .score-feed-page__status-dot {
  background: var(--error);
}

.score-feed-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.score-feed-page__empty {
  display: flex;
  justify-content: center;
  padding: var(--space-3xl) 0;
}

.score-feed-page__empty-text {
  font-size: var(--text-body);
  color: var(--text-tertiary);
  background: linear-gradient(
    90deg,
    var(--text-tertiary) 0%,
    var(--text-secondary) 50%,
    var(--text-tertiary) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-text 2s ease-in-out infinite;
}

.feed-enter-active {
  transition: all 200ms ease-out;
}

.feed-leave-active {
  transition: all 150ms ease-in;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.feed-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.feed-move {
  transition: transform 200ms ease-out;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shimmer-text {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .feed-enter-active,
  .feed-leave-active,
  .feed-move {
    transition: none;
  }

  .score-feed-page__status-dot {
    animation: none;
  }

  .score-feed-page__empty-text {
    animation: none;
    background: none;
    -webkit-text-fill-color: var(--text-tertiary);
  }
}

@media (max-width: 767px) {
  .score-feed-page {
    padding: var(--space-md);
  }
}
</style>
