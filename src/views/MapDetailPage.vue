<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTabs from '@/components/common/BaseTabs.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import StatBlock from '@/components/common/StatBlock.vue'
import ComplexityBadge from '@/components/domain/ComplexityBadge.vue'
import TimeSeriesChart from '@/components/domain/TimeSeriesChart.vue'
import { useColorExtract } from '@/composables/useColorExtract'
import { useCategoryStore } from '@/stores/categories'
import { useThemeStore } from '@/stores/theme'
import type { MapComplexityHistoryResponse, MapDifficultyResponse, MapDifficultyStatisticsResponse, MapResponse, TopScoreSnapshot } from '@/types/api/maps'
import type { MetricType, TimeRange, TimeSeriesPoint } from '@/types/display'
import { brightenRgb } from '@/utils/color'
import { DIFFICULTY_ORDER, MAP_STATS_METRICS, TIME_RANGE_PARAMS } from '@/utils/constants'
import { formatRelativeDate } from '@/utils/formatters'
import { formatDifficulty } from '@/utils/mappers'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MapScoresSection from './maps/MapScoresSection.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const categoryStore = useCategoryStore()

const mapId = computed(() => route.params.mapId as string)

const map = ref<MapResponse | null>(null)
const activeDifficultyId = ref<string>('')
const diffStats = ref<MapDifficultyStatisticsResponse | null>(null)
const complexityHistory = ref<MapComplexityHistoryResponse[]>([])
const historicStats = ref<MapDifficultyStatisticsResponse[]>([])
const loading = ref(true)
const error = ref(false)

const activeTab = ref('leaderboard')
const contentTabs = [
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'statistics', label: 'Statistics' },
]

const coverUrl = computed(() => map.value?.coverUrl ?? '')
const { dominantColor } = useColorExtract(coverUrl)

const resolvedAccent = computed(() => {
  const raw = dominantColor.value
  if (!raw) return categoryAccent.value
  return themeStore.theme === 'dark' ? brightenRgb(raw, 60) : raw
})

const rankedDifficulties = computed<MapDifficultyResponse[]>(() => {
  if (!map.value) return []
  return map.value.difficulties
    .filter((d) => d.status === 'RANKED' && d.active)
    .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty))
})

const activeDifficulty = computed(() =>
  rankedDifficulties.value.find((d) => d.id === activeDifficultyId.value) ?? null
)

const categoryCode = computed(() => {
  if (!activeDifficulty.value) return 'overall'
  return categoryStore.getCategoryCode(activeDifficulty.value.categoryId) ?? 'overall'
})

const categoryAccent = computed(() => categoryStore.getAccent(categoryCode.value))

const categoryName = computed(() => {
  const info = categoryStore.getCategoryInfo(categoryCode.value)
  return info?.name ?? categoryCode.value
})

const difficultyTabs = computed(() =>
  rankedDifficulties.value.map((d) => ({
    key: d.id,
    label: formatDifficulty(d.difficulty),
  }))
)

const breadcrumbs = computed(() => [
  { label: 'Maps', to: '/maps' },
  { label: map.value?.songName ?? 'Map' },
])

const selectedStatsMetric = ref<MetricType>('ap')
const selectedStatsRange = ref<TimeRange>('7d')


