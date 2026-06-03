import { loadConfig } from "./config"
import { getDefaultModel, getModelBaseURL } from "./models"
import { chat, type ChatMessage, type ToolDef, type ToolCall, FreeTierError } from "./llm"
import { readTool } from "./tool/read"
import { writeTool } from "./tool/write"
import { editTool } from "./tool/edit"
import { grepTool } from "./tool/grep"
import { globTool } from "./tool/glob"
import { shellTool } from "./tool/shell"
import type { Tool, ToolContext } from "./tool/tool"

const BUILTIN_TOOLS: Tool[] = [readTool, writeTool, editTool, grepTool, globTool, shellTool]

function toolsToDefs(tools: Tool[]): ToolDef[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters as Record<string, unknown> },
  }))
}

export interface AgentOptions {
  model?: string
  system?: string
  verbose?: boolean
}

const SYSTEM_PROMPT = "你是 Minicode，一个极简的 AI 编码助手。通过工具帮助用户完成开发任务。请调用合适的工具来完成任务。"

export interface AgentResult {
  text: string
  usage: { inputTokens: number; outputTokens: number }
  messages: ChatMessage[]
}

export async function runAgent(prompt: string, opts: AgentOptions = {}): Promise<AgentResult> {
  return runAgentWithMessages([{ role: "user", content: prompt }], opts)
}

export async function runAgentWithMessages(
  newMessages: ChatMessage[],
  opts: AgentOptions = {},
  existingMessages?: ChatMessage[],
): Promise<AgentResult> {
  const config = loadConfig()
  const modelSpec = opts.model || config.model || getDefaultModel()
  const [providerID, modelID] = modelSpec.includes("/") ? modelSpec.split("/") : ["opencode", modelSpec]
  const baseURL = getModelBaseURL(providerID)
  const apiKey = providerID === "opencode" ? undefined : config.provider?.[providerID]?.apiKey

  if (opts.verbose) console.error(`[Agent] 模型: ${providerID}/${modelID}`)

  const systemPrompt = opts.system || config.systemPrompt || SYSTEM_PROMPT
  let messages: ChatMessage[] = existingMessages ? [...existingMessages] : [{ role: "system", content: systemPrompt }]
  messages.push(...newMessages)

  const toolDefs = toolsToDefs(BUILTIN_TOOLS)
  let finalText = ""
  let totalInput = 0
  let totalOutput = 0
  const maxRounds = 15

  for (let round = 0; round < maxRounds; round++) {
    const result = await chat({ model: modelID, baseURL, apiKey }, messages, toolDefs)
    totalInput += result.usage.inputTokens
    totalOutput += result.usage.outputTokens

    if (result.content) {
      finalText += result.content
      messages.push({ role: "assistant", content: result.content })
    }

    if (!result.tool_calls || result.tool_calls.length === 0) break

    messages.push({
      role: "assistant",
      content: result.content || "",
      tool_calls: result.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    })

    for (const tc of result.tool_calls) {
      try {
        const args = JSON.parse(tc.function.arguments)
        const tool = BUILTIN_TOOLS.find((t) => t.name === tc.function.name)
        if (!tool) {
          messages.push({ role: "tool", content: `未知工具: ${tc.function.name}`, tool_call_id: tc.id })
          continue
        }
        const toolResult = await tool.execute(args, { sessionID: "", callID: tc.id })
        if (opts.verbose) console.error(`[Tool] ${tc.function.name}(${JSON.stringify(args)})`)
        messages.push({ role: "tool", content: toolResult.content, tool_call_id: tc.id })
      } catch (e: any) {
        messages.push({ role: "tool", content: `执行失败: ${e.message}`, tool_call_id: tc.id })
      }
    }
  }

  return { text: finalText, usage: { inputTokens: totalInput, outputTokens: totalOutput }, messages }
}
