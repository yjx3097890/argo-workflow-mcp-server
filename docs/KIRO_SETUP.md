# Kiro MCP 服务器配置指南

本文档说明如何在 Kiro IDE 中配置和使用 Argo Workflow MCP 服务器。

## 前置条件

1. 已安装 Node.js 18+
2. 已编译项目：`npm run build`
3. 有可访问的 Argo Workflow 实例

## 配置文件

### 1. MCP 配置 (`.kiro/settings/mcp.json`)

此文件配置 Kiro 如何启动 MCP 服务器：

```json
{
  "mcpServers": {
    "argo-workflow": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "LOG_LEVEL": "info",
        "KUBECONFIG": "${workspaceFolder}/.kiro/kubeconfig.yaml"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**配置说明**:
- `command`: 使用 Node.js 运行服务器
- `args`: 指向编译后的入口文件
- `cwd`: 工作目录设置为项目根目录
- `env.LOG_LEVEL`: 日志级别（error/warn/info/debug）
- `env.KUBECONFIG`: Kubernetes 配置文件路径
- `disabled`: 是否禁用此服务器
- `autoApprove`: 自动批准的工具列表（空表示需要手动批准）

### 2. Kubernetes 配置 (`.kiro/kubeconfig.yaml`)

此文件配置如何连接到 Argo Workflow 集群：

```yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: https://192.168.100.101:30728
    insecure-skip-tls-verify: true
  name: argo-workflow-cluster
contexts:
- context:
    cluster: argo-workflow-cluster
    user: argo-workflow-user
    namespace: default
  name: argo-workflow-context
current-context: argo-workflow-context
users:
- name: argo-workflow-user
  user:
    token: ""
```

**配置说明**:
- `server`: Argo Workflow API 地址
- `insecure-skip-tls-verify`: 跳过 TLS 验证（仅用于测试环境）
- `namespace`: 默认命名空间
- `token`: 认证令牌（如果需要）

## 使用步骤

### 1. 编译项目

```bash
npm run build
```

### 2. 测试连接

运行测试脚本验证与 Argo Workflow 的连接：

```bash
node test-connection.js
```

预期输出：
```
info: 开始测试 Kubernetes 连接...
info: 加载 kubeconfig: .kiro/kubeconfig.yaml
info: 当前上下文: argo-workflow-context
info: 当前集群: https://192.168.100.101:30728
info: 尝试列出 WorkflowTemplates...
info: 连接成功！
info: 找到 X 个 WorkflowTemplate
info: ✅ 测试通过
```

### 3. 在 Kiro 中启用 MCP 服务器

1. 打开 Kiro IDE
2. 打开命令面板（Ctrl+Shift+P 或 Cmd+Shift+P）
3. 搜索 "MCP" 相关命令
4. 选择 "Reload MCP Servers" 或重启 Kiro

### 4. 验证服务器状态

MCP 服务器启动后，你可以通过 Kiro 的 MCP 面板查看服务器状态，或者查看日志输出确认服务器正常运行。

### 5. 使用 MCP 工具

在 Kiro 中，你可以通过 AI Agent 使用以下工具：

#### Workflow Template 管理
- `create_workflow_template` - 创建工作流模板
- `get_workflow_template` - 查询工作流模板
- `list_workflow_templates` - 列出工作流模板
- `delete_workflow_template` - 删除工作流模板

#### Workflow 管理
- `submit_workflow` - 运行工作流
- `get_workflow_status` - 查询工作流状态
- `list_workflows` - 列出工作流
- `delete_workflow` - 删除工作流

## 示例对话

### 创建 Workflow Template

```
你: 帮我创建一个简单的 hello-world workflow template

AI: 我来帮你创建一个 hello-world workflow template...
[调用 create_workflow_template 工具]
```

### 列出所有 Workflow Templates

```
你: 列出所有的 workflow templates

AI: 让我查询所有的 workflow templates...
[调用 list_workflow_templates 工具]
```

### 运行 Workflow

```
你: 运行 hello-world template

AI: 我来运行 hello-world template...
[调用 submit_workflow 工具]
```

### 查询 Workflow 状态

```
你: 查询刚才运行的 workflow 状态

AI: 让我查询 workflow 的状态...
[调用 get_workflow_status 工具]
```

## 故障排查

### 问题 1: MCP 服务器无法启动

**症状**: Kiro 显示 MCP 服务器连接失败

**解决方案**:
1. 检查项目是否已编译：`npm run build`
2. 检查 `dist/index.js` 文件是否存在
3. 查看 Kiro 的 MCP 日志（通常在输出面板）

### 问题 2: 无法连接到 Argo Workflow

**症状**: 工具调用返回连接错误

**解决方案**:
1. 运行测试脚本：`node test-connection.js`
2. 检查 `.kiro/kubeconfig.yaml` 中的服务器地址
3. 确认 Argo Workflow 实例可访问
4. 检查网络连接和防火墙设置

### 问题 3: 权限错误

**症状**: 工具调用返回 403 Forbidden

**解决方案**:
1. 检查 kubeconfig 中的认证配置
2. 确认用户有足够的 RBAC 权限
3. 如果需要 token，在 kubeconfig 中添加有效的 token

### 问题 4: MCP 服务器运行异常

**症状**: 工具调用失败或服务器意外退出

**解决方案**:
1. 检查服务器日志输出
2. 确认 Argo Server 客户端初始化成功
3. 检查 MCP Server 是否正常启动
4. 验证命令行参数是否正确

## 高级配置

### 自动批准工具

如果你信任某些工具，可以将它们添加到 `autoApprove` 列表：

```json
{
  "mcpServers": {
    "argo-workflow": {
      ...
      "autoApprove": [
        "list_workflow_templates",
        "list_workflows",
        "get_workflow_template",
        "get_workflow_status"
      ]
    }
  }
}
```

**注意**: 只自动批准读取操作，避免自动批准创建/删除操作。

### 调试模式

启用调试日志：

```json
{
  "mcpServers": {
    "argo-workflow": {
      ...
      "env": {
        "LOG_LEVEL": "debug",
        ...
      }
    }
  }
}
```

### 使用不同的命名空间

修改 kubeconfig 中的默认命名空间：

```yaml
contexts:
- context:
    cluster: argo-workflow-cluster
    user: argo-workflow-user
    namespace: my-namespace  # 修改这里
  name: argo-workflow-context
```

## 安全建议

1. **不要在生产环境使用 `insecure-skip-tls-verify: true`**
   - 仅用于测试环境
   - 生产环境应使用有效的 TLS 证书

2. **使用最小权限原则**
   - 只授予必要的 RBAC 权限
   - 避免使用 cluster-admin 角色

3. **保护 kubeconfig 文件**
   - 不要提交到版本控制系统
   - 添加到 `.gitignore`

4. **定期轮换凭证**
   - 定期更新 token
   - 使用短期凭证

## 参考资料

- [MCP 协议文档](https://modelcontextprotocol.io/)
- [Argo Workflow 文档](https://argoproj.github.io/argo-workflows/)
- [Kubernetes 客户端文档](https://github.com/kubernetes-client/javascript)
- [项目设计文档](.kiro/specs/argo-workflow-mcp/design.md)
