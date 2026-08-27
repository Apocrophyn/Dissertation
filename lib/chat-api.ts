import type { ChatAttachment, ChatRequest, ChatResponse } from '@/types/chat'

/**
 * Streams a reply token by token.
 *
 * The endpoint answers with `text/plain` on success and JSON on failure, so
 * every recoverable error still arrives before the first byte of the body —
 * which is what lets the UI show a real error rather than a truncated answer.
 *
 * `onDelta` receives each decoded chunk; the resolved value is the full reply.
 * An aborted request rejects with an `AbortError` the caller is expected to
 * recognise and treat as a deliberate stop, not a failure.
 */
export async function streamChatMessage(
  request: ChatRequest,
  { onDelta, signal }: { onDelta: (delta: string) => void; signal?: AbortSignal }
): Promise<string> {
  const response = await fetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => ({}))) as Partial<ChatResponse>
    throw new Error(data.error || `MedicAI request failed (${response.status})`)
  }

  const reader = response.body.getReader()
  // Streamed chunks can split a multi-byte character, so the decoder has to
  // carry state across reads.
  const decoder = new TextDecoder()
  let full = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (!chunk) continue
      full += chunk
      onDelta(chunk)
    }
  } finally {
    reader.releaseLock()
  }

  const tail = decoder.decode()
  if (tail) {
    full += tail
    onDelta(tail)
  }

  if (!full.trim()) throw new Error('MedicAI returned an empty response. Please try again.')
  return full
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
