/**
 * 工具系统核心类型
 */

export interface ToolContext {
  sessionID: string
  callID: string
}

export interface ToolResult {
  content: string
  metadata?: Record<string, unknown>
}

export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>
}
