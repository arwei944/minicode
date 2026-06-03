import { runAgent } from "./agent"
import { getDefaultModel } from "./models"
import { loadConfig } from "./config"

const PORT = parseInt(process.env.PORT || "3000")

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Minicode Web</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0d1117;color:#e6edf3;height:100vh;display:flex;flex-direction:column}
header{background:#161b22;border-bottom:1px solid #30363d;padding:12px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}
header h1{font-size:16px;font-weight:600;color:#f0f6fc}
header span{font-size:12px;color:#8b949e;padding:2px 8px;background:#21262d;border-radius:4px}
#messages{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px}
#messages:empty::after{content:'输入下方消息开始对话';display:block;text-align:center;color:#484f58;padding:60px 0;font-size:14px}
.msg{max-width:85%;padding:10px 14px;border-radius:8px;line-height:1.6;font-size:14px;white-space:pre-wrap;word-break:break-word;animation:fadeIn .15s}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.msg.user{background:#1f6feb;align-self:flex-end;border-bottom-right-radius:2px}
.msg.assistant{background:#161b22;border:1px solid #30363d;align-self:flex-start;border-bottom-left-radius:2px}
.msg code{background:#21262d;padding:1px 5px;border-radius:3px;font-size:13px;font-family:'Cascadia Code','Fira Code','Consolas',monospace}
.msg pre{background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:12px;margin:8px 0;overflow-x:auto;position:relative}
.msg pre code{background:none;padding:0;font-size:13px;line-height:1.45;display:block;white-space:pre}
.msg pre .lang{position:absolute;top:4px;right:8px;font-size:11px;color:#484f58}
.msg .tool-call{color:#8b949e;font-size:12px;margin-top:4px;padding:4px 8px;background:#0d1117;border-radius:4px;display:inline-block}
.thinking{color:#8b949e;font-size:13px;padding:12px 20px;display:flex;gap:8px;align-items:center}
.thinking::after{content:'';width:12px;height:12px;border:2px solid #30363d;border-top-color:#58a6ff;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
#input-area{background:#161b22;border-top:1px solid #30363d;padding:12px 20px;display:flex;gap:8px;flex-shrink:0}
#input{flex:1;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:10px 14px;color:#e6edf3;font-size:14px;font-family:inherit;outline:none;resize:none;min-height:40px;max-height:120px;transition:border-color .15s}
#input:focus{border-color:#1f6feb}
#send{background:#1f6feb;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:14px;cursor:pointer;font-weight:500;transition:background .15s}
#send:hover{background:#388bfd}#send:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:600px){.msg{max-width:95%}#messages{padding:12px}#input-area{padding:10px}}
</style>
</head>
<body>
<header>
  <h1>Minicode</h1>
  <span id="model-badge"></span>
</header>
<div id="messages"></div>
<div class="thinking" id="thinking" style="display:none">思考中</div>
<div id="input-area">
  <textarea id="input" rows="1" placeholder="输入消息..." onkeydown="onKey(event)"></textarea>
  <button id="send" onclick="send()">发送</button>
</div>
<script>
const modelBadge=document.getElementById('model-badge')
const messagesEl=document.getElementById('messages')
const input=document.getElementById('input')
const sendBtn=document.getElementById('send')
const thinking=document.getElementById('thinking')
let loading=false

init()
async function init(){const r=await fetch('/api/info');const d=await r.json();modelBadge.textContent=d.model}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function render(text){
  let html=''
  let i=0
  while(i<text.length){
    const start=text.indexOf('\`\`\`',i)
    if(start===-1){html+=esc(text.slice(i)).replace(/\n/g,'<br>');break}
    html+=esc(text.slice(i,start)).replace(/\n/g,'<br>')
    const end=text.indexOf('\`\`\`',start+3)
    if(end===-1){html+=esc(text.slice(start)).replace(/\n/g,'<br>');break}
    const block=text.slice(start+3,end)
    const firstNl=block.indexOf('\n')
    const lang=firstNl===-1?'':block.slice(0,firstNl).trim()
    const code=firstNl===-1?block:block.slice(firstNl+1)
    html+='<pre><span class="lang">'+(lang||'code')+'</span><code>'+esc(code)+'</code></pre>'
    i=end+3
  }
  html=html.replace(/\`([^\`\n]+)\`/g,'<code>$1</code>')
  return html
}

function addMsg(role,text){const d=document.createElement('div');d.className='msg '+role;d.textContent=text;messagesEl.appendChild(d);messagesEl.scrollTop=messagesEl.scrollHeight}
function addHTML(role,html){const d=document.createElement('div');d.className='msg '+role;d.innerHTML=html;messagesEl.appendChild(d);messagesEl.scrollTop=messagesEl.scrollHeight}

function autoResize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px'}
function onKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}else{autoResize()}}

async function send(){
  if(loading)return
  const text=input.value.trim()
  if(!text)return
  input.value=''
  addMsg('user',text)
  loading=true;sendBtn.disabled=true;thinking.style.display='flex'
  try{
    const r=await fetch('/api/chat',{headers:{'Content-Type':'application/json'},method:'POST',body:JSON.stringify({prompt:text})})
    const d=await r.json()
    if(d.error){addMsg('assistant','错误: '+d.error)}else{addHTML('assistant',render(d.text))}
  }catch(e){addMsg('assistant','错误: '+e.message)}
  finally{loading=false;sendBtn.disabled=false;thinking.style.display='none';input.focus()}
}
</script>
</body>
</html>`

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, { headers: { "Content-Type": "text/html;charset=utf-8" } })
    }
    if (url.pathname === "/api/info" && req.method === "GET") {
      const config = loadConfig()
      return Response.json({ model: config.model || getDefaultModel() })
    }
    if (url.pathname === "/api/chat" && req.method === "POST") {
      try {
        const { prompt } = await req.json()
        if (!prompt) return Response.json({ error: "prompt 不能为空" }, { status: 400 })
        const result = await runAgent(prompt)
        return Response.json({ text: result.text, usage: result.usage })
      } catch (e: any) {
        return Response.json({ error: e.message || String(e) }, { status: 500 })
      }
    }
    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Minicode Web 版: http://localhost:${PORT}`)
