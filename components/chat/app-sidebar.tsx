"use client"

import { Plus, Settings } from "lucide-react"
import type { ChatSession, ChatType } from "@/types/chat"
import { MODE_ORDER, getMode } from "./mode-config"
import { MedicMark } from "@/components/medic-mark"
import { ChatHistory } from "./chat-history"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  visibleSessions: ChatSession[]
  activeSession: ChatSession
  setActiveSession: (s: ChatSession) => void
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreSessions: () => void
  onNewSession: (type: ChatType) => void
}

export function AppSidebar({
  visibleSessions,
  activeSession,
  setActiveSession,
  hasMore,
  isLoadingMore,
  loadMoreSessions,
  onNewSession,
}: AppSidebarProps) {
  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-050/70 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="grid h-9 w-9 place-items-center rounded-[var(--r-sm)] border border-white/[0.08] bg-ink-100">
          <MedicMark className="h-[19px] w-[19px] text-signal" />
        </div>
        <div>
          <p className="text-[0.9375rem] font-bold leading-tight tracking-[-0.02em] text-primary-ink">
            MedicAI
          </p>
          <p className="meta leading-normal">Healthcare assistant</p>
        </div>
      </div>

      {/* Modes — three different jobs, visibly three different things */}
      <nav className="px-2 pb-1" aria-label="Start a conversation">
        <h2 className="meta px-2.5 pb-2">Start a conversation</h2>
        <div className="space-y-0.5">
          {MODE_ORDER.map((type, i) => {
            const mode = getMode(type)
            const Icon = mode.icon
            const isCurrent = activeSession.type === type

            return (
              <button
                key={type}
                onClick={() => onNewSession(type)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "animate-rise group flex w-full items-center gap-3 rounded-[var(--r-md)] px-2.5 py-2.5 text-left transition-colors duration-150",
                  "hover:bg-white/[0.045]"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] border transition-colors duration-150",
                    isCurrent
                      ? "border-signal/25 bg-signal/10 text-signal"
                      : "border-white/[0.07] bg-white/[0.025] text-tertiary-ink group-hover:text-secondary-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] font-medium text-primary-ink">
                    {mode.label}
                  </span>
                  <span className="block truncate text-[0.75rem] text-tertiary-ink">
                    {mode.tagline}
                  </span>
                </span>
                <Plus className="h-3.5 w-3.5 shrink-0 text-tertiary-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </button>
            )
          })}
        </div>
      </nav>

      <hr className="rule mx-4 my-3" />

      {/* History */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatHistory
          visibleSessions={visibleSessions}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMoreSessions={loadMoreSessions}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-2 text-[0.8125rem] text-secondary-ink transition-colors hover:bg-white/[0.04] hover:text-primary-ink"
        >
          <Settings className="h-4 w-4 text-tertiary-ink" />
          Settings
        </button>
      </div>
    </aside>
  )
}
