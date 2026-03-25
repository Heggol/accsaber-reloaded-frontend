<script setup lang="ts">
import RangeSlider from '@/components/common/RangeSlider.vue'
import { useCategoryStore } from '@/stores/categories'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  selectedCategories: string[]
  complexityRange: [number, number]
  unplayedOnly?: boolean
  showUnplayed?: boolean
}>()

const emit = defineEmits<{
  'update:selectedCategories': [categories: string[]]
  'update:complexityRange': [range: [number, number]]
  'update:unplayedOnly': [value: boolean]
}>()

const categoryStore = useCategoryStore()

const filterableCategories = computed(() =>
  categoryStore.categoryInfoList.filter((c) => c.code !== 'overall' && c.code !== 'xp')
)

const localRange = ref<[number, number]>([...props.complexityRange])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.complexityRange, (val) => {
  localRange.value = [...val]
})

function onRangeChange(val: [number, number]) {
  localRange.value = val
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:complexityRange', val)
  }, 400)
}

function toggleCategory(categoryId: string, selected: string[]) {
  const idx = selected.indexOf(categoryId)
  if (idx >= 0) {
    const next = [...selected]
    next.splice(idx, 1)
    emit('update:selectedCategories', next)
  } else {
    emit('update:selectedCategories', [...selected, categoryId])
  }
}
</script>

<template>
  <div class="map-filters">
    <h3 class="map-filters__title">Filters</h3>

    <div class="map-filters__section">
      <h4 class="map-filters__heading">Category</h4>
      <div class="map-filters__categories">
        <label
          v-for="info in filterableCategories"
          :key="info.code"
          class="map-filters__cat-label"
        >
          <input
            type="checkbox"
            class="map-filters__checkbox"
            :checked="selectedCategories.includes(categoryStore.getCategoryId(info.code) ?? '')"
            @change="toggleCategory(categoryStore.getCategoryId(info.code) ?? '', selectedCategories)"
          />
          <span class="map-filters__cat-dot" :style="{ background: info.accent }" />
          <span>{{ info.name }}</span>
        </label>
      </div>
    </div>

    <div class="map-filters__section">
      <RangeSlider
        label="Complexity"
        :min="0"
        :max="20"
        :step="0.5"
        :model-value="localRange"
        @update:model-value="onRangeChange"
      />
    </div>

    <div v-if="showUnplayed" class="map-filters__section">
      <h4 class="map-filters__heading">Player</h4>
      <label class="map-filters__cat-label">
        <input
          type="checkbox"
          class="map-filters__checkbox"
          :checked="unplayedOnly"
          @change="emit('update:unplayedOnly', !unplayedOnly)"
        />
        <span class="map-filters__cat-dot map-filters__cat-dot--unplayed" />
        <span>Unplayed only</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.map-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.map-filters__title {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.map-filters__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.map-filters__heading {
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.map-filters__categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.map-filters__cat-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-caption);
  color: var(--text-primary);
  cursor: pointer;
}

.map-filters__checkbox {
  accent-color: var(--accent);
  cursor: pointer;
}

.map-filters__cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.map-filters__cat-dot--unplayed {
  background: var(--info);
}
</style>
