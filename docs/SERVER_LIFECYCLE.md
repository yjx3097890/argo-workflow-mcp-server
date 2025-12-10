# 服务器生命周期管理

本文档描述 Argo Workflow MCP Server 的启动、运行和关闭流程。

## 启动流程

服务器启动按以下顺序进行：

### 1. 命令行参数解析
- 解析必需的 Argo Server 配置参数
- 验证参数完整性和有效性
- 设置默认值

### 2. 日志初始化
- 配置日志级别（通过 `--log-level` 参数或 `LOG_LEVEL` 环境变量）
- 设置日志格式（时间戳、JSON 格式）
- 配置控制台输出（带颜色，输出到 stderr）

### 3. Argo Server 客户端初始化
- 使用提供的 Argo Server URL 和认证信息
- 验证与 Argo Server 的连接
- 初始化 HTTP 客户端

### 4. MCP Server 初始化
- 创建 MCP Server 实例
- 注册所有工具处理器（8个工具）
- 设置请求处理器

### 5. 启动 MCP Server
- 连接 stdio 传输层
- 开始监听 MCP 协议请求
- 服务器进入运行状态


## 运行状态

服务器启动后进入运行状态：

### MCP 协议处理
- 监听 stdin 上的 MCP 协议消息
- 解析 JSON-RPC 请求
- 调用相应的工具处理器
- 返回 JSON-RPC 响应到 stdout

### 工具执行
- 接收工具调用请求
- 验证参数
- 调用 Argo Server API
- 格式化响应结果

### 错误处理
- 捕获和记录所有错误
- 返回结构化的错误响应
- 维护服务稳定性

## 优雅关闭流程

当服务器收到关闭信号（SIGINT、SIGTERM）时，执行以下步骤：

### 1. 设置关闭标志
- 防止重复处理关闭信号
- 记录关闭开始日志

### 2. 退出进程
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

## 故障排查

### 服务无法启动

**检查日志**:
```bash
# 查看服务器日志输出
npm start 2>&1 | tee server.log

# 或在 Kiro 中查看 MCP 服务器日志
```

**常见原因**:
- Argo Server 连接失败
- 认证配置错误
- 命令行参数缺失或无效

### MCP 协议通信失败

**检查连接**:
```bash
# 验证 MCP 服务器是否正常启动
ps aux | grep "argo-workflow-mcp-server"

# 检查 Kiro 的 MCP 连接状态
# 在 Kiro 中查看 MCP 面板
```

**常见原因**:
- 服务未完全启动
- Argo Server 连接失败
- 命令行参数配置错误

### 工具调用失败

**检查 Argo Server 连接**:
```bash
# 测试 Argo Server 连接
curl -k https://your-argo-server/api/v1/workflows/argo

# 检查认证配置
curl -k -H "Authorization: Bearer your-token" https://your-argo-server/api/v1/workflows/argo
```

**常见原因**:
- Argo Server 不可访问
- 认证 token 无效或过期
- 权限不足

## 最佳实践

### 1. 配置管理

- 使用环境变量或配置文件管理敏感信息
- 不要在代码中硬编码 URL 和 token
- 为不同环境使用不同的配置

### 2. 优雅关闭

- 确保服务能正确响应关闭信号
- 记录关闭过程的日志
- 避免强制终止导致的数据丢失

### 3. 日志管理

- 生产环境使用 `info` 级别
- 调试时使用 `debug` 级别
- 所有日志输出到 stderr（MCP 要求）

### 4. 错误处理

- 捕获并记录所有错误
- 返回结构化的错误响应
- 提供有用的错误信息帮助调试

## 示例配置

### 开发环境

```bash
export LOG_LEVEL=debug
npm start -- --argo-server http://localhost:2746 --argo-insecure
```

### 生产环境

```bash
export LOG_LEVEL=info
npm start -- \
  --argo-server https://argo-server.example.com \
  --argo-token your-token \
  --namespace argo
```
