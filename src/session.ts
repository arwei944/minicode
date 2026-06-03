/**
 * 会话管理 - 内存存储
 */

export interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  toolCallID?: string
  toolName?: string
}

export interface Session {
  id: string
  messages: Message[]
  createdAt: number
}

let sessions: Map<string, Session> = new Map()

export function createSession(id?: string): Session {
  const sid = id || crypto.randomUUID()
  const session: Session = { id: sid, messages: [], createdAt: Date.now() }
  sessions.set(sid, session)
  return session
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id)
}

export function addMessage(sessionID: string, msg: Message): Session {
  let session = sessions.get(sessionID)
  if (!session) session = createSession(sessionID)
  session.messages.push(msg)
  return session
}

export function getMessages(sessionID: string, limit = 50): Message[] {
  const session = sessions.get(sessionID)
  if (!session) return []
  return session.messages.slice(-limit)
}

export function clearSession(sessionID: string): void {
  sessions.delete(sessionID)
}

export function listSessions(): Session[] {
  return Array.from(sessions.values())
}
