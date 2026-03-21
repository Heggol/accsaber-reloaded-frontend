import { useAuthStore } from '@/stores/auth'
import type { StaffRole } from '@/types/enums'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresStaff?: boolean
    requiresAdmin?: boolean
    requiredRole?: StaffRole
  }
}

const isAdminSubdomain = window.location.hostname.startsWith('admin.')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: isAdminSubdomain
        ? () => import('@/views/staff/AdminPage.vue')
        : () => import('@/views/HomePage.vue'),
      meta: isAdminSubdomain ? { requiresStaff: true, requiredRole: 'ADMIN' as StaffRole } : {},
    },
    {
      path: '/leaderboards',
      name: 'leaderboards',
      component: () => import('@/views/LeaderboardsPage.vue'),
    },
    {
      path: '/leaderboards/:categoryCode',
      name: 'leaderboards-category',
      component: () => import('@/views/LeaderboardsPage.vue'),
    },
    {
      path: '/maps',
      name: 'maps',
      component: () => import('@/views/MapsPage.vue'),
    },
    {
      path: '/maps/:mapId',
      name: 'map-detail',
      component: () => import('@/views/MapDetailPage.vue'),
    },
    {
      path: '/players/:userId',
      name: 'player-profile',
      component: () => import('@/views/PlayerProfilePage.vue'),
    },
    {
      path: '/ranked-queue',
      name: 'ranked-queue',
      component: () => import('@/views/RankedQueuePage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsPage.vue'),
    },
    {
      path: '/score-feed',
      name: 'score-feed',
      component: () => import('@/views/ScoreFeedPage.vue'),
    },
    {
      path: '/milestones',
      name: 'milestones',
      component: () => import('@/views/MilestonesPage.vue'),
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: () => import('@/views/CampaignsPage.vue'),
    },
    {
      path: '/campaigns/:campaignId',
      name: 'campaign-detail',
      component: () => import('@/views/CampaignDetailPage.vue'),
    },
    {
      path: '/whats-new',
      name: 'whats-new',
      component: () => import('@/views/WhatsNewPage.vue'),
    },
    {
      path: '/staff/login',
      name: 'staff-login',
      component: () => import('@/views/staff/AdminLoginPage.vue'),
    },
    {
      path: '/staff/ranking',
      name: 'staff-ranking',
      component: () => import('@/views/staff/RankingPage.vue'),
      meta: { requiresStaff: true, requiredRole: 'RANKING' },
    },
    {
      path: '/staff/ranking-head',
      name: 'staff-ranking-head',
      component: () => import('@/views/staff/RankingHeadPage.vue'),
      meta: { requiresStaff: true, requiredRole: 'HEAD_RANKING' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/staff/AdminPage.vue'),
      meta: { requiresStaff: true, requiredRole: 'ADMIN' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresStaff) {
    const auth = useAuthStore()

    if (!auth.isStaffAuthenticated) {
      return { name: 'staff-login', query: { redirect: to.fullPath } }
    }

    if (auth.isTokenExpiringSoon) {
      try {
        await auth.refreshStaffToken()
      } catch {
        auth.clearStaffAuth()
        return { name: 'staff-login', query: { redirect: to.fullPath } }
      }
    }

    if (to.meta.requiredRole && !auth.hasRole(to.meta.requiredRole)) {
      return { name: 'staff-ranking' }
    }
  }
})

export default router
