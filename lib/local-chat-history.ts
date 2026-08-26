import type { ChatSession, ChatType, Message } from '@/types/chat'

const STORAGE_KEY = 'medicai.chat-history.v1'

interface StoredHistory {
  version: 1
  activeSessionId: string | null
  sessions: Array<{
    id: string
    type: ChatType
    title: string
    lastMessage: string
    timestamp: string
    messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>
  }>
}

function isChatType(value: unknown): value is ChatType {
  return value === 'symptom-checker' || value === 'report-analyzer' || value === 'mental-health'
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseMessage(value: unknown): Message | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const timestamp = parseDate(item.timestamp)
  if (
    typeof item.id !== 'string' ||
    typeof item.content !== 'string' ||
    (item.sender !== 'user' && item.sender !== 'assistant') ||
    !timestamp
  ) {
    return null
  }

  return {
    id: item.id,
    content: item.content,
    sender: item.sender,
    timestamp,
    hasFile: item.hasFile === true,
    fileName: typeof item.fileName === 'string' ? item.fileName : undefined,
  }
}

function parseSession(value: unknown): ChatSession | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const timestamp = parseDate(item.timestamp)
  if (
    typeof item.id !== 'string' ||
    !isChatType(item.type) ||
    typeof item.title !== 'string' ||
    typeof item.lastMessage !== 'string' ||
    !timestamp ||
    !Array.isArray(item.messages)
  ) {
    return null
  }

  const messages = item.messages.map(parseMessage).filter((message): message is Message => !!message)
  return { id: item.id, type: item.type, title: item.title, lastMessage: item.lastMessage, timestamp, messages }
}

export function loadChatHistory(): { sessions: ChatSession[]; activeSessionId: string | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sessions: [], activeSessionId: null }
    const stored = JSON.parse(raw) as Partial<StoredHistory>
    if (stored.version !== 1 || !Array.isArray(stored.sessions)) {
      return { sessions: [], activeSessionId: null }
    }

    return {
      sessions: stored.sessions.map(parseSession).filter((session): session is ChatSession => !!session),
      activeSessionId: typeof stored.activeSessionId === 'string' ? stored.activeSessionId : null,
    }
  } catch {
    return { sessions: [], activeSessionId: null }
  }
}

export function saveChatHistory(sessions: ChatSession[], activeSessionId: string): boolean {
  try {
    const payload: StoredHistory = {
      version: 1,
      activeSessionId,
      sessions: sessions.map((session) => ({
        ...session,
        timestamp: session.timestamp.toISOString(),
        messages: session.messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
      })),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}
