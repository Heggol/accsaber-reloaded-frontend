<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'default' | 'primary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  href?: string
}>()

defineEmits<{
  click: [e: MouseEvent]
}>()

const tag = computed(() => (props.href ? 'a' : 'button'))

const isExternalUrl = computed(() =>
  props.href?.startsWith('http://') || props.href?.startsWith('https://'),
)

const linkAttrs = computed(() =>
  props.href
    ? {
      href: props.href,
      ...(isExternalUrl.value ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    }
    : {},
)
</script>

<template>
  <component :is="tag" class="base-button" :class="[
    `base-button--${variant ?? 'default'}`,
    `base-button--${size ?? 'md'}`,
    { 'base-button--loading': loading },
  ]" :disabled="!href && (disabled || loading)" v-bind="linkAttrs" @click="$emit('click', $event)">
    <span class="base-button__content" :class="{ 'base-button__content--hidden': loading }">
      <slot />
    </span>
    <span v-if="loading" class="base-button__spinner" />
  </component>
</template>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  border: 1px solid var(--bg-overlay);
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  cursor: pointer;
  border-radius: var(--radius-btn);
  transition: background-color 120ms ease-in, border-color 120ms ease-in, color 120ms ease-in;
  white-space: nowrap;
  text-decoration: none;
}

.base-button:hover:not(:disabled) {
  background: var(--bg-elevated);
  border-color: var(--text-tertiary);
}

.base-button:active:not(:disabled) {
  background: var(--bg-overlay);
}

.base-button:disabled {
  color: var(--text-tertiary);
  border-color: var(--bg-overlay);
  cursor: not-allowed;
}

.base-button--sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-caption);
}

.base-button--md {
  padding: var(--space-sm) var(--space-md);
}

.base-button--lg {
  padding: var(--space-sm) var(--space-lg);
  font-size: 1rem;
}

.base-button--primary {
  border-color: var(--accent);
  color: var(--accent);
}

.base-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-color: var(--accent);
}

.base-button--destructive {
  border-color: var(--error);
  color: var(--error);
}

.base-button--destructive:hover:not(:disabled) {
  background: color-mix(in srgb, var(--error) 10%, transparent);
  border-color: var(--error);
}

.base-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.base-button__content--hidden {
  visibility: hidden;
}

.base-button__spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-tertiary);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-button__spinner {
    animation: none;
    border-top-color: var(--text-tertiary);
    border-right-color: var(--text-primary);
  }
}
</style>
