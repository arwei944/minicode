<#
.SYNOPSIS
  Minicode 启动器 - 自动拉取最新代码、启动服务、打开浏览器
.DESCRIPTION
  放在桌面双击即可使用。每次启动自动 git pull 更新。
  关闭窗口时自动终止后端进程。
#>

$REPO_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PORT = 3000

# 切换到仓库目录
Set-Location $REPO_DIR

# 1. 拉取最新代码
Write-Host "正在检查更新..." -ForegroundColor Cyan
try {
  $pull = git pull 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "更新完成" -ForegroundColor Green
  } else {
    Write-Host "更新失败，使用本地版本" -ForegroundColor Yellow
  }
} catch {
  Write-Host "更新失败，使用本地版本" -ForegroundColor Yellow
}

# 2. 如果端口被占用，杀掉旧进程
try {
  $old = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
  if ($old) {
    $old.OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500
  }
} catch {}

# 3. 启动后端服务（新窗口）
$serverJob = Start-Job -ScriptBlock {
  param($dir, $port)
  Set-Location $dir
  $env:PORT = $port
  bun run src/server.ts
} -ArgumentList $REPO_DIR, $PORT

# 4. 等待服务就绪
Write-Host "正在启动服务..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$PORT/api/models" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
}
if (-not $ready) {
  Write-Host "服务启动超时，请检查错误" -ForegroundColor Red
  Read-Host "按 Enter 退出"
  exit 1
}

# 5. 打开浏览器
Write-Host "服务已就绪！正在打开浏览器..." -ForegroundColor Green
Start-Process "http://localhost:$PORT"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Minicode Web 版已启动" -ForegroundColor White
Write-Host "  地址: http://localhost:$PORT" -ForegroundColor Yellow
Write-Host "  关闭此窗口即可停止服务" -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 6. 等待用户关闭窗口
Read-Host "按 Enter 停止服务"

# 7. 清理
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -Force -ErrorAction SilentlyContinue
