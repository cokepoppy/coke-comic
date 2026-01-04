# G-Comics Backend Setup Guide

## 项目架构

```
coke-comic/
├── front/              # React 前端应用 (端口 3000)
│   ├── pages/          # 页面组件
│   ├── components/     # UI 组件
│   ├── services/       # API 服务
│   └── .env            # 前端环境变量
├── server/             # Express 后端服务 (端口 5000)
│   ├── src/
│   │   ├── config/     # 数据库和日志配置
│   │   ├── middleware/ # 认证、上传、错误处理
│   │   └── routes/     # API 路由
│   ├── public/uploads/ # 上传的图片文件
│   ├── migrations/     # 数据库迁移文件
│   └── .env            # 后端环境变量
├── docker-compose.yml  # MySQL 容器配置
└── .gitignore          # Git 忽略配置

```

## 第一次启动

### 1. 启动 MySQL 数据库（Docker）

```bash
# 确保 Docker Desktop 已经运行
# 启动 MySQL 容器
docker-compose up -d

# 检查容器状态
docker ps

# 查看容器日志
docker logs gcomics_mysql
```

**MySQL 配置：**
- Host: localhost
- Port: 3306
- Database: comics
- User: root
- Password: 123456

### 2. 启动后端服务器

```bash
# 进入 server 目录
cd server

# 开发模式启动（使用 nodemon 自动重启）
npm run dev

# 你应该看到类似的日志：
# 🚀 ================================
# 🚀 Server is running on port 5000
# 🚀 Environment: development
# ✅ Database connected successfully
# 📁 Serving static files from: .../public/uploads
```

**后端 API URL:** http://localhost:5000/api

### 3. 启动前端应用

打开新的终端窗口：

```bash
# 进入 front 目录
cd front

# 开发模式启动
npm run dev

# 你应该看到：
# VITE ready in xxx ms
# Local: http://localhost:3000
```

**前端 URL:** http://localhost:3000

## API 端点

### 认证相关
- POST `/api/auth/register` - 注册新用户
- POST `/api/auth/login` - 登录
- GET `/api/auth/me` - 获取当前用户信息
- POST `/api/auth/logout` - 登出

### 漫画相关
- GET `/api/comics` - 获取所有漫画
- POST `/api/comics` - 上传新漫画（需要认证）
- DELETE `/api/comics/:id` - 删除漫画（需要认证）

### 健康检查
- GET `/health` - 服务器健康状态

## 测试流程

### 1. 注册用户

访问 http://localhost:3000/admin

1. 点击 "Don't have an account? Register"
2. 输入：
   - Name: Test User
   - Email: test@example.com
   - Password: password123
3. 点击 "Create Account"

### 2. 上传漫画

登录后：

1. 点击 "New Comic" 按钮
2. 填写表单：
   - Comic Title: My First Comic
   - Author Name: Test Author
   - Description: (可选，或使用 Gemini AI 生成)
3. 上传文件：
   - Cover Image: 选择一张图片作为封面
   - Comic Pages: 选择1-20张图片作为页面
4. 点击 "Publish Comic"

### 3. 查看漫画

1. 访问首页 http://localhost:3000
2. 应该看到刚上传的漫画
3. 点击漫画进入阅读器
4. 使用键盘箭头键或空格键翻页

### 4. 删除漫画

1. 返回 /admin 页面
2. 在漫画列表中点击删除按钮（垃圾桶图标）
3. 确认删除

## 使用 curl 测试 API

### 注册用户
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLI User",
    "email": "cli@example.com",
    "password": "password123"
  }'
```

### 登录获取 Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cli@example.com",
    "password": "password123"
  }'

# 响应中包含 token，保存它用于后续请求
```

### 获取所有漫画
```bash
curl http://localhost:5000/api/comics
```

### 上传漫画
```bash
curl -X POST http://localhost:5000/api/comics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=CLI Test Comic" \
  -F "author=CLI Author" \
  -F "description=Uploaded via CLI" \
  -F "cover=@/path/to/cover.jpg" \
  -F "pages=@/path/to/page1.jpg" \
  -F "pages=@/path/to/page2.jpg"
```

