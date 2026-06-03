import { execSync } from "child_process"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const grepTool: Tool = {
  name: "grep",
  description: "搜索文件内容（正则匹配）",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "搜索模式" },
      path: { type: "string", description: "搜索目录" },
      include: { type: "string", description: "文件过滤（如 *.ts）" },
    },
    required: ["pattern"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    try {
      const pattern = args.pattern as string
      const dir = (args.path as string) || "."
      const inc = args.include as string
      let cmd = `rg -n "${pattern}" "${dir}"`
      if (inc) cmd += ` -g "${inc}"`
      cmd += " 2>&1 || true"
      const out = execSync(cmd, { encoding: "utf-8", maxBuffer: 1024 * 1024 })
      return { content: out.slice(0, 10000) || "无匹配结果" }
    } catch {
      return { content: "grep 执行失败，请确认 ripgrep (rg) 已安装" }
    }
  },
}
