<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FilterPopover from '@/components/common/FilterPopover.vue'
import GlowImage from '@/components/common/GlowImage.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import ComplexityBadge from '@/components/domain/ComplexityBadge.vue'
import MapCard from '@/components/domain/MapCard.vue'
import MapCardCompact from '@/components/domain/MapCardCompact.vue'
import { usePageableRoute } from '@/composables/usePageableRoute'
import { useCategoryStore } from '@/stores/categories'
import type { BatchResponse } from '@/types/api/batches'
import type { MapDifficultyResponse } from '@/types/api/maps'
import type { MapDisplay, TableColumn } from '@/types/display'
import type { Page } from '@/types/pagination'
import { formatRelativeDate } from '@/utils/formatters'
import { toMapDisplay } from '@/utils/mappers'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MapFilterSidebar from './maps/MapFilterSidebar.vue'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

const CATEGORY_ORDER = ['true_acc', 'standard_acc', 'tech_acc', 'low_mid', 'overall']

type ViewMode = 'grid' | 'list' | 'batch'

const MAPS_VIEW_KEY = 'accsaber:maps-view'

const viewMode = computed<ViewMode>({
  get() {
    const v = route.query.view as string
    if (v === 'grid' || v === 'list' || v === 'batch') return v
    const stored = localStorage.getItem(MAPS_VIEW_KEY) as ViewMode | null
    if (stored === 'list' || stored === 'batch') return stored
    return 'grid'
  },
  set(val) {
    localStorage.setItem(MAPS_VIEW_KEY, val)
    const query = { ...route.query }
    query.view = val
    delete query.page
    router.replace({ query })
  },
})

const filtersOpen = ref(false)
const searchQuery = ref('')
const playlistDropdownOpen = ref(false)

const playlistCategories = computed(() =>
  categoryStore.categories
    .filter((c) => c.code !== 'xp')
    .map((c) => ({
      code: c.code,
      name: c.name,
      accent: categoryStore.getAccent(c.code),
    }))
)

function downloadPlaylist(categoryCode: string) {
  const baseUrl = import.meta.env.VITE_API_BASE as string
  const a = document.createElement('a')
  a.href = `${baseUrl}/playlists?category=${categoryCode}`
  a.download = `accsaber-${categoryCode.replace('_', '-')}.json`
  a.click()
  playlistDropdownOpen.value = false
}

const selectedCategories = computed<string[]>({
  get() {
    const c = route.query.category
    if (!c) return []
    return Array.isArray(c) ? c as string[] : [c as string]
  },
  set(val) {
    const query = { ...route.query }
    if (val.length === 0) {
      delete query.category
    } else if (val.length === 1) {
      query.category = val[0]
    } else {
      query.category = val
    }
    delete query.page
    router.replace({ query })
  },
})

const complexityRange = computed<[number, number]>({
  get() {
    const min = Number(route.query.complexityMin) || 0
    const max = Number(route.query.complexityMax) || 20
    return [min, max]
  },
  set(val) {
    const query = { ...route.query }
    if (val[0] <= 0) {
      delete query.complexityMin
    } else {
      query.complexityMin = String(val[0])
    }
    if (val[1] >= 20) {
      delete query.complexityMax
    } else {
      query.complexityMax = String(val[1])
    }
    delete query.page
    router.replace({ query })
  },
})

const hasActiveFilters = computed(() =>
  selectedCategories.value.length > 0 || complexityRange.value[0] > 0 || complexityRange.value[1] < 20
)

const sortOptions = [
  { value: 'releaseDate', label: 'Release Date' },
  { value: 'complexity', label: 'Complexity' },
  { value: 'name', label: 'Name' },
]

const batchSortOptions = [
  { value: 'releasedAt', label: 'Release Date' },
  { value: 'difficultyCount', label: 'Difficulty Count' },
]

const batchSortKey = computed<string>({
  get() {
    return (route.query.batchSort as string) || 'releasedAt'
  },
  set(val) {
    const query = { ...route.query }
    if (val === 'releasedAt') {
      delete query.batchSort
    } else {
      query.batchSort = val
    }
    delete query.page
    router.replace({ query })
  },
})

