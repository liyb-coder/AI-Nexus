#!/bin/bash
# AI Nexus 汇智台 — 桌面应用启动器

DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. 启动后端
echo "🚀 启动后端服务..."
cd "$DIR/server" && npx tsx src/index.ts &
BACKEND_PID=$!
sleep 2

# 2. 等待后端就绪
for i in $(seq 1 15); do
  curl -s http://127.0.0.1:5173/api/health > /dev/null 2>&1 && break
  sleep 1
done

# 3. 启动前端
echo "🎨 启动前端..."
cd "$DIR" && npx vite --port 3000 &
FRONTEND_PID=$!
sleep 2

# 4. 启动 Electron 窗口
echo "🖥️ 启动桌面窗口..."
cd "$DIR" && npx electron . &
ELECTRON_PID=$!

echo ""
echo "✅ AI Nexus 汇智台 已启动"
echo "   后端: http://127.0.0.1:5173"
echo "   前端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID $ELECTRON_PID 2>/dev/null; exit" INT TERM
wait
