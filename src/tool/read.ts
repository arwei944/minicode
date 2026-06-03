import { readFileSync, existsSync } from "fs"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const readTool: Tool = {
  name: "read",
  description: "读取文件内容",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "文件路径" },
      offset: { type: "number", description: "起始行数" },
      limit: { type: "number", description: "最大行数" },
    },
    required: ["filePath"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    const fp = args.filePath as string
    if (!existsSync(fp)) return { content: `文件不存在: ${fp}` }
    const content = readFileSync(fp, "utf-8")
    const lines = content.split("\n")
    const offset = (args.offset as number) || 0
    const limit = (args.limit as number) || lines.length
    return { content: lines.slice(offset, offset + limit).join("\n") }
  },
}