const { currentPage, sortState, paginationParams, setPage, setSort } = usePageableRoute({
  defaultSort: 'releaseDate',
  defaultOrder: 'desc',
  defaultSize: 20,
  sortFieldMap: {
    releaseDate: 'rankedAt',
    name: 'songName',
  },
  secondarySort: null,
})

const listColumns: TableColumn[] = [
  { key: 'cover', label: '', width: '56px' },
  { key: 'songName', label: 'Name', sortable: true, align: 'left' },
  { key: 'artistName', label: 'Artist', align: 'left' },
  { key: 'mapperName', label: 'Mapper', align: 'left' },
  { key: 'category', label: 'Category', sortable: true, align: 'center', width: '100px' },
  { key: 'complexity', label: 'Complexity', sortable: true, align: 'center', width: '100px' },
  { key: 'totalScores', label: 'Scores', sortable: true, align: 'right', mono: true, width: '80px' },
  { key: 'rankedAt', label: 'Released', sortable: true, align: 'right', width: '100px' },
]

const difficulties = ref<MapDifficultyResponse[]>([])
const totalPages = ref(0)
const totalElements = ref(0)
const loading = ref(true)

const batches = ref<BatchResponse[]>([])
const batchTotalPages = ref(0)
const batchLoading = ref(true)

const mapDisplays = computed<MapDisplay[]>(() =>
  difficulties.value.map((d) => toMapDisplay(d, (id) => categoryStore.getCategoryCode(id)))
)

const listRows = computed(() =>
  mapDisplays.value.map((m) => ({
    id: m.id,
    difficultyId: m.difficultyId,
    cover: m.coverUrl,
    songName: m.songName,
    difficultyLabel: m.difficultyLabel,
    difficulty: m.difficulty,
    artistName: m.artistName,
    mapperName: m.mapperName,
    category: (categoryStore.getCategoryInfo(m.categoryCode)?.name ?? m.categoryCode).replace(/ Acc$/, ''),
    categoryCode: m.categoryCode,
    complexity: m.complexity,
    totalScores: m.totalScores ?? 0,
    rankedAt: m.rankedAt ?? '',
  }))
)

const listSortFieldMap: Record<string, string> = {
  songName: 'name',
  rankedAt: 'releaseDate',
}

function handleListSort(key: string) {
  setSort(listSortFieldMap[key] ?? key)
}

const listSortState = computed(() => {
  const reverseMap: Record<string, string> = {
    name: 'songName',
    releaseDate: 'rankedAt',
  }
  return {
    key: reverseMap[sortState.value.key] ?? sortState.value.key,
    direction: sortState.value.direction,
  }
})

const isBatchView = computed(() => viewMode.value === 'batch')

