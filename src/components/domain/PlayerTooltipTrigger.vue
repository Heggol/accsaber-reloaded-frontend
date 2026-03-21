<script setup lang="ts">
import PlayerTooltipCard from '@/components/domain/PlayerTooltipCard.vue';
import { onUnmounted, ref } from 'vue';

defineProps<{
  userId: string
  userName: string
  avatarUrl: string
  country: string
}>()

const showTooltip = ref(false)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function onMouseEnter() {
  hoverTimer = setTimeout(() => {
    showTooltip.value = true
  }, 800)
}

function onMouseLeave() {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  showTooltip.value = false
}

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
})
</script>

<template>
  <span class="tooltip-trigger" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <slot />
    <Transition name="tooltip">
      <div v-if="showTooltip" class="tooltip-trigger__popup">
        <PlayerTooltipCard :user-id="userId" :user-name="userName" :avatar-url="avatarUrl" :country="country" />
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.tooltip-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  z-index: 2;
}

.tooltip-trigger:hover {
  z-index: 10000;
}

.tooltip-trigger__popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10000;
  pointer-events: auto;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
}

.tooltip-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.tooltip-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
