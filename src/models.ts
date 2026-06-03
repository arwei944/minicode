/**
 * 模型目录管理 - 从 models.dev 拉取 + 免费模型过滤
 */

const MODELS_URL = "https://models.dev/api.json"
const OPENCODE_API = "https://opencode.ai/zen/v1"
// 实际可用免费模型（opencode.ai/zen/v1 仅支持这些）
const WORKING_FREE = ["deepseek-v4-flash-free", "big-pickle", "mimo-v2.5-free", "nemotron-3-super-free"]

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
  return WORKING_FREE.map((id) => `opencode/${id}`)
}

export function getOpenCodeFreeModels(): string[] {
  return WORKING_FREE.map((id) => `opencode/${id}`)
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
  return "opencode/deepseek-v4-flash-free"
}

export function resolveModel(spec: string): { providerID: string; modelID: string } {
  if (spec.includes("/")) {
    const [providerID, ...rest] = spec.split("/")
    return { providerID, modelID: rest.join("/") }
  }
  return { providerID: "opencode", modelID: spec }
}

export function getModelBaseURL(providerID: string): string | undefined {
  if (providerID === "opencode") return OPENCODE_API
  if (!_catalog) return undefined
  return _catalog.providers[providerID]?.api
}
