<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatBlock from '@/components/common/StatBlock.vue'
import TimeSeriesChart from '@/components/domain/TimeSeriesChart.vue'
import { useColorExtract } from '@/composables/useColorExtract'
import { useThemeStore } from '@/stores/theme'
import type { ScoreResponse } from '@/types/api/users'
import type { MetricType, ScoreDisplay, TimeRange, TimeSeriesPoint } from '@/types/display'
import { brightenRgb } from '@/utils/color'
import { SCORE_DETAIL_METRICS, TIME_RANGE_PARAMS } from '@/utils/constants'
import { formatRelativeDate } from '@/utils/formatters'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  open: boolean
  score: ScoreDisplay | null
  userId: string
}>()

const emit = defineEmits<{
  close: []
}>()

type ScoreMetric = 'accuracy' | 'ap' | 'xpCumulative' | 'xpPerAttempt'

const router = useRouter()
const themeStore = useThemeStore()
const coverUrl = computed(() => props.score?.coverUrl ?? '')
const { dominantColor } = useColorExtract(coverUrl)

const modalTitle = computed(() => {
  if (!props.score) return 'Score Detail'
  const { userName, artistName, mapName } = props.score
  const mapPart = artistName ? `${artistName} - ${mapName}` : mapName
  return userName ? `${userName}'s score on ${mapPart}` : mapPart
})

const resolvedAccent = computed(() => {
  const raw = dominantColor.value
  if (!raw) return 'var(--accent)'
  return themeStore.theme === 'dark' ? brightenRgb(raw, 60) : raw
})

const historicData = ref<ScoreResponse[]>([])
const selectedMetric = ref<ScoreMetric>('accuracy')
const selectedRange = ref<TimeRange>('14d')

const playCount = computed(() => historicData.value.length)

const totalMapXp = computed(() => {
  return historicData.value.reduce((sum, s) => sum + (s.xpGained ?? 0), 0)
})

const totalBaseXp = computed(() => {
  return historicData.value.reduce((sum, s) => sum + (s.baseXp ?? 0), 0)
})

const totalBonusXp = computed(() => {
  return historicData.value.reduce((sum, s) => sum + (s.bonusXp ?? 0), 0)
})

function buildTooltipLines(s: ScoreResponse, prev: ScoreResponse | null): string[] {
  const lines: string[] = []
  lines.push(`Accuracy: ${(s.accuracy * 100).toFixed(2)}%`)
  lines.push(`AP: ${s.ap.toFixed(2)}`)
  lines.push(`XP: ${(s.xpGained ?? 0).toFixed(1)} (${(s.baseXp ?? 0).toFixed(0)} base + ${(s.bonusXp ?? 0).toFixed(1)} bonus)`)
  if (s.misses > 0) lines.push(`Misses: ${s.misses}`)
  if (s.rankWhenSet != null) lines.push(`Rank: #${s.rankWhenSet}`)
  if (prev) {
    const accDelta = (s.accuracy - prev.accuracy) * 100
    const apDelta = s.ap - prev.ap
    const parts: string[] = []
    if (accDelta !== 0) parts.push(`${accDelta > 0 ? '+' : ''}${accDelta.toFixed(2)}% acc`)
    if (apDelta !== 0) parts.push(`${apDelta > 0 ? '+' : ''}${apDelta.toFixed(2)} AP`)
    if (parts.length > 0) lines.push(`Δ ${parts.join(', ')}`)
  }
  return lines
}

const chartPoints = computed<TimeSeriesPoint[]>(() => {
  const sorted = [...historicData.value].sort(
    (a, b) => new Date(a.timeSet).getTime() - new Date(b.timeSet).getTime(),
  )

  if (selectedMetric.value === 'xpCumulative') {
    let cumulative = 0
    return sorted.map((s, i) => {
      cumulative += s.xpGained ?? 0
      return {
        timestamp: new Date(s.timeSet).getTime(),
        value: cumulative,
        tooltipLines: buildTooltipLines(s, i > 0 ? sorted[i - 1] : null),
      }
    })
  }

  if (selectedMetric.value === 'xpPerAttempt') {
    return sorted.map((s, i) => ({
      timestamp: new Date(s.timeSet).getTime(),
      value: s.xpGained ?? 0,
      tooltipLines: buildTooltipLines(s, i > 0 ? sorted[i - 1] : null),
    }))
  }

  return sorted.map((s, i) => ({
    timestamp: new Date(s.timeSet).getTime(),
    value: selectedMetric.value === 'accuracy' ? s.accuracy * 100 : s.ap,
    tooltipLines: buildTooltipLines(s, i > 0 ? sorted[i - 1] : null),
  }))
})

