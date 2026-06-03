#!/usr/bin/env node

/**
 * CLI 入口
 */

import { runAgent } from "./agent"
import { createSession, addMessage, getMessages } from "./session"
import { getDefaultModel, fetchCatalog, getFreeModelIDs } from "./models"
import { loadConfig, saveConfig } from "./config"
import { readFileSync } from "fs"

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]

  switch (cmd) {
    case "init":
    case "config": {
      const cfg = loadConfig()
      console.log(JSON.stringify(cfg, null, 2))
      break
    }

    case "models": {
      await fetchCatalog()
      const free = getFreeModelIDs()
      console.log("可用免费模型:")
      for (const m of free) console.log(`  ${m}`)
      console.log(`\n默认模型: ${getDefaultModel()}`)
      break
    }

    case "run":
    case undefined: {
      const input = args.slice(cmd === "run" ? 1 : 0).join(" ") || ""

      if (!input) {
        // 交互模式
        console.log("Minicode - 极简 AI 编码助手 (输入 exit 退出)")
        const session = createSession()
        const readline = (await import("readline")).default
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

        const ask = () => {
          rl.question("> ", async (line) => {
            if (line === "exit" || line === "quit") { rl.close(); return }
            addMessage(session.id, { role: "user", content: line })
            const result = await runAgent(line, { verbose: true })
            console.log(`\n${result.text}\n`)
            ask()
          })
        }
        ask()
        return
      }

      // 单次模式
      const result = await runAgent(input)
      console.log(result.text)
      break
    }

    case "pipe": {
      // 管道模式：从 stdin 读内容作为 prompt
      const input = readFileSync("/dev/stdin", "utf-8").trim()
      if (!input) { console.error("请通过管道传入内容"); process.exit(1) }
      const result = await runAgent(input)
      console.log(result.text)
      break
    }

    case "version":
    case "--version":
    case "-v":
      console.log("minicode v0.1.0")
      break

    default:
      console.error(`未知命令: ${cmd}`)
      console.error("用法: minicode [run] <prompt> | models | config | version")
      process.exit(1)
  }
}

main().catch((e) => {
  console.error(e.message || String(e))
  process.exit(1)
})