## 日志查看

### 后端日志
后端服务器会在控制台输出详细的彩色日志：

- 🔐 登录/认证相关
- 📚 漫画操作
- 📊 数据库查询
- 📤 文件上传
- ❌ 错误信息

日志文件保存在：
- `server/logs/combined.log` - 所有日志
- `server/logs/error.log` - 仅错误日志

### MySQL 日志
```bash
# 查看 MySQL 容器日志
docker logs -f gcomics_mysql

# 连接到 MySQL 命令行
docker exec -it gcomics_mysql mysql -uroot -p123456 comics

# 查看表
SHOW TABLES;

# 查看用户数据
SELECT id, name, email, created_at FROM users;

# 查看漫画数据
SELECT id, title, author, created_at FROM comics;
```

## 停止服务

### 停止前端和后端
在各自的终端窗口中按 `Ctrl+C`

### 停止 MySQL 容器
```bash
# 停止容器（数据保留）
docker-compose stop

# 停止并删除容器（数据保留在 volume 中）
docker-compose down

# 完全清除（包括数据）
docker-compose down -v
```

## 重启所有服务

```bash
# 启动 MySQL
docker-compose up -d

# 启动后端（在 server 目录）
cd server && npm run dev

# 启动前端（在 front 目录，新终端）
cd front && npm run dev
```

## 生产部署

### 构建前端
```bash
cd front
npm run build
# 生成的文件在 front/dist/
```

### 构建后端
```bash
cd server
npm run build
# 生成的文件在 server/dist/

# 运行生产版本
npm start
```

### 环境变量配置

生产环境记得修改：

**server/.env:**
```env
NODE_ENV=production
JWT_SECRET=使用强随机密钥
DB_PASSWORD=使用强密码
ALLOWED_ORIGINS=https://your-domain.com
```

## 故障排查

### 后端无法连接数据库
1. 检查 Docker 是否运行：`docker ps`
2. 检查 MySQL 容器日志：`docker logs gcomics_mysql`
3. 检查 `server/.env` 中的数据库配置

### 前端无法连接后端
1. 检查后端是否运行在端口 5000
2. 检查 `front/.env` 中的 `VITE_API_URL` 配置
3. 查看浏览器控制台的网络请求

### 文件上传失败
1. 检查 `server/public/uploads/covers/` 和 `.../pages/` 目录是否存在
2. 检查文件大小是否超过 5MB
3. 检查文件格式（仅支持 JPEG, PNG, GIF, WEBP）

### 认证失败
1. 检查 JWT token 是否正确存储在 localStorage
2. 查看后端日志中的认证错误信息
3. 尝试重新登录

## 技术栈

**后端：**
- Express.js - Web 框架
- TypeScript - 类型安全
- MySQL (Docker) - 数据库
- Multer - 文件上传
- JWT - 身份认证
- Bcrypt - 密码加密
- Winston - 日志记录

**前端：**
- React 19 - UI 框架
- Vite - 构建工具
- TypeScript - 类型安全
- React Router - 路由
- Axios - HTTP 客户端
- Lucide React - 图标库

**数据库：**
- MySQL 8.0 (Docker)
- 两张表：users, comics
- JSON 字段存储漫画页面路径

## 数据库结构

### users 表
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### comics 表
```sql
CREATE TABLE comics (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author VARCHAR(255) NOT NULL,
  cover_url VARCHAR(500) NOT NULL,
  pages JSON NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 开发建议

1. **开发时保持三个终端窗口打开：**
   - Terminal 1: MySQL (docker-compose logs -f)
   - Terminal 2: Backend (cd server && npm run dev)
   - Terminal 3: Frontend (cd front && npm run dev)

2. **查看实时日志以便调试**

3. **使用浏览器开发者工具：**
   - Network 标签查看 API 请求
   - Console 标签查看前端日志
   - Application > Local Storage 查看 JWT token

4. **数据库管理工具（可选）：**
   - MySQL Workbench
   - DBeaver
   - 使用 `docker exec -it gcomics_mysql mysql -uroot -p123456` 直接连接
