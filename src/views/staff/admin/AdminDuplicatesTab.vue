<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DuplicateCandidateResponse, DuplicateLinkResponse } from '@/types/api/admin'
import AdminTable from '@/components/admin/AdminTable.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const candidates = ref<DuplicateCandidateResponse[]>([])
const candidatesLoading = ref(false)

async function fetchCandidates() {
  candidatesLoading.value = true
  try {
    const { getDuplicateCandidates } = await import('@/api/admin/duplicates')
    candidates.value = await getDuplicateCandidates()
  } finally {
    candidatesLoading.value = false
  }
}
fetchCandidates()

const links = ref<DuplicateLinkResponse[]>([])
const linksLoading = ref(false)

async function fetchLinks() {
  linksLoading.value = true
  try {
    const { getDuplicateLinks } = await import('@/api/admin/duplicates')
    links.value = await getDuplicateLinks()
  } finally {
    linksLoading.value = false
  }
}
fetchLinks()

const actionLoading = ref<Record<string, boolean>>({})

async function linkCandidate(c: DuplicateCandidateResponse) {
  const key = `${c.primaryUserId}-${c.secondaryUserId}`
  actionLoading.value[key] = true
  try {
    const { createDuplicateLink } = await import('@/api/admin/duplicates')
    const created = await createDuplicateLink({
      primaryUserId: c.primaryUserId,
      secondaryUserId: c.secondaryUserId,
      reason: `Auto-detected: ${c.identicalScores} identical scores`,
    })
    links.value.unshift(created)
    candidates.value = candidates.value.filter(
      (x) => !(x.primaryUserId === c.primaryUserId && x.secondaryUserId === c.secondaryUserId),
    )
  } finally {
    delete actionLoading.value[key]
  }
}

async function mergeLink(link: DuplicateLinkResponse) {
  if (!confirm(`Merge ${link.secondaryUserName} into ${link.primaryUserName}? Scores will be combined under the primary account.`)) return
  actionLoading.value[link.id] = true
  try {
    const { mergeDuplicate } = await import('@/api/admin/duplicates')
    const updated = await mergeDuplicate({
      primaryUserId: link.primaryUserId,
      secondaryUserId: link.secondaryUserId,
      reason: link.reason ?? undefined,
    })
    const idx = links.value.findIndex((l) => l.id === link.id)
    if (idx !== -1) links.value[idx] = updated
  } finally {
    delete actionLoading.value[link.id]
  }
}

async function unmergeLink(link: DuplicateLinkResponse) {
  if (!confirm(`Unmerge ${link.secondaryUserName} from ${link.primaryUserName}?`)) return
  actionLoading.value[link.id] = true
  try {
    const { unmergeDuplicate } = await import('@/api/admin/duplicates')
    const updated = await unmergeDuplicate(link.id)
    const idx = links.value.findIndex((l) => l.id === link.id)
    if (idx !== -1) links.value[idx] = updated
  } finally {
    delete actionLoading.value[link.id]
  }
}

async function deleteLink(link: DuplicateLinkResponse) {
  if (!confirm(`Remove link between ${link.primaryUserName} and ${link.secondaryUserName}?`)) return
  actionLoading.value[link.id] = true
  try {
    const { deleteDuplicateLink } = await import('@/api/admin/duplicates')
    await deleteDuplicateLink(link.id)
    links.value = links.value.filter((l) => l.id !== link.id)
  } finally {
    delete actionLoading.value[link.id]
  }
}

const showLinkModal = ref(false)
const manualPrimary = ref('')
const manualSecondary = ref('')
const manualReason = ref('')
const manualLoading = ref(false)
const manualError = ref('')

function openManualLink() {
  manualPrimary.value = ''
  manualSecondary.value = ''
  manualReason.value = ''
  manualError.value = ''
  showLinkModal.value = true
}

async function createManualLink() {
  if (!manualPrimary.value || !manualSecondary.value) return
  manualLoading.value = true
  manualError.value = ''
  try {
    const { createDuplicateLink } = await import('@/api/admin/duplicates')
    const created = await createDuplicateLink({
      primaryUserId: manualPrimary.value,
      secondaryUserId: manualSecondary.value,
      reason: manualReason.value || undefined,
    })
    links.value.unshift(created)
    showLinkModal.value = false
  } catch {
    manualError.value = 'Failed to create link. Check the user IDs.'
  } finally {
    manualLoading.value = false
  }
}

const mergeAllLoading = ref(false)

