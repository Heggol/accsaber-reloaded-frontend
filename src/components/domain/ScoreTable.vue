<script setup lang="ts">
import DataTable from '@/components/common/DataTable.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import type { SortState, TableColumn } from '@/types/display'
import type { RouteLocationRaw } from 'vue-router'
import { formatRelativeDate, isRecentDate } from '@/utils/formatters'
import { getRankClass } from '@/utils/ranking'
import { computed, useSlots } from 'vue'

withDefaults(defineProps<{
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  sortState?: SortState
  loading?: boolean
  loadingRows?: number
  emptyMessage?: string
  rowClickable?: boolean
  rowTo?: (row: Record<string, unknown>) => RouteLocationRaw
  page?: number
  totalPages?: number
  medalRanks?: boolean
  rowClass?: (row: Record<string, unknown>, index: number) => string | Record<string, boolean> | undefined
}>(), {
  loadingRows: 8,
  emptyMessage: 'No scores found',
  totalPages: 0,
})

const emit = defineEmits<{
  sort: [key: string]
  rowClick: [row: Record<string, unknown>, index: number]
  'update:page': [page: number]
}>()

const slots = useSlots()

const BUILT_IN_CELLS = new Set([
  'cell-rank', 'cell-leaderboardRank',
  'cell-accuracy', 'cell-score', 'cell-ap', 'cell-weighted', 'cell-date',
])

const customSlots = computed(() => {
  const result: Record<string, unknown> = {}
  for (const name of Object.keys(slots)) {
    if (!BUILT_IN_CELLS.has(name)) {
      result[name] = slots[name]
    }
  }
  return result
})

</script>

<template>
  <div class="score-table">
    <DataTable
      :columns="columns"
      :rows="rows"
      :sort-state="sortState"
      :loading="loading"
      :loading-rows="loadingRows"
      :row-clickable="rowClickable"
      :row-to="rowTo"
      :row-class="rowClass"
      :empty-message="emptyMessage"
      @sort="emit('sort', $event)"
      @row-click="(row, index) => emit('rowClick', row, index)"
    >
      <template #cell-rank="sp">
        <slot name="cell-rank" v-bind="sp">
          <span class="score-table__rank" :class="medalRanks ? getRankClass(sp.value as number) : ''">
            #{{ sp.value }}
          </span>
        </slot>
      </template>

      <template #cell-leaderboardRank="sp">
        <slot name="cell-leaderboardRank" v-bind="sp">
          <span class="score-table__rank">#{{ sp.value }}</span>
        </slot>
      </template>

      <template #cell-accuracy="sp">
        <slot name="cell-accuracy" v-bind="sp">
          {{ ((sp.value as number) * 100).toFixed(2) }}%
        </slot>
      </template>

      <template #cell-score="sp">
        <slot name="cell-score" v-bind="sp">
          <span class="score-table__secondary">{{ (sp.value as number).toLocaleString() }}</span>
        </slot>
      </template>

      <template #cell-ap="sp">
        <slot name="cell-ap" v-bind="sp">
          <span class="score-table__ap">{{ (sp.value as number).toFixed(2) }}</span>
        </slot>
      </template>

      <template #cell-weighted="sp">
        <slot name="cell-weighted" v-bind="sp">
          <span class="score-table__secondary">{{ (sp.value as number).toFixed(2) }}</span>
        </slot>
      </template>

      <template #cell-date="sp">
        <slot name="cell-date" v-bind="sp">
          <span class="score-table__date" :class="{ 'score-table__date--recent': isRecentDate(sp.value as string) }">
            {{ formatRelativeDate(sp.value as string) }}
          </span>
        </slot>
      </template>

      <template v-for="(_, name) in customSlots" :key="name" #[name]="sp">
        <slot :name="(name as string)" v-bind="sp" />
      </template>
    </DataTable>

    <PaginationControls
      v-if="totalPages > 1"
      :page="page ?? 1"
      :total-pages="totalPages"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>

<style scoped>
.score-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.score-table__rank {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-secondary);
}

.score-table__ap {
  font-weight: 500;
}

.score-table__secondary {
  color: var(--text-secondary);
}

.score-table__date {
  white-space: nowrap;
  color: var(--text-secondary);
}

.score-table__date--recent {
  color: var(--text-primary);
}
</style>
