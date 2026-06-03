/**
 * Agent 核心主循环
 */

import { generateText, type CoreMessage, type ToolSet } from "ai"
import { buildProvider } from "./llm"
import { createSession, addMessage, getMessages } from "./session"
import { loadConfig } from "./config"
import { getDefaultModel, fetchCatalog } from "./models"
import { readTool } from "./tool/read"
import { writeTool } from "./tool/write"
import { editTool } from "./tool/edit"
import { grepTool } from "./tool/grep"
import { globTool } from "./tool/glob"
import { shellTool } from "./tool/shell"
import type { Tool, ToolContext } from "./tool/tool"

const BUILTIN_TOOLS: Tool[] = [readTool, writeTool, editTool, grepTool, globTool, shellTool]

function convertToToolSet(tools: Tool[]): ToolSet {
  const set: ToolSet = {}
  for (const t of tools) {
    set[t.name] = {
      description: t.description,
      parameters: t.parameters as any,
      execute: async (args: any, opts: any) => {
        const result = await t.execute(args, {
          sessionID: opts?.toolCallId || "",
          callID: opts?.toolCallId || "",
        })
        return result.content
      },
    }
  }
  return set
}

export interface AgentOptions {
  model?: string
  system?: string
  verbose?: boolean
}

export async function runAgent(prompt: string, opts: AgentOptions = {}) {
  const config = loadConfig()
  const session = createSession()
  const modelSpec = opts.model || config.model || getDefaultModel()
  const [providerID, modelID] = modelSpec.includes("/") ? modelSpec.split("/") : ["opencode", modelSpec]
  const baseURL = providerID === "opencode" ? "https://models.dev/api" : undefined
  const apiKey = providerID === "opencode" ? (process.env.OPENCODE_API_KEY || "public") : config.provider?.[providerID]?.apiKey

  addMessage(session.id, { role: "user", content: prompt })

  const provider = buildProvider(apiKey, baseURL)
  const toolSet = convertToToolSet(BUILTIN_TOOLS)

  if (opts.verbose) {
    console.error(`[Agent] 模型: ${providerID}/${modelID}`)
    console.error(`[Agent] 会话: ${session.id}`)
    console.error(`[Agent] 工具: ${BUILTIN_TOOLS.map((t) => t.name).join(", ")}`)
  }

  const result = await generateText({
    model: provider(modelID),
    messages: [{ role: "user", content: prompt }],
    system: opts.system || config.systemPrompt || "你是一个极简的 AI 编码助手，通过工具帮助用户完成开发任务。",
    maxSteps: 25,
    tools: toolSet as any,
    onError: ({ error }) => {
      if (String(error).includes("429")) {
        throw new Error("免费额度已用完，请设置 OPENCODE_API_KEY 或订阅 OpenCode Go")
      }
    },
  })

  addMessage(session.id, { role: "assistant", content: result.text })

  return {
    sessionID: session.id,
    text: result.text,
    usage: result.usage,
  }
}