async function fetchDifficulties() {
  loading.value = true
  try {
    const { getDifficulties } = await import('@/api/maps')
    const params: Record<string, unknown> = { ...paginationParams.value, status: 'RANKED' }
    if (selectedCategories.value.length === 1) {
      params.categoryId = selectedCategories.value[0]
    }
    if (complexityRange.value[0] > 0) {
      params.complexityMin = complexityRange.value[0]
    }
    if (complexityRange.value[1] < 20) {
      params.complexityMax = complexityRange.value[1]
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    const res: Page<MapDifficultyResponse> = await getDifficulties(params as never)
    difficulties.value = res.content
    totalPages.value = res.totalPages
    totalElements.value = res.totalElements
  } catch {
    difficulties.value = []
    totalPages.value = 0
    totalElements.value = 0
  }
  loading.value = false
}

async function fetchBatches() {
  batchLoading.value = true
  try {
    const { getBatches } = await import('@/api/batches')
    const sortParam = batchSortKey.value === 'difficultyCount'
      ? 'difficultyCount,desc'
      : 'releasedAt,desc'
    const res = await getBatches({
      status: 'RELEASED',
      page: currentPage.value - 1,
      size: 10,
      sort: sortParam,
    })
    batches.value = res.content
    batchTotalPages.value = res.totalPages
  } catch {
    batches.value = []
    batchTotalPages.value = 0
  }
  batchLoading.value = false
}

function navigateToMap(mapId: string, difficultyId?: string) {
  router.push({
    name: 'map-detail',
    params: { mapId },
    query: difficultyId ? { difficultyId } : undefined,
  })
}

function handleListRowClick(row: Record<string, unknown>) {
  navigateToMap(row.id as string, row.difficultyId as string)
}

function batchDifficultiesByCategory(batch: BatchResponse) {
  const grouped = new Map<string, MapDisplay[]>()
  for (const diff of batch.difficulties) {
    const display = toMapDisplay(diff, (id) => categoryStore.getCategoryCode(id))
    const code = display.categoryCode
    if (!grouped.has(code)) grouped.set(code, [])
    grouped.get(code)!.push(display)
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a)
      const bi = CATEGORY_ORDER.indexOf(b)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .map(([code, diffs]) => ({
      categoryCode: code,
      accent: categoryStore.getAccent(code),
      name: categoryStore.getCategoryInfo(code)?.name ?? code,
      diffs,
    }))
}

watch(searchQuery, () => {
  const query = { ...route.query }
  delete query.page
  router.replace({ query })
})

watch(
  [paginationParams, selectedCategories, complexityRange, searchQuery],
  () => { if (!isBatchView.value) fetchDifficulties() },
  { immediate: true, deep: true },
)

watch(
  [() => viewMode.value, currentPage, batchSortKey],
  () => {
    if (isBatchView.value) fetchBatches()
  },
  { immediate: true },
)
</script>

<template>
  <div class="maps-page">
    <div class="maps-page__header">
      <div>
        <h1 class="maps-page__title">Maps</h1>
        <p v-if="!isBatchView && !loading" class="maps-page__subtitle">
          {{ totalElements.toLocaleString() }} ranked difficulties
        </p>
      </div>
    </div>

    <div class="maps-page__controls">
      <div class="maps-page__controls-left">
        <BaseDropdown :open="playlistDropdownOpen" @update:open="playlistDropdownOpen = $event">
          <template #trigger>
            <button class="maps-page__playlist-btn" :class="{ 'maps-page__playlist-btn--active': playlistDropdownOpen }"
              aria-label="Download playlists">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Playlists</span>
              <svg class="maps-page__playlist-chevron"
                :class="{ 'maps-page__playlist-chevron--open': playlistDropdownOpen }" width="12" height="12"
                viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </template>
          <div class="maps-page__playlist-menu">
            <span class="maps-page__playlist-title">Download playlists...</span>
            <BaseButton v-for="cat in playlistCategories" :key="cat.code" size="sm" @click="downloadPlaylist(cat.code)">
              <span class="maps-page__playlist-cat-dot" :style="{ background: cat.accent }" />
              {{ cat.name }}
            </BaseButton>
          </div>
        </BaseDropdown>
        <BaseSelect v-if="viewMode === 'grid'" :options="sortOptions" :model-value="sortState.key"
          @update:model-value="setSort($event)" />
        <BaseSelect v-if="isBatchView" :options="batchSortOptions" :model-value="batchSortKey"
          @update:model-value="batchSortKey = $event" />
        <SearchBox v-model="searchQuery" placeholder="Search maps..." />
      </div>
      <div class="maps-page__controls-right">
        <div class="maps-page__view-toggle" role="radiogroup" aria-label="View mode">
          <button class="maps-page__view-btn" :class="{ 'maps-page__view-btn--active': viewMode === 'grid' }"
            aria-label="Grid view" @click="viewMode = 'grid'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span class="maps-page__view-label">Grid</span>
          </button>
          <button class="maps-page__view-btn" :class="{ 'maps-page__view-btn--active': viewMode === 'list' }"
            aria-label="List view" @click="viewMode = 'list'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span class="maps-page__view-label">List</span>
          </button>
          <button class="maps-page__view-btn" :class="{ 'maps-page__view-btn--active': viewMode === 'batch' }"
            aria-label="Batch view" @click="viewMode = 'batch'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span class="maps-page__view-label">Batches</span>
          </button>
        </div>

        <FilterPopover v-if="!isBatchView" :open="filtersOpen" @update:open="filtersOpen = $event">
          <template #trigger>
            <button class="maps-page__filter-btn"
              :class="{ 'maps-page__filter-btn--active': filtersOpen || hasActiveFilters }" aria-label="Toggle filters">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span v-if="hasActiveFilters" class="maps-page__filter-dot" />
            </button>
          </template>
          <MapFilterSidebar :selected-categories="selectedCategories" :complexity-range="complexityRange"
            @update:selected-categories="selectedCategories = $event"
            @update:complexity-range="complexityRange = $event" />
        </FilterPopover>
      </div>
    </div>

    <div class="maps-page__content">
      <template v-if="viewMode === 'grid'">
        <template v-if="loading">
          <div class="maps-page__grid">
            <SkeletonLoader v-for="i in 12" :key="i" variant="card" />
          </div>
        </template>
        <template v-else-if="mapDisplays.length === 0">
          <EmptyState message="No maps found matching your filters." />
        </template>
        <template v-else>
          <div class="maps-page__grid">
            <MapCard v-for="m in mapDisplays" :key="m.difficultyId" :map="m"
              @click="navigateToMap(m.id, m.difficultyId)" />
          </div>
        </template>
      </template>

      <template v-else-if="viewMode === 'list'">
        <DataTable :columns="listColumns" :rows="listRows" :sort-state="listSortState" :loading="loading"
          :loading-rows="10" row-clickable empty-message="No maps found matching your filters." @sort="handleListSort"
          @row-click="handleListRowClick">
          <template #cell-cover="{ row }">
            <GlowImage v-if="row.cover" :src="(row.cover as string)" :alt="(row.songName as string)" :size="44" />
          </template>
          <template #cell-songName="{ row }">
            <div class="maps-page__name-cell">
              <span class="maps-page__name">{{ row.songName }}</span>
              <span class="maps-page__diff-label">{{ row.difficultyLabel }}</span>
            </div>
          </template>
          <template #cell-category="{ row }">
            <span class="maps-page__category"
              :style="{ '--cat-accent': categoryStore.getAccent(row.categoryCode as string) }">
              {{ row.category }}
            </span>
          </template>
          <template #cell-complexity="{ row }">
            <ComplexityBadge :complexity="row.complexity as number" :difficulty="(row.difficulty as string)" />
          </template>
          <template #cell-totalScores="{ value }">
            <span class="maps-page__mono">{{ (value as number).toLocaleString() }}</span>
          </template>
          <template #cell-rankedAt="{ value }">
            <span v-if="value" class="maps-page__date">{{ formatRelativeDate(value as string) }}</span>
          </template>

          <template #mobile-card="{ row }">
            <div class="maps-page__list-card" @click="handleListRowClick(row)">
              <GlowImage v-if="row.cover" :src="(row.cover as string)" :alt="(row.songName as string)" :size="48"
                class="maps-page__list-card-cover" />
              <div v-else class="maps-page__list-card-cover-placeholder" />
              <div class="maps-page__list-card-info">
                <span class="maps-page__name">{{ row.songName }}</span>
                <span class="maps-page__list-card-meta">{{ row.artistName }} · {{ row.mapperName }}</span>
              </div>
              <div class="maps-page__list-card-badges">
                <span v-if="row.difficultyLabel" class="maps-page__diff-label">{{ row.difficultyLabel }}</span>
                <ComplexityBadge :complexity="row.complexity as number" :difficulty="(row.difficulty as string)" />
              </div>
            </div>
          </template>
        </DataTable>
      </template>

      <template v-else-if="viewMode === 'batch'">
        <template v-if="batchLoading">
          <div class="maps-page__batch-skeletons">
            <SkeletonLoader v-for="i in 3" :key="i" variant="card" />
          </div>
        </template>
        <template v-else-if="batches.length === 0">
          <EmptyState message="No released batches found." />
        </template>
        <template v-else>
          <div class="maps-page__batches">
            <div v-for="batch in batches" :key="batch.id" class="maps-page__batch">
              <div class="maps-page__batch-header">
                <h2 class="maps-page__batch-name">{{ batch.name }}</h2>
                <div class="maps-page__batch-meta">
                  <span class="maps-page__batch-count">{{ batch.difficulties.length }} difficulties</span>
                  <span v-if="batch.releasedAt" class="maps-page__batch-date">{{ formatRelativeDate(batch.releasedAt)
                  }}</span>
                </div>
                <p v-if="batch.description" class="maps-page__batch-desc">{{ batch.description }}</p>
              </div>
              <div v-for="group in batchDifficultiesByCategory(batch)" :key="group.categoryCode"
                class="maps-page__batch-category">
                <div class="maps-page__batch-cat-header">
                  <span class="maps-page__batch-cat-dot" :style="{ background: group.accent }" />
                  <span class="maps-page__batch-cat-name">{{ group.name }}</span>
                </div>
                <div class="maps-page__batch-cards">
                  <MapCardCompact v-for="m in group.diffs" :key="m.difficultyId" :map="m"
                    @click="navigateToMap(m.id, m.difficultyId)" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <PaginationControls v-if="!isBatchView && totalPages > 1" :page="currentPage" :total-pages="totalPages"
        @update:page="setPage($event)" />
      <PaginationControls v-if="isBatchView && batchTotalPages > 1" :page="currentPage" :total-pages="batchTotalPages"
        @update:page="setPage($event)" />
    </div>
  </div>
</template>

<style scoped>
.maps-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.maps-page__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.maps-page__title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.maps-page__subtitle {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0;
}

.maps-page__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.maps-page__controls-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.maps-page__controls-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.maps-page__view-toggle {
  display: flex;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  overflow: hidden;
}

.maps-page__view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.maps-page__view-label {
  font-size: var(--text-caption);
  font-weight: 500;
}

.maps-page__view-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.maps-page__view-btn--active {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.maps-page__filter-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.maps-page__filter-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.maps-page__filter-btn--active {
  border-color: var(--accent, var(--text-tertiary));
  color: var(--accent, var(--text-primary));
}

.maps-page__filter-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent, var(--text-primary));
}

