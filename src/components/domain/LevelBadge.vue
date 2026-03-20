<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  level: number
  currentXp: number
  requiredXp: number
  avatarUrl?: string
  title?: string
}>()

const tierKey = computed(() => {
  if (props.title) return props.title.toLowerCase().replace(/\s+/g, '-')
  return 'newcomer'
})

const tierColor = computed(() => `var(--tier-${tierKey.value})`)

const progressPercent = computed(() => {
  if (props.requiredXp <= 0) return 100
  return Math.min((props.currentXp / props.requiredXp) * 100, 100)
})
</script>

<template>
  <div class="level-badge">
    <div class="level-badge__frame" :class="`level-badge__frame--${tierKey}`">
      <div v-if="avatarUrl" class="level-badge__avatar-wrap">
        <img class="level-badge__avatar" :src="avatarUrl" alt="Avatar" loading="lazy" />
      </div>
    </div>

    <div class="level-badge__below">
      <span class="level-badge__title-line" :style="{ color: tierColor }">
        <span class="level-badge__level">Lv. {{ level }}</span>
        <span v-if="title" class="level-badge__title">{{ title }}</span>
      </span>
      <div class="level-badge__bar-wrap">
        <div class="level-badge__bar">
          <div class="level-badge__fill" :style="{
            width: progressPercent + '%',
            backgroundColor: tierColor,
          }" />
        </div>
        <span class="level-badge__xp">{{ Math.round(currentXp).toLocaleString() }} / {{
          Math.round(requiredXp).toLocaleString() }} XP</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.level-badge__frame {
  position: relative;
  padding: 3px;
  border-radius: var(--radius-avatar);
}

.level-badge__frame--newcomer {
  background: #6b7280;
}

.level-badge__frame--apprentice {
  background: #3b82f6;
}

.level-badge__frame--adept {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.3);
}

.level-badge__frame--skilled {
  background: linear-gradient(135deg, #92400e, #cd7f32, #e8a84c, #cd7f32, #92400e);
  box-shadow: 0 0 8px rgba(205, 127, 50, 0.35);
}

.level-badge__frame--expert {
  background: linear-gradient(135deg, #9090a0, #c0c0d0, #f0f0ff, #c0c0d0, #9090a0);
  box-shadow: 0 0 10px rgba(192, 192, 210, 0.4);
}

.level-badge__frame--master {
  background: linear-gradient(135deg, #a16207, #fbbf24, #fde68a, #fbbf24, #a16207);
  box-shadow:
    0 0 10px rgba(251, 191, 36, 0.35),
    0 0 22px rgba(251, 191, 36, 0.12);
}

.level-badge__frame--grandmaster {
  padding: 4px;
  background: linear-gradient(var(--angle, 135deg), #6d28d9, #8b5cf6, #a78bfa, #8b5cf6, #6d28d9);
  box-shadow:
    0 0 12px rgba(139, 92, 246, 0.45),
    0 0 24px rgba(139, 92, 246, 0.15);
  animation: frame-rotate 6s linear infinite;
}

.level-badge__frame--legend {
  padding: 4px;
  background: linear-gradient(var(--angle, 0deg), #c2410c, #f97316, #fdba74, #f97316, #c2410c);
  box-shadow:
    0 0 14px rgba(249, 115, 22, 0.45),
    0 0 28px rgba(249, 115, 22, 0.15);
  animation: frame-rotate 5s linear infinite;
}

.level-badge__frame--transcendent {
  padding: 4px;
  background: linear-gradient(var(--angle, 0deg), #0891b2, #22d3ee, #a5f3fc, #22d3ee, #0891b2);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.5),
    0 0 28px rgba(34, 211, 238, 0.2),
    inset 0 0 1px rgba(255, 255, 255, 0.3);
  animation: frame-rotate 4s linear infinite;
}

.level-badge__frame--mythic {
  padding: 4px;
  background: linear-gradient(var(--angle, 0deg), #b91c1c, #ef4444, #fca5a5, #ef4444, #b91c1c);
  box-shadow:
    0 0 16px rgba(239, 68, 68, 0.5),
    0 0 32px rgba(239, 68, 68, 0.2);
  animation: frame-rotate 3s linear infinite;
}

.level-badge__frame--ascendant {
  padding: 5px;
  background: linear-gradient(var(--angle, 0deg), #f472b6, #fb923c, #facc15, #4ade80, #38bdf8, #a78bfa, #f472b6);
  box-shadow:
    0 0 18px rgba(244, 114, 182, 0.5),
    0 0 36px rgba(167, 139, 250, 0.2),
    0 0 54px rgba(56, 189, 248, 0.1);
  animation: frame-rotate 2.5s linear infinite;
}

.level-badge__frame--ascendant::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: calc(var(--radius-avatar) + 2px);
  background: linear-gradient(var(--angle, 0deg), transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%);
  animation: frame-rotate 2.5s linear infinite;
  pointer-events: none;
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes frame-rotate {
  to {
    --angle: 360deg;
  }
}

.level-badge__avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: calc(var(--radius-avatar) - 1px);
  overflow: hidden;
  background: var(--bg-base);
}

.level-badge__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.level-badge__below {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
}

.level-badge__title-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  font-weight: 700;
  white-space: nowrap;
}

.level-badge__level {
  font-family: var(--font-mono);
  font-size: var(--text-body);
}

.level-badge__title {
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.level-badge__bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
  padding: 0 var(--space-xs);
}

.level-badge__bar {
  height: 4px;
  background: var(--bg-overlay);
  border-radius: 2px;
  overflow: hidden;
  width: 100%;
}

.level-badge__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 300ms ease-out;
}

.level-badge__xp {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {

  .level-badge__frame--grandmaster,
  .level-badge__frame--legend,
  .level-badge__frame--transcendent,
  .level-badge__frame--mythic,
  .level-badge__frame--ascendant,
  .level-badge__frame--ascendant::after {
    animation: none;
  }

  .level-badge__fill {
    transition: none;
  }
}
</style>
