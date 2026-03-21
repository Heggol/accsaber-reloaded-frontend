<script setup lang="ts">
import BaseTabs from '@/components/common/BaseTabs.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import MilestoneDetail from '@/components/domain/MilestoneDetail.vue'
import type { MilestoneCompletionResponse, MilestoneSetResponse } from '@/types/api/milestones'
import type { Tab } from '@/types/display'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  milestones: MilestoneCompletionResponse[]
  sets: MilestoneSetResponse[]
  loading?: boolean
  loggedIn?: boolean
}>()

const expandedSets = ref<Set<string>>(new Set())
const viewMode = ref('all')

const viewTabs = computed<Tab[]>(() => {
  const tabs: Tab[] = [
    { key: 'all', label: 'All Progress' },
  ]
  if (props.loggedIn) {
    tabs.push({ key: 'completed', label: `Completed (${completedMilestones.value.length})` })
  } else {
    tabs.push({ key: 'completed', label: 'Completed' })
  }
  return tabs
})

interface MilestoneGroup {
  setId: string
  setTitle: string
  setBonusXp: number
  completedCount: number
  totalCount: number
  milestones: MilestoneCompletionResponse[]
}

const completedMilestones = computed(() =>
  props.milestones.filter((m) => m.userCompleted === true),
)

const activeMilestones = computed(() =>
  viewMode.value === 'completed' ? completedMilestones.value : props.milestones,
)

const groups = computed<MilestoneGroup[]>(() => {
  const setMap = new Map<string, MilestoneSetResponse>()
  for (const s of props.sets) setMap.set(s.id, s)

  const grouped = new Map<string, MilestoneCompletionResponse[]>()
  for (const m of activeMilestones.value) {
    const key = m.setId || 'uncategorized'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(m)
  }

  const result: MilestoneGroup[] = []
  for (const [setId, items] of grouped) {
    const setInfo = setMap.get(setId)
    result.push({
      setId,
      setTitle: setInfo?.title ?? 'Other',
      setBonusXp: setInfo?.setBonusXp ?? 0,
      completedCount: items.filter((m) => m.userCompleted === true).length,
      totalCount: items.length,
      milestones: items,
    })
  }
  return result
})

function toggleSet(setId: string) {
  if (expandedSets.value.has(setId)) {
    expandedSets.value.delete(setId)
  } else {
    expandedSets.value.add(setId)
  }
}

const hasAutoExpanded = ref(false)

watchEffect(() => {
  if (!hasAutoExpanded.value && !props.loading && groups.value.length > 0) {
    expandedSets.value.add(groups.value[0].setId)
    hasAutoExpanded.value = true
  }
})
</script>

<template>
  <div class="milestone-list-view">
    <BaseTabs :tabs="viewTabs" :model-value="viewMode" @update:model-value="viewMode = $event" />

    <template v-if="loading">
      <SkeletonLoader v-for="i in 3" :key="i" variant="card" />
    </template>

    <div v-else-if="viewMode === 'completed' && !loggedIn" class="milestone-list-view__login-hint">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <p>Log in with your Steam ID to track your milestone progress</p>
    </div>

    <p v-else-if="groups.length === 0" class="milestone-list-view__empty">
      {{ viewMode === 'completed' ? 'No completed milestones yet' : 'No milestone progress found' }}
    </p>

    <template v-else>
      <div v-for="group in groups" :key="group.setId" class="milestone-set">
        <button class="milestone-set__header" :aria-expanded="expandedSets.has(group.setId)" @click="toggleSet(group.setId)">
          <div class="milestone-set__info">
            <h3 class="milestone-set__title">{{ group.setTitle }}</h3>
            <span v-if="loggedIn" class="milestone-set__count">
              {{ group.completedCount }}/{{ group.totalCount }} completed
            </span>
            <span v-else class="milestone-set__count">
              {{ group.totalCount }} milestones
            </span>
          </div>
          <div class="milestone-set__meta">
            <span v-if="group.setBonusXp > 0" class="milestone-set__bonus">
              +{{ group.setBonusXp }} XP bonus
            </span>
            <span class="milestone-set__chevron"
              :class="{ 'milestone-set__chevron--open': expandedSets.has(group.setId) }">
              &#9660;
            </span>
          </div>
        </button>

        <div v-if="expandedSets.has(group.setId)" class="milestone-set__rows">
          <MilestoneDetail v-for="m in group.milestones" :key="m.milestoneId" :milestone="m" :logged-in="loggedIn"
            compact />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.milestone-list-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.milestone-list-view__empty {
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
  color: var(--text-secondary);
  margin: 0;
}

.milestone-list-view__login-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  color: var(--text-tertiary);
  text-align: center;
}

.milestone-list-view__login-hint p {
  margin: 0;
  font-size: var(--text-body);
  max-width: 320px;
}

.milestone-set {
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.milestone-set__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  transition: background-color 120ms ease;
}

.milestone-set__header:hover {
  background: var(--bg-elevated);
}

.milestone-set__info {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.milestone-set__title {
  font-size: var(--text-card-title);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.milestone-set__count {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.milestone-set__meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.milestone-set__bonus {
  font-size: var(--text-caption);
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 500;
}

.milestone-set__chevron {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  transition: transform 150ms ease;
}

.milestone-set__chevron--open {
  transform: rotate(180deg);
}

.milestone-set__rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg) var(--space-lg);
}

@media (max-width: 767px) {
  .milestone-set__header {
    padding: var(--space-md);
  }

  .milestone-set__info {
    flex-direction: column;
    gap: 2px;
  }

  .milestone-set__title {
    font-size: var(--text-body);
  }

  .milestone-set__rows {
    padding: var(--space-xs) var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .milestone-set__bonus {
    font-size: 0.625rem;
  }
}
</style>
