"use client"

import { useEffect, useMemo, useState } from "react"
import { HardDrive, Plus, Search, Trash2 } from "lucide-react"
import type { ChatSession, ChatType } from "@/types/chat"
import { MODE_ORDER, getMode } from "./mode-config"
import { MedicLogo } from "@/components/medic-mark"
import { GlassOrb, orbClass } from "@/components/ui/glass-orb"
import { ChatHistory } from "./chat-history"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

const SESSIONS_PER_PAGE = 12

interface AppSidebarProps {
  sessions: ChatSession[]
  activeSession: ChatSession
  setActiveSession: (session: ChatSession) => void
  onNewSession: (type: ChatType) => void
  onRenameSession: (id: string, title: string) => void
  onDeleteSession: (id: string) => void
  onDeleteAll: () => void
}

export function AppSidebar({
  sessions,
  activeSession,
  setActiveSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onDeleteAll,
}: AppSidebarProps) {
  const [query, setQuery] = useState("")
  const [displayCount, setDisplayCount] = useState(SESSIONS_PER_PAGE)

  useEffect(() => setDisplayCount(SESSIONS_PER_PAGE), [query])

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return [...sessions]
      .sort((first, second) => second.timestamp.getTime() - first.timestamp.getTime())
      .filter((session) =>
        normalizedQuery
          ? `${session.title} ${session.lastMessage}`.toLocaleLowerCase().includes(normalizedQuery)
          : true
      )
  }, [query, sessions])

  const visibleSessions = filteredSessions.slice(0, displayCount)

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-050/90 backdrop-blur-xl">
      <div className="flex h-[4.5rem] items-center px-4">
        <MedicLogo />
      </div>

      <nav className="px-2 pb-1" aria-label="Start a conversation">
        <h2 className="meta px-2.5 pb-2">Start a conversation</h2>
        <div className="space-y-0.5">
          {MODE_ORDER.map((type, index) => {
            const mode = getMode(type)
            const Icon = mode.icon
            const isCurrent = activeSession.type === type

            return (
              <button
                key={type}
                type="button"
                onClick={() => onNewSession(type)}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-rise group flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition-colors duration-150 hover:bg-white/[0.045]"
              >
                <GlassOrb
                  size="md"
                  tone={isCurrent ? "signal" : "quiet"}
                  aria-hidden
                  className="transition-colors duration-150 group-hover:text-primary-ink"
                >
                  <Icon className="h-4 w-4" />
                </GlassOrb>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] font-medium text-primary-ink">{mode.label}</span>
                  <span className="block truncate text-[0.75rem] text-tertiary-ink">{mode.tagline}</span>
                </span>
                <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0 text-tertiary-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </button>
            )
          })}
        </div>
      </nav>

      <hr className="rule mx-4 my-3" />

      <div className="px-3 pb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary-ink" />
          <span className="sr-only">Search conversations</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="h-10 w-full rounded-full border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-[0.8125rem] text-primary-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] outline-none transition-colors placeholder:text-tertiary-ink focus:border-signal/35 focus:bg-white/[0.04]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatHistory
          visibleSessions={visibleSessions}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          hasMore={displayCount < filteredSessions.length}
          loadMoreSessions={() => setDisplayCount((count) => count + SESSIONS_PER_PAGE)}
          onRenameSession={onRenameSession}
          onDeleteSession={onDeleteSession}
          emptyMessage={query ? "No conversations match your search." : "Your conversations will appear here."}
        />
      </div>

      <div className="border-t border-white/[0.06] p-2">
        <div className="flex items-center gap-2.5 rounded-full px-2 py-1.5">
          <GlassOrb size="md" aria-hidden>
            <HardDrive className="h-4 w-4" />
          </GlassOrb>
          <div className="min-w-0 flex-1">
            <p className="text-[0.75rem] text-secondary-ink">Saved on this device</p>
            <p className="truncate text-[0.6875rem] text-tertiary-ink">Private to this browser</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                aria-label="Delete all conversations"
                className={cn(orbClass({ size: "md" }), "hover:text-urgent")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-white/[0.09] bg-ink-100 text-primary-ink sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete every conversation?</AlertDialogTitle>
                <AlertDialogDescription className="text-secondary-ink">
                  This permanently removes all chat history stored in this browser.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/[0.1] bg-transparent text-primary-ink hover:bg-white/[0.06]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAll}
                  className="bg-red-500 text-white hover:bg-red-400"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </aside>
  )
}
