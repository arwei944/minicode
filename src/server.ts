import { runAgentWithMessages, type AgentResult } from "./agent"
import { getDefaultModel, getFreeModelIDs, fetchCatalog, getModelBaseURL } from "./models"
import { loadConfig } from "./config"
import type { ChatMessage } from "./llm"

const PORT = parseInt(process.env.PORT || "3000")

// 会话存储
interface WebSession {
  id: string
  name: string
  messages: ChatMessage[]
  model: string
  created: number
}
const sessions = new Map<string, WebSession>()
let sessionCounter = 0

function makeID(): string {
  return "s_" + (++sessionCounter).toString(36) + "_" + Date.now().toString(36)
}

function firstLine(s: string): string {
  const line = s.replace(/\n.*$/s, "").trim()
  return line.length > 30 ? line.slice(0, 30) + "..." : line || "新会话"
}

async function chatInSession(sessionID: string, prompt: string): Promise<{ text: string; name?: string }> {
  const sess = sessions.get(sessionID)
  if (!sess) throw new Error("会话不存在")

  const modelSpec = sess.model
  const [providerID, modelID] = modelSpec.includes("/") ? modelSpec.split("/") : ["opencode", modelSpec]

  const result: AgentResult = await runAgentWithMessages(
    [{ role: "user", content: prompt }],
    { model: modelSpec, verbose: false },
    sess.messages,
  )

  // 保存会话历史
  sess.messages = result.messages

  // 初次对话自动命名
  if (!sess.name || sess.name === "新会话") {
    sess.name = firstLine(prompt)
  }

  return { text: result.text, name: sess.name }
}

// 预加载模型目录
fetchCatalog().catch(() => {})

const html = await Bun.file(new URL("./web/index.html", import.meta.url)).text()

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // 静态页面
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } })
    }

    // 模型列表
    if (url.pathname === "/api/models" && req.method === "GET") {
      const free = getFreeModelIDs()
      const def = getDefaultModel()
      return Response.json({
        default: def,
        models: free.map((id) => ({ id, label: id.replace(/^opencode\//, "") })),
      })
    }

    // 会话列表
    if (url.pathname === "/api/sessions" && req.method === "GET") {
      const list = Array.from(sessions.entries())
        .sort((a, b) => b[1].created - a[1].created)
        .map(([id, s]) => ({ id, name: s.name, created: s.created }))
      return Response.json({ sessions: list })
    }

    // 创建会话
    if (url.pathname === "/api/sessions" && req.method === "POST") {
      const body = await req.json().catch(() => ({}))
      const id = makeID()
      const model = body.model || getDefaultModel()
      sessions.set(id, { id, name: "新会话", messages: [], model, created: Date.now() })
      return Response.json({ id, name: "新会话" })
    }

    // 获取会话消息
    const msgMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/messages$/)
    if (msgMatch && req.method === "GET") {
      const sess = sessions.get(msgMatch[1])
      if (!sess) return Response.json({ error: "会话不存在" }, { status: 404 })
      return Response.json({ messages: sess.messages })
    }

    // 会话聊天
    const chatMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/chat$/)
    if (chatMatch && req.method === "POST") {
      const body = await req.json().catch(() => ({}))
      if (!body.prompt) return Response.json({ error: "prompt 不能为空" }, { status: 400 })
      try {
        const result = await chatInSession(chatMatch[1], body.prompt)
        return Response.json(result)
      } catch (e: any) {
        return Response.json({ error: e.message || String(e) }, { status: 500 })
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Minicode Web 版: http://localhost:${PORT}`)
