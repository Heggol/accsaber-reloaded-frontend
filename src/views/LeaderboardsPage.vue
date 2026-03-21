<script setup lang="ts">
import BaseSelect from '@/components/common/BaseSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import GlowImage from '@/components/common/GlowImage.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import CategoryTabs from '@/components/domain/CategoryTabs.vue'
import CountryFlag from '@/components/domain/CountryFlag.vue'
import { usePageableRoute } from '@/composables/usePageableRoute'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/categories'
import type { LeaderboardResponse } from '@/types/api/users'
import type { CategoryCode, PlayerDisplay, TableColumn } from '@/types/display'
import type { Page } from '@/types/pagination'
import { toPlayerDisplay } from '@/utils/mappers'
import { COUNTRY_OPTIONS } from '@/utils/countries'
import { getRankClass } from '@/utils/ranking'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const categoryStore = useCategoryStore()

const { currentPage, sortState, paginationParams, setPage, setSort, resetPage } = usePageableRoute({
  defaultSort: 'ap',
  defaultOrder: 'desc',
  defaultSize: 50,
  sortFieldMap: { avgAccuracy: 'averageAcc' },
})

const activeCategory = computed<CategoryCode>({
  get: () => (route.params.categoryCode as CategoryCode) || 'overall',
  set: (code) => {
    const query = { ...route.query }
    delete query.page
    router.push({ name: 'leaderboards-category', params: { categoryCode: code }, query })
  },
})

const accent = computed(() => categoryStore.getAccent(activeCategory.value))
const categoryName = computed(() =>
  categoryStore.getCategoryInfo(activeCategory.value)?.name ?? 'Leaderboards',
)

const countryFilter = computed<string>({
  get: () => (route.query.country as string) || '',
  set: (country) => {
    const query = { ...route.query }
    if (country) {
      query.country = country
    } else {
      delete query.country
    }
    delete query.page
    router.replace({ query })
  },
})

const searchQuery = ref('')
const loading = ref(false)
const pageData = ref<Page<LeaderboardResponse> | null>(null)
const highlightedUserId = ref<string | null>(null)

const players = computed<PlayerDisplay[]>(() => {
  if (!pageData.value) return []
  return pageData.value.content.map(toPlayerDisplay)
})

const rows = computed(() =>
  players.value.map((p) => ({
    rank: p.rank,
    countryRank: p.countryRank,
    userId: p.userId,
    name: p.name,
    country: p.country,
    avatarUrl: p.avatarUrl,
    ap: p.ap,
    avgAccuracy: p.avgAccuracy,
    rankedPlays: p.rankedPlays,
  })),
)

const totalPages = computed(() => pageData.value?.totalPages ?? 0)
const totalPlayers = computed(() => pageData.value?.totalElements ?? 0)

const columns: TableColumn[] = [
  { key: 'rank', label: 'Rank', align: 'right', mono: true, width: '80px' },
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'ap', label: 'AP', sortable: true, align: 'right', mono: true, width: '120px' },
  { key: 'avgAccuracy', label: 'Avg Acc', sortable: true, align: 'right', mono: true, width: '120px' },
  { key: 'rankedPlays', label: 'Plays', sortable: true, align: 'right', mono: true, width: '100px' },
]

const countryOptions = COUNTRY_OPTIONS

async function fetchData() {
  const categoryId = categoryStore.getCategoryId(activeCategory.value)
  if (!categoryId) return

  loading.value = true
  try {
    const { getLeaderboard, getCountryLeaderboard } = await import('@/api/leaderboards')
    const params = { ...paginationParams.value, search: searchQuery.value.trim() || undefined }

    if (countryFilter.value) {
      pageData.value = await getCountryLeaderboard(categoryId, countryFilter.value, params)
    } else {
      pageData.value = await getLeaderboard(categoryId, params)
    }
  } catch {
    pageData.value = null
  }
  loading.value = false

  const highlightId = route.query.highlight as string | undefined
  if (highlightId) {
    highlightedUserId.value = highlightId
    router.replace({ query: { ...route.query, highlight: undefined } })
    await nextTick()
    const row = document.querySelector(`[data-user-id="${highlightId}"]`)
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => { highlightedUserId.value = null }, 2000)
  }
}

function rowClass(row: Record<string, unknown>): Record<string, boolean> {
  return {
    'data-table__row--highlighted': row.userId === highlightedUserId.value,
    'data-table__row--self-highlight': !!authStore.userId && row.userId === authStore.userId,
  }
}

function playerRowTo(row: Record<string, unknown>) {
  return { name: 'player-profile', params: { userId: row.userId as string } }
}

function handleRowClick(row: Record<string, unknown>) {
  router.push(playerRowTo(row))
}

function handleCategoryChange(code: CategoryCode) {
  activeCategory.value = code
}

function handleCountryChange(country: string) {
  countryFilter.value = country
}

watch(searchQuery, () => { resetPage() })

watch(
  [activeCategory, paginationParams, countryFilter, searchQuery],
  () => { fetchData() },
  { immediate: true },
)

watch(() => categoryStore.loaded, (loaded) => {
  if (loaded) fetchData()
})
</script>

