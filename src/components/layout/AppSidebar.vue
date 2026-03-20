<script setup lang="ts">
import PseudoLoginModal from '@/components/domain/PseudoLoginModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const theme = useThemeStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const loginModalOpen = ref(false)

function handleUserClick() {
  if (authStore.isLoggedIn && authStore.userId) {
    router.push({ name: 'player-profile', params: { userId: authStore.userId } })
  } else {
    loginModalOpen.value = true
  }
}

const navItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/leaderboards', label: 'Leaderboards', icon: 'leaderboard' },
  { to: '/maps', label: 'Maps', icon: 'map' },
  { to: '/milestones', label: 'Milestones', icon: 'milestone' },
//  { to: '/ranked-queue', label: 'Ranked Queue', icon: 'queue' },
//  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/score-feed', label: 'Score Feed', icon: 'feed' },
//  { to: '/campaigns', label: 'Campaigns', icon: 'campaign' },
//  { to: '/whats-new', label: "What's New", icon: 'news' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="sidebar" :class="{ 'sidebar--collapsed': props.collapsed }">
    <div class="sidebar__nav">
      <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive(item.to) }" :aria-label="item.label">
        <span class="sidebar__icon">
          <svg v-if="item.icon === 'home'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <svg v-else-if="item.icon === 'leaderboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <svg v-else-if="item.icon === 'map'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <svg v-else-if="item.icon === 'queue'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3h5v5" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
          <svg v-else-if="item.icon === 'stats'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
          <svg v-else-if="item.icon === 'feed'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <svg v-else-if="item.icon === 'milestone'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <svg v-else-if="item.icon === 'campaign'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <svg v-else-if="item.icon === 'news'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </span>
        <span class="sidebar__label">{{ item.label }}</span>
        <span class="sidebar__tooltip">{{ item.label }}</span>
      </router-link>
    </div>

    <div class="sidebar__bottom">
      <button class="sidebar__item sidebar__user-btn" aria-label="User profile" @click="handleUserClick">
        <span class="sidebar__icon">
          <img v-if="authStore.isLoggedIn && authStore.userProfile?.avatarUrl"
            :src="authStore.userProfile.avatarUrl" :alt="authStore.userProfile.name"
            class="sidebar__user-avatar" />
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span class="sidebar__label">
          {{ authStore.isLoggedIn && authStore.userProfile ? authStore.userProfile.name : 'Log In' }}
        </span>
        <span class="sidebar__tooltip">
          {{ authStore.isLoggedIn && authStore.userProfile ? authStore.userProfile.name : 'Log In' }}
        </span>
      </button>

      <button v-if="authStore.isLoggedIn" class="sidebar__item sidebar__logout-btn" aria-label="Log out" @click="authStore.clearUserId()">
        <span class="sidebar__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span class="sidebar__label">Log Out</span>
        <span class="sidebar__tooltip">Log Out</span>
      </button>

      <button class="sidebar__item sidebar__theme-toggle"
        :aria-label="theme.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="theme.toggle()">
        <span class="sidebar__icon">
          <svg v-if="theme.theme === 'dark'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
        <span class="sidebar__label">
          {{ theme.theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </span>
        <span class="sidebar__tooltip">
          {{ theme.theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </span>
      </button>

      <button class="sidebar__item sidebar__collapse-toggle"
        :aria-label="props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('update:collapsed', !props.collapsed)">
        <span class="sidebar__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline v-if="props.collapsed" points="9 18 15 12 9 6" />
            <polyline v-else points="15 18 9 12 15 6" />
          </svg>
        </span>
        <span class="sidebar__label">Collapse</span>
        <span class="sidebar__tooltip">
          {{ collapsed ? 'Expand' : 'Collapse' }}
        </span>
      </button>
    </div>
  </nav>

  <PseudoLoginModal :open="loginModalOpen" @close="loginModalOpen = false" />
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  background: color-mix(in srgb, var(--bg-surface) 85%, transparent);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 100;
  border-right: 1px solid var(--bg-overlay);
  transition: width 200ms ease;
  overflow: hidden;
}

.sidebar--collapsed {
  width: 56px;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  padding-top: var(--space-md);
  gap: var(--space-xs);
}

.sidebar__bottom {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--space-md);
  gap: var(--space-xs);
}

.sidebar__item {
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0 var(--space-md);
  gap: var(--space-sm);
  text-decoration: none;
  border-radius: 0;
  transition: background 120ms ease;
}

.sidebar__item:hover {
  background: var(--bg-elevated);
}

.sidebar__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.sidebar__item--active .sidebar__icon {
  color: var(--accent);
}

.sidebar__item:hover .sidebar__icon {
  color: var(--text-primary);
}

.sidebar__label {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 150ms ease;
}

.sidebar--collapsed .sidebar__label {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

.sidebar__item--active .sidebar__label {
  color: var(--text-primary);
}

.sidebar__item:hover .sidebar__label {
  color: var(--text-primary);
}

.sidebar__tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateX(-4px) translateY(-50%);
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: var(--text-caption);
  border-radius: var(--radius-pill);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition:
    opacity 100ms ease-out,
    transform 100ms ease-out;
  display: none;
}

.sidebar--collapsed .sidebar__tooltip {
  display: block;
}

.sidebar--collapsed .sidebar__item:hover .sidebar__tooltip {
  opacity: 1;
  transform: translateX(var(--space-sm)) translateY(-50%);
}

.sidebar__user-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-btn);
  object-fit: cover;
}

.sidebar__logout-btn .sidebar__icon {
  color: var(--text-tertiary);
}

.sidebar__logout-btn:hover .sidebar__icon {
  color: var(--error);
}

.sidebar__theme-toggle,
.sidebar__collapse-toggle {
  margin: 0;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100% !important;
    height: 56px;
    flex-direction: row;
    justify-content: space-around;
    border-right: none;
    border-top: 1px solid var(--bg-overlay);
  }

  .sidebar__nav {
    flex-direction: row;
    padding-top: 0;
    gap: 0;
    flex: 1;
    justify-content: space-around;
  }

  .sidebar__bottom {
    display: none;
  }

  .sidebar__item {
    justify-content: center;
    padding: 0;
    flex: 1;
  }

  .sidebar__label {
    display: none;
  }

  .sidebar__item--active::before {
    left: 50%;
    top: 0;
    bottom: auto;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    border-radius: 0 0 2px 2px;
  }

  .sidebar__tooltip {
    display: none !important;
  }
}
</style>
