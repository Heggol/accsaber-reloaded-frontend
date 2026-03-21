<script setup lang="ts">
import BaseSelect from '@/components/common/BaseSelect.vue'
import GlowImage from '@/components/common/GlowImage.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import CountryFlag from '@/components/domain/CountryFlag.vue'
import PlayerTooltipTrigger from '@/components/domain/PlayerTooltipTrigger.vue'
import ScoreDetailModal from '@/components/domain/ScoreDetailModal.vue'
import ScoreTable from '@/components/domain/ScoreTable.vue'
import { usePageableRoute } from '@/composables/usePageableRoute'
import { useAuthStore } from '@/stores/auth'
import { useModifierStore } from '@/stores/modifiers'
import type { CategoryCode, DifficultyScoreDisplay, ScoreDisplay, TableColumn } from '@/types/display'
import { COUNTRY_OPTIONS } from '@/utils/countries'
import { toDifficultyScoreDisplay } from '@/utils/mappers'
import { getRankClass } from '@/utils/ranking'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  difficultyId: string
  mapId?: string
  mapName?: string
  artistName?: string
  coverUrl?: string
  categoryCode?: CategoryCode
  difficulty?: string
  accentColor?: string
  mapAuthor?: string
}>()

const router = useRouter()
const authStore = useAuthStore()
const modifierStore = useModifierStore()

const { currentPage, sortState, paginationParams, setPage, setSort, resetPage } = usePageableRoute({
  defaultSort: 'ap',
  defaultOrder: 'desc',
  defaultSize: 50,
  sortFieldMap: {
    rank: 'rank',
    accuracy: 'accuracy',
    score: 'score',
    ap: 'ap',
    weighted: 'weightedAp',
    streak115: 'streak115',
    date: 'timeSet',
  },
})

const searchQuery = ref('')
const countryFilter = ref('')

const scores = ref<DifficultyScoreDisplay[]>([])
const totalPages = ref(0)
const loading = ref(true)

const detailOpen = ref(false)
const detailScore = ref<ScoreDisplay | null>(null)
const detailUserId = ref('')

const showStreak115 = computed(() =>
  sortState.value.key === 'streak115' || scores.value.some((s) => s.streak115 != null && s.streak115 > 0),
)

const allColumns: TableColumn[] = [
  { key: 'rank', label: '#', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'accuracy', label: 'Acc', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'score', label: 'Score', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'ap', label: 'AP', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'weighted', label: 'Weighted', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'streak115', label: '115s', sortable: true, align: 'right', mono: true, width: '60px' },
  { key: 'date', label: 'Date', sortable: true, align: 'right', width: '80px' },
  { key: 'detail', label: '', align: 'center', width: '40px' },
]

const columns = computed(() =>
  showStreak115.value
    ? allColumns
    : allColumns.filter((c) => c.key !== 'streak115'),
)

const rows = computed(() => {
  const pageOffset = (paginationParams.value.page ?? 0) * (paginationParams.value.size ?? 50)
  return scores.value.map((s, i) => ({
    _index: i,
    _userId: s.userId,
    rank: s.rank,
    countryRank: countryFilter.value ? pageOffset + i + 1 : 0,
    avatarUrl: s.avatarUrl,
    userName: s.userName,
    country: s.country,
    accuracy: s.accuracy,
    score: s.score,
    ap: s.ap,
    weighted: s.weightedAp,
    streak115: s.streak115,
    date: s.date,
  }))
})

const countryOptions = COUNTRY_OPTIONS

function scoreRowClass(row: Record<string, unknown>): Record<string, boolean> | undefined {
  if (!authStore.userId) return undefined
  return { 'data-table__row--self-highlight': row._userId === authStore.userId }
}

function playerRowTo(row: Record<string, unknown>) {
  return { name: 'player-profile', params: { userId: row._userId as string } }
}

function handleRowClick(row: Record<string, unknown>) {
  router.push(playerRowTo(row))
}

function openDetail(index: number, event: Event) {
  event.stopPropagation()
  const s = scores.value[index]
  if (!s) return
  detailUserId.value = s.userId
  detailScore.value = {
    mapId: props.mapId,
    mapDifficultyId: props.difficultyId,
    mapName: props.mapName ?? 'Unknown Map',
    artistName: props.artistName,
    difficulty: props.difficulty ?? '',
    categoryCode: props.categoryCode ?? 'overall',
    coverUrl: props.coverUrl,
    leaderboardRank: s.rank,
    score: s.score,
    scoreNoMods: s.scoreNoMods,
    accuracy: s.accuracy,
    ap: s.ap,
    weightedAp: s.weightedAp,
    modifiers: s.modifiers,
    date: s.date,
    misses: s.misses,
    badCuts: s.badCuts,
    maxCombo: s.maxCombo,
    wallHits: s.wallHits,
    bombHits: s.bombHits,
    pauses: s.pauses,
    streak115: s.streak115,
    playCount: s.playCount,
    hmd: s.hmd,
    xpGained: s.xpGained,
    rankWhenSet: s.rankWhenSet,
    blScoreId: s.blScoreId,
    mapAuthor: props.mapAuthor,
    userName: s.userName,
  }
  detailOpen.value = true
}