.maps-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.maps-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}


.maps-page__name-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.maps-page__name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.maps-page__diff-label {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.maps-page__category {
  color: var(--cat-accent);
  font-size: var(--text-caption);
}

.maps-page__mono {
  font-family: var(--font-mono);
}

.maps-page__date {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.maps-page__batches {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.maps-page__batch {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.maps-page__batch-header {
  padding: var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
}

.maps-page__batch-name {
  font-size: var(--text-section);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.maps-page__batch-meta {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xs);
}

.maps-page__batch-count,
.maps-page__batch-date {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.maps-page__batch-desc {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin: var(--space-sm) 0 0;
}

.maps-page__batch-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-left: var(--space-md);
}

.maps-page__batch-cat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.maps-page__batch-cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.maps-page__batch-cat-name {
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.maps-page__batch-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-sm);
}

.maps-page__batch-skeletons {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.maps-page__list-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-sm);
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-left: 2px solid transparent;
  border-radius: var(--radius-card);
  cursor: pointer;
  min-height: 48px;
  transition: border-color 120ms ease;
}

.maps-page__list-card:hover {
  border-left-color: var(--text-tertiary);
}

.maps-page__list-card-cover {
  flex-shrink: 0;
  margin-left: var(--space-xs);
}

.maps-page__list-card-cover-placeholder {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin-left: var(--space-xs);
  border-radius: var(--radius-avatar);
  background: var(--bg-overlay);
}

.maps-page__list-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.maps-page__list-card-meta {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.maps-page__list-card-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.maps-page__playlist-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--tint-overall);
  border: 1px solid var(--accent-overall);
  border-radius: var(--radius-input);
  color: var(--accent-overall);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  font-weight: 600;
  cursor: pointer;
  min-width: 140px;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.maps-page__playlist-btn:hover {
  background: color-mix(in srgb, var(--accent-overall) 22%, var(--bg-base));
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent-overall) 30%, transparent);
}

.maps-page__playlist-btn--active {
  background: color-mix(in srgb, var(--accent-overall) 22%, var(--bg-base));
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent-overall) 30%, transparent);
}

.maps-page__playlist-chevron {
  color: currentColor;
  transition: transform 150ms ease;
}

.maps-page__playlist-chevron--open {
  transform: rotate(180deg);
}

.maps-page__playlist-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 200px;
}

.maps-page__playlist-title {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  padding: var(--space-xs) var(--space-sm);
  font-weight: 500;
}

.maps-page__playlist-cat-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .maps-page__grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  .maps-page__controls {
    flex-wrap: wrap;
  }
}
</style>
