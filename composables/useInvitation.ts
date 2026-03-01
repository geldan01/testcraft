import type { Invitation, InvitationInfo, CreateInvitationInput, AcceptInvitationInput } from '~/types'

export const useInvitation = () => {
  const toast = useToast()

  async function createInvitation(
    organizationId: string,
    data: CreateInvitationInput,
  ): Promise<{ invitation: Invitation; inviteUrl: string } | null> {
    try {
      return await $fetch<{ invitation: Invitation; inviteUrl: string }>('/api/invitations', {
        method: 'POST',
        body: { organizationId, ...data },
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string; statusMessage?: string } })?.data?.statusMessage
        ?? (err as { data?: { message?: string } })?.data?.message
        ?? 'Failed to create invitation'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function getInvitationInfo(token: string): Promise<InvitationInfo | null> {
    try {
      return await $fetch<InvitationInfo>(`/api/invitations/${token}`)
    } catch {
      return null
    }
  }

  async function acceptInvitation(
    token: string,
    data?: AcceptInvitationInput,
  ): Promise<{ user: any; token: string } | null> {
    try {
      return await $fetch<{ user: any; token: string }>(`/api/invitations/${token}/accept`, {
        method: 'POST',
        body: data ?? {},
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string; statusMessage?: string } })?.data?.statusMessage
        ?? (err as { data?: { message?: string } })?.data?.message
        ?? 'Failed to accept invitation'
      throw new Error(message)
    }
  }

  return { createInvitation, getInvitationInfo, acceptInvitation }
}
