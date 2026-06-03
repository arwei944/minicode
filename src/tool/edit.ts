import { readFileSync, writeFileSync, existsSync } from "fs"
import type { Tool, ToolContext, ToolResult } from "./tool"

export const editTool: Tool = {
  name: "edit",
  description: "编辑文件（替换文本）",
  parameters: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "文件路径" },
      oldString: { type: "string", description: "要替换的原文" },
      newString: { type: "string", description: "替换后的新文本" },
    },
    required: ["filePath", "oldString", "newString"],
  },
  async execute(args: Record<string, unknown>, _ctx: ToolContext): Promise<ToolResult> {
    const fp = args.filePath as string
    if (!existsSync(fp)) return { content: `文件不存在: ${fp}` }
    const content = readFileSync(fp, "utf-8")
    const oldStr = args.oldString as string
    const newStr = args.newString as string

    const idx = content.indexOf(oldStr)
    if (idx === -1) return { content: `未找到匹配的文本` }

    const updated = content.slice(0, idx) + newStr + content.slice(idx + oldStr.length)
    writeFileSync(fp, updated, "utf-8")
    return { content: `已编辑 ${fp}` }
  },
}
