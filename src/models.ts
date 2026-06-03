/**
 * 模型目录管理 - 从 models.dev 拉取 + 免费模型过滤
 * 这是从 opencode 源码核心逻辑精简而来
 */

const MODELS_URL = "https://models.dev/api.json"
const FREE_MODEL_PRIORITY = ["gpt-5-nano", "big-pickle", "grok-code"]

export interface ModelCost {
  input: number
  output?: number
  cache?: { read?: number; write?: number }
}

export interface ModelInfo {
  id: string
  provider: string
  name: string
  cost: ModelCost
  enabled: boolean
}

export interface ProviderInfo {
  id: string
  name: string
  models: ModelInfo[]
}

export interface ModelCatalog {
  providers: Record<string, ProviderInfo>
  updatedAt: number
}

let _catalog: ModelCatalog | null = null

export function getFreeModelIDs(): string[] {
  if (!_catalog) return FREE_MODEL_PRIORITY
  const free: ModelInfo[] = []
  for (const p of Object.values(_catalog.providers)) {
    for (const m of p.models) {
      if (m.enabled && m.cost.input === 0) free.push(m)
    }
  }
  const sorted = FREE_MODEL_PRIORITY.map((id) => free.find((m) => m.id === id)).filter(Boolean) as ModelInfo[]
  const rest = free.filter((m) => !FREE_MODEL_PRIORITY.includes(m.id))
  return [...sorted, ...rest].map((m) => `${m.provider}/${m.id}`)
}

export async function fetchCatalog(): Promise<ModelCatalog> {
  const res = await fetch(MODELS_URL)
  if (!res.ok) throw new Error(`Failed to fetch model catalog: ${res.status}`)
  const data = await res.json()

  const catalog: ModelCatalog = { providers: {}, updatedAt: Date.now() }
  const hasKey = !!process.env.OPENCODE_API_KEY

  for (const [pid, pdata] of Object.entries(data.providers || {})) {
    const p = pdata as any
    const provider: ProviderInfo = {
      id: pid,
      name: p.name || pid,
      models: [],
    }
    for (const [mid, mdata] of Object.entries(p.models || {})) {
      const m = mdata as any
      const cost = m.cost || { input: 0 }
      const enabled = hasKey || (cost.input || 0) === 0
      provider.models.push({
        id: mid,
        provider: pid,
        name: m.name || mid,
        cost: { input: cost.input || 0 },
        enabled,
      })
    }
    catalog.providers[pid] = provider
  }

  _catalog = catalog
  return catalog
}

export function getDefaultModel(): string {
  if (!_catalog) return "gpt-5-nano"
  const free = getFreeModelIDs()
  return free[0] || "gpt-5-nano"
}

export function resolveModel(spec: string): { providerID: string; modelID: string } {
  const [providerID, modelID] = spec.includes("/") ? spec.split("/") : ["opencode", spec]
  return { providerID, modelID }
}
