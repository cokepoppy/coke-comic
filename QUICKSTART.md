# G-Comics 快速启动指南

## 当前状态 ✅

已完成：
- ✅ MySQL Docker 容器运行中（端口 3306）
- ✅ 数据库表创建成功（users, comics）
- ✅ 后端 TypeScript 编译成功
- ✅ 前端代码已更新（axios集成）
- ✅ 环境配置完成

**重要变更：**
- 端口从 5000 改为 **5001**（避免与 macOS AirPlay 冲突）
- 前端 API URL: `http://localhost:5001/api`

## MySQL 认证问题修复

后端连接MySQL时遇到认证问题。执行以下命令修复：

```bash
# 在项目根目录执行
docker exec -it gcomics_mysql mysql -uroot -p123456 -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456'; FLUSH PRIVILEGES;"
```

## 启动步骤

### 1. 确保 MySQL 容器运行
```bash
docker ps | grep gcomics_mysql
# 如果没有运行，执行：
docker-compose up -d
```

### 2. 启动后端服务器

```bash
cd server
npm run dev
```

你应该看到：
```
🚀 Server is running on port 5001
✅ Database connected successfully
```

### 3. 启动前端应用（新终端窗口）

```bash
cd front
npm run dev
```

你应该看到：
```
Local: http://localhost:3000
```

## 首次使用

1. 访问 http://localhost:3000/admin
2. 点击 "Don't have an account? Register"
3. 注册账户：
   - Name: 你的名字
   - Email: your@email.com
   - Password: 至少6个字符
4. 登录后上传漫画
5. 回到首页查看

## 常见问题

### 问题1: 端口 5001 被占用
```bash
lsof -ti:5001 | xargs kill -9
```

### 问题2: MySQL 连接失败
检查容器状态：
```bash
docker logs gcomics_mysql | tail -20
```

重启容器：
```bash
docker-compose restart
```

### 问题3: 前端无法连接后端
检查 `front/.env` 文件：
```
VITE_API_URL=http://localhost:5001/api
```

## API 端点

- POST `/api/auth/register` - 注册
- POST `/api/auth/login` - 登录
- GET `/api/auth/me` - 获取当前用户
- GET `/api/comics` - 获取所有漫画
- POST `/api/comics` - 上传漫画（需认证）
- DELETE `/api/comics/:id` - 删除漫画（需认证）

## 测试 API

```bash
# 健康检查
curl http://localhost:5001/health

# 注册用户
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# 登录
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## 停止服务

```bash
# 停止前后端（在各自终端按 Ctrl+C）
# 停止 MySQL
docker-compose stop
```

## 目录结构

```
coke-comic/
├── front/              # React 前端 (localhost:3000)
│   ├── .env           # VITE_API_URL=http://localhost:5001/api
│   └── ...
├── server/             # Express 后端 (localhost:5001)
│   ├── .env           # DB配置, JWT密钥
│   ├── src/           # TypeScript源码
│   ├── dist/          # 编译输出
│   └── public/uploads/  # 上传的图片
├── docker-compose.yml  # MySQL配置
└── SETUP.md           # 详细设置指南
```

## 下一步

完成后端MySQL认证修复后：
1. 启动后端和前端
2. 注册第一个用户
3. 上传测试漫画
4. 查看详细日志（后端有彩色日志）

查看 `SETUP.md` 获取完整的部署和故障排查指南。
