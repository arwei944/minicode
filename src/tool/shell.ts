import { execSync } from "child_process"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const shellTool: Tool = {
  name: "bash",
  description: "执行 Shell 命令",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "要执行的命令" },
      workdir: { type: "string", description: "工作目录" },
    },
    required: ["command"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    const cmd = args.command as string
    const dir = (args.workdir as string) || process.cwd()
    try {
      const out = execSync(cmd, {
        cwd: dir,
        encoding: "utf-8",
        maxBuffer: 5 * 1024 * 1024,
        timeout: 60000,
      })
      return { content: out || "(命令执行完毕，无输出)" }
    } catch (e: any) {
      const msg = e.stderr || e.message || String(e)
      return { content: `执行失败:\n${msg}` }
    }
  },
}
