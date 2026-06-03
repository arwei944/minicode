/**
 * Agent 核心主循环 - 零外部依赖
 */

import { createSession, addMessage } from "./session"
import { loadConfig } from "./config"
import { getDefaultModel, getFreeModelIDs, fetchCatalog, getModelBaseURL } from "./models"
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
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    },
  }))
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
  const baseURL = getModelBaseURL(providerID)
  const apiKey = providerID === "opencode" ? undefined : config.provider?.[providerID]?.apiKey

  addMessage(session.id, { role: "user", content: prompt })

  if (opts.verbose) {
    console.error(`[Agent] 模型: ${providerID}/${modelID} 会话: ${session.id}`)
  }

  const systemPrompt = opts.system || config.systemPrompt ||
    "你是 Minicode，一个极简的 AI 编码助手。通过工具帮助用户完成开发任务。请调用合适的工具来完成任务。"

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }]
  const toolDefs = toolsToDefs(BUILTIN_TOOLS)

  let finalText = ""
  let totalInput = 0
  let totalOutput = 0
  const maxRounds = 15

  for (let round = 0; round < maxRounds; round++) {
    const result = await chat(
      { model: modelID, baseURL, apiKey },
      messages,
      toolDefs,
    )

    totalInput += result.usage.inputTokens
    totalOutput += result.usage.outputTokens

    if (result.content) {
      finalText += result.content
      messages.push({ role: "assistant", content: result.content })
    }

    if (!result.tool_calls || result.tool_calls.length === 0) break

    // 处理工具调用
    for (const tc of result.tool_calls) {
      messages.push({
        role: "assistant",
        content: "",
        tool_call_id: tc.id,
        name: tc.function.name,
      })

      try {
        const args = JSON.parse(tc.function.arguments)
        const tool = BUILTIN_TOOLS.find((t) => t.name === tc.function.name)
        if (!tool) {
          messages.push({
            role: "tool",
            content: `未知工具: ${tc.function.name}`,
            tool_call_id: tc.id,
          })
          continue
        }

        const toolResult = await tool.execute(args, {
          sessionID: session.id,
          callID: tc.id,
        })

        if (opts.verbose) {
          console.error(`[Tool] ${tc.function.name}(${JSON.stringify(args)})`)
        }

        messages.push({
          role: "tool",
          content: toolResult.content,
          tool_call_id: tc.id,
        })
      } catch (e: any) {
        messages.push({
          role: "tool",
          content: `执行失败: ${e.message}`,
          tool_call_id: tc.id,
        })
      }
    }
  }

  addMessage(session.id, { role: "assistant", content: finalText })

  return {
    sessionID: session.id,
    text: finalText,
    usage: { inputTokens: totalInput, outputTokens: totalOutput },
  }
}
