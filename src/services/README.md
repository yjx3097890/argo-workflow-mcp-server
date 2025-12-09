# Services 模块

## KubeClient

KubeClient 是一个封装了 Kubernetes API 交互的客户端类，专门用于管理 Argo Workflow 资源。

### 功能特性

- **WorkflowTemplate 管理**
  - 创建 Workflow Template
  - 查询 Workflow Template
  - 列出 Workflow Templates
  - 删除 Workflow Template

- **Workflow 管理**
  - 提交 Workflow（从模板创建实例）
  - 查询 Workflow 状态
  - 列出 Workflows（支持状态过滤）
  - 删除 Workflow

- **错误处理**
  - 统一的错误处理机制
  - 详细的错误日志记录
  - 符合 MCP 协议的错误响应

- **输入验证**
  - 资源名称验证
  - 命名空间验证
  - 模板规范验证

### 使用示例

#### 初始化客户端

```typescript
import { KubeClient } from './services/kube-client';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const client = new KubeClient(logger);
await client.initialize();
```

#### 创建 Workflow Template

```typescript
const template = await client.createWorkflowTemplate(
  'hello-world',
  'default',
  {
    templates: [
      {
        name: 'main',
        container: {
          image: 'alpine:latest',
          command: ['echo', 'hello world'],
        },
      },
    ],
    entrypoint: 'main',
  }
);
```

#### 提交 Workflow

```typescript
const workflow = await client.submitWorkflow(
  'hello-world',
  'default',
  { message: 'Hello from MCP!' },
  'hello-'
);

console.log(`Workflow 已创建: ${workflow.metadata.name}`);
```

#### 查询 Workflow 状态

```typescript
const workflow = await client.getWorkflow('hello-abc123', 'default');
console.log(`状态: ${workflow.status?.phase}`);
console.log(`进度: ${workflow.status?.progress}`);
```

#### 列出 Workflows

```typescript
// 列出所有 Workflows
const allWorkflows = await client.listWorkflows();

// 列出特定命名空间的 Workflows
const defaultWorkflows = await client.listWorkflows('default');

// 列出特定状态的 Workflows
const runningWorkflows = await client.listWorkflows('default', WorkflowPhase.Running);
```

### 错误处理

KubeClient 使用统一的错误处理机制，所有错误都会被转换为 `MCPError`：

```typescript
import { MCPError, ErrorType } from '../models/errors';

try {
  const template = await client.getWorkflowTemplate('non-existent', 'default');
} catch (error) {
  if (error instanceof MCPError) {
    console.error(`错误类型: ${error.type}`);
    console.error(`错误消息: ${error.message}`);
    console.error(`错误详情:`, error.details);
  }
}
```

### 配置要求

#### 集群内运行

当在 Kubernetes 集群内运行时，KubeClient 会自动使用集群内配置：

- ServiceAccount token
- CA 证书
- API Server 地址

#### 集群外运行

当在集群外运行时，KubeClient 会使用默认的 kubeconfig 文件：

- `~/.kube/config` (Linux/macOS)
- `%USERPROFILE%\.kube\config` (Windows)

### RBAC 权限要求

KubeClient 需要以下 Kubernetes RBAC 权限：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: argo-workflow-mcp-role
rules:
- apiGroups: ["argoproj.io"]
  resources: ["workflowtemplates"]
  verbs: ["get", "list", "create", "delete"]
- apiGroups: ["argoproj.io"]
  resources: ["workflows"]
  verbs: ["get", "list", "create", "delete", "watch"]
```

### 日志记录

KubeClient 使用 Winston 进行日志记录，支持以下日志级别：

- `info`: 重要操作（创建、删除等）
- `debug`: 详细操作（查询、列表等）
- `error`: 错误信息

可以通过环境变量 `LOG_LEVEL` 配置日志级别：

```bash
export LOG_LEVEL=debug
```

### 验证规则

#### 资源名称

- 必须由小写字母、数字和连字符组成
- 不能以连字符开头或结尾
- 最大长度 253 个字符

#### 命名空间

- 必须由小写字母、数字和连字符组成
- 不能以连字符开头或结尾
- 最大长度 63 个字符

#### 模板规范

- 必须是一个对象
- 必须包含 `templates` 数组
- `templates` 数组不能为空
- 每个 template 必须有 `name` 字段
