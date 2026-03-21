<script setup lang="ts">
import type { LevelThreshold } from '@/api/levels'
import { getLevelThresholds } from '@/api/levels'
import logoUrl from '@/assets/logo.png'
import BaseButton from '@/components/common/BaseButton.vue'
import ParticleCanvas from '@/components/common/ParticleCanvas.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useThemeStore } from '@/stores/theme'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const themeStore = useThemeStore()

const levels = ref<LevelThreshold[]>([])
const levelsLoading = ref(true)
const marqueeRef = ref<HTMLElement | null>(null)
let rafId = 0

function tierKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-')
}

function levelRange(level: number, index: number, all: LevelThreshold[]): string {
  const next = all[index + 1]
  if (!next) return `${level}+`
  return `${level}\u2013${next.level - 1}`
}

function updateCarousel() {
  const el = marqueeRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const center = rect.left + rect.width / 2
  const half = rect.width / 2

  for (const item of el.querySelectorAll<HTMLElement>('.xp-item')) {
    const ir = item.getBoundingClientRect()
    const dist = Math.abs(ir.left + ir.width / 2 - center) / half
    const edge = Math.max(0, (dist - 0.82) / 0.18)
    const t = 1 - edge * edge
    item.style.transform = `scale(${0.4 + 0.6 * t})`
    item.style.opacity = `${0.08 + 0.92 * t}`
  }

  rafId = requestAnimationFrame(updateCarousel)
}

onMounted(async () => {
  try {
    levels.value = await getLevelThresholds()
  } catch { } finally {
    levelsLoading.value = false
  }

  rafId = requestAnimationFrame(updateCarousel)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__glow" />
      <ParticleCanvas class="hero__particles" :dark-mode="themeStore.theme === 'dark'" />
      <div class="hero__content">
        <img :src="logoUrl" alt="AccSaber" class="hero__logo" />
        <p class="hero__tagline">New and improved stack for AccSaber.</p>
        <BaseButton variant="primary" href="https://discord.gg/DmzKSgcJWe" class="hero__discord">
          <svg class="hero__discord-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"
            aria-hidden="true">
            <path
              d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Join Discord
        </BaseButton>
      </div>

      <div class="hero__stats">
        <div class="hero__stat">
          <span class="hero__stat-value">124K+</span>
          <span class="hero__stat-label">Total Players</span>
        </div>
        <div class="hero__stat">
          <span class="hero__stat-value">450+</span>
          <span class="hero__stat-label">Ranked Maps</span>
        </div>
      </div>

      <div class="hero__scroll-hint" aria-hidden="true">
        <svg class="hero__scroll-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="7 13 12 18 17 13" />
          <polyline points="7 6 12 11 17 6" />
        </svg>
      </div>
    </section>

    <section class="section">
      <h2 class="section__title">Explore</h2>
      <div class="explore-buttons">
        <BaseButton variant="default" size="lg" @click="router.push({ name: 'leaderboards' })">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Leaderboards
        </BaseButton>
        <BaseButton variant="default" size="lg" @click="router.push({ name: 'maps' })">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Maps
        </BaseButton>
      </div>
    </section>

    <section class="section xp-section">
      <h2 class="section__title">The XP System</h2>
      <p class="xp-section__intro">
        While <strong>AP</strong> rewards the <em>quality</em> of your play,
        <strong>XP</strong> rewards <em>participation</em>. Play more ranked maps, earn milestones, improve your scores.
        Quality still matters, but the biggest factor is showing up.
      </p>

      <div v-if="levelsLoading" class="xp-skeleton">
        <SkeletonLoader v-for="i in 7" :key="i" width="72px" height="52px" />
      </div>

      <div v-else-if="levels.length > 0" ref="marqueeRef" class="xp-marquee">
        <div class="xp-marquee__track">
          <template v-for="copy in 2" :key="copy">
            <template v-for="(tier, i) in levels" :key="`${copy}-${tier.level}`">
              <div class="xp-item xp-tier">
                <div class="xp-tier__node" :style="{
                  background: `var(--tier-${tierKey(tier.title)})`,
                  boxShadow: `0 0 10px var(--tier-${tierKey(tier.title)})`,
                }" />
                <span class="xp-tier__title" :style="{ color: `var(--tier-${tierKey(tier.title)})` }">
                  {{ tier.title }}
                </span>
                <span class="xp-tier__range">Lv. {{ levelRange(tier.level, i, levels) }}</span>
              </div>

              <svg v-if="i < levels.length - 1" class="xp-item xp-tier__arrow" viewBox="0 0 40 16" fill="none"
                aria-hidden="true">
                <line x1="0" y1="8" x2="32" y2="8" :stroke="`var(--tier-${tierKey(tier.title)})`" stroke-width="2" />
                <polygon :points="`40,8 32,3 32,13`" :fill="`var(--tier-${tierKey(tier.title)})`" />
              </svg>
            </template>

            <div class="xp-item xp-divider" />
          </template>
        </div>
      </div>
    </section>

    <footer class="home-footer">
      <p class="home-footer__text">
        Logo by Brylanbbab and Interz. AccSaber Reloaded takes no credit for any assets used in their platform.
      </p>
      <a href="https://github.com/tikugato/accsaber-reloaded-frontend" target="_blank" rel="noopener noreferrer"
        class="home-footer__link">
        GitHub
      </a>
    </footer>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  max-width: 1030px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-3xl);
}

