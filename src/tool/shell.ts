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
    const dir = (args.workdir as string) || "."
    try {
      const proc = Bun.spawnSync([process.platform === "win32" ? "cmd" : "sh", process.platform === "win32" ? "/c" : "-c", cmd], {
        cwd: dir,
        timeout: 60000,
      })
      const out = proc.stdout.toString() + proc.stderr.toString()
      return { content: out || "(命令执行完毕，无输出)" }
    } catch (e: any) {
      return { content: `执行失败:\n${e.message}` }
    }
  },
}
