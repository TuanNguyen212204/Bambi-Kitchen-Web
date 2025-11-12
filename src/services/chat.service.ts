import { bambiApi } from "@utils/api"
import { API_ENDPOINTS } from "@utils/endpoints"

export interface ChatRequest {
  message: string
}

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

/**
 * Gửi tin nhắn chat đến AI bằng GET request
 */
export async function chatWithAI(message: string): Promise<string> {
  try {
    const response = await bambiApi.get<string>(API_ENDPOINTS.API_GEMINI_CHAT(message))
    return response.data || ""
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    throw new ChatError(
      "Không thể kết nối với AI. Vui lòng thử lại sau.",
      status,
      status === 500 || status === 503
    )
  }
}

/**
 * Gửi tin nhắn chat đến AI bằng POST request (agent chat)
 */
export async function agentChatWithAI(message: string): Promise<string> {
  try {
    const response = await bambiApi.post<string, ChatRequest>(
      API_ENDPOINTS.API_GEMINI_AGENT,
      { message }
    )
    return response.data || ""
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    throw new ChatError(
      "Không thể kết nối với AI. Vui lòng thử lại sau.",
      status,
      status === 500 || status === 503
    )
  }
}

/**
 * Gửi tin nhắn với fallback: thử POST trước, nếu lỗi thì thử GET
 */
export async function chatWithAIFallback(message: string): Promise<string> {
  try {
    // Thử POST trước (agent chat - tốt hơn)
    return await agentChatWithAI(message)
  } catch (error) {
    // Nếu POST lỗi (đặc biệt là 500), thử GET làm fallback
    if (error instanceof ChatError && error.shouldRetry) {
      try {
        return await chatWithAI(message)
      } catch (fallbackError) {
        // Nếu cả hai đều lỗi, throw lỗi cuối cùng
        throw fallbackError
      }
    }
    // Nếu không phải lỗi có thể retry, throw ngay
    throw error
  }
}

