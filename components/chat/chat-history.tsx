"use client"

import { useMemo, useState } from "react"
import { format, isThisWeek, isToday, isYesterday } from "date-fns"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { ChatSession } from "@/types/chat"
import { getMode } from "./mode-config"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ChatHistoryProps {
  visibleSessions: ChatSession[]
  activeSession: ChatSession
  setActiveSession: (session: ChatSession) => void
  hasMore: boolean
  loadMoreSessions: () => void
  onRenameSession: (id: string, title: string) => void
  onDeleteSession: (id: string) => void
  emptyMessage: string
}

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
  loadMoreSessions,
  onRenameSession,
  onDeleteSession,
  emptyMessage,
}: ChatHistoryProps) {
  const [renaming, setRenaming] = useState<ChatSession | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleting, setDeleting] = useState<ChatSession | null>(null)

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; sessions: ChatSession[] }> = []
    for (const session of visibleSessions) {
      const label = bucketOf(session.timestamp)
      const lastGroup = groups[groups.length - 1]
      if (lastGroup?.label === label) lastGroup.sessions.push(session)
      else groups.push({ label, sessions: [session] })
    }
    return groups
  }, [visibleSessions])

  const openRename = (session: ChatSession) => {
    setRenameValue(session.title)
    setRenaming(session)
  }

  const saveRename = () => {
    if (!renaming || !renameValue.trim()) return
    onRenameSession(renaming.id, renameValue)
    setRenaming(null)
  }

  return (
    <>
      {visibleSessions.length === 0 ? (
        <p className="px-4 py-6 text-center text-[0.8125rem] leading-relaxed text-tertiary-ink">
          {emptyMessage}
        </p>
      ) : (
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
                    <div
                      key={session.id}
                      className={cn(
                        "group relative flex items-center rounded-[var(--r-sm)] transition-colors duration-150",
                        isActive
                          ? "bg-white/[0.07] text-primary-ink"
                          : "text-secondary-ink hover:bg-white/[0.04] hover:text-primary-ink"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-signal transition-opacity duration-200",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setActiveSession(session)}
                        aria-current={isActive ? "page" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-2.5 pr-1 text-left"
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-signal" : "text-tertiary-ink group-hover:text-secondary-ink"
                          )}
                        />
                        <span className="truncate text-[0.8125rem]">{session.title}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for ${session.title}`}
                            className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-tertiary-ink opacity-0 transition-all hover:bg-white/[0.07] hover:text-primary-ink focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          side="right"
                          className="border-white/[0.09] bg-ink-100 text-primary-ink"
                        >
                          <DropdownMenuItem
                            onSelect={() => openRename(session)}
                            className="focus:bg-white/[0.07] focus:text-primary-ink"
                          >
                            <Pencil /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setDeleting(session)}
                            className="text-red-300 focus:bg-red-500/10 focus:text-red-200"
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {hasMore ? (
            <button
              type="button"
              onClick={loadMoreSessions}
              className="w-full rounded-[var(--r-sm)] px-2.5 py-2 text-[0.8125rem] text-tertiary-ink transition-colors hover:bg-white/[0.04] hover:text-primary-ink"
            >
              Show older
            </button>
          ) : null}
        </div>
      )}

      <Dialog open={!!renaming} onOpenChange={(open) => (open ? undefined : setRenaming(null))}>
        <DialogContent className="border-white/[0.09] bg-ink-100 text-primary-ink sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription className="text-secondary-ink">
              Choose a title that will be easy to find later.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={renameValue}
            maxLength={80}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveRename()
            }}
            aria-label="Conversation title"
            className="h-10 rounded-[var(--r-sm)] border border-white/[0.1] bg-white/[0.035] px-3 text-sm text-primary-ink outline-none focus:border-signal/40"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenaming(null)}
              className="h-10 rounded-[var(--r-sm)] border border-white/[0.1] px-4 text-sm text-secondary-ink hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRename}
              disabled={!renameValue.trim()}
              className="h-10 rounded-[var(--r-sm)] bg-signal px-4 text-sm font-medium text-ink-000 hover:brightness-110 disabled:opacity-50"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => (open ? undefined : setDeleting(null))}>
        <AlertDialogContent className="border-white/[0.09] bg-ink-100 text-primary-ink sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary-ink">
              “{deleting?.title}” and all of its messages will be permanently removed from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.1] bg-transparent text-primary-ink hover:bg-white/[0.06]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) onDeleteSession(deleting.id)
                setDeleting(null)
              }}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
