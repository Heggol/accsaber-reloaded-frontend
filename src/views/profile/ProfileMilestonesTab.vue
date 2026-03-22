<script setup lang="ts">
import MilestoneListView from '@/components/domain/MilestoneListView.vue'
import type { MilestoneSort } from '@/api/milestones'
import type { MilestoneCompletionResponse, MilestoneSetResponse } from '@/types/api/milestones'
import { ref, watch } from 'vue'

const props = defineProps<{
  userId: string
}>()

const loading = ref(false)
const milestones = ref<MilestoneCompletionResponse[]>([])
const sets = ref<MilestoneSetResponse[]>([])
const sort = ref<MilestoneSort>('tier')

async function fetchMilestones(sortBy?: MilestoneSort) {
  loading.value = true
  try {
    const { getMilestoneSets, getMilestoneCompletionStats } = await import('@/api/milestones')
    const [completionRes, setRes] = await Promise.all([
      getMilestoneCompletionStats(props.userId, sortBy ?? sort.value),
      getMilestoneSets({ size: 100 }),
    ])
    milestones.value = completionRes
    sets.value = setRes.content
  } catch {
    milestones.value = []
    sets.value = []
  }
  loading.value = false
}

async function handleSortChange(newSort: MilestoneSort) {
  sort.value = newSort
  try {
    const { getMilestoneCompletionStats } = await import('@/api/milestones')
    milestones.value = await getMilestoneCompletionStats(props.userId, newSort)
  } catch {
    milestones.value = []
  }
}

watch(() => props.userId, () => { fetchMilestones() }, { immediate: true })
</script>

<template>
  <MilestoneListView :milestones="milestones" :sets="sets" :sort="sort" :loading="loading" logged-in
    @update:sort="handleSortChange" />
</template>
