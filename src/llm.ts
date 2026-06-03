/**
 * LLM 调用层 - 精简版，支持 opencode 免费模型和标准 OpenAI API
 */

import { generateText, type CoreMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { getOpenCodeApiKey } from "./config"
import type { ToolSet } from "ai"

export interface LLMConfig {
  model: string
  apiKey?: string
  baseURL?: string
  system?: string
  maxSteps?: number
}

export function buildProvider(apiKey?: string, baseURL?: string) {
  const key = apiKey || getOpenCodeApiKey() || "public"
  return createOpenAI({
    apiKey: key,
    baseURL: baseURL || "https://models.dev/api",
  })
}

export async function chat(config: LLMConfig, messages: CoreMessage[], tools?: ToolSet) {
  const provider = buildProvider(config.apiKey, config.baseURL)

  const result = await generateText({
    model: provider(config.model),
    messages,
    system: config.system,
    maxSteps: config.maxSteps ?? 10,
    tools: tools as any,
    // 捕获免费额度超限错误
    onError: ({ error }) => {
      if (error instanceof Error && error.message.includes("429")) {
        throw new FreeTierError()
      }
    },
  })

  return result
}

export class FreeTierError extends Error {
  constructor() {
    super("Free usage exceeded, subscribe to OpenCode Go")
    this.name = "FreeTierError"
  }
}
