import { Glob } from "bun"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const globTool: Tool = {
  name: "glob",
  description: "搜索文件名（通配符模式）",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "glob 模式（如 **/*.ts）" },
      path: { type: "string", description: "搜索目录" },
    },
    required: ["pattern"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    const pattern = args.pattern as string
    const dir = (args.path as string) || "."
    const glob = new Glob(pattern)
    const files: string[] = []
    for await (const file of glob.scan(dir)) {
      files.push(file)
      if (files.length >= 200) break
    }
    return { content: files.join("\n") || "无匹配文件" }
  },
}
