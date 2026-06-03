#!/usr/bin/env node

/**
 * CLI 入口 - 零外部依赖
 */

import { runAgent } from "./agent"
import { getDefaultModel, getFreeModelIDs, fetchCatalog } from "./models"
import { loadConfig } from "./config"
import { readFileSync } from "fs"

async function promptUser(): Promise<string> {
  const buf = new Uint8Array(1024)
  const n = Deno ? 0 : await new Promise<number>((resolve) => {
    process.stdin.once("data", (data) => {
      resolve(data.length)
      buf.set(data)
    })
  })
  return new TextDecoder().decode(buf.slice(0, n)).trim()
}

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]

  switch (cmd) {
    case "models": {
      console.log("正在加载模型目录...")
      await fetchCatalog()
      const free = getFreeModelIDs()
      console.log("\n可用免费模型:")
      for (const m of free) console.log(`  ${m}`)
      console.log(`\n默认模型: ${getDefaultModel()}`)
      break
    }

    case "run":
    case undefined: {
      const input = args.slice(cmd === "run" ? 1 : 0).join(" ")

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
      break
    }

    case "pipe": {
      const input = readFileSync("/dev/stdin", "utf-8").trim()
      if (!input) { console.error("请通过管道传入内容"); process.exit(1) }
      const result = await runAgent(input)
      console.log(result.text)
      break
    }

    case "-v":
    case "--version":
    case "version":
      console.log("minicode v0.1.0")
      break

    default:
      console.error(`未知命令: ${cmd}`)
      console.error("用法: minicode [run] <prompt> | models | version")
      process.exit(1)
  }
}

main().catch((e) => {
  console.error(e.message || String(e))
  process.exit(1)
})
