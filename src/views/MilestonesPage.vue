<script setup lang="ts">
import ParticleCanvas from '@/components/common/ParticleCanvas.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import SetDetail from '@/components/domain/SetDetail.vue'
import SetChartMap from '@/components/domain/SetChartMap.vue'
import MilestoneListView from '@/components/domain/MilestoneListView.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import type { MilestoneCompletionResponse, MilestoneSetResponse, PrerequisiteLinkResponse } from '@/types/api/milestones'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const sets = ref<MilestoneSetResponse[]>([])
const milestones = ref<MilestoneCompletionResponse[]>([])
const isMobile = ref(false)
const viewMode = ref<'chart' | 'list'>('chart')

const selectedSetId = computed({
  get: (): string | null => (route.query.set as string) || null,
  set: (val: string | null) => {
    router.replace({ query: val ? { set: val } : {} })
  },
})

const milestonesBySet = computed(() => {
  const map = new Map<string, MilestoneCompletionResponse[]>()
  for (const m of milestones.value) {
    if (!map.has(m.setId)) map.set(m.setId, [])
    map.get(m.setId)!.push(m)
  }
  return map
})

const selectedSet = computed(() =>
  sets.value.find((s) => s.id === selectedSetId.value) ?? null,
)

const selectedMilestones = computed(() =>
  selectedSetId.value ? (milestonesBySet.value.get(selectedSetId.value) ?? []) : [],
)

const prerequisitesBySet = ref<Map<string, PrerequisiteLinkResponse[]>>(new Map())

const selectedPrerequisites = computed(() =>
  selectedSetId.value ? (prerequisitesBySet.value.get(selectedSetId.value) ?? []) : [],
)

const totalMilestones = computed(() => milestones.value.length)
const totalCompleted = computed(() => milestones.value.filter((m) => m.userCompleted).length)

