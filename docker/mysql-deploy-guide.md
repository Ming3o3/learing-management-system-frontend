# MySQL Docker 部署指南

## 📦 MySQL 容器部署说明

本项目使用 MySQL 8.0 作为数据库，支持以下部署方式：

---

## 🚀 部署方式

### **方式一：使用 Docker Compose（推荐）**

Docker Compose 会自动部署 MySQL 并初始化数据库。

```bash
# 启动所有服务（包含MySQL）
docker-compose up -d

# 仅启动MySQL
docker-compose up -d mysql
```

### **方式二：单独部署 MySQL**

```bash
# 1. 创建数据卷
docker volume create mysql-data

# 2. 运行MySQL容器
docker run -d \
  --name lms-mysql \
  --network lms-network \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=learing-management-system \
  -e MYSQL_USER=lms_user \
  -e MYSQL_PASSWORD=lms_password \
  -e TZ=Asia/Shanghai \
  -v mysql-data:/var/lib/mysql \
  -v $(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql \
  --restart unless-stopped \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci
```

---

## 🔧 配置说明

### **环境变量**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | root_password | root用户密码 |
| `MYSQL_DATABASE` | learing-management-system | 自动创建的数据库名 |
| `MYSQL_USER` | lms_user | 应用数据库用户名 |
| `MYSQL_PASSWORD` | lms_password | 应用数据库密码 |
| `TZ` | Asia/Shanghai | 时区设置 |

### **端口映射**

- **3306:3306** - MySQL服务端口

### **数据持久化**

- **mysql-data** - 数据卷，存储数据库文件

### **初始化脚本**

- **init.sql** - 自动执行的数据库初始化脚本

---

## 📋 数据库初始化

### **自动初始化**

容器首次启动时会自动执行 `init.sql` 脚本，创建：

1. ✅ 数据库表结构
2. ✅ 默认管理员账号
3. ✅ 示例教师账号
4. ✅ 示例学生账号

### **初始账号**

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | teacher123 | 教师 |
| student1 | student123 | 学生 |

---

## 🔍 管理操作

### **连接到MySQL**

```bash
# 方式1: 使用docker exec
docker exec -it lms-mysql mysql -u lms_user -p

# 方式2: 使用MySQL客户端
mysql -h localhost -P 3306 -u lms_user -p
```

### **查看日志**

```bash
# 查看MySQL日志
docker logs -f lms-mysql

# 查看最近100行
docker logs --tail 100 lms-mysql
```

### **备份数据库**

```bash
# 备份数据库
docker exec lms-mysql mysqldump -u lms_user -plms_password learing-management-system > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份所有数据库
docker exec lms-mysql mysqldump -u root -proot_password --all-databases > backup_all_$(date +%Y%m%d_%H%M%S).sql
```

### **恢复数据库**

```bash
# 恢复数据库
docker exec -i lms-mysql mysql -u lms_user -plms_password learing-management-system < backup_20251222_120000.sql

# 或者先复制SQL文件到容器
docker cp backup.sql lms-mysql:/tmp/
docker exec -it lms-mysql mysql -u lms_user -plms_password learing-management-system < /tmp/backup.sql
```

### **重置数据库**

```bash
# 停止并删除容器
docker stop lms-mysql
docker rm lms-mysql

# 删除数据卷（会删除所有数据！）
docker volume rm mysql-data

# 重新启动（会重新初始化）
docker-compose up -d mysql
```

---

## 🔒 安全建议

### 1. **修改默认密码**

编辑 `docker-compose.yml`:

```yaml
environment:
  - MYSQL_ROOT_PASSWORD=your_strong_root_password  # 修改这里
  - MYSQL_PASSWORD=your_strong_password             # 修改这里
```

### 2. **限制访问**

如果不需要外部访问MySQL，可以移除端口映射：

```yaml
# ports:
#   - "3306:3306"  # 注释掉，仅容器内部访问
```

### 3. **使用Docker Secrets（生产环境）**

