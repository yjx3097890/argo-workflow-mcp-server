# 服务器生命周期管理

本文档描述 Argo Workflow MCP Server 的启动、运行和关闭流程。

## 启动流程

服务器启动按以下顺序进行：

### 1. 日志初始化
- 配置日志级别（通过 `LOG_LEVEL` 环境变量）
- 设置日志格式（时间戳、JSON 格式）
- 配置控制台输出（带颜色）

### 2. 健康检查服务器启动
- 启动 HTTP 服务器（默认端口 3000）
- 注册健康检查端点：`/health`
- 注册就绪检查端点：`/ready`
- 初始状态：健康但未就绪

### 3. Kubernetes 客户端初始化
- 加载 Kubernetes 配置（集群内或 kubeconfig）
- 验证与 Kubernetes API Server 的连接
- 初始化 Custom Objects API 客户端

### 4. MCP Server 初始化
- 创建 MCP Server 实例
- 注册所有工具处理器
- 设置请求处理器

### 5. 标记服务就绪
- 将健康检查服务器标记为就绪状态
- 此时 `/ready` 端点返回 200

### 6. 启动 MCP Server
- 连接 stdio 传输层
- 开始监听 MCP 协议请求

## 健康检查端点

### `/health` - 健康检查

**用途**: 检查服务是否健康运行

**响应**:
```json
// 健康状态 (200 OK)
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 不健康状态 (503 Service Unavailable)
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**使用场景**:
- Kubernetes liveness probe
- 监控系统健康检查
- 负载均衡器健康检查

### `/ready` - 就绪检查

**用途**: 检查服务是否准备好接收请求

**响应**:
```json
// 就绪状态 (200 OK)
{
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 未就绪状态 (503 Service Unavailable)
{
  "status": "not_ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**使用场景**:
- Kubernetes readiness probe
- 滚动更新期间的流量控制
- 启动时的预热检查

### `/` - 服务器信息

**用途**: 获取服务器基本信息

**响应**:
```json
{
  "name": "Argo Workflow MCP Server",
  "version": "1.0.0",
  "status": "healthy",
  "ready": "ready"
}
```

## 优雅关闭流程

当服务器收到关闭信号（SIGINT、SIGTERM）时，执行以下步骤：

### 1. 标记为不健康
- 将健康检查状态设置为 `unhealthy`
- 将就绪状态设置为 `not_ready`
- 此时 `/health` 和 `/ready` 端点返回 503

### 2. 等待排空
- 等待 2 秒，让负载均衡器移除此实例
- 允许正在处理的请求完成

### 3. 关闭健康检查服务器
- 停止接受新的 HTTP 连接
- 关闭 HTTP 服务器

### 4. 退出进程
- 记录关闭完成日志
- 退出进程（退出码 0）

## 信号处理

服务器处理以下信号：

### SIGINT (Ctrl+C)
- 触发优雅关闭流程
- 常用于本地开发环境

### SIGTERM
- 触发优雅关闭流程
- Kubernetes 使用此信号终止 Pod

### uncaughtException
- 记录错误日志
- 触发优雅关闭流程
- 退出码 1

### unhandledRejection
- 记录错误日志
- 触发优雅关闭流程
- 退出码 1

## 日志配置

### 日志级别

通过 `LOG_LEVEL` 环境变量配置：

- `error`: 仅记录错误
- `warn`: 记录警告和错误
- `info`: 记录信息、警告和错误（默认）
- `debug`: 记录所有日志，包括调试信息

### 日志格式

**JSON 格式**（用于日志收集）:
```json
{
  "level": "info",
  "message": "服务器已启动",
  "timestamp": "2024-01-01 00:00:00",
  "service": "argo-workflow-mcp-server"
}
```

**控制台格式**（用于开发）:
```
2024-01-01 00:00:00 [info]: 服务器已启动
```

## Kubernetes 集成

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

**说明**:
- 启动后 10 秒开始检查
- 每 30 秒检查一次
- 超时时间 5 秒
- 连续失败 3 次后重启 Pod

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
```

**说明**:
- 启动后 5 秒开始检查
- 每 10 秒检查一次
- 超时时间 3 秒
- 连续失败 2 次后从 Service 移除

### 优雅终止

```yaml
spec:
  terminationGracePeriodSeconds: 30
```

**说明**:
- Kubernetes 发送 SIGTERM 信号
- 等待最多 30 秒让服务优雅关闭
- 超时后发送 SIGKILL 强制终止

## 故障排查

### 服务无法启动

**检查日志**:
```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 查看启动错误
kubectl describe pod <pod-name>
```

**常见原因**:
- Kubernetes API 连接失败
- 权限不足（RBAC 配置）
- 端口已被占用

### 健康检查失败

**检查健康端点**:
```bash
# 在 Pod 内检查
kubectl exec <pod-name> -- curl http://localhost:3000/health

# 端口转发后检查
kubectl port-forward <pod-name> 3000:3000
curl http://localhost:3000/health
```

**常见原因**:
- 服务未完全启动
- Kubernetes 客户端初始化失败
- 内部错误导致服务不健康

### 就绪检查失败

**检查就绪端点**:
```bash
curl http://localhost:3000/ready
```

**常见原因**:
- 服务正在启动中
- Kubernetes 连接未建立
- 依赖服务不可用

## 最佳实践

### 1. 合理配置探针

- **Liveness Probe**: 检测死锁和无响应状态
- **Readiness Probe**: 检测服务是否准备好处理请求
- 避免过于频繁的检查，以免增加系统负载

### 2. 优雅关闭

- 确保 `terminationGracePeriodSeconds` 足够长
- 在关闭前标记为不健康，避免新请求
- 等待现有请求完成

### 3. 日志管理

- 生产环境使用 `info` 级别
- 调试时使用 `debug` 级别
- 使用结构化日志（JSON）便于分析

### 4. 监控

- 监控健康检查端点的响应时间
- 设置告警：连续失败次数超过阈值
- 监控优雅关闭的时长

## 示例配置

### 开发环境

```bash
export LOG_LEVEL=debug
export HEALTH_PORT=3000
npm start
```

### 生产环境

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argo-workflow-mcp-server
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: mcp-server
        image: argo-workflow-mcp-server:latest
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: HEALTH_PORT
          value: "3000"
        ports:
        - containerPort: 3000
          name: health
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
      terminationGracePeriodSeconds: 30
```
