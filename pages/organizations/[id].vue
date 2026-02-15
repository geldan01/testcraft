<script setup lang="ts">
import type { Organization, OrganizationMember, RbacPermission, Project, CreateProjectInput } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const orgId = computed(() => route.params.id as string)

const { getOrganization, getMembers, getRbacPermissions, switchOrg } = useOrganization()
const { fetchProjects, projects, createProject } = useProject()

// Fetch data
const org = ref<Organization | null>(null)
const members = ref<OrganizationMember[]>([])
const permissions = ref<RbacPermission[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const [orgData, membersData, permissionsData] = await Promise.all([
      getOrganization(orgId.value),
      getMembers(orgId.value),
      getRbacPermissions(orgId.value),
    ])
    org.value = orgData
    members.value = membersData
    permissions.value = permissionsData

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
          <UButton icon="i-lucide-user-plus" size="sm" data-testid="org-detail-invite-member-button">
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
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">RBAC Configuration</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure role-based access control for this organization.
          </p>
        </div>

        <UCard>
          <div
            v-if="permissions.length === 0"
            class="text-center py-8 text-sm text-gray-500 dark:text-gray-400"
          >
            No RBAC permissions configured. Default permissions will be used.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Object Type</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                  <th class="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Allowed</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="perm in permissions"
                  :key="perm.id"
                  class="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td class="py-2 px-3">
                    <UBadge :color="getRoleBadgeColor(perm.role)" variant="subtle" size="xs">
                      {{ formatRole(perm.role) }}
                    </UBadge>
                  </td>
                  <td class="py-2 px-3 text-gray-700 dark:text-gray-300">
                    {{ formatRole(perm.objectType) }}
                  </td>
                  <td class="py-2 px-3 text-gray-700 dark:text-gray-300">
                    {{ perm.action }}
                  </td>
                  <td class="py-2 px-3 text-center">
                    <UIcon
                      :name="perm.allowed ? 'i-lucide-check' : 'i-lucide-x'"
                      :class="perm.allowed ? 'text-green-500' : 'text-red-500'"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
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
  </div>
</template>
