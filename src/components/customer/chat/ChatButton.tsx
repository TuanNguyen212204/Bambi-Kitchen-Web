import { useCallback, useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import ChatBox, { CHAT_HISTORY_STORAGE_KEY } from "./ChatBox"
import { useAuthStore } from "@zustand/stores/auth"

interface ChatButtonProps {
  className?: string
}

export default function ChatButton({ className }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const canUseChat = useAuthStore(
    (state) => state.isAuthenticated || Boolean(state.token)
  )

  const handleAssistantMessage = useCallback(() => {
    if (!isOpen) {
      setUnreadChatCount((prev) => Math.min(prev + 1, 99))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setUnreadChatCount(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!canUseChat && isOpen) {
      setIsOpen(false)
    }
  }, [canUseChat, isOpen])

  useEffect(() => {
    if (canUseChat) return
    if (typeof window === "undefined") return
    window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY)
    setUnreadChatCount(0)
  }, [canUseChat])

  const fixedStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    left: "auto",
    zIndex: 2147483642,
  }

  if (!canUseChat) {
    return null
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={fixedStyle}
          className={cn(
            "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-orange-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-95 relative",
            className
          )}
          aria-label="Mở BambiKitchen AI"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadChatCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white p-0 flex items-center justify-center text-[10px] font-bold shadow-md">
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </Badge>
          )}
        </button>
      )}
      
      {isOpen && (
        <ChatBox
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onAssistantMessage={handleAssistantMessage}
        />
      )}
    </>
  )
}

