# Docker部署快速指南

## 📁 文件说明

```
docker/
├── docker-compose.yml          # Docker Compose编排文件
├── frontend.Dockerfile         # 前端Docker镜像构建文件
├── backend.Dockerfile          # 后端Docker镜像构建文件
├── frontend.dockerignore       # 前端构建忽略文件
├── backend.dockerignore        # 后端构建忽略文件
├── nginx.conf                  # Nginx配置文件
├── init.sql                    # MySQL数据库初始化脚本
├── application-prod.yml        # Spring Boot生产环境配置
├── deploy-backend.sh           # Linux/Mac后端部署脚本
├── deploy-backend.bat          # Windows后端部署脚本
├── deploy-guide.md             # 完整部署指南
└── mysql-deploy-guide.md       # MySQL部署指南
```

## 🚀 快速部署

### 在项目根目录执行：

```bash
# 进入docker目录
cd docker

# 一键启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 或者在项目根目录执行：

```bash
# 指定docker-compose文件路径
docker compose -f docker/docker-compose.yml up -d
```

## 📋 部署前准备

1. **确保MySQL容器已运行并加入网络：**

```bash
docker network create lms-network
docker network connect lms-network mysql
```

2. **创建数据库：**

```bash
docker exec -it mysql mysql -u root -pEnglish629
mysql> CREATE DATABASE IF NOT EXISTS `learing-management-system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> EXIT;
```

3. **导入数据表结构：**

```bash
docker exec -i mysql mysql -u root -pEnglish629 learing-management-system < init.sql
```

## 🔍 验证部署

```bash
# 查看运行中的容器
docker ps

# 访问应用
浏览器打开: http://your-server-ip
后端API: http://your-server-ip:8080
```

## 📚 详细文档

- [完整部署指南](deploy-guide.md)
- [MySQL部署指南](mysql-deploy-guide.md)