<template>
  <div class="leaderboards" :style="{ '--page-accent': accent }">
    <header class="leaderboards__header">
      <div class="leaderboards__header-bleed" />
      <div class="leaderboards__header-content">
        <h1 class="leaderboards__title">{{ categoryName }}</h1>
        <p v-if="totalPlayers > 0" class="leaderboards__subtitle">
          {{ totalPlayers.toLocaleString() }} players ranked
        </p>
      </div>
    </header>

    <div class="leaderboards__controls">
      <CategoryTabs :model-value="activeCategory" @update:model-value="handleCategoryChange" />
      <div class="leaderboards__filter">
        <SearchBox v-model="searchQuery" placeholder="Search players..." />
        <BaseSelect :model-value="countryFilter" :options="countryOptions" placeholder="All Countries" searchable
          @update:model-value="handleCountryChange" />
      </div>
    </div>

    <div class="leaderboards__table">
      <DataTable :columns="columns" :rows="rows" :sort-state="sortState" :loading="loading" :loading-rows="10"
        :row-class="rowClass" row-clickable :row-to="playerRowTo"
        empty-message="No players found for this category" @sort="setSort"
        @row-click="handleRowClick">
        <template #cell-rank="{ value, row }">
          <span v-if="countryFilter && row.countryRank" class="rank-cell" :class="getRankClass(row.countryRank as number)">
            #{{ row.countryRank }}
            <span class="rank-cell__global">(#{{ value }})</span>
          </span>
          <span v-else class="rank-cell" :class="getRankClass(value as number)">
            #{{ value }}
          </span>
        </template>

        <template #cell-player="{ row }">
          <div class="player-cell" :data-user-id="row.userId">
            <GlowImage :src="(row.avatarUrl as string)" :alt="(row.name as string)" :size="32" />
            <span class="player-cell__name">{{ row.name }}</span>
            <CountryFlag :country="(row.country as string)" />
          </div>
        </template>

        <template #cell-ap="{ value }">
          <span class="ap-cell">{{ (value as number).toFixed(2) }}</span>
        </template>

        <template #cell-avgAccuracy="{ value }">
          <template v-if="value != null">
            {{ ((value as number) * 100).toFixed(2) }}%
          </template>
          <template v-else>-</template>
        </template>

        <template #mobile-card="{ row }">
          <router-link :to="{ name: 'player-profile', params: { userId: row.userId as string } }" class="lb-card" :class="[
            { 'lb-card--highlighted': row.userId === highlightedUserId },
            { 'lb-card--self-highlight': !!authStore.userId && row.userId === authStore.userId },
            rowClass(row)
          ]" :data-user-id="row.userId">
            <span class="lb-card__rank rank-cell" :class="getRankClass(countryFilter && row.countryRank ? row.countryRank as number : row.rank as number)">
              #{{ countryFilter && row.countryRank ? row.countryRank : row.rank }}
            </span>
            <div class="lb-card__player">
              <GlowImage :src="(row.avatarUrl as string)" :alt="(row.name as string)" :size="28" />
              <span class="lb-card__name">{{ row.name }}</span>
              <CountryFlag :country="(row.country as string)" />
            </div>
            <span class="lb-card__ap ap-cell">{{ (row.ap as number).toFixed(2) }}</span>
          </router-link>
        </template>
      </DataTable>
    </div>

    <PaginationControls v-if="totalPages > 1" :page="currentPage" :total-pages="totalPages" @update:page="setPage" />
  </div>
</template>

<style scoped>
.leaderboards {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 1030px;
  margin: 0 auto;
  width: 100%;
}

.leaderboards__header {
  position: relative;
  text-align: center;
  padding: var(--space-2xl) 0 var(--space-lg);
}

.leaderboards__header-bleed {
  position: absolute;
  inset: -32px -64px 0 -64px;
  background: radial-gradient(ellipse at 50% 0%,
      color-mix(in srgb, var(--page-accent) 15%, transparent),
      transparent 70%);
  pointer-events: none;
}

.leaderboards__header-content {
  position: relative;
  z-index: 1;
}

.leaderboards__title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.leaderboards__subtitle {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  color: var(--page-accent);
  margin: var(--space-xs) 0 0;
  letter-spacing: 0.02em;
}

.leaderboards__controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
}

.leaderboards__filter {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.leaderboards__table {
  --accent: var(--page-accent);
}

.rank-cell {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-secondary);
}

.rank-cell__global {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  font-weight: 400;
  margin-left: 2px;
}

:deep(.data-table__row--highlighted) {
  animation: row-highlight 2s ease-out;
}

:deep(.data-table__row--self-highlight) {
  background: color-mix(in srgb, var(--page-accent) 8%, var(--bg-surface));
  border-left: 2px solid color-mix(in srgb, var(--page-accent) 40%, transparent);
}

@keyframes row-highlight {
  0% {
    background: color-mix(in srgb, var(--page-accent) 25%, var(--bg-surface));
    border-left-color: var(--page-accent);
  }

  100% {
    background: transparent;
    border-left-color: transparent;
  }
}

.player-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.player-cell__name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.ap-cell {
  color: var(--page-accent);
  font-weight: 600;
}

.lb-card {
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

.lb-card:hover {
  border-left-color: var(--page-accent);
}

.lb-card__rank {
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.lb-card__player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
}

.lb-card__name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lb-card__ap {
  font-family: var(--font-mono);
  font-weight: 600;
  flex-shrink: 0;
}

.lb-card--highlighted {
  animation: row-highlight 2s ease-out;
}

.lb-card--self-highlight {
  background: color-mix(in srgb, var(--page-accent) 8%, var(--bg-surface));
  border-left-color: color-mix(in srgb, var(--page-accent) 40%, transparent);
}

@media (max-width: 767px) {
  .leaderboards__controls {
    flex-direction: column;
    align-items: stretch;
  }

  .leaderboards__filter {
    min-width: unset;
  }

  .leaderboards__header {
    padding: var(--space-lg) 0 var(--space-md);
  }
}
</style>
