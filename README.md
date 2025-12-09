# Argo Workflow MCP Server

一个 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 服务器，为 AI Agent 提供管理 Argo Workflows 的能力。

## 功能特性

- 🚀 通过 Argo Server REST API 管理 Argo Workflows
- 📝 创建、查询、列出和删除 Workflow Templates
- ⚡ 提交、监控和管理 Workflow 实例
- 🔒 支持 Token 认证和 TLS 证书验证
- 🛠️ 完整的 MCP 协议支持
- 📦 易于安装和配置

## 安装

### 使用 npx（推荐）

无需安装，直接运行：

```bash
npx argo-workflow-mcp-server --argo-server https://argo-server.example.com --argo-token your-token
```

### 全局安装

```bash
npm install -g argo-workflow-mcp-server
```

## 使用方法

### 命令行参数

```bash
argo-workflow-mcp-server [options]

选项：
  --argo-server <url>      Argo Server 地址（必需）
  --argo-token <token>     Argo Server 认证 token（可选）
  --argo-insecure          跳过 TLS 证书验证（用于自签名证书或开发环境）
  --namespace <name>       默认命名空间（默认：argo）
  --log-level <level>      日志级别：error, warn, info, debug（默认：info）
  -h, --help               显示帮助信息
  -V, --version            显示版本号
```

### 示例

#### 连接到生产环境 Argo Server

```bash
argo-workflow-mcp-server \
  --argo-server https://argo-server.example.com \
  --argo-token your-auth-token \
  --namespace argo
```

#### 连接到本地开发环境（通过 port-forward）

首先设置 port-forward：

```bash
kubectl port-forward -n argo svc/argo-server 2746:2746
```

然后启动 MCP Server：

```bash
argo-workflow-mcp-server \
  --argo-server http://localhost:2746 \
  --argo-insecure \
  --namespace argo
```

#### 连接到使用自签名证书的 Argo Server

如果你的 Argo Server 使用自签名证书，会遇到 "self-signed certificate" 错误。使用 `--argo-insecure` 参数跳过证书验证：

```bash
argo-workflow-mcp-server \
  --argo-server https://argo-server.example.com \
  --argo-token your-auth-token \
  --argo-insecure \
  --namespace argo
```

**注意**：`--argo-insecure` 会跳过 TLS 证书验证，仅在以下情况使用：
- 开发和测试环境
- 使用自签名证书的内部环境
- 通过 port-forward 连接本地环境

**不推荐在生产环境使用**，生产环境应使用有效的 TLS 证书。

## AI Agent 配置

### Kiro

在 `.kiro/settings/mcp.json` 中添加配置：

```json
{
  "mcpServers": {
    "argo-workflow": {
      "command": "npx",
      "args": [
        "-y",
        "argo-workflow-mcp-server",
        "--argo-server",
        "https://argo-server.example.com",
        "--argo-token",
        "your-auth-token",
        "--namespace",
        "argo"
      ]
    }
  }
}
```

### 其他 MCP 客户端

参考 [MCP 文档](https://modelcontextprotocol.io) 配置您的客户端。

## 可用工具

MCP Server 提供以下工具：

### Workflow Template 管理

- `create_workflow_template` - 创建新的 Workflow Template
- `get_workflow_template` - 查询指定的 Workflow Template
- `list_workflow_templates` - 列出所有 Workflow Templates
- `delete_workflow_template` - 删除指定的 Workflow Template

### Workflow 实例管理

- `submit_workflow` - 从模板提交新的 Workflow
- `get_workflow_status` - 查询 Workflow 运行状态
- `list_workflows` - 列出所有 Workflows
- `delete_workflow` - 删除指定的 Workflow

## 获取 Argo Server 地址和 Token

### 获取 Argo Server 地址

如果 Argo Server 已暴露为 LoadBalancer 或 Ingress：

```bash
kubectl get svc -n argo argo-server
```

如果使用 port-forward：

```bash
kubectl port-forward -n argo svc/argo-server 2746:2746
# 然后使用 http://localhost:2746
```

### 获取认证 Token

创建 ServiceAccount 并获取 token：

```bash
# 创建 ServiceAccount
kubectl create sa argo-workflow-mcp -n argo

# 创建 RoleBinding（根据需要调整权限）
kubectl create rolebinding argo-workflow-mcp \
  --clusterrole=argo-admin \
  --serviceaccount=argo:argo-workflow-mcp \
  -n argo

# 获取 token
kubectl create token argo-workflow-mcp -n argo --duration=8760h
```

## 开发

### 构建

```bash
npm install
npm run build
```

### 测试

```bash
npm test
```

### 本地测试

```bash
npm run build
npm link
argo-workflow-mcp-server --help
```

## 故障排查

### 自签名证书错误

**错误信息**：`Failed to connect to Argo Server: self-signed certificate`

**解决方案**：使用 `--argo-insecure` 参数跳过 TLS 证书验证

```bash
argo-workflow-mcp-server \
  --argo-server https://your-argo-server \
  --argo-token your-token \
  --argo-insecure
```

### 连接失败

- 确认 Argo Server 地址正确
- 检查网络连接
- 验证 token 是否有效
- 如果使用 HTTPS，确保证书有效或使用 `--argo-insecure`

### 权限错误

- 确认 ServiceAccount 有足够的权限
- 检查 RBAC 配置
- 验证 token 是否过期

### 更多帮助

查看 [故障排查指南](./docs/TROUBLESHOOTING.md)

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Argo Workflows](https://argoproj.github.io/workflows/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Kiro IDE](https://kiro.ai)