async function mergeAllUnmerged() {
  if (!confirm(`Merge all ${unmergedLinks.value.length} unmerged links? Recalculation runs once after all merges complete.`)) return
  mergeAllLoading.value = true
  try {
    const { mergeAllUnmerged: api } = await import('@/api/admin/duplicates')
    const updated = await api()
    const updatedMap = new Map(updated.map((l) => [l.id, l]))
    links.value = links.value.map((l) => updatedMap.get(l.id) ?? l)
  } finally {
    mergeAllLoading.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const mergedLinks = computed(() => links.value.filter((l) => l.merged))
const unmergedLinks = computed(() => links.value.filter((l) => !l.merged))
</script>

<template>
  <div class="tab">
    <div class="tab__header">
      <div>
        <h2 class="tab__title">Duplicate Accounts</h2>
        <p class="tab__meta">Detect and merge duplicate player accounts</p>
      </div>
      <BaseButton @click="openManualLink">Manual Link</BaseButton>
    </div>

    <section class="section">
      <div class="section__header">
        <h3 class="section__title">Detected Candidates</h3>
        <BaseButton size="sm" :loading="candidatesLoading" @click="fetchCandidates">Refresh</BaseButton>
      </div>

      <AdminTable :items="candidates" :loading="candidatesLoading" :loading-rows="5" empty-message="No duplicate candidates detected">
        <template #head>
          <th>Primary</th>
          <th>Secondary</th>
          <th style="width: 80px">Country</th>
          <th class="mono right" style="width: 100px">Identical</th>
          <th class="mono right" style="width: 90px">Primary</th>
          <th class="mono right" style="width: 90px">Secondary</th>
          <th class="right" style="width: 100px">Actions</th>
        </template>
        <template #default="{ item }">
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.primaryUserName }}</span>
              <span class="user-cell__id">{{ item.primaryUserId }}</span>
            </div>
          </td>
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.secondaryUserName }}</span>
              <span class="user-cell__id">{{ item.secondaryUserId }}</span>
            </div>
          </td>
          <td class="mono muted">{{ item.country }}</td>
          <td class="mono right">{{ item.identicalScores }}</td>
          <td class="mono right muted">{{ item.primaryTotalScores }}</td>
          <td class="mono right muted">{{ item.secondaryTotalScores }}</td>
          <td class="right">
            <BaseButton
              size="sm"
              variant="primary"
              :loading="actionLoading[`${item.primaryUserId}-${item.secondaryUserId}`]"
              @click="linkCandidate(item)"
            >
              Link
            </BaseButton>
          </td>
        </template>
      </AdminTable>
    </section>

    <section v-if="unmergedLinks.length" class="section">
      <div class="section__header">
        <h3 class="section__title">Linked (Unmerged)</h3>
        <BaseButton size="sm" variant="primary" :loading="mergeAllLoading" @click="mergeAllUnmerged">
          Merge All ({{ unmergedLinks.length }})
        </BaseButton>
      </div>

      <AdminTable :items="unmergedLinks" :loading="linksLoading" :loading-rows="3" empty-message="No unmerged links">
        <template #head>
          <th>Primary</th>
          <th>Secondary</th>
          <th>Reason</th>
          <th class="mono" style="width: 120px">Created</th>
          <th class="right">Actions</th>
        </template>
        <template #default="{ item }">
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.primaryUserName }}</span>
              <span class="user-cell__id">{{ item.primaryUserId }}</span>
            </div>
          </td>
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.secondaryUserName }}</span>
              <span class="user-cell__id">{{ item.secondaryUserId }}</span>
            </div>
          </td>
          <td class="muted">{{ item.reason ?? '-' }}</td>
          <td class="mono muted">{{ formatDate(item.createdAt) }}</td>
          <td class="right">
            <div class="actions">
              <BaseButton size="sm" variant="primary" :loading="actionLoading[item.id]" @click="mergeLink(item)">
                Merge
              </BaseButton>
              <BaseButton size="sm" variant="destructive" :loading="actionLoading[item.id]" @click="deleteLink(item)">
                Remove
              </BaseButton>
            </div>
          </td>
        </template>
      </AdminTable>
    </section>

    <section v-if="mergedLinks.length" class="section">
      <h3 class="section__title">Merged</h3>

      <AdminTable :items="mergedLinks" :loading="linksLoading" :loading-rows="3" empty-message="No merged accounts">
        <template #head>
          <th>Primary</th>
          <th>Secondary</th>
          <th>Reason</th>
          <th class="mono" style="width: 120px">Merged</th>
          <th class="right" style="width: 100px">Actions</th>
        </template>
        <template #default="{ item }">
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.primaryUserName }}</span>
              <span class="user-cell__id">{{ item.primaryUserId }}</span>
            </div>
          </td>
          <td>
            <div class="user-cell">
              <span class="user-cell__name">{{ item.secondaryUserName }}</span>
              <span class="user-cell__id">{{ item.secondaryUserId }}</span>
            </div>
          </td>
          <td class="muted">{{ item.reason ?? '-' }}</td>
          <td class="mono muted">{{ item.mergedAt ? formatDate(item.mergedAt) : '-' }}</td>
          <td class="right">
            <BaseButton size="sm" :loading="actionLoading[item.id]" @click="unmergeLink(item)">
              Unmerge
            </BaseButton>
          </td>
        </template>
      </AdminTable>
    </section>
  </div>

  <BaseModal :open="showLinkModal" title="Create Duplicate Link" @close="showLinkModal = false">
    <div class="modal-form">
      <BaseInput v-model="manualPrimary" label="Primary User ID (keep)" type="number" required />
      <BaseInput v-model="manualSecondary" label="Secondary User ID (merge away)" type="number" required />
      <BaseInput v-model="manualReason" label="Reason (optional)" />
      <p v-if="manualError" class="form-error">{{ manualError }}</p>
    </div>
    <template #footer>
      <BaseButton @click="showLinkModal = false">Cancel</BaseButton>
      <BaseButton variant="primary" :loading="manualLoading" :disabled="!manualPrimary || !manualSecondary" @click="createManualLink">
        Create Link
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.tab { display: flex; flex-direction: column; gap: var(--space-xl); }

.tab__header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-lg); }
.tab__title { font-size: var(--text-section-heading); font-weight: 600; color: var(--text-primary); margin: 0; }
.tab__meta { font-size: var(--text-caption); color: var(--text-secondary); margin: 2px 0 0; }

.section { display: flex; flex-direction: column; gap: var(--space-md); }
.section__header { display: flex; align-items: center; justify-content: space-between; }
.section__title { font-size: var(--text-body); font-weight: 600; color: var(--text-primary); margin: 0; }

.user-cell { display: flex; flex-direction: column; }
.user-cell__name { font-size: var(--text-body); color: var(--text-primary); }
.user-cell__id { font-size: var(--text-caption); font-family: var(--font-mono); color: var(--text-tertiary); }

.actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-sm); }

.modal-form { display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-sm) 0; }
.form-error { font-size: var(--text-caption); color: var(--error); margin: 0; }
</style>
