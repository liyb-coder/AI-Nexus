#!/bin/bash
# AI Nexus — 一键启动脚本
# 同时启动后端服务和前端开发服务器

set -e

echo "╔══════════════════════════════════════════╗"
echo "║        AI Nexus — 汇智台 启动脚本          ║"
echo "║   多 AI 协作操作工作台                     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check if backend dependencies are installed
if [ ! -d "server/node_modules" ]; then
  echo -e "${YELLOW}[1/4] 安装后端依赖...${NC}"
  cd server && npm install && cd ..
else
  echo -e "${GREEN}[1/4] 后端依赖已安装${NC}"
fi

# 2. Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}[2/4] 安装前端依赖...${NC}"
  npm install
else
  echo -e "${GREEN}[2/4] 前端依赖已安装${NC}"
fi

# 3. Start backend server
echo -e "${YELLOW}[3/4] 启动后端服务 (端口 5173)...${NC}"
cd server && npx tsx src/index.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# 4. Start frontend dev server
echo -e "${YELLOW}[4/4] 启动前端开发服务器 (端口 3000)...${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  打开浏览器访问: http://localhost:3000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

npm run dev &
FRONTEND_PID=$!

# Trap to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}正在关闭服务...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}已关闭${NC}"
}
trap cleanup EXIT INT TERM

# Wait for both processes
wait
