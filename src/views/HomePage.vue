<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import ParticleCanvas from '@/components/common/ParticleCanvas.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useThemeStore } from '@/stores/theme'
import type { PublicStaffUserResponse } from '@/types/api/staff'
import logoUrl from '@/assets/logo.png'
import { ROLE_LABELS, ROLE_ORDER } from '@/utils/constants'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const themeStore = useThemeStore()

const loading = ref(true)

const staffGroups = ref<{ label: string; members: PublicStaffUserResponse[] }[]>([])

function groupStaff(users: PublicStaffUserResponse[]) {
  const groups = new Map<string, PublicStaffUserResponse[]>()
  for (const user of users) {
    const role = user.role
    if (!groups.has(role)) groups.set(role, [])
    groups.get(role)!.push(user)
  }

  const sorted = [...groups.entries()].sort(
    ([a], [b]) => (ROLE_ORDER[a] ?? 99) - (ROLE_ORDER[b] ?? 99),
  )

  return sorted.map(([role, members]) => ({
    label: ROLE_LABELS[role] ?? role,
    members,
  }))
}

onMounted(async () => {
  const { getStaffUsers } = await import('@/api/staff')

  try {
    const staffPage = await getStaffUsers({ page: 0, size: 100 })
    staffGroups.value = groupStaff(staffPage.content)
  } catch {
  }

  loading.value = false
})

function navigateToPlayer(steamId: string) {
  router.push({ name: 'player-profile', params: { steamId } })
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__glow" />
      <ParticleCanvas class="hero__particles" :dark-mode="themeStore.theme === 'dark'" />
      <div class="hero__content">
        <img :src="logoUrl" alt="AccSaber" class="hero__logo" />
        <p class="hero__tagline">New and improved stack for AccSaber.</p>
        <BaseButton
          variant="primary"
          href="https://discord.gg/DmzKSgcJWe"
          class="hero__discord"
        >
          <svg class="hero__discord-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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
    </section>

    <section class="section">
      <h2 class="section__title">Explore</h2>
      <div class="explore-buttons">
        <BaseButton variant="default" size="lg" @click="router.push({ name: 'leaderboards' })">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Leaderboards
        </BaseButton>
        <BaseButton variant="default" size="lg" @click="router.push({ name: 'maps' })">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Maps
        </BaseButton>
      </div>
    </section>
  <!--
    <section v-if="loading || staffGroups.length > 0" class="section">
      <h2 class="section__title">Our Team</h2>
      <template v-if="loading">
        <div class="team-skeleton">
          <SkeletonLoader v-for="i in 6" :key="i" variant="avatar" />
        </div>
      </template>
      <template v-else>
        <div v-for="group in staffGroups" :key="group.label" class="team-group">
          <h3
            class="team-group__label"
            :class="`team-group__label--${group.members[0]?.role?.toLowerCase().replace('_', '-')}`"
          >
            {{ group.label }}
          </h3>
          <div class="team-group__members">
            <div
              v-for="member in group.members"
              :key="member.id"
              class="team-member"
              tabindex="0"
              role="button"
              @click="navigateToPlayer(member.userId)"
              @keydown.enter="navigateToPlayer(member.userId)"
            >
              <img
                :src="member.avatarUrl"
                :alt="member.username"
                class="team-member__avatar"
                loading="lazy"
              />
              <span class="team-member__name">{{ member.username }}</span>
            </div>
          </div>
        </div>
      </template>
    </section>
    -->

    <footer class="home-footer">
      <p class="home-footer__text">
        Logo by Brylanbbab and Interz. AccSaber Reloaded takes no credit for any assets used in their platform.
      </p>
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
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--tier-gold) 12%, transparent),
    transparent 70%
  );
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

.team-skeleton {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.team-group {
  margin-bottom: var(--space-lg);
  width: 100%;
}

.team-group__label {
  font-size: var(--text-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-md);
  text-align: center;
}

.team-group__label--admin { color: var(--role-admin); }
.team-group__label--developer { color: var(--role-developer); }
.team-group__label--moderator { color: var(--role-moderator); }
.team-group__label--head-ranking { color: var(--role-head-ranking); }
.team-group__label--ranking { color: var(--role-ranking); }

.team-group__members {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  justify-content: center;
}

.team-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: border-color 150ms ease;
  min-width: 130px;
}

.team-member:hover {
  border-color: var(--text-tertiary);
}

.team-member__avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-avatar);
  object-fit: cover;
}

.team-member__name {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
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

  .team-group__members {
    gap: var(--space-sm);
  }

  .team-member {
    min-width: 100px;
    padding: var(--space-md);
  }

  .team-member__avatar {
    width: 44px;
    height: 44px;
  }
}
</style>
