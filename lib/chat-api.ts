import { createClient } from '@/lib/supabase/client'
import { ChatRequest, ChatResponse } from '@/types/chat'

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as ChatResponse
  } catch (error) {
    console.error('Error sending chat message:', error)
    return {
      message: 'Sorry, there was an error processing your request. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function uploadFile(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export async function getChatHistory() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching chat history:', error)
    return []
  }

  return data
} 