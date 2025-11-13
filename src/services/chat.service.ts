import type { ChatMessageMetadata } from "@models/chat"
import { bambiApi } from "@utils/api"
import { API_ENDPOINTS } from "@utils/endpoints"

export class ChatError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public shouldRetry: boolean = false
  ) {
    super(message)
    this.name = "ChatError"
  }
}

export interface ChatServiceResponse {
  message: string
  metadata?: ChatMessageMetadata | null
  conversationId?: string
  raw?: unknown
}

/**
 * Gửi tin nhắn chat đến AI thông qua endpoint /chat mới (POST)
 * Backend có thể trả về string thuần hoặc object chứa metadata.
 */
export async function chatWithAI(message: string): Promise<ChatServiceResponse> {
  try {
    const response = await bambiApi.get<unknown>(API_ENDPOINTS.API_GEMINI_CHAT, {
      params: { message },
    })
    const data = response.data

    if (typeof data === "string") {
      return { message: data, raw: data }
    }

    if (data && typeof data === "object") {
      const maybeObject = data as {
        message?: string
        reply?: string
        content?: string
        metadata?: ChatMessageMetadata | null
        meta?: ChatMessageMetadata | null
        conversationId?: string
      }

      const resolvedMessage =
        maybeObject.message ??
        maybeObject.reply ??
        maybeObject.content ??
        JSON.stringify(data)

      const metadata = maybeObject.metadata ?? maybeObject.meta ?? null

      return {
        message: resolvedMessage,
        metadata,
        conversationId: maybeObject.conversationId,
        raw: data,
      }
    }

    // Fallback: không nhận diện được data, convert sang string
    return {
      message: typeof data === "undefined" || data === null ? "" : String(data),
      raw: data,
    }
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    throw new ChatError(
      "Không thể kết nối với AI. Vui lòng thử lại sau.",
      status,
      status === 500 || status === 503
    )
  }
}

