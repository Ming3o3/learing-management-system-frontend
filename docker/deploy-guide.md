# LMS 学习管理系统 Docker 部署指南

## 📋 目录

- [系统要求](#系统要求)
- [前端部署](#前端部署)
- [后端部署](#后端部署)
- [完整部署](#完整部署)
- [生产环境配置](#生产环境配置)
- [常见问题](#常见问题)

---

## 🖥️ 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器: 2核CPU, 4GB内存以上 (推荐)
- 操作系统: Linux (Ubuntu/CentOS), Windows Server, macOS

---

## 🎨 前端部署

### 方案一: 单独部署前端

#### 1. 构建前端镜像

```bash
# 进入前端项目目录
cd lms-frontend/LMS

# 构建Docker镜像
docker build -t lms-frontend:latest .
```

#### 2. 运行前端容器

```bash
# 运行容器
docker run -d \
  --name lms-frontend \
  -p 80:80 \
  lms-frontend:latest
```

#### 3. 访问应用

打开浏览器访问: `http://服务器IP`

---

## ⚙️ 后端部署

### 创建后端 Dockerfile

在后端项目根目录创建 `Dockerfile`:

```dockerfile
# Spring Boot 后端 Dockerfile
FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

# 复制pom.xml和源代码
COPY pom.xml .
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests

# 生产镜像
FROM openjdk:17-jdk-slim

WORKDIR /app

# 从构建阶段复制jar包
COPY --from=builder /app/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
```

### 构建并运行后端

```bash
# 构建后端镜像
cd lms-backend
docker build -t lms-backend:latest .

# 运行后端容器
docker run -d \
  --name lms-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://your-db-host:3306/lms \
  -e SPRING_DATASOURCE_USERNAME=your-username \
  -e SPRING_DATASOURCE_PASSWORD=your-password \
  lms-backend:latest
```

---

## 🚀 完整部署 (推荐)

### 使用 Docker Compose 一键部署

#### 1. 准备项目结构

```
project-root/
├── lms-frontend/
│   └── LMS/
│       ├── Dockerfile
│       ├── nginx.conf
│       └── ...
├── lms-backend/
│   ├── Dockerfile
│   ├── src/
│   └── pom.xml
└── docker-compose.yml
```

#### 2. 修改环境配置

编辑 `lms-frontend/LMS/.env.production`:

```env
# 生产环境配置
VITE_APP_BASE_API=/api
VITE_APP_TITLE=学习管理系统
```

#### 3. 启动所有服务

```bash
# 在项目根目录执行
docker-compose up -d
```

#### 4. 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f frontend
docker-compose logs -f backend
```

#### 5. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

## 🔧 生产环境配置

### 1. 配置域名和HTTPS

#### 使用 Nginx + Let's Encrypt

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 修改 nginx.conf 支持HTTPS

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 其他配置...
}
```

### 2. 数据持久化

确保在 docker-compose.yml 中配置数据卷:

```yaml
volumes:
  mysql-data:
  redis-data:
```

### 3. 备份策略

```bash
# 备份MySQL数据库
docker exec lms-mysql mysqldump -u lms_user -p lms > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i lms-mysql mysql -u lms_user -p lms < backup_20231219.sql
```

### 4. 性能优化

#### 前端优化
- 开启Gzip压缩 (已在nginx.conf中配置)
- 配置静态资源缓存
- 使用CDN加速

#### 后端优化
```yaml
# 在 docker-compose.yml 中限制资源
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

---

## 📊 监控和日志

### 查看容器状态

```bash
# 查看资源使用情况
docker stats

# 查看容器详细信息
docker inspect lms-frontend
```

### 日志管理

```bash
# 实时查看日志
docker logs -f lms-frontend
docker logs -f lms-backend

# 查看最近100行日志
docker logs --tail 100 lms-backend
```

---

## 🔒 安全建议

1. **修改默认密码**: 修改 MySQL root 密码和应用数据库密码
2. **使用环境变量**: 敏感信息使用环境变量或 Docker secrets
3. **限制网络访问**: 只暴露必要的端口
4. **定期更新**: 定期更新基础镜像和依赖
5. **防火墙配置**: 配置服务器防火墙规则

---

## 🐛 常见问题

### Q1: 前端无法连接后端?

**解决方案:**
1. 检查 nginx.conf 中的后端代理配置
2. 确认后端服务名称与 docker-compose.yml 一致
3. 查看网络配置: `docker network inspect lms-network`

### Q2: 数据库连接失败?

**解决方案:**
1. 检查数据库环境变量配置
2. 确认数据库容器已启动: `docker ps | grep mysql`
3. 测试数据库连接: `docker exec -it lms-mysql mysql -u lms_user -p`

### Q3: 容器启动失败?

**解决方案:**
```bash
# 查看详细错误日志
docker logs lms-backend

# 检查容器状态
docker ps -a

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

### Q4: 如何更新应用?

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose build

# 3. 重启服务
docker-compose up -d

# 4. 清理旧镜像 (可选)
docker image prune -f
```

### Q5: 端口被占用?

```bash
# 查看端口占用
netstat -tuln | grep 80
lsof -i :80

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8000:80"  # 使用其他端口
```

---

## 📝 快速部署命令总结

```bash
# 1. 克隆项目
git clone <repository-url>
cd lms-project

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 一键启动
docker-compose up -d

# 4. 查看状态
docker-compose ps

# 5. 访问应用
# 前端: http://your-server-ip
# 后端: http://your-server-ip:8080
```

---

## 🌐 服务端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 80 | 前端Web服务 |
| Backend | 8080 | 后端API服务 |
| MySQL | 3306 | 数据库服务 |
| Redis | 6379 | 缓存服务 |

---

## 📞 技术支持

如遇到部署问题，请检查:
1. Docker 和 Docker Compose 版本
2. 服务器防火墙和安全组配置
3. 容器日志信息
4. 网络连通性

---

**最后更新**: 2025-12-22
