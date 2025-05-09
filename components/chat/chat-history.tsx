import { format } from "date-fns"
import { MessageCircle, ClipboardList, Heart } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChatSession, ChatType } from "@/types/chat"

interface ChatHistoryProps {
  visibleSessions: ChatSession[]
  activeSession: ChatSession
  setActiveSession: (session: ChatSession) => void
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreSessions: () => void
}

export function ChatHistory({
  visibleSessions,
  activeSession,
  setActiveSession,
  hasMore,
  isLoadingMore,
  loadMoreSessions,
}: ChatHistoryProps) {
  const getIcon = (type: ChatType) => {
    switch (type) {
      case 'symptom-checker':
        return <MessageCircle className="w-4 h-4" />
      case 'report-analyzer':
        return <ClipboardList className="w-4 h-4" />
      case 'mental-health':
        return <Heart className="w-4 h-4" />
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-2 p-2">
        {visibleSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSession.id === session.id
                ? "bg-primary/10 hover:bg-primary/15"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              {getIcon(session.type)}
              <div className="flex-1 truncate">
                <div className="font-medium truncate">{session.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {session.lastMessage}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(session.timestamp, "HH:mm")}
              </div>
            </div>
          </button>
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={loadMoreSessions}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        )}
      </div>
    </ScrollArea>
  )
} 