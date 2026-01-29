# Docker配置文件说明

所有Docker相关的配置文件已经移动到统一的 `docker/` 目录。

## 📁 新的文件位置

- **前端Docker配置**: `docker/frontend/`
  - Dockerfile
  - .dockerignore
  - nginx.conf

- **后端Docker配置**: `docker/backend/`
  - Dockerfile
  - .dockerignore
  - application-prod.yml

## 🚀 部署方式

在项目根目录运行：

### Windows
```powershell
.\deploy.bat
```

### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动：
1. 将 `docker/frontend/nginx.conf` 复制到 `lms-frontend/LMS/`
2. 将 `docker/backend/application-prod.yml` 复制到后端项目
3. 构建并启动所有服务

## 📚 详细文档

- [docker/README.md](../../../docker/README.md) - Docker配置详细说明
- [DOCKER部署清单.md](../../../DOCKER部署清单.md) - 完整部署清单
- [部署说明.md](../../../部署说明.md) - 部署指南和故障排查
