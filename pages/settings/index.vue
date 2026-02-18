<script setup lang="ts">
import type { OrganizationMember, OrganizationRole } from '~/types'
import { usePreferencesStore, type ThemePreference } from '~/stores/preferences'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Settings',
})

const { currentOrg, updateOrganization, getMembers, inviteMember, removeMember, updateMemberRole } = useOrganization()

const activeTab = ref('organization')
const members = ref<OrganizationMember[]>([])
const loading = ref(true)

// Organization settings form
const orgName = ref('')
const orgMaxProjects = ref(10)
const orgMaxTestCases = ref(1000)
const savingOrg = ref(false)

// Invite form
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<OrganizationRole>('QA_ENGINEER')
const inviting = ref(false)

// Theme preferences
const prefsStore = usePreferencesStore()
const selectedTheme = ref<ThemePreference>(prefsStore.theme)

const themeOptions = [
  { label: 'Light', value: 'light', description: 'Always use light mode' },
  { label: 'Dark', value: 'dark', description: 'Always use dark mode' },
  { label: 'System', value: 'system', description: 'Follow your system settings' },
]

function handleThemeChange(value: string) {
  selectedTheme.value = value as ThemePreference
  prefsStore.setTheme(selectedTheme.value)
}

const tabs = [
  { label: 'Organization', value: 'organization', icon: 'i-lucide-building-2' },
  { label: 'Members', value: 'members', icon: 'i-lucide-users' },
{ label: 'Preferences', value: 'preferences', icon: 'i-lucide-palette' },
]

const roleOptions: Array<{ label: string; value: OrganizationRole }> = [
  { label: 'Organization Manager', value: 'ORGANIZATION_MANAGER' },
  { label: 'Project Manager', value: 'PROJECT_MANAGER' },
  { label: 'Product Owner', value: 'PRODUCT_OWNER' },
  { label: 'QA Engineer', value: 'QA_ENGINEER' },
  { label: 'Developer', value: 'DEVELOPER' },
]

async function loadData() {
  if (!currentOrg.value) return

  loading.value = true
  try {
    const membersData = await getMembers(currentOrg.value.id)
    members.value = membersData

    orgName.value = currentOrg.value.name
    orgMaxProjects.value = currentOrg.value.maxProjects
    orgMaxTestCases.value = currentOrg.value.maxTestCasesPerProject
  } finally {
    loading.value = false
  }
}

await loadData()

// Re-fetch when org changes (e.g. org switcher)
watch(() => currentOrg.value?.id, () => loadData())

async function saveOrgSettings() {
  if (!currentOrg.value || !orgName.value.trim()) return

  savingOrg.value = true
  try {
    await updateOrganization(currentOrg.value.id, {
      name: orgName.value.trim(),
      maxProjects: orgMaxProjects.value,
      maxTestCasesPerProject: orgMaxTestCases.value,
    })
  } finally {
    savingOrg.value = false
  }
}

async function handleInvite() {
  if (!currentOrg.value || !inviteEmail.value.trim()) return

  inviting.value = true
  try {
    const member = await inviteMember(currentOrg.value.id, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })
    if (member) {
      members.value.push(member)
      showInviteModal.value = false
      inviteEmail.value = ''
      inviteRole.value = 'QA_ENGINEER'
    }
  } finally {
    inviting.value = false
  }
}

async function handleRemoveMember(memberId: string) {
  if (!currentOrg.value) return
  const success = await removeMember(currentOrg.value.id, memberId)
  if (success) {
    members.value = members.value.filter((m) => m.id !== memberId)
  }
}

async function handleRoleChange(memberId: string, newRole: string) {
  if (!currentOrg.value) return
  await updateMemberRole(currentOrg.value.id, memberId, newRole)
}

