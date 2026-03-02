<script setup lang="ts">
import type { Organization, OrganizationMember, RbacPermission, Project, CreateProjectInput, OrganizationRole, Invitation } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const orgId = computed(() => route.params.id as string)

const authStore = useAuthStore()
const { getOrganization, getMembers, getRbacPermissions, updateRbacPermission, switchOrg } = useOrganization()
const { fetchProjects, projects, createProject } = useProject()
const { createInvitation } = useInvitation()

// Fetch data
const org = ref<Organization | null>(null)
const members = ref<OrganizationMember[]>([])
const permissions = ref<RbacPermission[]>([])
const rbacAccessDenied = ref(false)
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const [orgData, membersData, rbacResult] = await Promise.all([
      getOrganization(orgId.value),
      getMembers(orgId.value),
      getRbacPermissions(orgId.value),
    ])
    org.value = orgData
    members.value = membersData
    permissions.value = rbacResult.data
    rbacAccessDenied.value = rbacResult.accessDenied

    if (orgData) {
      switchOrg(orgData.id)
      await fetchProjects(orgData.id)
    }

    useSeoMeta({
      title: orgData?.name ?? 'Organization',
    })
  } finally {
    loading.value = false
  }
}

await loadData()

const canInvite = computed(() => {
  if (authStore.isAdmin) return true
  const currentMembership = members.value.find(m => m.userId === authStore.user?.id)
  return currentMembership?.role === 'ORGANIZATION_MANAGER'
})

const activeTab = ref('projects')

const tabs = [
  { label: 'Projects', value: 'projects', icon: 'i-lucide-folder' },
  { label: 'Members', value: 'members', icon: 'i-lucide-users' },
  { label: 'RBAC Settings', value: 'rbac', icon: 'i-lucide-shield' },
]

type BadgeColor = 'error' | 'warning' | 'info' | 'success' | 'neutral'

function getRoleBadgeColor(role: string): BadgeColor {
  switch (role) {
    case 'ORGANIZATION_MANAGER': return 'error'
    case 'PROJECT_MANAGER': return 'warning'
    case 'PRODUCT_OWNER': return 'info'
    case 'QA_ENGINEER': return 'success'
    case 'DEVELOPER': return 'neutral'
    default: return 'neutral'
  }
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Create project modal
const showCreateProject = ref(false)
const newProject = reactive({ name: '', description: '' })
const creatingProject = ref(false)
const createProjectError = ref('')

async function handleCreateProject() {
  if (!newProject.name.trim()) return
  creatingProject.value = true
  createProjectError.value = ''
  try {
    const result = await createProject({
      name: newProject.name.trim(),
      description: newProject.description.trim() || undefined,
      organizationId: orgId.value,
    })
    if (result) {
      showCreateProject.value = false
      newProject.name = ''
      newProject.description = ''
      await navigateTo(`/projects/${result.id}`)
    } else {
      createProjectError.value = 'Failed to create project. Please try again.'
    }
  } catch {
    createProjectError.value = 'An error occurred. Please try again.'
  } finally {
    creatingProject.value = false
  }
}

// Invite member modal
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<OrganizationRole>('QA_ENGINEER')
const inviting = ref(false)
const inviteError = ref('')
const inviteLink = ref('')
const emailSent = ref(false)
const linkCopied = ref(false)

const roleOptions = [
  { label: 'Organization Manager', value: 'ORGANIZATION_MANAGER' },
  { label: 'Project Manager', value: 'PROJECT_MANAGER' },
  { label: 'Product Owner', value: 'PRODUCT_OWNER' },
  { label: 'QA Engineer', value: 'QA_ENGINEER' },
  { label: 'Developer', value: 'DEVELOPER' },
]

const emailContent = computed(() => {
  if (!inviteLink.value || !org.value) return ''
  return `You've been invited to join ${org.value.name} on TestCraft as a ${formatRole(inviteRole.value)}!\n\nClick the link below to accept:\n${inviteLink.value}\n\nThis invitation expires in 7 days.`
})

const mailtoLink = computed(() => {
  if (!inviteLink.value || !org.value) return ''
  const subject = encodeURIComponent(`You're invited to join ${org.value.name} on TestCraft`)
  const body = encodeURIComponent(emailContent.value)
  return `mailto:${inviteEmail.value}?subject=${subject}&body=${body}`
})

async function handleInviteMember() {
  if (!inviteEmail.value.trim()) return
  inviting.value = true
  inviteError.value = ''
  inviteLink.value = ''
  try {
    const result = await createInvitation(orgId.value, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })
    if (result) {
      inviteLink.value = result.inviteUrl
      emailSent.value = result.emailSent
    }
  } catch {
    inviteError.value = 'An error occurred. Please try again.'
  } finally {
    inviting.value = false
  }
}

