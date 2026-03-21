<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref } from 'vue'

const sidebarCollapsed = ref(false)
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.isLoggedIn) {
    authStore.fetchProfile()
  }
})
</script>

<template>
  <AppSidebar v-model:collapsed="sidebarCollapsed" />
  <main class="main-content" :class="{ 'main-content--sidebar-collapsed': sidebarCollapsed }">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>

<style scoped>
.main-content {
  margin-left: 200px;
  min-height: 100vh;
  padding: var(--space-xl);
  transition: margin-left 200ms ease;
}

.main-content--sidebar-collapsed {
  margin-left: 56px;
}


.page-enter-active,
.page-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0;
    margin-bottom: 56px;
    padding: var(--space-md);
  }
}
</style>