async function fetchScores() {
  loading.value = true
  try {
    const { getDifficultyScores } = await import('@/api/maps')
    const params = {
      ...paginationParams.value,
      search: searchQuery.value.trim() || undefined,
      country: countryFilter.value || undefined,
    }
    const res = await getDifficultyScores(props.difficultyId, params)
    scores.value = res.content.map((s) =>
      toDifficultyScoreDisplay(s, modifierStore.resolveModifierCodes(s.modifierIds))
    )
    totalPages.value = res.totalPages
  } catch {
    scores.value = []
    totalPages.value = 0
  }
  loading.value = false
}

watch(searchQuery, () => { resetPage() })
watch(countryFilter, () => { resetPage() })

watch(
  [() => props.difficultyId, paginationParams, searchQuery, countryFilter],
  () => fetchScores(),
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="map-scores">
    <div class="map-scores__controls">
      <BaseSelect
        :model-value="countryFilter"
        :options="countryOptions"
        placeholder="All Countries"
        searchable
        @update:model-value="countryFilter = $event"
      />
      <SearchBox v-model="searchQuery" placeholder="Search players..." />
    </div>

    <ScoreTable
      :columns="columns"
      :rows="rows"
      :sort-state="sortState"
      :loading="loading"
      :loading-rows="10"
      :page="currentPage"
      :total-pages="totalPages"
      medal-ranks
      row-clickable
      :row-to="playerRowTo"
      :row-class="scoreRowClass"
      empty-message="No scores recorded yet."
      @sort="setSort"
      @row-click="handleRowClick"
      @update:page="setPage"
    >
      <template #cell-rank="{ value, row }">
        <span v-if="countryFilter" class="map-scores__rank" :class="getRankClass(row.countryRank as number)">
          #{{ row.countryRank }}
          <span class="map-scores__rank-global">(#{{ value }})</span>
        </span>
        <span v-else class="map-scores__rank" :class="getRankClass(value as number)">
          #{{ value }}
        </span>
      </template>

      <template #cell-player="{ row }">
        <div class="map-scores__player">
          <GlowImage :src="(row.avatarUrl as string)" :alt="(row.userName as string)" />
          <PlayerTooltipTrigger
            :user-id="(row._userId as string)"
            :user-name="(row.userName as string)"
            :avatar-url="(row.avatarUrl as string)"
            :country="(row.country as string)"
          >
            <span class="map-scores__name">{{ row.userName }}</span>
            <CountryFlag :country="(row.country as string)" />
          </PlayerTooltipTrigger>
        </div>
      </template>

      <template #cell-streak115="{ value }">
        <span v-if="value != null && value !== 0">{{ value }}</span>
        <span v-else class="map-scores__muted">&ndash;</span>
      </template>

      <template #cell-detail="{ row }">
        <button class="map-scores__detail-btn" aria-label="View score details"
          @click="openDetail(row._index as number, $event)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11L5.5 5L8 8L10.5 4L14 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 13H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </template>

      <template #mobile-card="{ row }">
        <router-link :to="playerRowTo(row)" class="ms-card" :class="{ 'ms-card--self-highlight': !!authStore.userId && row._userId === authStore.userId }">
          <span class="ms-card__rank map-scores__rank" :class="getRankClass(countryFilter ? (row.countryRank as number) : (row.rank as number))">
            #{{ countryFilter ? row.countryRank : row.rank }}
          </span>
          <GlowImage :src="(row.avatarUrl as string)" :alt="(row.userName as string)" :size="28" />
          <div class="ms-card__info">
            <span class="ms-card__name">{{ row.userName }}</span>
            <CountryFlag :country="(row.country as string)" />
          </div>
          <div class="ms-card__stats">
            <span class="ms-card__acc">{{ ((row.accuracy as number) * 100).toFixed(2) }}%</span>
            <span class="ms-card__ap">{{ (row.ap as number).toFixed(2) }}</span>
          </div>
          <button class="ms-card__detail-btn" aria-label="View score details"
            @click.stop="openDetail(row._index as number, $event)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 11L5.5 5L8 8L10.5 4L14 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 13H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </router-link>
      </template>
    </ScoreTable>

    <ScoreDetailModal
      :open="detailOpen"
      :score="detailScore"
      :user-id="detailUserId"
      :accent-color="accentColor"
      @close="detailOpen = false"
    />
  </div>
</template>

<style scoped>
.map-scores {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.map-scores__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.map-scores__rank {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-secondary);
}

.map-scores__rank-global {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  font-weight: 400;
  margin-left: 2px;
}

.map-scores__player {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.map-scores__name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-scores__muted {
  color: var(--text-tertiary);
}

.map-scores__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;
}

.map-scores__detail-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

:deep(.data-table__row--self-highlight) {
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-surface));
  border-left: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

.ms-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-left: 2px solid transparent;
  border-radius: var(--radius-card);
  cursor: pointer;
  min-height: 48px;
  transition: border-color 120ms ease;
  text-decoration: none;
  color: inherit;
}

.ms-card:hover {
  border-left-color: var(--accent, var(--text-tertiary));
}

.ms-card__rank {
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.ms-card__info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
}

.ms-card__name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-card__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 2px;
}

.ms-card__acc {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
}

.ms-card__ap {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.ms-card__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms ease, border-color 120ms ease;
}

.ms-card__detail-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

.ms-card--self-highlight {
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-surface));
  border-left-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
</style>
