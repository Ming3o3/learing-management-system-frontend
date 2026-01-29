@echo off
REM ================================================
REM LMS 后端项目 Docker 部署脚本 (Windows)
REM ================================================

echo ==========================================
echo   LMS Backend Docker Deployment Script
echo ==========================================
echo.

REM 配置变量
set BACKEND_DIR=..\lms-backend
set IMAGE_NAME=lms-backend
set IMAGE_TAG=latest
set CONTAINER_NAME=lms-backend

echo [INFO] 检查后端项目路径...
if not exist "%BACKEND_DIR%" (
    echo [ERROR] 后端项目目录不存在: %BACKEND_DIR%
    echo 请修改脚本中的 BACKEND_DIR 变量
    pause
    exit /b 1
)
echo [INFO] 后端项目路径: %BACKEND_DIR% [OK]
echo.

echo [INFO] 复制Dockerfile到后端项目...
if exist "backend-Dockerfile" (
    copy /Y backend-Dockerfile "%BACKEND_DIR%\Dockerfile" >nul
    echo [INFO] Dockerfile已复制 [OK]
) else (
    echo [ERROR] backend-Dockerfile 文件不存在
    pause
    exit /b 1
)

if exist "backend-dockerignore" (
    copy /Y backend-dockerignore "%BACKEND_DIR%\.dockerignore" >nul
    echo [INFO] .dockerignore已复制 [OK]
)

if exist "application-prod.yml" (
    if not exist "%BACKEND_DIR%\src\main\resources" mkdir "%BACKEND_DIR%\src\main\resources"
    copy /Y application-prod.yml "%BACKEND_DIR%\src\main\resources\" >nul
    echo [INFO] 生产环境配置已复制 [OK]
)
echo.

echo [INFO] 开始构建Docker镜像...
cd /d "%BACKEND_DIR%"
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .

if %errorlevel% neq 0 (
    echo [ERROR] 镜像构建失败
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo [INFO] 镜像构建成功: %IMAGE_NAME%:%IMAGE_TAG% [OK]
cd /d "%~dp0"
echo.

echo [INFO] 检查并删除旧容器...
docker ps -aq -f name=%CONTAINER_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] 发现已存在的容器，正在停止并删除...
    docker stop %CONTAINER_NAME% >nul 2>&1
    docker rm %CONTAINER_NAME% >nul 2>&1
    echo [INFO] 旧容器已删除 [OK]
)
echo.

echo [INFO] 启动Docker容器...
docker run -d ^
    --name %CONTAINER_NAME% ^
    --network lms-network ^
    -p 8080:8080 ^
    -e SPRING_PROFILES_ACTIVE=prod ^
    -e TZ=Asia/Shanghai ^
    --restart unless-stopped ^
    %IMAGE_NAME%:%IMAGE_TAG%

if %errorlevel% neq 0 (
    echo [ERROR] 容器启动失败
    pause
    exit /b 1
)
echo [INFO] 容器启动成功 [OK]
echo.

echo [INFO] 等待服务启动...
timeout /t 10 /nobreak >nul
echo.

echo [INFO] 查看容器日志...
docker logs --tail 50 %CONTAINER_NAME%
echo.

echo ==========================================
echo   部署完成!
echo ==========================================
echo 容器名称: %CONTAINER_NAME%
echo 镜像名称: %IMAGE_NAME%:%IMAGE_TAG%
echo 访问地址: http://localhost:8080
echo 健康检查: http://localhost:8080/actuator/health
echo.
echo 常用命令:
echo   查看日志: docker logs -f %CONTAINER_NAME%
echo   停止容器: docker stop %CONTAINER_NAME%
echo   启动容器: docker start %CONTAINER_NAME%
echo   重启容器: docker restart %CONTAINER_NAME%
echo   进入容器: docker exec -it %CONTAINER_NAME% sh
echo ==========================================
echo.
pause
