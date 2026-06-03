import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"

export interface Config {
  model?: string
  systemPrompt?: string
  provider?: Record<string, { apiKey?: string }>
}

function configDir(): string {
  const env = process.env.XDG_CONFIG_HOME || process.env.HOME || process.env.USERPROFILE
  if (!env) throw new Error("Cannot find config directory")
  const dir = path.join(env, ".config", "minicode")
  mkdirSync(dir, { recursive: true })
  return dir
}

function configPath(): string {
  return path.join(configDir(), "config.json")
}

export function loadConfig(): Config {
  const p = configPath()
  if (!existsSync(p)) return {}
  return JSON.parse(readFileSync(p, "utf-8"))
}

export function saveConfig(cfg: Config): void {
  writeFileSync(configPath(), JSON.stringify(cfg, null, 2))
}

export function getOpenCodeApiKey(): string | undefined {
  return process.env.OPENCODE_API_KEY || undefined
}

export function hasOpenCodeKey(): boolean {
  return !!getOpenCodeApiKey()
}
