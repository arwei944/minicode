import { writeFileSync, mkdirSync, existsSync } from "fs"
import path from "path"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const writeTool: Tool = {
  name: "write",
  description: "写入/创建文件",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "文件路径" },
      content: { type: "string", description: "文件内容" },
    },
    required: ["filePath", "content"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    const fp = args.filePath as string
    const dir = path.dirname(fp)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(fp, args.content as string, "utf-8")
    return { content: `已写入 ${fp}` }
  },
}
