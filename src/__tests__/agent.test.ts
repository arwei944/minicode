import { describe, it, expect } from "bun:test"
import { createSession, addMessage, getMessages } from "../session"
import { loadConfig, saveConfig } from "../config"

describe("Session", () => {
  it("创建并获取会话", () => {
    const s = createSession("test-1")
    expect(s.id).toBe("test-1")
    expect(s.messages).toHaveLength(0)
  })

  it("添加消息", () => {
    const s = createSession("test-2")
    addMessage("test-2", { role: "user", content: "hello" })
    addMessage("test-2", { role: "assistant", content: "world" })
    const msgs = getMessages("test-2")
    expect(msgs).toHaveLength(2)
    expect(msgs[0].content).toBe("hello")
    expect(msgs[1].content).toBe("world")
  })

  it("消息数量限制", () => {
    createSession("test-3")
    for (let i = 0; i < 60; i++) {
      addMessage("test-3", { role: "user", content: `msg-${i}` })
    }
    const msgs = getMessages("test-3", 50)
    expect(msgs).toHaveLength(50)
    expect(msgs[0].content).toBe("msg-10")
  })
})

describe("Config", () => {
  it("加载默认配置", () => {
    const cfg = loadConfig()
    expect(cfg).toBeDefined()
  })
})

describe("Tools", () => {
  it("shell 工具返回结果", async () => {
    const { shellTool } = await import("../tool/shell")
    const cmd = process.platform === "win32" ? "cmd /c echo hello" : "echo hello"
    const result = await shellTool.execute({ command: cmd }, { sessionID: "t", callID: "1" })
    expect(result.content).toContain("hello")
  }, 15000)

  it("write 工具创建文件", async () => {
    const { writeTool } = await import("../tool/write")
    const testPath = import.meta.dir + "/_test_output.txt"
    await writeTool.execute({ filePath: testPath, content: "test content" }, { sessionID: "t", callID: "1" })
    const { readTool } = await import("../tool/read")
    const result = await readTool.execute({ filePath: testPath }, { sessionID: "t", callID: "2" })
    expect(result.content).toContain("test content")
    await import("fs").then((fs) => fs.unlinkSync(testPath))
  })
})
