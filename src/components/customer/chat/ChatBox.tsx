import { useState, useRef, useEffect } from "react"
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  RotateCcw,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@lib/utils"
import type { ChatMessageMetadata, ChatMessageNutritionMetadata } from "@models/chat"
import { chatWithAI, ChatError } from "@services/chat.service"
import { calculateDishNutrition } from "@services/nutrition.service"
import { Button } from "@components/ui/button"
import { Textarea } from "@components/ui/textarea"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog"
import { extractErrorMessage } from "@utils/errors"
import NutritionAnalysisCard from "./NutritionAnalysisCard"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
  metadata?: ChatMessageMetadata | null
}

interface ChatBoxProps {
  isOpen: boolean
  onClose: () => void
  onAssistantMessage?: (message: Message) => void
}

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

const formatMetric = (value: number, digits = 1): string => {
  if (!Number.isFinite(value)) return "0"
  if (digits === 0 || Math.abs(value) >= 100 || Number.isInteger(value)) {
    return value.toFixed(0)
  }
  return value.toFixed(digits)
}

export default function ChatBox({ isOpen, onClose, onAssistantMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của Bambi Kitchen. Tôi có thể giúp gì cho bạn hôm nay?",
      timestamp: new Date(),
      metadata: null,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<{ message: string; canRetry: boolean } | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const [isNutritionDialogOpen, setIsNutritionDialogOpen] = useState(false)
  const [nutritionDishId, setNutritionDishId] = useState("")
  const [isNutritionLoading, setIsNutritionLoading] = useState(false)
  const [nutritionError, setNutritionError] = useState<string | null>(null)
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

  const handleNutritionDialogOpenChange = (open: boolean) => {
    setIsNutritionDialogOpen(open)
    if (!open) {
      setNutritionError(null)
      setNutritionDishId("")
    }
  }

  const handleNutritionAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isNutritionLoading) return

    const trimmedId = nutritionDishId.trim()
    const parsedDishId = Number(trimmedId)
    if (!Number.isFinite(parsedDishId) || parsedDishId <= 0) {
      setNutritionError("Vui lòng nhập ID món hợp lệ (số dương).")
      return
    }

    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: `Phân tích dinh dưỡng cho món #${parsedDishId}`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    setIsNutritionLoading(true)
    setNutritionError(null)

    try {
      const result = await calculateDishNutrition(parsedDishId)
      const analysis = result.analysis
      const totals = analysis.totals ?? {
        calories: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        fiber: 0,
      }

      const summaryLines = [
        `Phân tích dinh dưỡng cho món "${result.dishName}" (#${result.dishId}).`,
        `Điểm tổng quát: ${formatMetric(analysis.score, 1)}/10`,
        `🔥 Calories: ${formatMetric(totals.calories ?? 0, 0)} kcal`,
        `💪 Protein: ${formatMetric(totals.protein ?? 0)} g • 🍚 Carb: ${formatMetric(totals.carb ?? 0)} g`,
        `🥑 Fat: ${formatMetric(totals.fat ?? 0)} g • 🌿 Fiber: ${formatMetric(totals.fiber ?? 0)} g`,
      ]

      if (Array.isArray(result.missingIngredients) && result.missingIngredients.length > 0) {
        summaryLines.push(
          "",
          `⚠️ Thiếu dữ liệu dinh dưỡng cho: ${result.missingIngredients
            .map((item) => item.name)
            .join(", ")}`
        )
      }

      if (analysis.suggest) {
        summaryLines.push("", `Gợi ý: ${analysis.suggest}`)
      }

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: summaryLines.join("\n"),
        timestamp: new Date(),
        metadata: {
          type: "nutrition-analysis",
          dishId: result.dishId,
          dishName: result.dishName,
          payload: result.payload,
          generatedAt: new Date().toISOString(),
          contributions: result.contributions,
          analysis,
          missingIngredients:
            Array.isArray(result.missingIngredients) && result.missingIngredients.length > 0
              ? result.missingIngredients
              : undefined,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
      onAssistantMessage?.(assistantMessage)
      setIsNutritionDialogOpen(false)
      setNutritionDishId("")
      setNutritionError(null)
    } catch (error) {
      const errorText =
        extractErrorMessage(error) || "Không thể phân tích dinh dưỡng món ăn. Vui lòng thử lại sau."
      const assistantError: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: errorText.startsWith("⚠️") ? errorText : `⚠️ ${errorText}`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, assistantError])
      setNutritionError(errorText)
    } finally {
      setIsNutritionLoading(false)
    }
  }

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
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Chat với AI</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsNutritionDialogOpen(true)}
              disabled={isNutritionLoading}
              className="bg-white/20 text-primary-foreground hover:bg-white/30 border border-white/30 hover:text-primary-foreground"
            >
              {isNutritionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UtensilsCrossed className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs sm:text-sm">Phân tích món</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Đóng chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
      <Dialog open={isNutritionDialogOpen} onOpenChange={handleNutritionDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phân tích dinh dưỡng món ăn</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ lấy dữ liệu món thực tế, tổng hợp dinh dưỡng và gửi kết quả trực tiếp
              vào khung chat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNutritionAnalyze} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-nutrition-dish-id">ID món ăn</Label>
              <Input
                id="chat-nutrition-dish-id"
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ví dụ: 12"
                value={nutritionDishId}
                onChange={(event) => {
                  setNutritionDishId(event.target.value)
                  setNutritionError(null)
                }}
                disabled={isNutritionLoading}
              />
              {nutritionError ? (
                <p className="text-sm text-destructive">{nutritionError}</p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              * Yêu cầu cần thông tin dinh dưỡng của từng nguyên liệu. Nếu thiếu dữ liệu, hệ thống
              sẽ thông báo trong kết quả.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNutritionDialogOpenChange(false)}
                disabled={isNutritionLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isNutritionLoading}>
                {isNutritionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Đang phân tích...</span>
                  </>
                ) : (
                  "Phân tích ngay"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

