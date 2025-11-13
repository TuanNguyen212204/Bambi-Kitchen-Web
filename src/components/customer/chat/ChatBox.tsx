import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, User, Loader2, AlertCircle, RotateCcw } from "lucide-react"
import { cn } from "@lib/utils"
import type { ChatMessageMetadata, ChatMessageNutritionMetadata } from "@models/chat"
import { chatWithAI, ChatError } from "@services/chat.service"
import { getNutritionAdviceForDishes, NutritionError } from "@services/nutrition.service"
import { Button } from "@components/ui/button"
import { Textarea } from "@components/ui/textarea"
import { extractErrorMessage } from "@utils/errors"
import NutritionAnalysisCard from "./NutritionAnalysisCard"
import { useAuthStore } from "@zustand/stores/auth"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
  metadata?: ChatMessageMetadata | null
}

export interface NutritionChatRequest {
  dishIds: number[]
  dishNames?: string[]
  orderId?: number | string
  query?: string
  introMessage?: string
  appendUserMessage?: boolean
}

interface ChatBoxProps {
  isOpen: boolean
  onClose: () => void
  onAssistantMessage?: (message: Message) => void
  nutritionRequest?: NutritionChatRequest | null
  onNutritionRequestConsumed?: () => void
}

type PersistedMessage = Omit<Message, "timestamp"> & { timestamp: string }

export const CHAT_HISTORY_STORAGE_KEY = "bambi-chat-history"

const isNutritionAnalysisMetadata = (
  metadata: ChatMessageMetadata | null | undefined
): metadata is ChatMessageNutritionMetadata => {
  return !!metadata && metadata.type === "nutrition-analysis"
}

const tryDeriveNutritionMetadataFromContent = (
  content: string
): ChatMessageNutritionMetadata | null => {
  const trimmed = content.trim()
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.score === "undefined" ||
      typeof parsed.totals !== "object" ||
      parsed.totals === null
    ) {
      return null
    }

    const analysisBase: ChatMessageNutritionMetadata["analysis"] = {
      score: Number(parsed.score) || 0,
      title: typeof parsed.title === "string" ? parsed.title : "",
      roast: typeof parsed.roast === "string" ? parsed.roast : "",
      totals: {
        calories: Number(
          (parsed.totals as Record<string, unknown>)?.calories
        ) || 0,
        protein: Number(
          (parsed.totals as Record<string, unknown>)?.protein
        ) || 0,
        carb: Number((parsed.totals as Record<string, unknown>)?.carb) || 0,
        fat: Number((parsed.totals as Record<string, unknown>)?.fat) || 0,
        fiber: Number((parsed.totals as Record<string, unknown>)?.fiber) || 0,
      },
      suggest: typeof parsed.suggest === "string" ? parsed.suggest : "",
    }
    if (
      parsed.analysis &&
      typeof parsed.analysis === "object" &&
      parsed.analysis !== null
    ) {
      Object.assign(
        analysisBase,
        parsed.analysis as Record<string, unknown>
      )
    }

    const analysis = analysisBase

    const payload: ChatMessageNutritionMetadata["payload"] = {
      name: typeof parsed.name === "string" ? parsed.name : "Món ăn",
      ingredients: [],
    }

    return {
      type: "nutrition-analysis",
      dishId: Number(parsed.dishId) || 0,
      dishName:
        typeof parsed.dishName === "string"
          ? (parsed.dishName as string)
          : payload.name,
      payload,
      generatedAt: new Date().toISOString(),
      contributions: [],
      analysis,
      missingIngredients: Array.isArray(parsed.missingIngredients)
        ? (parsed.missingIngredients as Array<{ id: number; name: string }>)
        : undefined,
    }
  } catch {
    return null
  }
}

const generateMessageId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const removeDiacritics = (value: string): string =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "")

const extractNutritionDishIds = (content: string): number[] => {
  const normalized = removeDiacritics(content).toLowerCase()
  if (!normalized.includes("dinh duong") && !normalized.includes("nutrition")) {
    return []
  }
  const matches = content.match(/\d+/g)
  if (!matches) return []
  return matches
    .map((item) => Number(item))
    .filter((value) => Number.isFinite(value) && value > 0)
}

const createDefaultMessages = (): Message[] => [
  {
    id: generateMessageId(),
    role: "assistant",
    content:
      "Xin chào! Tôi là trợ lý BambiKitchen AI. Bạn cần mình hỗ trợ điều gì hôm nay?",
    timestamp: new Date(),
    metadata: null,
  },
]

const loadInitialMessages = (): Message[] => {
  if (typeof window === "undefined") {
    return createDefaultMessages()
  }
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (!raw) {
      return createDefaultMessages()
    }
    const parsed = JSON.parse(raw) as PersistedMessage[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createDefaultMessages()
    }
    return parsed.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }))
  } catch {
    return createDefaultMessages()
  }
}

