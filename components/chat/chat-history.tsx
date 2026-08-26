"use client"

import { isToday, isYesterday, isThisWeek, format } from "date-fns"
import { useMemo } from "react"
import type { ChatSession } from "@/types/chat"
import { getMode } from "./mode-config"
import { cn } from "@/lib/utils"

interface ChatHistoryProps {
  visibleSessions: ChatSession[]
  activeSession: ChatSession
  setActiveSession: (session: ChatSession) => void
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreSessions: () => void
}

/** Buckets sessions the way people actually remember them. */
function bucketOf(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  if (isThisWeek(date, { weekStartsOn: 1 })) return "Earlier this week"
  return format(date, "MMMM yyyy")
}

export function ChatHistory({
  visibleSessions,
  activeSession,
  setActiveSession,
  hasMore,
  isLoadingMore,
  loadMoreSessions,
}: ChatHistoryProps) {
  const grouped = useMemo(() => {
    const groups: { label: string; sessions: ChatSession[] }[] = []
    for (const session of visibleSessions) {
      const label = bucketOf(new Date(session.timestamp))
      const last = groups[groups.length - 1]
      if (last?.label === label) last.sessions.push(session)
      else groups.push({ label, sessions: [session] })
    }
    return groups
  }, [visibleSessions])

  if (visibleSessions.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[0.8125rem] leading-relaxed text-tertiary-ink">
        Your conversations will appear here.
      </p>
    )
  }

  return (
    <div className="space-y-5 px-2 pb-2">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="meta px-2.5 pb-1.5">{group.label}</h3>
          <div className="space-y-0.5">
            {group.sessions.map((session) => {
              const mode = getMode(session.type)
              const Icon = mode.icon
              const isActive = activeSession.id === session.id

              return (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-2 text-left transition-colors duration-150",
                    isActive
                      ? "bg-white/[0.07] text-primary-ink"
                      : "text-secondary-ink hover:bg-white/[0.04] hover:text-primary-ink"
                  )}
                >
                  {/* Active marker: a 2px signal bar, not a full colored border */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-signal transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-signal" : "text-tertiary-ink group-hover:text-secondary-ink"
                    )}
                  />
                  <span className="flex-1 truncate text-[0.8125rem]">{session.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={loadMoreSessions}
          disabled={isLoadingMore}
          className="w-full rounded-[var(--r-sm)] px-2.5 py-2 text-[0.8125rem] text-tertiary-ink transition-colors hover:bg-white/[0.04] hover:text-primary-ink disabled:opacity-50"
        >
          {isLoadingMore ? "Loading…" : "Show older"}
        </button>
      )}
    </div>
  )
}