function resetInviteModal() {
  inviteEmail.value = ''
  inviteRole.value = 'QA_ENGINEER'
  inviteError.value = ''
  inviteLink.value = ''
  emailSent.value = false
  linkCopied.value = false
}

async function copyInviteLink() {
  await navigator.clipboard.writeText(inviteLink.value)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}

// RBAC matrix helpers
const RESOURCE_LABELS: Record<string, string> = {
  TEST_CASE: 'Test Cases',
  TEST_PLAN: 'Test Plans',
  TEST_SUITE: 'Test Suites',
  TEST_RUN: 'Test Runs',
  REPORT: 'Reports',
}

const RBAC_ROLES = ['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER'] as const
const OBJECT_TYPES = ['TEST_CASE', 'TEST_PLAN', 'TEST_SUITE', 'TEST_RUN', 'REPORT'] as const
const ACTIONS = ['READ', 'EDIT', 'DELETE'] as const

const permissionMap = computed(() => {
  const map: Record<string, Record<string, Record<string, RbacPermission>>> = {}
  for (const perm of permissions.value) {
    if (!map[perm.role]) map[perm.role] = {}
    if (!map[perm.role][perm.objectType]) map[perm.role][perm.objectType] = {}
    map[perm.role][perm.objectType][perm.action] = perm
  }
  return map
})

function getPermission(role: string, objectType: string, action: string): RbacPermission | undefined {
  return permissionMap.value[role]?.[objectType]?.[action]
}

