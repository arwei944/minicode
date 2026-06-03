/**
 * 模型目录管理 - 从 models.dev 拉取 + 免费模型过滤
 */

const MODELS_URL = "https://models.dev/api.json"

export interface ModelInfo {
  id: string
  provider: string
  name: string
  cost: { input: number; output?: number }
  enabled: boolean
  apiBaseURL?: string
}

export interface ProviderInfo {
  id: string
  name: string
  api?: string
  models: ModelInfo[]
}

export interface ModelCatalog {
  providers: Record<string, ProviderInfo>
  updatedAt: number
}

let _catalog: ModelCatalog | null = null

export function getFreeModelIDs(): string[] {
  if (!_catalog) return ["opencode/deepseek-v4-flash-free", "opencode/big-pickle", "opencode/mimo-v2.5-free", "opencode/grok-code", "opencode/glm-4.7-free", "opencode/ring-2.6-1t-free"]
  const free: ModelInfo[] = []
  for (const p of Object.values(_catalog.providers)) {
    for (const m of p.models) {
      if (m.enabled && m.cost.input === 0) free.push(m)
    }
  }
  const priority = ["deepseek-v4-flash-free", "big-pickle", "mimo-v2.5-free", "grok-code", "ring-2.6-1t-free", "glm-4.7-free"]
  const sorted = priority.map((id) => free.find((m) => m.id === id)).filter(Boolean) as ModelInfo[]
  const rest = free.filter((m) => !priority.includes(m.id))
  return [...sorted, ...rest].map((m) => `${m.provider}/${m.id}`)
}

export function getOpenCodeFreeModels(): string[] {
  if (!_catalog) return ["opencode/deepseek-v4-flash-free", "opencode/big-pickle", "opencode/mimo-v2.5-free", "opencode/grok-code", "opencode/glm-4.7-free", "opencode/ring-2.6-1t-free", "opencode/nemotron-3-super-free"]
  const prov = _catalog.providers["opencode"]
  if (!prov) return getFreeModelIDs().filter((id) => id.startsWith("opencode/"))
  const priority = ["deepseek-v4-flash-free", "big-pickle", "mimo-v2.5-free", "grok-code", "ring-2.6-1t-free", "glm-4.7-free"]
  const sorted = priority.map((id) => prov.models.find((m) => m.id === id)).filter(Boolean) as ModelInfo[]
  const rest = prov.models.filter((m) => !priority.includes(m.id) && m.cost.input === 0)
  return [...sorted, ...rest].map((m) => `opencode/${m.id}`)
}

export async function fetchCatalog(): Promise<ModelCatalog> {
  const res = await fetch(MODELS_URL)
  if (!res.ok) throw new Error(`Failed to fetch model catalog: ${res.status}`)
  const data = await res.json() as Record<string, any>

  const catalog: ModelCatalog = { providers: {}, updatedAt: Date.now() }
  const hasKey = !!process.env.OPENCODE_API_KEY

  for (const [pid, pdata] of Object.entries(data)) {
    if (!pdata.models || typeof pdata.models !== "object") continue

    const provider: ProviderInfo = {
      id: pid,
      name: pdata.name || pid,
      api: pdata.api,
      models: [],
    }

    for (const [mid, mdata] of Object.entries(pdata.models) as [string, any][]) {
      const cost = mdata.cost || { input: 0 }
      const enabled = hasKey || (cost.input || 0) === 0
      if (!enabled) continue // 只保留可用的（免费或有 Key）

      provider.models.push({
        id: mid,
        provider: pid,
        name: mdata.name || mid,
        cost: { input: cost.input || 0, output: cost.output },
        enabled: true,
        apiBaseURL: pdata.api,
      })
    }

    if (provider.models.length > 0) {
      catalog.providers[pid] = provider
    }
  }

  _catalog = catalog
  return catalog
}

export function getDefaultModel(): string {
  if (!_catalog) return "opencode/deepseek-v4-flash-free"
  const free = getFreeModelIDs()
  return free[0] || "opencode/deepseek-v4-flash-free"
}

export function resolveModel(spec: string): { providerID: string; modelID: string } {
  if (spec.includes("/")) {
    const [providerID, ...rest] = spec.split("/")
    return { providerID, modelID: rest.join("/") }
  }
  return { providerID: "opencode", modelID: spec }
}

export function getModelBaseURL(providerID: string): string | undefined {
  // opencode 免费模型全部通过 models.dev/api 工作（zen/v1 仅支持 4/19）
  if (!_catalog) return providerID === "opencode" ? "https://models.dev/api" : undefined
  if (providerID === "opencode") return "https://models.dev/api"
  return _catalog.providers[providerID]?.api
}
