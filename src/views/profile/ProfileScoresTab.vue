<script setup lang="ts">
import GlowImage from '@/components/common/GlowImage.vue'
import ScoreDetailModal from '@/components/domain/ScoreDetailModal.vue'
import ScoreTable from '@/components/domain/ScoreTable.vue'
import { usePageableRoute } from '@/composables/usePageableRoute'
import { useCategoryStore } from '@/stores/categories'
import { useModifierStore } from '@/stores/modifiers'
import type { ScoreResponse } from '@/types/api/users'
import type { CategoryCode, ScoreDisplay, TableColumn } from '@/types/display'
import type { Page } from '@/types/pagination'
import { toScoreDisplay } from '@/utils/mappers'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  userId: string
  category: CategoryCode
  search?: string
}>(), {
  search: '',
})

const router = useRouter()
const categoryStore = useCategoryStore()
const modifierStore = useModifierStore()

const { currentPage, sortState, paginationParams, setPage, setSort, resetPage } = usePageableRoute({
  defaultSort: 'ap',
  defaultOrder: 'desc',
  defaultSize: 20,
  sortFieldMap: { leaderboardRank: 'rank', weighted: 'weightedAp', date: 'timeSet' },
})

const loading = ref(false)
const scoreData = ref<Page<ScoreResponse> | null>(null)

const detailOpen = ref(false)
const detailScore = ref<ScoreDisplay | null>(null)

const scores = computed<ScoreDisplay[]>(() => {
  if (!scoreData.value) return []
  return scoreData.value.content.map((s) => {
    const categoryCode = categoryStore.getCategoryCode(s.categoryId)
    return toScoreDisplay(
      s,
      modifierStore.resolveModifierCodes(s.modifierIds),
      categoryCode,
    )
  })
})

const rows = computed(() =>
  scores.value.map((s) => ({
    mapDifficultyId: s.mapDifficultyId,
    mapId: s.mapId,
    coverUrl: s.coverUrl,
    mapName: s.mapName,
    difficulty: s.difficulty,
    category: (categoryStore.getCategoryInfo(s.categoryCode)?.name ?? s.categoryCode).replace(/ Acc$/, ''),
    categoryCode: s.categoryCode,
    ap: s.ap,
    accuracy: s.accuracy,
    weighted: s.weightedAp,
    streak115: s.streak115,
    date: s.date,
    leaderboardRank: s.leaderboardRank,
  })),
)

const totalPages = computed(() => scoreData.value?.totalPages ?? 0)

const accent = computed(() => categoryStore.getAccent(props.category))

const showStreak115 = computed(() =>
  sortState.value.key === 'streak115' || scores.value.some((s) => s.streak115 != null),
)

const allColumns: TableColumn[] = [
  { key: 'leaderboardRank', label: '#', sortable: true, align: 'right', mono: true, width: '50px' },
  { key: 'cover', label: '', width: '44px' },
  { key: 'mapName', label: 'Map', align: 'left' },
  { key: 'difficulty', label: 'Diff', align: 'center', width: '70px' },
  { key: 'accuracy', label: 'Acc', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'ap', label: 'AP', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'weighted', label: 'Weighted', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'category', label: 'Category', align: 'center', width: '100px' },
  { key: 'streak115', label: '115s', sortable: true, align: 'right', mono: true, width: '60px' },
  { key: 'date', label: 'Date', sortable: true, align: 'right', width: '80px' },
  { key: 'detail', label: '', align: 'center', width: '40px' },
]

const columns = computed(() =>
  showStreak115.value
    ? allColumns
    : allColumns.filter((c) => c.key !== 'streak115'),
)

async function fetchScores() {
  loading.value = true
  try {
    const { getUserScores } = await import('@/api/users')
    const categoryId = props.category !== 'overall'
      ? categoryStore.getCategoryId(props.category)
      : undefined

    const search = props.search.trim() || undefined
    const params = {
      ...paginationParams.value,
      categoryId,
      search,
    }

    scoreData.value = await getUserScores(props.userId, params)
  } catch {
    scoreData.value = null
  }
  loading.value = false
}

function scoreRowTo(row: Record<string, unknown>) {
  if (typeof row.mapId !== 'string') return undefined
  const query = typeof row.mapDifficultyId === 'string' ? { difficultyId: row.mapDifficultyId } : undefined
  return { path: `/maps/${row.mapId}`, query }
}