```yaml
secrets:
  mysql_root_password:
    file: ./secrets/mysql_root_password.txt
  mysql_password:
    file: ./secrets/mysql_password.txt
```

---

## 📊 监控和调优

### **查看数据库状态**

```sql
-- 连接到MySQL后执行
SHOW DATABASES;
SHOW TABLES;
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

### **性能优化参数**

在 `docker-compose.yml` 中添加：

```yaml
command: 
  - --default-authentication-plugin=mysql_native_password
  - --character-set-server=utf8mb4
  - --collation-server=utf8mb4_unicode_ci
  - --max_connections=1000
  - --innodb_buffer_pool_size=1G
  - --innodb_log_file_size=256M
```

### **查看容器资源使用**

```bash
# 查看资源使用情况
docker stats lms-mysql

# 查看详细信息
docker inspect lms-mysql
```

---

## 🐛 常见问题

### Q1: 容器启动后立即退出？

**检查日志：**
```bash
docker logs lms-mysql
```

**常见原因：**
- 数据卷权限问题
- 配置参数错误
- 端口被占用

### Q2: 无法连接到数据库？

**检查步骤：**
```bash
# 1. 确认容器运行
docker ps | grep lms-mysql

# 2. 检查网络
docker network inspect lms-network

# 3. 测试连接
docker exec -it lms-mysql mysql -u lms_user -p
```

### Q3: 数据库初始化失败？

**原因：**
- init.sql 脚本有语法错误
- 数据卷已存在旧数据

**解决：**
```bash
# 删除数据卷重新初始化
docker-compose down -v
docker-compose up -d
```

### Q4: 中文乱码？

**检查字符集：**
```sql
SHOW VARIABLES LIKE 'character%';
SHOW VARIABLES LIKE 'collation%';
```

**应该显示：**
- character_set_server: utf8mb4
- collation_server: utf8mb4_unicode_ci

---

## 📝 Docker Compose 配置详解

```yaml
mysql:
  image: mysql:8.0                    # MySQL版本
  container_name: lms-mysql           # 容器名称
  ports:
    - "3306:3306"                     # 端口映射
  environment:
    - MYSQL_ROOT_PASSWORD=xxx         # root密码
    - MYSQL_DATABASE=learing-management-system  # 默认数据库
    - MYSQL_USER=lms_user             # 应用用户
    - MYSQL_PASSWORD=xxx              # 应用密码
    - TZ=Asia/Shanghai                # 时区
  volumes:
    - mysql-data:/var/lib/mysql       # 数据持久化
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # 初始化脚本
  command:                            # 启动参数
    - --default-authentication-plugin=mysql_native_password
    - --character-set-server=utf8mb4
    - --collation-server=utf8mb4_unicode_ci
  networks:
    - lms-network                     # 网络配置
  restart: unless-stopped             # 重启策略
```

---

## 🔄 数据迁移

### **从其他MySQL迁移**

```bash
# 1. 导出数据
mysqldump -h old_host -u user -p learing-management-system > lms_export.sql

# 2. 导入到Docker MySQL
docker exec -i lms-mysql mysql -u lms_user -plms_password learing-management-system < lms_export.sql
```

### **数据卷迁移**

```bash
# 1. 备份数据卷
docker run --rm -v mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data

# 2. 恢复数据卷
docker run --rm -v mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-backup.tar.gz -C /
```

---

## ✅ 验证部署

```bash
# 1. 检查容器状态
docker ps | grep lms-mysql

# 2. 查看日志
docker logs lms-mysql | grep "ready for connections"

# 3. 测试连接
docker exec -it lms-mysql mysql -u lms_user -plms_password -e "SHOW DATABASES;"

# 4. 验证表结构
docker exec -it lms-mysql mysql -u lms_user -plms_password learing-management-system -e "SHOW TABLES;"

# 5. 查看初始用户
docker exec -it lms-mysql mysql -u lms_user -plms_password learing-management-system -e "SELECT username, real_name, roles FROM user;"
```

---

**最后更新**: 2025-12-22
