<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import { ref, computed } from 'vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const input = ref('')
const error = ref('')
const loading = ref(false)

const isLoggedIn = computed(() => authStore.isLoggedIn)

async function handleLogin() {
  if (!input.value.trim()) return
  error.value = ''
  loading.value = true

  try {
    const { linkUser } = await import('@/api/users')
    const user = await linkUser(input.value.trim())
    authStore.setSteamId(user.id)
    authStore.setProfile(user)
    input.value = ''
    emit('close')
  } catch {
    error.value = 'Player not found on AccSaber'
  }
  loading.value = false
}

function handleLogout() {
  authStore.clearSteamId()
  emit('close')
}
</script>

<template>
  <BaseModal :open="open" title="Log In" max-width="400px" @close="emit('close')">
    <div class="login-modal">
      <template v-if="isLoggedIn && authStore.userProfile">
        <div class="login-modal__profile">
          <img :src="authStore.userProfile.avatarUrl" :alt="authStore.userProfile.name"
            class="login-modal__avatar" />
          <span class="login-modal__name">{{ authStore.userProfile.name }}</span>
        </div>
        <BaseButton variant="destructive" @click="handleLogout">Log Out</BaseButton>
      </template>

      <template v-else>
        <BaseInput
          v-model="input"
          label="BeatLeader, ScoreSaber, or Steam ID"
          placeholder="Enter your ID or profile URL..."
          :error="error"
          @keydown.enter="handleLogin"
        />
        <BaseButton variant="primary" :loading="loading" @click="handleLogin">
          Log In
        </BaseButton>
      </template>
    </div>
  </BaseModal>
</template>

<style scoped>
.login-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.login-modal__profile {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-surface);
  border: 1px solid var(--bg-overlay);
  border-radius: var(--radius-card);
}

.login-modal__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-avatar);
  object-fit: cover;
}

.login-modal__name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--text-body);
}
</style>
