<script setup lang="ts">
import type { SortState, TableColumn } from '@/types/display';
import { computed, useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';
import DataTableCardFallback from './DataTableCardFallback.vue';
import SkeletonLoader from './SkeletonLoader.vue';

const props = defineProps<{
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  sortState?: SortState
  rowClickable?: boolean
  rowTo?: (row: Record<string, unknown>) => RouteLocationRaw | undefined
  rowKey?: string | ((row: Record<string, unknown>, index: number) => string | number)
  loading?: boolean
  loadingRows?: number
  emptyMessage?: string
  rowClass?: (row: Record<string, unknown>, index: number) => string | Record<string, boolean> | undefined
}>()

const emit = defineEmits<{
  sort: [key: string]
  rowClick: [row: Record<string, unknown>, index: number]
}>()

const router = useRouter()
const slots = useSlots()
const skeletonCount = computed(() => props.loadingRows ?? 5)

function resolveRowKey(row: Record<string, unknown>, index: number): string | number {
  if (!props.rowKey) return index
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  return (row[props.rowKey] as string | number) ?? index
}

function resolveRowHref(row: Record<string, unknown>): string | undefined {
  const route = props.rowTo?.(row)
  if (!route) return undefined
  return router.resolve(route).href
}

function handleRowClick(row: Record<string, unknown>, index: number, event: MouseEvent) {
  if (props.rowTo) {
    const route = props.rowTo(row)
    if (!route) return
    if (event.ctrlKey || event.metaKey || event.button === 1) return
    event.preventDefault()
    router.push(route)
  } else if (props.rowClickable) {
    emit('rowClick', row, index)
  }
}

function handleSort(col: TableColumn) {
  if (col.sortable) emit('sort', col.key)
}

function sortIcon(col: TableColumn): string {
  if (!col.sortable) return ''
  if (props.sortState?.key !== col.key) return '\u2195'
  return props.sortState.direction === 'asc' ? '\u2191' : '\u2193'
}
</script>

<template>
  <div class="data-table-wrapper">
    <div class="data-table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" class="data-table__th" :class="{
              'data-table__th--sortable': col.sortable,
              'data-table__th--mono': col.mono,
              [`data-table__th--${col.align ?? 'left'}`]: true,
            }" :style="col.width ? { width: col.width } : undefined" @click="handleSort(col)">
              {{ col.label }}
              <span v-if="col.sortable" class="data-table__sort-icon">{{ sortIcon(col) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in skeletonCount" :key="'skel-' + i" class="data-table__row">
              <td v-for="col in columns" :key="col.key" class="data-table__td">
                <SkeletonLoader variant="text" />
              </td>
            </tr>
          </template>
          <template v-else-if="rows.length === 0">
            <tr>
              <td :colspan="columns.length" class="data-table__empty">
                <slot name="empty">
                  {{ emptyMessage ?? 'No data available' }}
                </slot>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="(row, index) in rows" :key="resolveRowKey(row, index)" class="data-table__row"
              :class="[{ 'data-table__row--clickable': rowClickable || !!rowTo }, rowClass?.(row, index)]"
              @click="handleRowClick(row, index, $event)">
              <td v-for="(col, colIdx) in columns" :key="col.key" class="data-table__td" :class="{
                'data-table__td--mono': col.mono,
                [`data-table__td--${col.align ?? 'left'}`]: true,
              }">
                <a v-if="colIdx === 0 && resolveRowHref(row)" :href="resolveRowHref(row)" class="data-table__row-link" tabindex="-1" aria-hidden="true" />
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="index">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="data-table-cards">
      <template v-if="loading">
        <SkeletonLoader v-for="i in skeletonCount" :key="'skel-card-' + i" variant="card" />
      </template>
      <template v-else-if="rows.length === 0">
        <div class="data-table__empty-card">
          <slot name="empty">{{ emptyMessage ?? 'No data available' }}</slot>
        </div>
      </template>
      <template v-else-if="slots['mobile-card']">
        <div v-for="(row, index) in rows" :key="resolveRowKey(row, index)" class="data-table-cards__custom">
          <slot name="mobile-card" :row="row" :index="index" />
        </div>
      </template>
      <template v-else>
        <DataTableCardFallback v-for="(row, index) in rows" :key="resolveRowKey(row, index)" :columns="columns"
          :row="row" :clickable="rowClickable" @click="emit('rowClick', row, index)">
          <template v-for="col in columns" :key="col.key" #[`cell-${col.key}`]="slotProps">
            <slot :name="`cell-${col.key}`" :row="slotProps.row" :value="slotProps.value" :index="index">
              {{ slotProps.value }}
            </slot>
          </template>
        </DataTableCardFallback>
      </template>
    </div>
  </div>
</template>

<style scoped>
.data-table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table__th {
  position: sticky;
  top: 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--bg-overlay);
  white-space: nowrap;
  z-index: 1;
}

.data-table__th--sortable {
  cursor: pointer;
  user-select: none;
}

.data-table__th--sortable:hover {
  color: var(--text-primary);
}

.data-table__th--left {
  text-align: left;
}

.data-table__th--center {
  text-align: center;
}

.data-table__th--right {
  text-align: right;
}

.data-table__th--mono {
  font-family: var(--font-mono);
}

.data-table__sort-icon {
  margin-left: var(--space-xs);
  font-size: 0.7rem;
}

.data-table__row {
  position: relative;
  height: 48px;
  border-left: 2px solid transparent;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.data-table__row:nth-child(odd) {
  background: var(--bg-surface);
}

.data-table__row:nth-child(even) {
  background: var(--bg-elevated);
}

.data-table__row--clickable {
  cursor: pointer;
}

.data-table__row--clickable:hover {
  border-left-color: var(--accent);
  background: color-mix(in srgb, var(--bg-elevated) 80%, var(--accent) 5%);
}

.data-table__row-link {
  position: static;
  display: inline;
  text-decoration: none;
  color: inherit;
}

.data-table__row-link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
}

.data-table__td {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-body);
  color: var(--text-primary);
  vertical-align: middle;
}

.data-table__td--left {
  text-align: left;
}

.data-table__td--center {
  text-align: center;
}

.data-table__td--right {
  text-align: right;
}

.data-table__td--mono {
  font-family: var(--font-mono);
}

.data-table__empty {
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
  color: var(--text-secondary);
}

.data-table__empty-card {
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
  color: var(--text-secondary);
}

.data-table-cards {
  display: none;
  flex-direction: column;
  gap: var(--space-sm);
}

@media (max-width: 767px) {
  .data-table-scroll {
    display: none;
  }

  .data-table-cards {
    display: flex;
  }
}
</style>