async function handlePermissionToggle(permissionId: string, currentAllowed: boolean) {
  const updated = await updateRbacPermission(orgId.value, permissionId, !currentAllowed)
  if (updated) {
    const index = permissions.value.findIndex((p) => p.id === permissionId)
    if (index !== -1) {
      permissions.value[index] = updated
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>

    <template v-else-if="org">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-building-2" class="text-2xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ org.name }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ members.length }} members, {{ projects.length }} projects
              </p>
            </div>
          </div>
        </div>
        <UButton
          icon="i-lucide-settings"
          variant="outline"
          color="neutral"
          size="sm"
          data-testid="org-detail-settings-button"
        >
          Settings
        </UButton>
      </div>

      <!-- Tabs -->
      <UTabs
        :items="tabs"
        :model-value="activeTab"
        data-testid="org-detail-tabs"
        @update:model-value="activeTab = $event as string"
      />

      <!-- Projects tab -->
      <div v-if="activeTab === 'projects'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Projects</h2>
          <UButton icon="i-lucide-plus" size="sm" data-testid="org-detail-create-project-button" @click="showCreateProject = true">
            Create Project
          </UButton>
        </div>

        <div
          v-if="projects.length === 0"
          class="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <UIcon name="i-lucide-folder-plus" class="text-3xl text-gray-400 dark:text-gray-400 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No projects yet. Create one to get started.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="project in projects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            :data-testid="`org-detail-project-card-${project.id}`"
            class="group"
          >
            <UCard class="h-full hover:shadow-md transition-shadow">
              <div class="space-y-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {{ project.name }}
                </h3>
                <p
                  v-if="project.description"
                  class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                >
                  {{ project.description }}
                </p>
                <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-400 pt-2">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-test-tubes" />
                    {{ project._count?.testCases ?? 0 }} cases
                  </span>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-users" />
                    {{ project._count?.members ?? 0 }} members
                  </span>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>

      <!-- Members tab -->
      <div v-if="activeTab === 'members'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Members</h2>
          <UButton v-if="canInvite" icon="i-lucide-user-plus" size="sm" data-testid="org-detail-invite-member-button" @click="showInviteModal = true">
            Invite Member
          </UButton>
        </div>

        <UCard>
          <div class="divide-y divide-gray-200 dark:divide-gray-800">
            <div
              v-for="member in members"
              :key="member.id"
              :data-testid="`org-detail-member-${member.id}`"
              class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :text="member.user?.name?.charAt(0) ?? '?'"
                  :src="member.user?.avatarUrl ?? undefined"
                  size="sm"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ member.user?.name ?? 'Unknown' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ member.user?.email ?? '' }}
                  </p>
                </div>
              </div>
              <UBadge
                :color="getRoleBadgeColor(member.role)"
                variant="subtle"
                size="sm"
              >
                {{ formatRole(member.role) }}
              </UBadge>
            </div>

            <div
              v-if="members.length === 0"
              class="text-center py-8 text-sm text-gray-500 dark:text-gray-400"
            >
              No members found.
            </div>
          </div>
        </UCard>
      </div>

      <!-- RBAC tab -->
      <div v-if="activeTab === 'rbac'" class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Role-Based Access Control</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure which roles can perform actions on different resource types.
          </p>
        </div>

        <!-- Access denied -->
        <UCard v-if="rbacAccessDenied">
          <div class="text-center py-8">
            <UIcon name="i-lucide-shield-off" class="text-3xl text-gray-400 mb-2" />
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Insufficient permissions
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Only Organization Managers can view and manage RBAC settings.
            </p>
          </div>
        </UCard>

        <!-- No permissions configured -->
        <UCard v-else-if="permissions.length === 0">
          <div class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No custom RBAC permissions configured. Default permissions apply.
          </div>
        </UCard>

        <!-- Permission matrix per role -->
        <template v-else>
          <UCard v-for="role in RBAC_ROLES" :key="role">
            <template #header>
              <div class="flex items-center gap-2">
                <UBadge :color="getRoleBadgeColor(role) as any" variant="subtle" size="sm">
                  {{ formatRole(role) }}
                </UBadge>
              </div>
            </template>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Resource</th>
                  <th v-for="action in ACTIONS" :key="action" class="text-center py-2 px-4 font-medium text-gray-500 dark:text-gray-400 w-24">
                    {{ action.charAt(0) + action.slice(1).toLowerCase() }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="objectType in OBJECT_TYPES"
                  :key="objectType"
                  class="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td class="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                    {{ RESOURCE_LABELS[objectType] ?? formatRole(objectType) }}
                  </td>
                  <td v-for="action in ACTIONS" :key="action" class="py-2.5 px-4 text-center">
                    <USwitch
                      v-if="getPermission(role, objectType, action)"
                      :model-value="getPermission(role, objectType, action)!.allowed"
                      size="sm"
                      @update:model-value="handlePermissionToggle(getPermission(role, objectType, action)!.id, getPermission(role, objectType, action)!.allowed)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>
        </template>
      </div>
    </template>

    <!-- Not found -->
    <div v-else data-testid="org-detail-not-found" class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Organization not found</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        The organization you're looking for doesn't exist or you don't have access.
      </p>
      <UButton class="mt-4" variant="outline" data-testid="org-detail-back-button" @click="navigateTo('/organizations')">
        Back to Organizations
      </UButton>
    </div>

    <!-- Create project modal -->
    <UModal v-model:open="showCreateProject">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Create Project</h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showCreateProject = false"
              />
            </div>
          </template>

          <form class="space-y-4" @submit.prevent="handleCreateProject">
            <div
              v-if="createProjectError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300"
            >
              {{ createProjectError }}
            </div>

            <UFormField label="Project name" required>
              <UInput
                v-model="newProject.name"
                placeholder="e.g., Mobile App v2"
                class="w-full"
                autofocus
              />
            </UFormField>

            <UFormField label="Description">
              <UTextarea
                v-model="newProject.description"
                placeholder="Brief description of this project..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton variant="ghost" color="neutral" @click="showCreateProject = false">
                Cancel
              </UButton>
              <UButton
                type="submit"
                :loading="creatingProject"
                :disabled="!newProject.name.trim()"
                icon="i-lucide-plus"
              >
                Create
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Invite member modal -->
    <UModal v-model:open="showInviteModal" @close="resetInviteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Invite Member</h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showInviteModal = false"
              />
            </div>
          </template>

          <!-- Step 1: Form -->
          <div v-if="!inviteLink" class="space-y-4">
            <div
              v-if="inviteError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300"
            >
              {{ inviteError }}
            </div>

            <UFormField label="Email address" required>
              <UInput
                v-model="inviteEmail"
                data-testid="invite-email-input"
                type="email"
                placeholder="colleague@company.com"
                icon="i-lucide-mail"
                class="w-full"
                autofocus
                @keydown.enter.prevent="handleInviteMember"
              />
            </UFormField>

            <UFormField label="Role" required>
              <USelect
                v-model="inviteRole"
                data-testid="invite-role-select"
                :items="roleOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Step 2: Invite link generated -->
          <div v-else class="space-y-4">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
              <UIcon name="i-lucide-check-circle" class="text-green-500 text-lg shrink-0 mt-0.5" />
              <div>
                <p class="text-sm text-green-700 dark:text-green-300 font-medium">
                  Invitation created successfully!
                </p>
                <p v-if="emailSent" class="text-sm text-green-600 dark:text-green-400 mt-1">
                  An email invitation has been sent to <strong>{{ inviteEmail }}</strong>.
                </p>
              </div>
            </div>

            <UFormField label="Invite link">
              <div class="flex gap-2">
                <UInput :model-value="inviteLink" readonly class="flex-1" data-testid="invite-link-input" />
                <UButton
                  :icon="linkCopied ? 'i-lucide-check' : 'i-lucide-copy'"
                  :color="linkCopied ? 'success' : 'neutral'"
                  variant="outline"
                  data-testid="invite-copy-button"
                  @click="copyInviteLink"
                />
              </div>
            </UFormField>

            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ emailSent ? 'You can also share this link directly.' : `Share this link with` }}
              <strong v-if="!emailSent">{{ inviteEmail }}</strong>{{ emailSent ? '' : '.' }}
              It expires in 7 days.
            </p>

            <UFormField v-if="!emailSent" label="Or copy this message">
              <UTextarea :model-value="emailContent" readonly :rows="4" class="w-full" data-testid="invite-email-content" />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton v-if="inviteLink && !emailSent" variant="outline" color="neutral" :href="mailtoLink" tag="a" icon="i-lucide-mail" data-testid="invite-mailto-button">
                Send via Email
              </UButton>
              <UButton
                variant="ghost"
                color="neutral"
                @click="showInviteModal = false"
              >
                {{ inviteLink ? 'Done' : 'Cancel' }}
              </UButton>
              <UButton
                v-if="!inviteLink"
                :loading="inviting"
                :disabled="!inviteEmail.trim()"
                icon="i-lucide-send"
                data-testid="invite-submit-button"
                @click="handleInviteMember"
              >
                Create Invitation
              </UButton>
              <UButton
                v-else
                icon="i-lucide-user-plus"
                data-testid="invite-another-button"
                @click="resetInviteModal"
              >
                Invite Another
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