export default function ChatBox({
  isOpen,
  onClose,
  onAssistantMessage,
  nutritionRequest,
  onNutritionRequestConsumed,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(loadInitialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<{ message: string; canRetry: boolean } | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const [isProcessingNutrition, setIsProcessingNutrition] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const processedNutritionRequestRef = useRef<string | null>(null)
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated || Boolean(state.token)
  )

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

  useEffect(() => {
    if (typeof window === "undefined") return
    const serialized: PersistedMessage[] = messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    }))
    window.localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(serialized)
    )
  }, [messages])

  useEffect(() => {
    if (isAuthenticated) return
    setMessages(createDefaultMessages())
  }, [isAuthenticated])

  const handleNutritionAdviceRequest = async (request: NutritionChatRequest) => {
    const uniqueIds = Array.from(
      new Set(
        (request.dishIds || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    )

    if (!uniqueIds.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: "⚠️ Không có món ăn hợp lệ để phân tích dinh dưỡng.",
          timestamp: new Date(),
          isError: true,
        },
      ])
      return
    }

    if (isProcessingNutrition) {
      return
    }

    setIsProcessingNutrition(true)
    const contextLabel = request.orderId
      ? ` cho đơn #${request.orderId}`
      : request.dishNames && request.dishNames.length
      ? ` cho ${request.dishNames.slice(0, 3).join(", ")}${request.dishNames.length > 3 ? "..." : ""}`
      : ""

    const placeholderId = generateMessageId()
    const placeholderMessage: Message = {
      id: placeholderId,
      role: "assistant",
      content: `Đang phân tích dinh dưỡng${contextLabel}...`,
      timestamp: new Date(),
      metadata: null,
    }

    setMessages((prev) => [...prev, placeholderMessage])

    try {
      const response = await getNutritionAdviceForDishes(uniqueIds, {
        query: request.query,
        dishNames: request.dishNames,
      })

      const derivedMetadata =
        response.metadata ?? tryDeriveNutritionMetadataFromContent(response.message)

      const finalMessage: Message = {
        id: placeholderId,
        role: "assistant",
        content: response.message?.trim()
          ? response.message
          : "Mình đã phân tích nhưng không nhận được nội dung cụ thể từ AI.",
        timestamp: new Date(),
        metadata: derivedMetadata ?? null,
      }

      setMessages((prev) =>
        prev.map((message) => (message.id === placeholderId ? finalMessage : message))
      )
      setLastError(null)
      onAssistantMessage?.(finalMessage)
    } catch (error) {
      const nutritionError = error instanceof NutritionError
        ? error
        : new NutritionError("Không thể lấy lời khuyên dinh dưỡng từ AI.", error)

      const errorMessage: Message = {
        id: placeholderId,
        role: "assistant",
        content: `⚠️ ${nutritionError.message}`,
        timestamp: new Date(),
        isError: true,
      }

      setMessages((prev) =>
        prev.map((message) => (message.id === placeholderId ? errorMessage : message))
      )
      setLastError({ message: nutritionError.message, canRetry: false })
    } finally {
      setIsProcessingNutrition(false)
      onNutritionRequestConsumed?.()
    }
  }

  useEffect(() => {
    if (!isOpen || !nutritionRequest) {
      return
    }

    // Tạo unique key cho request để tránh xử lý trùng lặp
    const requestKey = `${nutritionRequest.dishIds.join(",")}-${nutritionRequest.orderId || ""}`
    
    // Nếu đã xử lý request này rồi, bỏ qua
    if (processedNutritionRequestRef.current === requestKey) {
      return
    }

    // Đánh dấu đã xử lý
    processedNutritionRequestRef.current = requestKey

    const shouldAppendUserMessage = nutritionRequest.appendUserMessage !== false
    if (shouldAppendUserMessage) {
      const userContent =
        nutritionRequest.introMessage?.trim() ||
        (nutritionRequest.orderId
          ? `Phân tích dinh dưỡng cho đơn #${nutritionRequest.orderId}`
          : nutritionRequest.query?.trim() ||
            (nutritionRequest.dishNames?.length
              ? `Phân tích dinh dưỡng cho ${nutritionRequest.dishNames.join(", ")}`
              : "Phân tích dinh dưỡng"))

      if (userContent) {
        const syntheticUserMessage: Message = {
          id: generateMessageId(),
          role: "user",
          content: userContent,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, syntheticUserMessage])
      }
    }

    void handleNutritionAdviceRequest(nutritionRequest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nutritionRequest, isOpen])

  // Reset processed request khi đóng chatBox
  useEffect(() => {
    if (!isOpen) {
      processedNutritionRequestRef.current = null
    }
  }, [isOpen])

  const handleSend = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim()
    if (!messageToSend || isLoading || isProcessingNutrition) return

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
    setLastError(null)

    const nutritionDishIds = extractNutritionDishIds(messageToSend)
    if (nutritionDishIds.length > 0) {
      await handleNutritionAdviceRequest({
        dishIds: nutritionDishIds,
        query: messageToSend,
      })
      if (!retryMessage) {
        setInput("")
      }
      return
    }

    setIsLoading(true)

    try {
      const response = await chatWithAI(userMessage.content)
      const derivedMetadata =
        response.metadata ?? tryDeriveNutritionMetadataFromContent(response.message)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        metadata: derivedMetadata,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setLastError(null)
      onAssistantMessage?.(assistantMessage)
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
        <div className="flex items-center justify-between p-4 border-b border-border bg-orange-500 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold text-lg">BambiKitchen AI</h3>
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
          {messages.map((message) => {
            const isAssistant = message.role === "assistant"
            const showAlertIcon =
              message.isError || message.content.includes("⚠️")
            const isNutritionMessage =
              isAssistant &&
              !showAlertIcon &&
              isNutritionAnalysisMetadata(message.metadata)

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {isAssistant && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%]",
                    isNutritionMessage
                      ? "w-full sm:max-w-[85%] space-y-2"
                      : "rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : showAlertIcon
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : isNutritionMessage
                      ? "bg-transparent text-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isNutritionMessage ? (
                    <>
                      {message.content && (
                        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap shadow-sm">
                          {message.content}
                        </div>
                      )}
                      <NutritionAnalysisCard
                        metadata={message.metadata as ChatMessageNutritionMetadata}
                      />
                      <p className="text-xs opacity-70 mt-2 text-right">
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        {showAlertIcon && (
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm whitespace-pre-wrap flex-1">
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })}
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
              disabled={isLoading || isProcessingNutrition}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isProcessingNutrition}
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

