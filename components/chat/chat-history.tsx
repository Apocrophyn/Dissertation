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
      <div className="space-y-2 p-3">
        {visibleSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session)}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              activeSession.id === session.id
                ? "glass-lighter border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={activeSession.id === session.id ? "text-cyan-400" : "text-gray-400"}>
                {getIcon(session.type)}
              </div>
              <div className="flex-1 truncate">
                <div className={`font-medium truncate ${activeSession.id === session.id ? "text-white" : "text-gray-200"}`}>
                  {session.title}
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {session.lastMessage}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {format(session.timestamp, "HH:mm")}
              </div>
            </div>
          </button>
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full hover:bg-white/5 text-gray-300"
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