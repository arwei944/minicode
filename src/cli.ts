#!/usr/bin/env node

import { runAgent } from "./agent"
import { getDefaultModel, getFreeModelIDs, fetchCatalog } from "./models"
import { readFileSync } from "node:fs"

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]

  if (cmd === "models") {
    console.log("正在加载模型目录...")
    await fetchCatalog()
    const free = getFreeModelIDs()
    console.log("\n可用免费模型:")
    for (const m of free) console.log(`  ${m}`)
    console.log(`\n默认模型: ${getDefaultModel()}`)
    return
  }

  if (cmd === "pipe") {
    const input = readFileSync("/dev/stdin", "utf-8").trim()
    if (!input) { console.error("请通过管道传入内容"); process.exit(1) }
    const result = await runAgent(input)
    console.log(result.text)
    return
  }

  if (cmd === "-v" || cmd === "--version" || cmd === "version") {
    console.log("minicode v0.1.0")
    return
  }

  // 提取 prompt：支持 `minicode "prompt"` 或 `minicode run "prompt"`
  const hasRunPrefix = cmd === "run"
  const input = hasRunPrefix ? args.slice(1).join(" ") : args.join(" ")

  if (!input) {
    // 交互模式
    console.log("Minicode - 零依赖 AI 编码助手 (输入 exit 退出)")
    console.log(`默认模型: ${getDefaultModel()}`)
    console.log("---")

    const readline = (await import("readline")).default
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.on("line", async (line) => {
      if (line === "exit" || line === "quit") { rl.close(); return }
      try {
        const result = await runAgent(line, { verbose: true })
        console.log(`\n${result.text}\n`)
        console.log(`--- (输入: ${result.usage.inputTokens}, 输出: ${result.usage.outputTokens})`)
      } catch (e: any) {
        console.error(`\n错误: ${e.message}\n`)
      }
    })
    return
  }

  const result = await runAgent(input)
  console.log(result.text)
}

main().catch((e) => {
  console.error(e.message || String(e))
  process.exit(1)
})