const statsChartPoints = computed<TimeSeriesPoint[]>(() => {
  return historicStats.value
    .map((s) => ({
      timestamp: new Date(s.createdAt).getTime(),
      value: selectedStatsMetric.value === 'ap'
        ? s.maxAp
        : selectedStatsMetric.value === 'avgAccuracy'
          ? s.averageAp
          : s.totalScores,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
})

const topScoreHistory = computed<TopScoreSnapshot[]>(() => {
  const seen = new Set<string>()
  const entries: TopScoreSnapshot[] = []
  const sorted = [...historicStats.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  for (const stat of sorted) {
    if (stat.topScore && !seen.has(stat.topScore.scoreId)) {
      seen.add(stat.topScore.scoreId)
      entries.push(stat.topScore)
    }
  }
  return entries.reverse()
})

const activeComplexityHistory = computed(() =>
  complexityHistory.value.filter((h) => h.mapDifficultyId === activeDifficultyId.value)
)

interface ComplexityChange {
  date: string
  from: number
  to: number
  type: 'BUFF' | 'NERF' | 'INITIAL'
}


const complexityChanges = computed<ComplexityChange[]>(() => {
  if (activeComplexityHistory.value.length === 0) return []
  const sorted = [...activeComplexityHistory.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const changes: ComplexityChange[] = []
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    if (i === 0) {
      changes.push({
        date: entry.createdAt,
        from: entry.complexity,
        to: entry.complexity,
        type: 'INITIAL',
      })
    } else {
      const prev = sorted[i - 1]
      changes.push({
        date: entry.createdAt,
        from: prev.complexity,
        to: entry.complexity,
        type: entry.complexity > prev.complexity ? 'BUFF' : 'NERF',
      })
    }
  }
  return changes.reverse()
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function fetchMap() {
  loading.value = true
  error.value = false
  map.value = null

  try {
    const { getMap } = await import('@/api/maps')
    map.value = await getMap(mapId.value)

    const ranked = map.value.difficulties.filter((d) => d.status === 'RANKED' && d.active)
    if (ranked.length > 0) {
      activeDifficultyId.value = ranked[0].id
    }
  } catch {
    error.value = true
  }
  loading.value = false
}

async function fetchDifficultyStats() {
  if (!activeDifficultyId.value) return
  try {
    const { getDifficultyStatistics } = await import('@/api/maps')
    diffStats.value = await getDifficultyStatistics(activeDifficultyId.value)
  } catch {
    diffStats.value = null
  }
}

async function fetchComplexityHistory() {
  if (!mapId.value) return
  try {
    const { getComplexityHistory } = await import('@/api/maps')
    complexityHistory.value = await getComplexityHistory(mapId.value)
  } catch {
    complexityHistory.value = []
  }
}

async function fetchHistoricStats() {
  if (!activeDifficultyId.value) return
  try {
    const { getDifficultyStatisticsHistoric } = await import('@/api/maps')
    const params = TIME_RANGE_PARAMS[selectedStatsRange.value]
    historicStats.value = await getDifficultyStatisticsHistoric(activeDifficultyId.value, params)
  } catch {
    historicStats.value = []
  }
}

watch(mapId, () => fetchMap(), { immediate: true })

watch(activeDifficultyId, () => {
  if (activeDifficultyId.value) {
    fetchDifficultyStats()
    fetchHistoricStats()
  }
})

watch(() => map.value?.id, () => {
  if (map.value) fetchComplexityHistory()
})

watch(selectedStatsRange, () => fetchHistoricStats())
</script>

<template>
  <div class="map-detail" :style="{ '--page-accent': resolvedAccent }">
    <template v-if="loading">
      <div class="map-detail__skeleton">
        <SkeletonLoader variant="avatar" width="120px" height="120px" />
        <SkeletonLoader variant="text" width="300px" />
        <SkeletonLoader variant="text" width="200px" />
        <div class="map-detail__skeleton-stats">
          <SkeletonLoader v-for="i in 4" :key="i" variant="stat-block" />
        </div>
      </div>
    </template>

    <template v-else-if="error || !map">
      <h1 class="map-detail__error-title">Map Not Found</h1>
      <p class="map-detail__error">Could not load this map.</p>
    </template>

    <template v-else>
      <nav class="map-detail__breadcrumbs" aria-label="Breadcrumb">
        <span class="map-detail__breadcrumbs-pill">
          <router-link v-for="(crumb, i) in breadcrumbs" :key="i" :to="crumb.to ?? ''" class="map-detail__crumb"
            :class="{ 'map-detail__crumb--link': !!crumb.to }">
            {{ crumb.label }}
            <span v-if="i < breadcrumbs.length - 1" class="map-detail__crumb-sep">/</span>
          </router-link>
        </span>
      </nav>

      <div class="map-detail__bg">
        <div class="map-detail__bg-image" :style="{ backgroundImage: `url(${map.coverUrl})` }" />
        <div class="map-detail__bg-fade" />
      </div>

      <div class="map-detail__hero">
        <div class="map-detail__cover-wrap">
          <img class="map-detail__cover" :src="map.coverUrl" :alt="map.songName" />
          <div class="map-detail__cover-glow" :style="{ backgroundImage: `url(${map.coverUrl})` }" />
        </div>

        <div class="map-detail__details">
          <div class="map-detail__name-row">
            <h1 class="map-detail__song">{{ map.songName }}</h1>
          </div>
          <p class="map-detail__artist">{{ map.songAuthor }}</p>
          <p class="map-detail__mapper">Mapped by <strong>{{ map.mapAuthor }}</strong></p>

          <div class="map-detail__links">
            <BaseButton v-if="map.beatsaverCode" size="sm" :href="`beatsaver://${map.beatsaverCode}`"
              aria-label="One-Click Install" title="One-Click Install">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12" />
                <path d="M11 11.5V6.5a1.5 1.5 0 0 1 3 0V12" />
                <path d="M14 10.5V8.5a1.5 1.5 0 0 1 3 0V13a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-2a1.5 1.5 0 0 1 3 0V12" />
              </svg>
            </BaseButton>
            <BaseButton v-if="map.beatsaverCode" size="sm" :href="`https://beatsaver.com/maps/${map.beatsaverCode}`"
              aria-label="View on BeatSaver">
              <img src="https://beatsaver.com/static/favicon/favicon-32x32.png" alt="BeatSaver" width="16" height="16"
                style="border-radius: 3px;" />
            </BaseButton>
            <BaseButton v-if="activeDifficulty?.blLeaderboardId" size="sm"
              :href="`https://www.beatleader.com/leaderboard/global/${activeDifficulty.blLeaderboardId}`"
              aria-label="View on BeatLeader">
              <img src="https://beatleader.com/assets/favicon-32x32.png" alt="BeatLeader" width="16" height="16"
                style="border-radius: 3px;" />
            </BaseButton>
            <BaseButton v-if="activeDifficulty?.ssLeaderboardId" size="sm"
              :href="`https://scoresaber.com/leaderboard/${activeDifficulty.ssLeaderboardId}`"
              aria-label="View on ScoreSaber">
              <img src="https://scoresaber.com/favicon-32x32.png" alt="ScoreSaber" width="16" height="16"
                style="border-radius: 3px;" />
            </BaseButton>
          </div>

          <BaseTabs v-if="difficultyTabs.length > 1" :tabs="difficultyTabs" :model-value="activeDifficultyId"
            @update:model-value="activeDifficultyId = $event" />

          <div v-if="activeDifficulty" class="map-detail__stats-strip">
            <div class="map-detail__diff-meta">
              <ComplexityBadge :complexity="activeDifficulty.complexity" :difficulty="activeDifficulty.difficulty" />
              <span class="map-detail__category-name" :style="{ color: categoryAccent }">{{ categoryName }}</span>
            </div>
            <div class="map-detail__stats">
              <StatBlock label="Max AP" :value="diffStats?.maxAp?.toFixed(2) ?? '-'" />
              <StatBlock label="Min AP" :value="diffStats?.minAp?.toFixed(2) ?? '-'" />
              <StatBlock label="Avg AP" :value="diffStats?.averageAp?.toFixed(2) ?? '-'" />
              <StatBlock label="Total Scores" :value="diffStats?.totalScores ?? 0" :decimals="0" />
            </div>
          </div>
        </div>
      </div>

      <BaseTabs :tabs="contentTabs" :model-value="activeTab" @update:model-value="activeTab = $event" />

      <div class="map-detail__content">
        <template v-if="activeTab === 'leaderboard'">
          <MapScoresSection v-if="activeDifficultyId" :difficulty-id="activeDifficultyId" :map-id="map?.id"
            :map-name="map?.songName" :artist-name="map?.songAuthor" :map-author="map?.mapAuthor"
            :cover-url="map?.coverUrl" :category-code="categoryCode"
            :difficulty="activeDifficulty ? formatDifficulty(activeDifficulty.difficulty) : undefined"
            :accent-color="resolvedAccent" />
        </template>

        <template v-if="activeTab === 'statistics'">
          <div v-if="topScoreHistory.length > 0" class="map-detail__section">
            <h2 class="map-detail__section-heading">#1 History</h2>
            <div class="map-detail__top-history">
              <div v-for="(entry, i) in topScoreHistory" :key="entry.scoreId" class="map-detail__top-history-row"
                :class="{ 'map-detail__top-history-row--current': i === 0 }" tabindex="0" role="button"
                @click="router.push({ name: 'player-profile', params: { userId: entry.userId } })"
                @keydown.enter="router.push({ name: 'player-profile', params: { userId: entry.userId } })">
                <img class="map-detail__top-avatar" :src="entry.avatarUrl" :alt="entry.userName" />
                <span class="map-detail__top-name">{{ entry.userName }}</span>
                <span class="map-detail__top-acc">{{ (entry.accuracy * 100).toFixed(2) }}%</span>
                <span class="map-detail__top-ap">{{ entry.ap.toFixed(2) }} AP</span>
                <span class="map-detail__top-date">{{ formatRelativeDate(entry.timeSet) }}</span>
              </div>
            </div>
          </div>

          <div v-if="complexityChanges.length > 0" class="map-detail__section">
            <h2 class="map-detail__section-heading">Complexity History</h2>
            <div class="map-detail__complexity-list">
              <div v-for="(change, i) in complexityChanges" :key="i" class="map-detail__complexity-entry">
                <span class="map-detail__complexity-date">{{ formatDate(change.date) }}</span>
                <template v-if="change.type === 'INITIAL'">
                  <span class="map-detail__complexity-val">{{ change.to.toFixed(1) }}</span>
                  <span class="map-detail__complexity-tag map-detail__complexity-tag--initial">INITIAL</span>
                </template>
                <template v-else>
                  <span class="map-detail__complexity-val">{{ change.from.toFixed(1) }} → {{ change.to.toFixed(1)
                    }}</span>
                  <span class="map-detail__complexity-tag"
                    :class="change.type === 'BUFF' ? 'map-detail__complexity-tag--buff' : 'map-detail__complexity-tag--nerf'">
                    {{ change.type === 'BUFF' ? '↑ BUFF' : '↓ NERF' }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div v-if="activeDifficultyId" class="map-detail__section">
            <h2 class="map-detail__section-heading">Statistics Over Time</h2>
            <TimeSeriesChart :data="statsChartPoints" :metric-label="selectedStatsMetric" :accent-color="resolvedAccent"
              :available-metrics="MAP_STATS_METRICS" :selected-metric="selectedStatsMetric"
              :selected-range="selectedStatsRange" @update:selected-metric="selectedStatsMetric = $event as MetricType"
              @update:selected-range="selectedStatsRange = $event" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.map-detail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  --accent: var(--page-accent, var(--accent-overall));
}

.map-detail>*:not(.map-detail__bg) {
  width: 100%;
  max-width: 1030px;
  position: relative;
  z-index: 1;
}

.map-detail__bg {
  position: absolute;
  top: calc(-1 * var(--space-xl));
  left: calc(-1 * var(--space-xl));
  right: calc(-1 * var(--space-xl));
  height: 75vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.map-detail__bg-image {
  position: absolute;
  inset: -80px;
  background-size: cover;
  background-position: center 20%;
  background-repeat: no-repeat;
  filter: blur(40px);
  opacity: 0.3;
}

.map-detail__bg-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, var(--bg-base) 100%);
}

.map-detail__breadcrumbs {
  display: flex;
}

.map-detail__breadcrumbs-pill {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: color-mix(in srgb, var(--bg-base) 70%, transparent);
  backdrop-filter: blur(8px);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
}

.map-detail__crumb {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  text-decoration: none;
}

.map-detail__crumb--link {
  color: var(--text-primary);
  transition: color 120ms ease;
}

.map-detail__crumb--link:hover {
  color: var(--accent);
}

.map-detail__crumb-sep {
  margin-left: var(--space-xs);
  color: var(--text-secondary);
}

.map-detail__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  background: color-mix(in srgb, var(--bg-base) 55%, transparent);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-card);
}

.map-detail__cover-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.map-detail__cover {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-avatar);
  object-fit: cover;
  position: relative;
  z-index: 1;
  border: 1px solid var(--bg-overlay);
}

.map-detail__cover-glow {
  position: absolute;
  inset: -8px;
  border-radius: var(--radius-avatar);
  background-size: cover;
  background-position: center;
  filter: blur(16px) saturate(1.8);
  opacity: 0.4;
  z-index: 0;
  pointer-events: none;
}

.map-detail__details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  min-width: 0;
}

.map-detail__name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.map-detail__song {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.map-detail__artist {
  font-size: var(--text-body);
  color: var(--text-secondary);
  margin: 0;
}

.map-detail__mapper {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin: 0;
}

.map-detail__mapper strong {
  color: var(--text-secondary);
  font-weight: 500;
}

.map-detail__links {
  display: flex;
  gap: var(--space-sm);
}

.map-detail__stats-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
}

.map-detail__diff-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.map-detail__category-name {
  font-size: var(--text-body);
  font-weight: 600;
}

.map-detail__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
}