const chartFormatValue = computed(() => {
  if (selectedMetric.value === 'accuracy') return (v: number) => `${v.toFixed(2)}%`
  if (selectedMetric.value === 'xpCumulative' || selectedMetric.value === 'xpPerAttempt') return (v: number) => `${v.toFixed(1)} XP`
  return undefined
})

function goToProfile() {
  emit('close')
  router.push({ name: 'player-profile', params: { userId: props.userId } })
}

function goToMap() {
  if (!props.score?.mapId) return
  emit('close')
  router.push({
    path: `/maps/${props.score.mapId}`,
    query: { difficultyId: props.score.mapDifficultyId },
  })
}

async function fetchHistoric() {
  if (!props.score) return
  try {
    const { getUserScoresHistoric } = await import('@/api/users')
    const params = TIME_RANGE_PARAMS[selectedRange.value]
    historicData.value = await getUserScoresHistoric(props.userId, {
      mapDifficultyId: props.score.mapDifficultyId,
      amount: params.amount,
      unit: params.unit,
    })
  } catch {
    historicData.value = []
  }
}

watch(
  [() => props.open, () => props.score?.mapDifficultyId, selectedRange],
  ([open]) => {
    if (open && props.score) fetchHistoric()
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal :open="open" :title="modalTitle" max-width="680px" @close="emit('close')">
    <div v-if="score" class="score-detail" :style="{ '--detail-accent': resolvedAccent }">
      <div class="score-detail__bleed" />

      <p v-if="score.mapAuthor" class="score-detail__mapper-line">
        Mapped by <strong>{{ score.mapAuthor }}</strong>
      </p>

      <div class="score-detail__hero">
        <div v-if="score.coverUrl" class="score-detail__cover-wrap">
          <img :src="score.coverUrl" :alt="score.mapName" class="score-detail__cover" />
          <div class="score-detail__cover-glow" :style="{ backgroundImage: `url(${score.coverUrl})` }" />
        </div>
        <div class="score-detail__primary">
          <StatBlock
            label="Accuracy"
            :value="`${(score.accuracy * 100).toFixed(2)}%`"
            :accent-color="resolvedAccent"
          />
          <StatBlock label="AP" :value="score.ap.toFixed(2)" :accent-color="resolvedAccent" />
          <StatBlock label="Weighted AP" :value="score.weightedAp.toFixed(2)" />
          <div v-if="totalMapXp > 0" class="score-detail__xp-wrap">
            <StatBlock label="Total Map XP" :value="totalMapXp.toFixed(1)" :accent-color="resolvedAccent" />
            <span class="score-detail__xp-info" tabindex="0" aria-label="XP breakdown">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span class="score-detail__xp-tooltip">
                <span class="score-detail__xp-tooltip-row">
                  <span class="score-detail__xp-tooltip-label">Base XP</span>
                  <span class="score-detail__xp-tooltip-value">{{ totalBaseXp.toFixed(1) }}</span>
                </span>
                <span class="score-detail__xp-tooltip-row">
                  <span class="score-detail__xp-tooltip-label">Bonus XP</span>
                  <span class="score-detail__xp-tooltip-value"><span class="score-detail__xp-tooltip-value--bonus">{{ totalBonusXp.toFixed(1) }}</span></span>
                </span>
                <span class="score-detail__xp-tooltip-divider" />
                <span class="score-detail__xp-tooltip-row">
                  <span class="score-detail__xp-tooltip-label score-detail__xp-tooltip-label--total">Total</span>
                  <span class="score-detail__xp-tooltip-value score-detail__xp-tooltip-value--total">{{ totalMapXp.toFixed(1) }} XP</span>
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="score-detail__section">
        <h3 class="score-detail__heading">Score</h3>
        <div class="score-detail__row-grid">
          <div class="score-detail__pair">
            <span class="score-detail__label">Score</span>
            <span class="score-detail__value">{{ score.score.toLocaleString() }}</span>
          </div>
          <div v-if="score.scoreNoMods != null" class="score-detail__pair">
            <span class="score-detail__label">No Mods</span>
            <span class="score-detail__value">{{ score.scoreNoMods.toLocaleString() }}</span>
          </div>
          <div class="score-detail__pair">
            <span class="score-detail__label">Rank</span>
            <span class="score-detail__value">#{{ score.leaderboardRank }}</span>
          </div>
          <div v-if="score.rankWhenSet != null" class="score-detail__pair">
            <span class="score-detail__label">Rank When Set</span>
            <span class="score-detail__value">#{{ score.rankWhenSet }}</span>
          </div>
        </div>
      </div>

      <div v-if="score.maxCombo != null || score.misses != null || score.badCuts != null" class="score-detail__section">
        <h3 class="score-detail__heading">Precision</h3>
        <div class="score-detail__row-grid">
          <div v-if="score.maxCombo != null" class="score-detail__pair">
            <span class="score-detail__label">Max Combo</span>
            <span class="score-detail__value">{{ score.maxCombo.toLocaleString() }}</span>
          </div>
          <div v-if="score.streak115 != null" class="score-detail__pair">
            <span class="score-detail__label">115 Streak</span>
            <span class="score-detail__value">{{ score.streak115.toLocaleString() }}</span>
          </div>
          <div v-if="score.misses != null" class="score-detail__pair">
            <span class="score-detail__label">Misses</span>
            <span class="score-detail__value" :class="{ 'score-detail__value--bad': score.misses > 0 }">
              {{ score.misses }}
            </span>
          </div>
          <div v-if="score.badCuts != null" class="score-detail__pair">
            <span class="score-detail__label">Bad Cuts</span>
            <span class="score-detail__value" :class="{ 'score-detail__value--bad': score.badCuts > 0 }">
              {{ score.badCuts }}
            </span>
          </div>
          <div v-if="score.wallHits != null" class="score-detail__pair">
            <span class="score-detail__label">Wall Hits</span>
            <span class="score-detail__value" :class="{ 'score-detail__value--bad': score.wallHits > 0 }">
              {{ score.wallHits }}
            </span>
          </div>
          <div v-if="score.bombHits != null" class="score-detail__pair">
            <span class="score-detail__label">Bomb Hits</span>
            <span class="score-detail__value" :class="{ 'score-detail__value--bad': score.bombHits > 0 }">
              {{ score.bombHits }}
            </span>
          </div>
        </div>
      </div>

      <div class="score-detail__section">
        <h3 class="score-detail__heading">Details</h3>
        <div class="score-detail__row-grid">
          <div v-if="score.modifiers.length > 0" class="score-detail__pair">
            <span class="score-detail__label">Modifiers</span>
            <span class="score-detail__value">{{ score.modifiers.join(', ') }}</span>
          </div>
          <div v-if="score.playCount != null" class="score-detail__pair">
            <span class="score-detail__label">Play Count</span>
            <span class="score-detail__value">{{ score.playCount }}</span>
          </div>
          <div v-if="score.pauses != null" class="score-detail__pair">
            <span class="score-detail__label">Pauses</span>
            <span class="score-detail__value">{{ score.pauses }}</span>
          </div>
          <div v-if="score.hmd" class="score-detail__pair">
            <span class="score-detail__label">HMD</span>
            <span class="score-detail__value">{{ score.hmd }}</span>
          </div>
          <div class="score-detail__pair">
            <span class="score-detail__label">Date</span>
            <span class="score-detail__value">{{ formatRelativeDate(score.date) }}</span>
          </div>
        </div>
      </div>

      <div class="score-detail__section">
        <h3 class="score-detail__heading">Links</h3>
        <div class="score-detail__links">
          <BaseButton size="sm" @click="goToProfile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            View Profile
          </BaseButton>
          <BaseButton v-if="score.mapId" size="sm" @click="goToMap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Map Leaderboard
          </BaseButton>
          <BaseButton
            v-if="score.blScoreId"
            size="sm"
            :href="`https://replay.beatleader.com/?scoreId=${score.blScoreId}`"
          >
            <img src="https://beatleader.com/assets/bs-pepe.gif" alt="Replay" width="20" height="20" style="border-radius: 3px;" />
            Replay
          </BaseButton>
          <BaseButton
            v-if="score.blScoreId"
            size="sm"
            :href="`https://allpoland.github.io/ArcViewer/?scoreID=${score.blScoreId}`"
          >
            <img src="https://beatleader.com/assets/ArcViewerIcon.webp" alt="ArcViewer" width="20" height="20" style="border-radius: 3px;" />
            ArcViewer
          </BaseButton>
          <BaseButton
            v-if="score.blScoreId"
            size="sm"
            :href="`https://beatleader.com/score/${score.blScoreId}`"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            More Info
          </BaseButton>
        </div>
      </div>

      <div class="score-detail__section">
        <h3 class="score-detail__heading">History</h3>
        <TimeSeriesChart
          :data="chartPoints"
          :metric-label="selectedMetric"
          :accent-color="resolvedAccent"
          :available-metrics="SCORE_DETAIL_METRICS"
          :selected-metric="selectedMetric as MetricType"
          :selected-range="selectedRange"
          :format-value="chartFormatValue"
          @update:selected-metric="selectedMetric = $event as ScoreMetric"
          @update:selected-range="selectedRange = $event"
        />
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
:deep(.modal__header) {
  justify-content: center;
  position: relative;
}

:deep(.modal__title) {
  text-align: center;
}

:deep(.modal__close) {
  position: absolute;
  right: var(--space-lg);
}

.score-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  position: relative;
  --accent: var(--detail-accent);
}

.score-detail__bleed {
  position: absolute;
  top: calc(-1 * var(--space-lg));
  left: calc(-1 * var(--space-lg));
  right: calc(-1 * var(--space-lg));
  height: 160px;
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--detail-accent) 20%, transparent),
    transparent 70%
  );
  pointer-events: none;
}

