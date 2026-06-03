/**
 * LLM 调用层 - 零外部依赖，直接 fetch
 * 支持 opencode 免费模型和标准 OpenAI API
 */

export interface LLMConfig {
  apiKey?: string
  baseURL?: string
  model: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  tool_call_id?: string
  name?: string
}

export interface ToolDef {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ToolCall {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export interface ChatResult {
  content: string | null
  tool_calls: ToolCall[]
  usage: { inputTokens: number; outputTokens: number }
}

export class FreeTierError extends Error {
  constructor() { super("免费额度已用完，请设置 OPENCODE_API_KEY 或订阅 OpenCode Go"); this.name = "FreeTierError" }
}

export async function chat(
  config: LLMConfig,
  messages: ChatMessage[],
  tools?: ToolDef[],
): Promise<ChatResult> {
  const apiKey = config.apiKey || process.env.OPENCODE_API_KEY || "public"
  const baseURL = config.baseURL || "https://models.dev/api"

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    max_tokens: 16384,
  }
  if (tools && tools.length > 0) body.tools = tools

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 429) throw new FreeTierError()
  if (!res.ok) {
    const err = await res.text().catch(() => "")
    throw new Error(`LLM API 错误 (${res.status}): ${err}`)
  }

  const data = await res.json() as any
  const choice = data.choices?.[0]?.message

  return {
    content: choice?.content || null,
    tool_calls: choice?.tool_calls || [],
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  }
}

export async function* chatStream(
  config: LLMConfig,
  messages: ChatMessage[],
  tools?: ToolDef[],
): AsyncGenerator<string | ToolCall[]> {
  const apiKey = config.apiKey || process.env.OPENCODE_API_KEY || "public"
  const baseURL = config.baseURL || "https://models.dev/api"

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    max_tokens: 16384,
    stream: true,
  }
  if (tools && tools.length > 0) body.tools = tools

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (res.status === 429) throw new FreeTierError()
  if (!res.ok) throw new Error(`LLM API 错误 (${res.status})`)
  if (!res.body) throw new Error("无响应体")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue
      const json = trimmed.slice(6)
      if (json === "[DONE]") return
      try {
        const data = JSON.parse(json)
        const delta = data.choices?.[0]?.delta
        if (delta?.content) yield delta.content
        if (delta?.tool_calls) {
          const calls: ToolCall[] = delta.tool_calls.map((tc: any) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" },
          }))
          if (calls.some((c) => c.id)) yield calls
        }
      } catch { /* 跳过解析失败的行 */ }
    }
  }
}
