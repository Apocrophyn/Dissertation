import type { ChatAttachment, ChatRequest, ChatResponse } from '@/types/chat'

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const data = (await response.json().catch(() => ({}))) as Partial<ChatResponse>
  if (!response.ok || !data.message) {
    throw new Error(data.error || `MedicAI request failed (${response.status})`)
  }

  return data as ChatResponse
}

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024

export async function prepareAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('Attachments must be smaller than 3 MB')
  }

  if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
    throw new Error('Only PDF and image attachments are supported')
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The attachment could not be read'))
    reader.readAsDataURL(file)
  })

  return { name: file.name, type: file.type, dataUrl }
}