.score-detail__hero {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--bg-overlay);
  position: relative;
}

.score-detail__cover-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.score-detail__cover {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-card);
  object-fit: cover;
  position: relative;
  z-index: 1;
  border: 1px solid var(--bg-overlay);
}

.score-detail__cover-glow {
  position: absolute;
  inset: -6px;
  border-radius: var(--radius-avatar);
  background-size: cover;
  background-position: center;
  filter: blur(12px) saturate(1.8);
  opacity: 0.4;
  z-index: 0;
  pointer-events: none;
}

.score-detail__primary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  flex: 1;
  min-width: 0;
}

.score-detail__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.score-detail__heading {
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.score-detail__row-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm) var(--space-md);
}

.score-detail__pair {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.score-detail__label {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

.score-detail__value {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
}

.score-detail__value--bad {
  color: var(--error);
}

.score-detail__mapper-line {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  text-align: center;
  margin: 0;
  position: relative;
}
.score-detail__mapper-line strong {
  color: var(--text-secondary);
  font-weight: 500;
}

.score-detail__xp-wrap {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.score-detail__xp-info {
  position: relative;
  color: var(--text-tertiary);
  cursor: help;
  display: inline-flex;
  align-items: center;
  margin-top: 2px;
  transition: color 120ms ease;
}

.score-detail__xp-info:hover,
.score-detail__xp-info:focus-visible {
  color: var(--text-secondary);
}

.score-detail__xp-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  right: -8px;
  background: var(--bg-elevated);
  border: 1px solid var(--bg-overlay);
  border-radius: 6px;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.score-detail__xp-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 12px;
  border: 5px solid transparent;
  border-bottom-color: var(--bg-overlay);
}

.score-detail__xp-info:hover .score-detail__xp-tooltip,
.score-detail__xp-info:focus-visible .score-detail__xp-tooltip {
  opacity: 1;
}

.score-detail__xp-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-lg);
}

.score-detail__xp-tooltip-label {
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.score-detail__xp-tooltip-label--total {
  font-weight: 600;
  color: var(--text-primary);
}

.score-detail__xp-tooltip-value {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--text-primary);
}

.score-detail__xp-tooltip-hint {
  color: var(--text-primary);
}

.score-detail__xp-tooltip-value--bonus {
  color: var(--detail-accent, var(--accent));
}

.score-detail__xp-tooltip-value--total {
  font-weight: 600;
  color: var(--text-primary);
}

.score-detail__xp-tooltip-divider {
  height: 1px;
  background: var(--bg-overlay);
  margin: 2px 0;
}

.score-detail__links {
  display: flex;
  gap: var(--space-sm);
}

@media (max-width: 767px) {
  .score-detail__row-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .score-detail__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-detail__primary {
    gap: 0;
  }
}
</style>
