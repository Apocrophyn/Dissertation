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
      <div className="space-y-1 p-2">
        {visibleSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
              activeSession.id === session.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`flex-shrink-0 ${activeSession.id === session.id ? "text-cyan-400" : "text-gray-500"}`}>
                {getIcon(session.type)}
              </div>
              <div className="flex-1 truncate font-normal">
                {session.title}
              </div>
            </div>
          </button>
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full hover:bg-white/5 text-sm text-gray-400 mt-2"
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