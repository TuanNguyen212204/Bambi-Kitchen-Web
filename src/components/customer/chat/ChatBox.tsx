import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, User, Loader2, AlertCircle, RotateCcw } from "lucide-react"
import { cn } from "@lib/utils"
import { chatWithAIFallback, ChatError } from "@services/chat.service"
import { Button } from "@components/ui/button"
import { Textarea } from "@components/ui/textarea"
import { extractErrorMessage } from "@utils/errors"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
}

interface ChatBoxProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của Bambi Kitchen. Tôi có thể giúp gì cho bạn hôm nay?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<{ message: string; canRetry: boolean } | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim()
    if (!messageToSend || isLoading) return

    // Nếu đang retry, xóa message lỗi cuối cùng (nếu có)
    if (retryMessage) {
      setMessages((prev) => {
        const filtered = [...prev]
        // Tìm và xóa message lỗi cuối cùng
        for (let i = filtered.length - 1; i >= 0; i--) {
          if (filtered[i].isError || filtered[i].content.includes("⚠️")) {
            filtered.splice(i, 1)
            break
          }
        }
        return filtered
      })
      setLastError(null)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!retryMessage) {
      setInput("")
      setLastUserMessage(messageToSend)
    }
    setIsLoading(true)
    setLastError(null)

    try {
      const response = await chatWithAIFallback(userMessage.content)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLastError(null)
    } catch (error) {
      const isChatError = error instanceof ChatError
      const statusCode = isChatError ? error.statusCode : (error as { response?: { status?: number } })?.response?.status
      const canRetry = isChatError ? error.shouldRetry : (statusCode === 500 || statusCode === 503)
      
      let errorText = extractErrorMessage(error) || "Xin lỗi, đã xảy ra lỗi khi kết nối với AI."
      
      // Customize error message based on status code
      if (statusCode === 500) {
        errorText = "⚠️ Máy chủ AI đang gặp sự cố. Hệ thống đã tự động thử phương thức khác nhưng vẫn không thành công. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ."
      } else if (statusCode === 503) {
        errorText = "⚠️ Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau."
      } else if (statusCode === 401 || statusCode === 403) {
        errorText = "⚠️ Bạn không có quyền sử dụng tính năng này. Vui lòng đăng nhập lại."
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
      setLastError({ message: errorText, canRetry })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSend(lastUserMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[2147483645] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Chat Box */}
      <div 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[2147483646] flex flex-col w-[calc(100vw-2rem)] sm:w-full max-w-md h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px] bg-background border border-border rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Chat với AI</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Đóng chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.isError || message.content.includes("⚠️")
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-start gap-2">
                  {(message.isError || message.content.includes("⚠️")) && (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border space-y-2">
          {lastError && lastError.canRetry && (
            <div className="flex items-center justify-between p-2 bg-destructive/10 text-destructive rounded-md text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Lỗi kết nối. Bạn có muốn thử lại không?</span>
              </div>
              <Button
                onClick={handleRetry}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Thử lại
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn của bạn..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="self-end"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

