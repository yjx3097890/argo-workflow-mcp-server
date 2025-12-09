# 故障排查指南

本指南帮助你解决使用 Argo Workflow MCP Server 时遇到的常见问题。

## 连接问题

### 无法连接到 Argo Server

**症状**：
```
Failed to connect to Argo Server: connect ECONNREFUSED
```

**解决方案**：

1. **检查 Argo Server 地址**
   ```bash
   # 验证 Argo Server 是否运行
   kubectl get pods -n argo | grep argo-server
   
   # 检查服务
   kubectl get svc -n argo argo-server
   ```

2. **使用 port-forward**
   ```bash
   kubectl port-forward -n argo svc/argo-server 2746:2746
   ```
   
   然后使用 `http://localhost:2746` 作为 Argo Server 地址

3. **检查网络连接**
   ```bash
   curl -k https://argo-server.example.com
   ```

### TLS 证书验证失败

**症状**：
```
Error: unable to verify the first certificate
```

**解决方案**：

1. **使用 `--argo-insecure` 标志**（仅用于开发环境）
   ```bash
   argo-workflow-mcp-server \
     --argo-server https://argo-server.example.com \
     --argo-insecure
   ```

2. **安装正确的 CA 证书**（生产环境推荐）
   ```bash
   # 将 CA 证书添加到系统信任存储
   ```

## 认证问题

### Token 认证失败

**症状**：
```
Error: Unauthorized (401)
Error: Forbidden (403)
```

**解决方案**：

1. **验证 token 是否有效**
   ```bash
   # 测试 token
   curl -H "Authorization: Bearer your-token" \
     https://argo-server.example.com/api/v1/workflow-templates/argo
   ```

2. **重新生成 token**
   ```bash
   kubectl create token argo-workflow-mcp -n argo --duration=8760h
   ```

3. **检查 token 是否过期**
   ```bash
   # 查看 token 信息
   kubectl get secret -n argo
   ```

### 权限不足

**症状**：
```
Error: Forbidden - insufficient permissions
```

**解决方案**：

1. **检查 ServiceAccount 权限**
   ```bash
   kubectl describe rolebinding argo-workflow-mcp -n argo
   ```

2. **授予必要的权限**
   ```bash
   # 创建 RoleBinding
   kubectl create rolebinding argo-workflow-mcp \
     --clusterrole=argo-admin \
     --serviceaccount=argo:argo-workflow-mcp \
     -n argo
   ```

3. **验证 RBAC 配置**
   ```bash
   kubectl auth can-i create workflowtemplates \
     --as=system:serviceaccount:argo:argo-workflow-mcp \
     -n argo
   ```

## 资源问题

### 找不到 Workflow Template

**症状**：
```
Error: Resource not found - workflow template 'xxx' not found
```

**解决方案**：

1. **检查命名空间**
   ```bash
   # 列出所有命名空间的模板
   kubectl get workflowtemplates --all-namespaces
   ```

2. **使用正确的命名空间**
   ```bash
   argo-workflow-mcp-server \
     --argo-server https://argo-server.example.com \
     --namespace your-namespace
   ```

3. **验证模板是否存在**
   ```bash
   kubectl get workflowtemplates -n argo
   ```

### Workflow 提交失败

**症状**：
```
Error: Failed to submit workflow
```

**解决方案**：

1. **检查模板定义**
   ```bash
   kubectl get workflowtemplate your-template -n argo -o yaml
   ```

2. **验证参数**
   - 确保提供的参数与模板定义匹配
   - 检查参数类型和格式

3. **查看 Argo Server 日志**
   ```bash
   kubectl logs -n argo deployment/argo-server
   ```

## MCP 协议问题

### MCP Server 无法启动

**症状**：
```
Error: Failed to initialize MCP Server
```

**解决方案**：

1. **检查命令行参数**
   ```bash
   argo-workflow-mcp-server --help
   ```

2. **验证必需参数**
   - `--argo-server` 是必需的
   - 确保 URL 格式正确

3. **查看日志输出**
   - 日志输出到 stderr
   - 使用 `--log-level debug` 获取详细信息

### AI Agent 无法连接

**症状**：
- AI Agent 报告 MCP Server 不可用
- 工具列表为空

**解决方案**：

1. **检查 MCP 配置**
   ```json
   {
     "mcpServers": {
       "argo-workflow": {
         "command": "npx",
         "args": [
           "-y",
           "argo-workflow-mcp-server",
           "--argo-server",
           "http://localhost:2746",
           "--argo-insecure"
         ]
       }
     }
   }
   ```

2. **重启 AI Agent**
   - 重新加载 MCP 配置
   - 重启 AI Agent 应用

3. **使用 MCP Inspector 测试**
   ```bash
   npx @modelcontextprotocol/inspector \
     node dist/index.js -- \
     --argo-server http://localhost:2746 \
     --argo-insecure
   ```

## 性能问题

### 响应缓慢

**可能原因**：
- Argo Server 负载过高
- 网络延迟
- 大量 Workflow 实例

**解决方案**：

1. **检查 Argo Server 性能**
   ```bash
   kubectl top pods -n argo
   ```

2. **优化查询**
   - 使用命名空间过滤
   - 使用状态过滤
   - 限制返回结果数量

3. **增加 Argo Server 资源**
   ```bash
   kubectl edit deployment argo-server -n argo
   ```

## 日志和调试

### 启用调试日志

```bash
argo-workflow-mcp-server \
  --argo-server https://argo-server.example.com \
  --log-level debug
```

### 查看 Argo Server 日志

```bash
# 查看 Argo Server 日志
kubectl logs -n argo deployment/argo-server -f

# 查看 Workflow Controller 日志
kubectl logs -n argo deployment/workflow-controller -f
```

### 使用 MCP Inspector

MCP Inspector 是一个可视化工具，用于测试和调试 MCP Server：

```bash
npx @modelcontextprotocol/inspector \
  node dist/index.js -- \
  --argo-server http://localhost:2746 \
  --argo-insecure \
  --namespace argo
```

## 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|---------|
| 400 | 请求参数无效 | 检查参数格式和类型 |
| 401 | 未认证 | 提供有效的 token |
| 403 | 权限不足 | 检查 RBAC 配置 |
| 404 | 资源不存在 | 验证资源名称和命名空间 |
| 409 | 资源冲突 | 资源已存在，使用不同的名称 |
| 500 | 服务器内部错误 | 查看 Argo Server 日志 |

## 获取帮助

如果以上方法都无法解决问题：

1. **查看文档**
   - [快速开始指南](../QUICKSTART.md)
   - [MCP Server 使用说明](./MCP_SERVER_USAGE.md)

2. **检查 GitHub Issues**
   - [已知问题](https://github.com/your-org/argo-workflow-mcp-server/issues)

3. **提交新 Issue**
   - 包含完整的错误信息
   - 提供复现步骤
   - 附上日志输出

4. **社区支持**
   - [Argo Workflows Slack](https://argoproj.github.io/community/join-slack/)
   - [MCP Discord](https://discord.gg/modelcontextprotocol)