function handleRowClick(row: Record<string, unknown>) {
  const to = scoreRowTo(row)
  if (to) router.push(to)
}

function openDetail(diffId: string, event: Event) {
  event.stopPropagation()
  detailScore.value = scores.value.find((s) => s.mapDifficultyId === diffId) ?? null
  detailOpen.value = true
}

watch(() => props.search, () => { resetPage() })

watch(
  [() => props.userId, () => props.category, paginationParams, () => props.search],
  () => { fetchScores() },
  { immediate: true },
)
</script>

<template>
  <div class="scores-tab">
    <ScoreTable
      :columns="columns"
      :rows="rows"
      :sort-state="sortState"
      :loading="loading"
      :loading-rows="8"
      :page="currentPage"
      :total-pages="totalPages"
      row-clickable
      :row-to="scoreRowTo"
      row-key="mapDifficultyId"
      :empty-message="props.search ? `No maps matching &quot;${props.search}&quot;` : 'No scores found'"
      @sort="setSort"
      @row-click="handleRowClick"
      @update:page="setPage"
    >
      <template #cell-cover="{ row }">
        <GlowImage v-if="row.coverUrl" :src="(row.coverUrl as string)" :alt="(row.mapName as string)" />
      </template>

      <template #cell-mapName="{ value }">
        <span class="scores-tab__map-name" :title="(value as string)">
          {{ (value as string).length > 24 ? (value as string).slice(0, 24) + '…' : value }}
        </span>
      </template>

      <template #cell-category="{ row }">
        <span class="scores-tab__category"
          :style="{ '--cat-accent': categoryStore.getAccent(row.categoryCode as string) }">
          {{ row.category }}
        </span>
      </template>

      <template #cell-difficulty="{ value }">
        <span class="scores-tab__difficulty">{{ value }}</span>
      </template>

      <template #cell-streak115="{ value }">
        <span v-if="value != null" class="scores-tab__streak">{{ value }}</span>
        <span v-else class="scores-tab__streak scores-tab__streak--empty">&ndash;</span>
      </template>

      <template #cell-detail="{ row }">
        <button class="scores-tab__detail-btn" aria-label="View score details"
          @click="openDetail(row.mapDifficultyId as string, $event)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11L5.5 5L8 8L10.5 4L14 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 13H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </template>

      <template #mobile-card="{ row }">
        <div class="ps-card" @click="handleRowClick(row)">
          <GlowImage v-if="row.coverUrl" :src="(row.coverUrl as string)" :alt="(row.mapName as string)" :size="40" />
          <div v-else class="ps-card__cover-placeholder" />
          <div class="ps-card__info">
            <span class="ps-card__name">{{ row.mapName }}</span>
            <span class="ps-card__diff">{{ row.difficulty }}</span>
          </div>
          <div class="ps-card__stats">
            <span class="ps-card__acc">{{ ((row.accuracy as number) * 100).toFixed(2) }}%</span>
            <span class="ps-card__ap">{{ (row.ap as number).toFixed(2) }} AP</span>
          </div>
          <button class="ps-card__detail-btn" aria-label="View score details"
            @click.stop="openDetail(row.mapDifficultyId as string, $event)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 11L5.5 5L8 8L10.5 4L14 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 13H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </template>
    </ScoreTable>

    <ScoreDetailModal :open="detailOpen" :score="detailScore" :user-id="userId" :accent-color="accent"
      @close="detailOpen = false" />
  </div>
</template>

<style scoped>
.scores-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.scores-tab__category {
  color: color-mix(in srgb, var(--cat-accent) 30%, var(--text-secondary));
  font-size: var(--text-caption);
}

.scores-tab__map-name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scores-tab__difficulty {
  color: var(--text-secondary);
}

.scores-tab__streak--empty {
  color: var(--text-tertiary);
}

.scores-tab__detail-btn {
  position: relative;
  z-index: 1;
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

.scores-tab__detail-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}

.ps-card {
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
}

.ps-card:hover {
  border-left-color: var(--accent, var(--text-tertiary));
}

.ps-card__cover-placeholder {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-avatar);
  background: var(--bg-overlay);
}

.ps-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ps-card__name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-body);
}

.ps-card__diff {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.ps-card__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 2px;
}

.ps-card__acc {
  font-family: var(--font-mono);
  font-size: var(--text-body);
  color: var(--text-primary);
}

.ps-card__ap {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.ps-card__detail-btn {
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

.ps-card__detail-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-tertiary);
}
</style>