</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Manage organization settings, members, and preferences.
      </p>
    </div>

    <!-- Tabs (always visible) -->
    <UTabs
      :items="tabs"
      :model-value="activeTab"
      @update:model-value="activeTab = $event as string"
    />

    <!-- Preferences tab (always available, no org required) -->
    <div v-if="activeTab === 'preferences'" class="max-w-2xl space-y-6">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold">Appearance</h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Theme" hint="Choose how TestCraft looks to you">
            <URadioGroup
              :model-value="selectedTheme"
              :items="themeOptions"
              value-key="value"
              @update:model-value="handleThemeChange"
            />
          </UFormField>
        </div>
      </UCard>
    </div>

    <!-- Org-dependent tabs -->
    <template v-else>
      <!-- No org selected -->
      <div
        v-if="!currentOrg"
        class="text-center py-16"
      >
        <UIcon name="i-lucide-building-2" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No organization selected</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select an organization from the header to manage settings.
        </p>
      </div>

      <template v-else>
        <!-- Loading -->
        <div v-if="loading" class="animate-pulse space-y-4">
          <div class="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div class="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>

        <!-- Organization tab -->
        <div v-else-if="activeTab === 'organization'" class="max-w-2xl space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-base font-semibold">Organization Details</h2>
            </template>
            <form class="space-y-4" @submit.prevent="saveOrgSettings">
              <UFormField label="Organization name" required>
                <UInput v-model="orgName" class="w-full" />
              </UFormField>
              <UFormField label="Max projects" hint="Maximum number of projects for this organization">
                <UInput v-model.number="orgMaxProjects" type="number" :min="1" :max="100" class="w-full" />
              </UFormField>
              <UFormField label="Max test cases per project" hint="Maximum test cases allowed per project">
                <UInput v-model.number="orgMaxTestCases" type="number" :min="1" :max="10000" class="w-full" />
              </UFormField>
              <div class="flex justify-end">
                <UButton type="submit" :loading="savingOrg" data-testid="settings-save-button">
                  Save Changes
                </UButton>
              </div>
            </form>
          </UCard>

          <!-- Danger zone -->
          <UCard class="border-red-200 dark:border-red-800">
            <template #header>
              <h2 class="text-base font-semibold text-red-300">Danger Zone</h2>
            </template>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Delete Organization</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  This will permanently delete the organization, all projects, and all data.
                </p>
              </div>
              <UButton color="error" variant="outline" size="sm" data-testid="settings-delete-org-button">
                Delete
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- Members tab -->
        <div v-else-if="activeTab === 'members'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Members ({{ members.length }})
            </h2>
            <UButton icon="i-lucide-user-plus" size="sm" data-testid="settings-invite-member-button" @click="showInviteModal = true">
              Invite Member
            </UButton>
          </div>

          <UCard>
            <div class="divide-y divide-gray-200 dark:divide-gray-800">
              <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div class="flex items-center gap-3">
                  <UAvatar
                    :text="member.user?.name?.charAt(0) ?? '?'"
                    :src="member.user?.avatarUrl ?? undefined"
                    size="sm"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white" data-testid="settings-member-name">
                      {{ member.user?.name ?? 'Unknown' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ member.user?.email ?? '' }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <USelect
                    :model-value="member.role"
                    :items="roleOptions"
                    value-key="value"
                    size="xs"
                    class="w-48"
                    @update:model-value="handleRoleChange(member.id, $event as string)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="xs"
                    aria-label="Remove member"
                    data-testid="settings-remove-member-button"
                    @click="handleRemoveMember(member.id)"
                  />
                </div>
              </div>

              <div v-if="members.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No members found.
              </div>
            </div>
          </UCard>
        </div>

      </template>
    </template>

    <!-- Invite Modal -->
    <UModal
      v-model:open="showInviteModal"
      title="Invite Member"
      description="Send an invitation to join this organization."
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="handleInvite">
          <UFormField label="Email address" required>
            <UInput
              v-model="inviteEmail"
              type="email"
              placeholder="colleague@example.com"
              autofocus
              class="w-full"
              data-testid="settings-invite-email-input"
            />
          </UFormField>
          <UFormField label="Role" required>
            <USelect
              v-model="inviteRole"
              :items="roleOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="showInviteModal = false">Cancel</UButton>
          <UButton :loading="inviting" :disabled="!inviteEmail.trim()" @click="handleInvite">
            Send Invitation
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
