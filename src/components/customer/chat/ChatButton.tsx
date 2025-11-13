import { useCallback, useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@lib/utils"
import { Badge } from "@components/ui/badge"
import ChatBox from "./ChatBox"

interface ChatButtonProps {
  className?: string
}

export default function ChatButton({ className }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0)

  const handleAssistantMessage = useCallback(() => {
    if (!isOpen) {
      setUnreadChatCount((prev) => Math.min(prev + 1, 99))
    }
  }, [isOpen])

  useEffect(() => {
    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>
      const detail = customEvent.detail
      setNotificationUnreadCount(
        typeof detail === "number" && !Number.isNaN(detail) ? detail : 0
      )
    }

    window.addEventListener(
      "notifications:update-unread",
      handleNotificationUpdate as EventListener
    )
    return () => {
      window.removeEventListener(
        "notifications:update-unread",
        handleNotificationUpdate as EventListener
      )
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setUnreadChatCount(0)
    }
  }, [isOpen])

  const totalBadgeCount = notificationUnreadCount + unreadChatCount

  const fixedStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    left: "auto",
    zIndex: 2147483642,
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={fixedStyle}
          className={cn(
            "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 relative",
            className
          )}
          aria-label="Mở chat AI"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {totalBadgeCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white p-0 flex items-center justify-center text-[10px] font-bold shadow-md">
              {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
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

