# MCP Server 使用指南

## 概述

Argo Workflow MCP Server 是一个实现了 Model Context Protocol (MCP) 的服务器，为 AI Agent 提供管理 Argo Workflow 的能力。

## 架构

```
AI Agent
    ↓ (MCP Protocol via stdio)
MCP Server
    ↓ (Kubernetes API)
Kubernetes Cluster
    ↓
Argo Workflow CRDs
```

## 可用工具

MCP Server 提供以下 8 个工具：

### WorkflowTemplate 管理

1. **create_workflow_template** - 创建新的 Workflow Template
2. **get_workflow_template** - 查询指定的 Workflow Template
3. **list_workflow_templates** - 列出所有 Workflow Template
4. **delete_workflow_template** - 删除指定的 Workflow Template

### Workflow 管理

5. **submit_workflow** - 运行指定的 Workflow Template
6. **get_workflow_status** - 查询 Workflow 运行状态
7. **list_workflows** - 列出所有 Workflow
8. **delete_workflow** - 删除指定的 Workflow

## 启动服务器

### 前置条件

1. 安装 Node.js 18+
2. 配置 Kubernetes 访问（kubeconfig 或集群内配置）
3. 安装 Argo Workflow CRDs

### 构建和启动

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务器
npm start
```

### 环境变量

- `LOG_LEVEL`: 日志级别（默认: `info`）
  - 可选值: `error`, `warn`, `info`, `debug`

## MCP 协议通信

MCP Server 使用 stdio 传输层进行通信，遵循 JSON-RPC 2.0 协议。

### 工具列表请求

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### 工具调用请求

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_workflow_template",
    "arguments": {
      "name": "hello-world",
      "namespace": "default",
      "spec": {
        "templates": [
          {
            "name": "hello",
            "container": {
              "image": "alpine:latest",
              "command": ["echo", "Hello World"]
            }
          }
        ],
        "entrypoint": "hello"
      }
    }
  }
}
```

### 成功响应

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"name\":\"hello-world\",\"namespace\":\"default\",\"created_at\":\"2024-01-01T00:00:00Z\"}"
      }
    ]
  }
}
```

### 错误响应

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"error_type\":\"NotFound\",\"message\":\"WorkflowTemplate 'hello-world' not found in namespace 'default'\"}"
      }
    ],
    "isError": true
  }
}
```

## 工具使用示例

### 创建 WorkflowTemplate

```json
{
  "name": "create_workflow_template",
  "arguments": {
    "name": "example-template",
    "namespace": "default",
    "spec": {
      "templates": [
        {
          "name": "main",
          "container": {
            "image": "alpine:latest",
            "command": ["echo", "Hello from Argo"]
          }
        }
      ],
      "entrypoint": "main"
    }
  }
}
```

### 提交 Workflow

```json
{
  "name": "submit_workflow",
  "arguments": {
    "template_name": "example-template",
    "namespace": "default",
    "parameters": {
      "message": "Hello World"
    }
  }
}
```

### 查询 Workflow 状态

```json
{
  "name": "get_workflow_status",
  "arguments": {
    "name": "example-workflow-abc123",
    "namespace": "default"
  }
}
```

### 列出 Workflows

```json
{
  "name": "list_workflows",
  "arguments": {
    "namespace": "default",
    "phase": "Running"
  }
}
```

## 错误处理

MCP Server 定义了以下错误类型：

- `NotFound` - 资源未找到
- `AlreadyExists` - 资源已存在
- `InvalidInput` - 无效输入
- `ValidationError` - 验证错误
- `ConnectionError` - 连接错误
- `AuthorizationError` - 授权错误
- `InternalError` - 内部错误

所有错误都会以结构化格式返回，包含错误类型、消息和详细信息。

## 日志记录

MCP Server 使用 winston 进行日志记录，支持以下日志级别：

- `error` - 错误信息
- `warn` - 警告信息
- `info` - 一般信息（默认）
- `debug` - 调试信息

日志格式：

```json
{
  "level": "info",
  "message": "处理工具调用",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "toolName": "create_workflow_template",
  "arguments": {...}
}
```

## 开发和测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- src/mcp-server.test.ts

# 生成覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 格式化代码
npm run format
```

## 故障排查

### 连接 Kubernetes 失败

确保：
1. kubeconfig 文件配置正确
2. 有足够的权限访问 Argo Workflow 资源
3. Argo Workflow CRDs 已安装

### 工具调用失败

检查：
1. 参数格式是否正确
2. 命名空间是否存在
3. 资源名称是否有效
4. 查看日志获取详细错误信息

### 权限错误

确保 ServiceAccount 有以下权限：
- `workflowtemplates`: get, list, create, delete
- `workflows`: get, list, create, delete, watch

## 下一步

- 创建 Docker 镜像
- 部署到生产环境
- 集成到 CI/CD 流水线