.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
  padding: var(--space-3xl) var(--space-md);
}

.hero__glow {
  position: absolute;
  inset: -32px -64px 0 -64px;
  background: radial-gradient(ellipse at 50% 0%,
      color-mix(in srgb, var(--tier-gold) 12%, transparent),
      transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.hero__particles {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  text-align: center;
}

.hero__logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.hero__tagline {
  font-size: var(--text-section-heading);
  color: var(--text-secondary);
  margin: 0;
}

.hero__discord {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.hero__discord-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.hero__stats {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: var(--space-2xl);
  flex-wrap: wrap;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.hero__stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-section-heading);
  font-weight: 600;
  color: var(--text-primary);
}

.hero__stat-label {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.hero__scroll-hint {
  position: absolute;
  bottom: var(--space-3xl);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: scroll-float 2s ease-in-out infinite;
}

.hero__scroll-arrow {
  color: var(--text-secondary);
  filter:
    drop-shadow(0 0 4px var(--accent-overall)) drop-shadow(0 0 8px color-mix(in srgb, var(--accent-overall) 40%, transparent));
}

@keyframes scroll-float {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 0.7;
  }

  50% {
    transform: translateX(-50%) translateY(8px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__scroll-hint {
    animation: none;
  }
}

.section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.section__title {
  font-size: var(--text-page-title);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.explore-buttons {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.explore-buttons :deep(.base-button) {
  padding: var(--space-md) var(--space-2xl);
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: var(--radius-card);
}

.explore-buttons :deep(.base-button svg) {
  width: 24px;
  height: 24px;
}

.xp-section {
  padding: 0 var(--space-md);
}

.xp-section__intro {
  max-width: 560px;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--text-body);
  line-height: 1.6;
  margin: 0;
}

.xp-section__intro strong {
  color: var(--text-primary);
  font-weight: 700;
}

.xp-skeleton {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl) 0;
  width: 100%;
  overflow: hidden;
}

.xp-marquee {
  width: 100%;
  overflow: hidden;
  padding: var(--space-xl) 0;
}

.xp-marquee__track {
  display: flex;
  align-items: center;
  width: max-content;
  animation: xp-scroll 18s linear infinite;
}

.xp-marquee:hover .xp-marquee__track {
  animation-play-state: paused;
}

@keyframes xp-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.xp-item {
  will-change: transform, opacity;
  flex-shrink: 0;
}

.xp-tier {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  min-width: 72px;
  padding: 0 var(--space-xs);
}

.xp-tier__node {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--bg-base);
}

.xp-tier__arrow {
  width: 32px;
  height: 16px;
  align-self: center;
}

.xp-tier__title {
  font-weight: 700;
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.xp-tier__range {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.xp-divider {
  width: 1px;
  height: 48px;
  background: var(--bg-overlay);
  margin: 0 var(--space-lg);
  align-self: center;
}

.home-footer {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  border-top: 1px solid var(--bg-overlay);
}

.home-footer__text {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.5;
}

.home-footer__link {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin-top: var(--space-sm);
  display: inline-block;
  text-decoration: none;
}

.home-footer__link:hover {
  color: var(--text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .xp-marquee__track {
    animation: none;
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: calc(100svh - 56px);
    padding: var(--space-2xl) var(--space-md);
  }

  .hero__logo {
    width: 80px;
    height: 80px;
  }

  .hero__tagline {
    font-size: var(--text-body);
  }

  .hero__stats {
    gap: var(--space-md);
  }

  .explore-buttons :deep(.base-button) {
    padding: var(--space-sm) var(--space-xl);
    font-size: 1rem;
  }
}
</style>
