import type { Attachment } from '~/types'

export function getAttachmentDownloadUrl(attachmentId: string): string {
  return `/api/attachments/${attachmentId}/download`
}

export const useAttachment = () => {
  const toast = useToast()

  async function uploadAttachment(
    file: File,
    testRunId?: string,
    testCaseId?: string,
  ): Promise<Attachment | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const params = new URLSearchParams()
      if (testRunId) params.set('testRunId', testRunId)
      if (testCaseId) params.set('testCaseId', testCaseId)

      const query = params.toString()
      const url = `/api/attachments/upload${query ? `?${query}` : ''}`

      return await $fetch<Attachment>(url, {
        method: 'POST',
        body: formData,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to upload attachment'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function deleteAttachment(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/attachments/${id}`, { method: 'DELETE' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete attachment'
      toast.add({ title: message, color: 'error' })
      return false
    }
  }

  async function getTestRunAttachments(testRunId: string): Promise<Attachment[]> {
    try {
      return await $fetch<Attachment[]>(`/api/test-runs/${testRunId}/attachments`)
    } catch {
      return []
    }
  }

  async function getTestCaseAttachments(testCaseId: string): Promise<Attachment[]> {
    try {
      return await $fetch<Attachment[]>(`/api/test-cases/${testCaseId}/attachments`)
    } catch {
      return []
    }
  }

  return {
    uploadAttachment,
    deleteAttachment,
    getTestRunAttachments,
    getTestCaseAttachments,
  }
}