const lockedPlaceholders = computed(() => {
  const count = Math.max(0, 5 - sets.value.length)
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${i}`,
    title: 'Coming Soon',
    index: sets.value.length + i,
  }))
})

async function fetchData() {
  loading.value = true
  try {
    const { getMilestoneSets, getMilestoneCompletionStats } = await import('@/api/milestones')
    const [setsRes, completionRes] = await Promise.all([
      getMilestoneSets({ userId: authStore.userId ?? undefined, size: 100 }),
      getMilestoneCompletionStats(authStore.userId ?? undefined),
    ])
    sets.value = setsRes.content
    milestones.value = completionRes
  } catch {
    sets.value = []
    milestones.value = []
  }
  loading.value = false
}

async function fetchPrerequisites(setId: string) {
  if (prerequisitesBySet.value.has(setId)) return
  try {
    const { getSetPrerequisites } = await import('@/api/milestones')
    prerequisitesBySet.value.set(setId, await getSetPrerequisites(setId))
  } catch {
    prerequisitesBySet.value.set(setId, [])
  }
}

watch(selectedSetId, (id) => {
  if (id) fetchPrerequisites(id)
}, { immediate: true })

function handleResize() { isMobile.value = window.innerWidth < 768 }

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(() => authStore.userId, fetchData)
</script>

<template>
  <div class="milestones-page">
    <ParticleCanvas class="milestones-page__particles" :dark-mode="themeStore.theme === 'dark'"
      :particle-count="isMobile ? 60 : 120" />

    <header class="milestones-page__header">
      <h1 class="milestones-page__title">Milestones</h1>
      <div class="milestones-page__controls">
        <div v-if="!loading" class="milestones-page__stats">
          <div class="milestones-page__stat">
            <span class="milestones-page__stat-value">{{ sets.length }}</span>
            <span class="milestones-page__stat-label">Sets</span>
          </div>
          <div class="milestones-page__stat">
            <span class="milestones-page__stat-value">{{ totalMilestones }}</span>
            <span class="milestones-page__stat-label">Milestones</span>
          </div>
          <div v-if="authStore.isLoggedIn" class="milestones-page__stat">
            <span class="milestones-page__stat-value">{{ totalCompleted }}</span>
            <span class="milestones-page__stat-label">Completed</span>
          </div>
        </div>
        <div v-if="!selectedSetId" class="milestones-page__view-toggle">
          <button :class="{ 'milestones-page__view-btn--active': viewMode === 'chart' }" class="milestones-page__view-btn"
            @click="viewMode = 'chart'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="2" /><circle cx="6" cy="6" r="1.5" /><circle cx="18" cy="8" r="1.5" /><circle cx="8" cy="18" r="1.5" /><circle cx="18" cy="17" r="1.5" />
              <line x1="7.5" y1="7" x2="10.5" y2="10.5" /><line x1="13.5" y1="10.5" x2="16.5" y2="9" /><line x1="10.5" y1="13.5" x2="9" y2="16.5" /><line x1="13.5" y1="13.5" x2="17" y2="15.5" />
            </svg>
            Chart
          </button>
          <button :class="{ 'milestones-page__view-btn--active': viewMode === 'list' }" class="milestones-page__view-btn"
            @click="viewMode = 'list'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="milestones-page__skeleton">
      <SkeletonLoader v-for="i in 6" :key="i" variant="card" />
    </div>

    <template v-else-if="viewMode === 'list' && !selectedSetId">
      <MilestoneListView :milestones="milestones" :sets="sets" :logged-in="authStore.isLoggedIn" />
    </template>

    <Transition v-else name="zoom" mode="out-in">
      <SetDetail v-if="selectedSet" :key="selectedSet.id" :set="selectedSet"
        :milestones="selectedMilestones" :prerequisites="selectedPrerequisites"
        :logged-in="authStore.isLoggedIn" @back="selectedSetId = null" />

      <SetChartMap v-else-if="!isMobile" key="set-chart-map" :sets="sets" :milestones-by-set="milestonesBySet"
        :selected-set-id="selectedSetId" :locked-sets="lockedPlaceholders"
        @select-set="selectedSetId = $event" />

      <div v-else key="mobile-list" class="milestones-page__mobile-list">
        <button v-for="set in sets" :key="set.id" class="milestones-page__mobile-card"
          @click="selectedSetId = set.id">
          <div class="milestones-page__mobile-card-header">
            <h3 class="milestones-page__mobile-card-title">{{ set.title }}</h3>
            <span class="milestones-page__mobile-card-count">
              {{ (milestonesBySet.get(set.id) ?? []).length }} milestones
            </span>
          </div>
        </button>

        <div v-for="lg in lockedPlaceholders" :key="lg.id"
          class="milestones-page__mobile-card milestones-page__mobile-card--locked">
          <div class="milestones-page__mobile-card-header">
            <h3 class="milestones-page__mobile-card-title">{{ lg.title }}</h3>
            <svg class="milestones-page__mobile-lock" viewBox="0 0 20 20" fill="none" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="9" width="10" height="8" rx="1.5" />
              <path d="M7 9V6a3 3 0 0 1 6 0v3" />
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.milestones-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  min-height: 80vh;
  padding: var(--space-lg);
}

.milestones-page__particles {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.milestones-page__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.milestones-page__title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.milestones-page__controls {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.milestones-page__stats {
  display: flex;
  gap: var(--space-xl);
}

.milestones-page__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.milestones-page__stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-section-heading);
  font-weight: 600;
  color: var(--text-primary);
}

.milestones-page__stat-label {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.milestones-page__view-toggle {
  display: flex;
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-btn);
  overflow: hidden;
}

.milestones-page__view-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  cursor: pointer;
  transition: all 100ms ease;
}

.milestones-page__view-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.milestones-page__view-btn--active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.milestones-page__skeleton {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-2xl) 0;
}

.milestones-page__mobile-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.milestones-page__mobile-card {
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  padding: var(--space-md);
  text-align: left;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: border-color 120ms ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.milestones-page__mobile-card:hover {
  border-color: var(--text-tertiary);
}

.milestones-page__mobile-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.milestones-page__mobile-card-title {
  font-size: var(--text-card-title);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.milestones-page__mobile-card-count {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.milestones-page__mobile-card--locked {
  cursor: default;
  opacity: 0.5;
  border-style: dashed;
}

.milestones-page__mobile-card--locked:hover {
  border-color: var(--bg-overlay);
}

.milestones-page__mobile-lock {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}

.zoom-enter-from {
  opacity: 0;
  transform: scale(1.15);
}

.zoom-leave-to {
  opacity: 0;
  transform: scale(1.15);
}

@media (max-width: 767px) {
  .milestones-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .milestones-page__controls {
    flex-wrap: wrap;
  }

  .milestones-page__stats {
    gap: var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .zoom-enter-active,
  .zoom-leave-active {
    transition: none;
  }
}
</style>
