#!/bin/bash

# ================================================
# LMS 后端项目 Docker 部署脚本
# ================================================

set -e

echo "=========================================="
echo "  LMS Backend Docker Deployment Script"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
BACKEND_DIR="../lms-backend"
IMAGE_NAME="lms-backend"
IMAGE_TAG="latest"
CONTAINER_NAME="lms-backend"

# 函数: 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 函数: 检查后端项目路径
check_backend_path() {
    print_message "检查后端项目路径..."
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "后端项目目录不存在: $BACKEND_DIR"
        echo "请修改脚本中的 BACKEND_DIR 变量，或者创建后端项目"
        exit 1
    fi
    print_message "后端项目路径: $BACKEND_DIR ✓"
}

# 函数: 复制Dockerfile到后端目录
copy_dockerfile() {
    print_message "复制Dockerfile到后端项目..."
    
    if [ -f "backend-Dockerfile" ]; then
        cp backend-Dockerfile "$BACKEND_DIR/Dockerfile"
        print_message "Dockerfile已复制 ✓"
    else
        print_error "backend-Dockerfile 文件不存在"
        exit 1
    fi

    if [ -f "backend-dockerignore" ]; then
        cp backend-dockerignore "$BACKEND_DIR/.dockerignore"
        print_message ".dockerignore已复制 ✓"
    fi

    if [ -f "application-prod.yml" ]; then
        mkdir -p "$BACKEND_DIR/src/main/resources"
        cp application-prod.yml "$BACKEND_DIR/src/main/resources/"
        print_message "生产环境配置已复制 ✓"
    fi
}

# 函数: 构建Docker镜像
build_image() {
    print_message "开始构建Docker镜像..."
    cd "$BACKEND_DIR"
    
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
    
    if [ $? -eq 0 ]; then
        print_message "镜像构建成功: $IMAGE_NAME:$IMAGE_TAG ✓"
    else
        print_error "镜像构建失败"
        exit 1
    fi
    
    cd - > /dev/null
}

# 函数: 停止并删除旧容器
remove_old_container() {
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        print_warning "发现已存在的容器，正在停止并删除..."
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
        print_message "旧容器已删除 ✓"
    fi
}

# 函数: 运行容器
run_container() {
    print_message "启动Docker容器..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        --network lms-network \
        -p 8080:8080 \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e TZ=Asia/Shanghai \
        --restart unless-stopped \
        "$IMAGE_NAME:$IMAGE_TAG"
    
    if [ $? -eq 0 ]; then
        print_message "容器启动成功 ✓"
        print_message "容器名称: $CONTAINER_NAME"
        print_message "映射端口: 8080"
    else
        print_error "容器启动失败"
        exit 1
    fi
}

# 函数: 查看容器日志
show_logs() {
    print_message "查看容器日志..."
    sleep 3
    docker logs --tail 50 "$CONTAINER_NAME"
}

# 函数: 检查容器健康状态
check_health() {
    print_message "等待服务启动..."
    sleep 10
    
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_message "容器运行正常 ✓"
        
        # 尝试访问健康检查端点
        if command -v curl &> /dev/null; then
            if curl -s http://localhost:8080/actuator/health &> /dev/null; then
                print_message "服务健康检查通过 ✓"
            else
                print_warning "健康检查暂未通过，可能服务还在启动中"
            fi
        fi
    else
        print_error "容器未在运行"
        exit 1
    fi
}

# 函数: 显示部署信息
show_info() {
    echo ""
    echo "=========================================="
    echo "  部署完成!"
    echo "=========================================="
    echo "容器名称: $CONTAINER_NAME"
    echo "镜像名称: $IMAGE_NAME:$IMAGE_TAG"
    echo "访问地址: http://localhost:8080"
    echo "健康检查: http://localhost:8080/actuator/health"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker logs -f $CONTAINER_NAME"
    echo "  停止容器: docker stop $CONTAINER_NAME"
    echo "  启动容器: docker start $CONTAINER_NAME"
    echo "  重启容器: docker restart $CONTAINER_NAME"
    echo "  进入容器: docker exec -it $CONTAINER_NAME sh"
    echo "=========================================="
}

# 主流程
main() {
    print_message "开始后端Docker部署流程..."
    
    check_backend_path
    copy_dockerfile
    build_image
    remove_old_container
    run_container
    check_health
    show_logs
    show_info
}

# 执行主流程
main