.map-detail__content {
  min-height: 400px;
}

.map-detail__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.map-detail__section-heading {
  font-size: var(--text-section);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.map-detail__top-history {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.map-detail__top-history-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-btn);
  transition: background 120ms ease;
}

.map-detail__top-history-row:hover {
  background: var(--bg-elevated);
}

.map-detail__top-history-row--current {
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
}

.map-detail__top-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-btn);
  object-fit: cover;
  flex-shrink: 0;
}

.map-detail__top-name {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-detail__top-acc {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
  flex-shrink: 0;
}

.map-detail__top-ap {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--accent);
  flex-shrink: 0;
}

.map-detail__top-date {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.map-detail__complexity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.map-detail__complexity-entry {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border-radius: var(--radius-btn);
}

.map-detail__complexity-date {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  min-width: 100px;
}

.map-detail__complexity-val {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
}

.map-detail__complexity-tag {
  font-size: var(--text-caption);
  font-weight: 600;
  padding: 1px var(--space-sm);
  border-radius: var(--radius-pill);
}

.map-detail__complexity-tag--initial {
  color: var(--text-secondary);
  background: var(--bg-elevated);
}

.map-detail__complexity-tag--buff {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 15%, transparent);
}

.map-detail__complexity-tag--nerf {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 15%, transparent);
}

.map-detail__error-title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.map-detail__error {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--space-3xl);
}

.map-detail__skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl) var(--space-lg);
  background: color-mix(in srgb, var(--bg-base) 55%, transparent);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-card);
}

.map-detail__skeleton-stats {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

@media (max-width: 767px) {
  .map-detail__bg {
    top: calc(-1 * var(--space-md));
    left: calc(-1 * var(--space-md));
    right: calc(-1 * var(--space-md));
  }

  .map-detail__cover-wrap {
    width: 96px;
    height: 96px;
  }

  .map-detail__cover {
    width: 96px;
    height: 96px;
  }

  .map-detail__stats {
    justify-content: center;
  }

  .map-detail__diff-meta {
    flex-wrap: wrap;
    justify-content: center;
  }

  .map-detail__top-player,
  .map-detail__top-history-row {
    flex-wrap: wrap;
  }
}
</style>
