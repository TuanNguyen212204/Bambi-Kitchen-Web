import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@lib/utils"
import ChatBox from "./ChatBox"

interface ChatButtonProps {
  className?: string
}

export default function ChatButton({ className }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95",
            className
          )}
          aria-label="Mở chat AI"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}
      
      {isOpen && <ChatBox isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  )
}

