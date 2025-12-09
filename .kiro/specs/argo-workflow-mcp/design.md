# 设计文档

## 概述

本项目实现一个 MCP (Model Context Protocol) 服务器，为 AI Agent 提供管理 Argo Workflow 的能力。服务器将作为 AI Agent 和 Kubernetes 集群中 Argo Workflow 之间的桥梁，提供标准化的工具接口来管理工作流模板和工作流实例。

### 技术栈

- **语言**: Node.js (TypeScript)
- **MCP 框架**: @modelcontextprotocol/sdk
- **Kubernetes 客户端**: @kubernetes/client-node
- **运行时**: Node.js 18+
- **日志**: winston
- **分发**: npm 包
- **构建工具**: TypeScript compiler (tsc)

### 核心功能

1. Workflow Template 管理（创建、查询、删除）
2. Workflow 实例管理（运行、查询状态、列表、删除）
3. MCP 协议实现
4. 通过环境变量配置 Kubernetes 连接

## 架构

### 系统架构图

```
┌─────────────┐
│  AI Agent   │
└──────┬──────┘
       │ MCP Protocol (stdio)
       │
┌──────▼──────────────────────────┐
│     MCP Server                  │
│  ┌──────────────────────────┐  │
│  │   MCP Protocol Handler   │  │
│  └────────┬─────────────────┘  │
│           │                     │
│  ┌────────▼─────────────────┐  │
│  │   Tool Implementations   │  │
│  │  - Template Tools        │  │
│  │  - Workflow Tools        │  │
│  └────────┬─────────────────┘  │
│           │                     │
│  ┌────────▼─────────────────┐  │
│  │   Argo Server Client     │  │
│  │   (HTTP/REST API)        │  │
│  └────────┬─────────────────┘  │
└───────────┼─────────────────────┘
            │ HTTPS
┌───────────▼─────────────────────┐
│      Argo Server                │
│  ┌──────────────────────────┐  │
│  │    REST API Endpoints    │  │
│  └────────┬─────────────────┘  │
│           │                     │
│  ┌────────▼─────────────────┐  │
│  │  Kubernetes Client       │  │
│  └────────┬─────────────────┘  │
└───────────┼─────────────────────┘
            │
┌───────────▼─────────────────────┐
│   Kubernetes API Server         │
│  ┌──────────────────────────┐  │
│  │  Argo Workflow CRDs      │  │
│  │  - WorkflowTemplate      │  │
│  │  - Workflow              │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

### 分层架构

1. **协议层**: 处理 MCP 协议通信
2. **工具层**: 实现具体的 Argo Workflow 管理工具
3. **客户端层**: 与 Kubernetes API 交互
4. **资源层**: Argo Workflow CRDs


## 组件和接口

### MCP 工具定义

服务器将提供以下 MCP 工具：

#### 1. create_workflow_template
创建新的 Workflow Template

**输入参数**:
- `name` (string): 模板名称
- `namespace` (string, 可选): 命名空间，默认为 "default"
- `spec` (object): 模板规范（JSON 格式的 Argo WorkflowTemplate spec）

**输出**:
- `name` (string): 创建的模板名称
- `namespace` (string): 模板所在命名空间
- `created_at` (string): 创建时间

#### 2. get_workflow_template
查询指定的 Workflow Template

**输入参数**:
- `name` (string): 模板名称
- `namespace` (string, 可选): 命名空间，默认为 "default"

**输出**:
- `name` (string): 模板名称
- `namespace` (string): 命名空间
- `spec` (object): 完整的模板定义
- `created_at` (string): 创建时间

#### 3. list_workflow_templates
列出所有 Workflow Template

**输入参数**:
- `namespace` (string, 可选): 命名空间过滤，不指定则列出所有命名空间

**输出**:
- `templates` (array): 模板列表
  - `name` (string): 模板名称
  - `namespace` (string): 命名空间
  - `created_at` (string): 创建时间

#### 4. delete_workflow_template
删除指定的 Workflow Template

**输入参数**:
- `name` (string): 模板名称
- `namespace` (string, 可选): 命名空间，默认为 "default"

**输出**:
- `success` (boolean): 是否成功
- `message` (string): 确认信息

#### 5. submit_workflow
运行指定的 Workflow Template

**输入参数**:
- `template_name` (string): 模板名称
- `namespace` (string, 可选): 命名空间，默认为 "default"
- `parameters` (object, 可选): 运行参数
- `generate_name` (string, 可选): 工作流名称前缀

**输出**:
- `name` (string): 创建的工作流名称
- `namespace` (string): 命名空间
- `status` (string): 初始状态
- `created_at` (string): 创建时间


#### 6. get_workflow_status
查询 Workflow 运行状态

**输入参数**:
- `name` (string): 工作流名称
- `namespace` (string, 可选): 命名空间，默认为 "default"

**输出**:
- `name` (string): 工作流名称
- `namespace` (string): 命名空间
- `phase` (string): 当前阶段（Pending, Running, Succeeded, Failed, Error）
- `progress` (string): 进度信息
- `started_at` (string, 可选): 开始时间
- `finished_at` (string, 可选): 完成时间
- `nodes` (array): 节点状态列表
  - `name` (string): 节点名称
  - `phase` (string): 节点阶段
  - `message` (string, 可选): 消息或错误信息

#### 7. list_workflows
列出所有 Workflow

**输入参数**:
- `namespace` (string, 可选): 命名空间过滤
- `phase` (string, 可选): 状态过滤（Pending, Running, Succeeded, Failed, Error）

**输出**:
- `workflows` (array): 工作流列表
  - `name` (string): 工作流名称
  - `namespace` (string): 命名空间
  - `phase` (string): 当前阶段
  - `created_at` (string): 创建时间
  - `finished_at` (string, 可选): 完成时间

#### 8. delete_workflow
删除指定的 Workflow

**输入参数**:
- `name` (string): 工作流名称
- `namespace` (string, 可选): 命名空间，默认为 "default"

**输出**:
- `success` (boolean): 是否成功
- `message` (string): 确认信息

### 核心模块

#### MCPServer 模块
负责 MCP 协议的实现和工具注册

```typescript
export class MCPServer {
  private kubeClient: KubeClient;
  private server: Server;

  constructor();
  async initialize(): Promise<void>;
  async start(): Promise<void>;
  private registerTools(): void;
}
```

#### ArgoClient 模块
封装 Argo Server API 交互

```typescript
export class ArgoClient {
  private baseUrl: string;
  private token?: string;
  private insecure: boolean;

  constructor(baseUrl: string, token?: string, insecure?: boolean);
  async initialize(): Promise<void>;
  
  async createWorkflowTemplate(
    name: string, 
    namespace: string, 
    spec: any
  ): Promise<WorkflowTemplate>;
  
  async getWorkflowTemplate(
    name: string, 
    namespace: string
  ): Promise<WorkflowTemplate>;
  
  async listWorkflowTemplates(
    namespace?: string
  ): Promise<WorkflowTemplate[]>;
  
  async deleteWorkflowTemplate(
    name: string, 
    namespace: string
  ): Promise<void>;
  
  async submitWorkflow(
    templateName: string, 
    namespace: string, 
    params?: any
  ): Promise<Workflow>;
  
  async getWorkflow(
    name: string, 
    namespace: string
  ): Promise<Workflow>;
  
  async listWorkflows(
    namespace?: string, 
    phase?: string
  ): Promise<Workflow[]>;
  
  async deleteWorkflow(
    name: string, 
    namespace: string
  ): Promise<void>;
}
```


#### ToolHandler 模块
实现各个工具的具体逻辑

```typescript
export class TemplateToolHandler {
  constructor(private argoClient: ArgoClient) {}

  async handleCreate(args: any): Promise<any>;
  async handleGet(args: any): Promise<any>;
  async handleList(args: any): Promise<any>;
  async handleDelete(args: any): Promise<any>;
}

export class WorkflowToolHandler {
  constructor(private argoClient: ArgoClient) {}

  async handleSubmit(args: any): Promise<any>;
  async handleGetStatus(args: any): Promise<any>;
  async handleList(args: any): Promise<any>;
  async handleDelete(args: any): Promise<any>;
}
```

#### ErrorHandler 模块
统一的错误处理

```typescript
export enum ErrorType {
  NOT_FOUND = 'NotFound',
  ALREADY_EXISTS = 'AlreadyExists',
  INVALID_INPUT = 'InvalidInput',
  VALIDATION_ERROR = 'ValidationError',
  CONNECTION_ERROR = 'ConnectionError',
  AUTHORIZATION_ERROR = 'AuthorizationError',
  INTERNAL_ERROR = 'InternalError',
}

export class MCPError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }

  toMCPResponse(): any {
    return {
      error_type: this.type,
      message: this.message,
      details: this.details,
    };
  }
}
```

## 数据模型

### WorkflowTemplate 结构

使用 Argo Workflow 的 CRD 定义：

```typescript
export interface WorkflowTemplate {
  apiVersion: 'argoproj.io/v1alpha1';
  kind: 'WorkflowTemplate';
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
  };
  spec: WorkflowTemplateSpec;
}

export interface WorkflowTemplateSpec {
  templates: Template[];
  arguments?: Arguments;
  entrypoint?: string;
}

export interface Template {
  name: string;
  inputs?: any;
  outputs?: any;
  container?: any;
  script?: any;
  steps?: any[];
  dag?: any;
}
```

### Workflow 结构

```typescript
export interface Workflow {
  apiVersion: 'argoproj.io/v1alpha1';
  kind: 'Workflow';
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
  };
  spec: WorkflowSpec;
  status?: WorkflowStatus;
}

export interface WorkflowSpec {
  workflowTemplateRef?: {
    name: string;
  };
  arguments?: Arguments;
}

export interface WorkflowStatus {
  phase: string;
  startedAt?: string;
  finishedAt?: string;
  progress?: string;
  nodes?: Record<string, NodeStatus>;
  message?: string;
}

export interface NodeStatus {
  id: string;
  name: string;
  displayName: string;
  type: string;
  phase: string;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
}

export interface Arguments {
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  value?: string;
}
```


### MCP 协议消息格式

#### 工具调用请求

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_workflow_template",
    "arguments": {
      "name": "example-template",
      "namespace": "default",
      "spec": { ... }
    }
  }
}
```

#### 成功响应

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"name\":\"example-template\",\"namespace\":\"default\",\"created_at\":\"2024-01-01T00:00:00Z\"}"
      }
    ]
  }
}
```

#### 错误响应

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Resource not found: workflow template 'example' not found in namespace 'default'",
    "data": {
      "error_type": "NotFound",
      "resource": "WorkflowTemplate",
      "name": "example",
      "namespace": "default"
    }
  }
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证的正确性保证之间的桥梁。*

### 模板管理属性

**属性 1: 模板创建后可查询**
*对于任何*有效的 Workflow Template 定义，创建后立即查询应该返回相同的模板定义
**验证需求: Requirements 1.1, 2.1**

**属性 2: 模板创建返回完整信息**
*对于任何*成功创建的 Workflow Template，返回值应该包含模板名称和命名空间
**验证需求: Requirements 1.2**

**属性 3: 无效模板定义被拒绝**
*对于任何*无效的 Workflow Template 定义，创建操作应该返回包含验证失败原因的错误信息
**验证需求: Requirements 1.3**

**属性 4: 重复创建返回冲突错误**
*对于任何*已存在的 Workflow Template 名称，尝试创建同名模板应该返回冲突错误且原模板保持不变
**验证需求: Requirements 1.4**

**属性 5: 模板列表包含所有创建的模板**
*对于任何*命名空间，列出模板应该返回该命名空间中所有已创建的模板
**验证需求: Requirements 2.3**

**属性 6: 命名空间过滤正确工作**
*对于任何*指定的命名空间，列出模板应该只返回该命名空间下的模板，不包含其他命名空间的模板
**验证需求: Requirements 2.4**

**属性 7: 删除后模板不可查询**
*对于任何*已创建的 Workflow Template，删除后查询应该返回未找到错误
**验证需求: Requirements 3.1**

**属性 8: 删除模板不影响运行中的工作流**
*对于任何*正在运行的 Workflow，删除其来源模板不应该影响该工作流的执行
**验证需求: Requirements 3.4**


### 工作流管理属性

**属性 9: 有效模板可以创建工作流**
*对于任何*有效的 Workflow Template，提交工作流应该成功创建并返回工作流实例
**验证需求: Requirements 4.1**

**属性 10: 工作流参数正确传递**
*对于任何*提供的运行参数，创建的 Workflow 实例应该包含这些参数
**验证需求: Requirements 4.2**

**属性 11: 工作流创建返回完整信息**
*对于任何*成功创建的 Workflow，返回值应该包含工作流名称、命名空间和初始状态
**验证需求: Requirements 4.3**

**属性 12: 无效参数被拒绝**
*对于任何*不符合模板要求的参数，提交工作流应该返回参数验证错误
**验证需求: Requirements 4.5**

**属性 13: 工作流状态查询返回完整信息**
*对于任何*Workflow 实例，查询状态应该返回当前阶段、进度和状态信息
**验证需求: Requirements 5.1**

**属性 14: 多步骤工作流返回所有步骤状态**
*对于任何*包含多个步骤的 Workflow，状态查询应该返回每个步骤的状态信息
**验证需求: Requirements 5.2**

**属性 15: 工作流列表包含必需字段**
*对于任何*返回的 Workflow 列表项，每项都应该包含名称、状态、创建时间和完成时间字段
**验证需求: Requirements 6.1**

**属性 16: 状态过滤正确工作**
*对于任何*指定的状态过滤参数，列出工作流应该只返回匹配该状态的工作流
**验证需求: Requirements 6.2**

**属性 17: 工作流命名空间过滤正确工作**
*对于任何*指定的命名空间，列出工作流应该只返回该命名空间下的工作流
**验证需求: Requirements 6.3**

**属性 18: 删除后工作流不可查询**
*对于任何*已创建的 Workflow，删除后查询应该返回未找到错误
**验证需求: Requirements 7.1**

**属性 19: 删除运行中工作流先终止再删除**
*对于任何*正在运行的 Workflow，删除操作应该先终止工作流然后删除
**验证需求: Requirements 7.4**

### 错误处理属性

**属性 20: 所有错误返回结构化响应**
*对于任何*错误情况，MCP Server 应该返回包含错误类型和详细信息的结构化错误响应
**验证需求: Requirements 9.1**

**属性 21: MCP 协议响应格式正确**
*对于任何*工具调用，成功响应应该符合 MCP 协议格式规范
**验证需求: Requirements 10.3**

**属性 22: MCP 协议错误格式正确**
*对于任何*工具调用失败，错误响应应该符合 MCP 协议错误格式规范
**验证需求: Requirements 10.4**


## 错误处理

### 错误分类

1. **资源错误**
   - `NotFound`: 请求的资源不存在
   - `AlreadyExists`: 资源已存在（创建冲突）

2. **验证错误**
   - `InvalidInput`: 输入参数格式错误
   - `ValidationError`: 资源定义验证失败

3. **连接错误**
   - `ConnectionError`: 无法连接到 Kubernetes API Server
   - `NetworkError`: 网络通信失败

4. **权限错误**
   - `AuthorizationError`: 权限不足，无法执行操作
   - `AuthenticationError`: 身份验证失败

5. **系统错误**
   - `InternalError`: 服务器内部错误
   - `TimeoutError`: 操作超时

### 错误处理策略

#### 1. 资源不存在
```typescript
// 查询不存在的资源时
if (!resource) {
  throw new MCPError(
    ErrorType.NOT_FOUND,
    `workflow template '${name}' not found in namespace '${namespace}'`
  );
}
```

#### 2. 资源冲突
```typescript
// 创建已存在的资源时
try {
  await kubeClient.createWorkflowTemplate(name, namespace, spec);
} catch (error: any) {
  if (error.statusCode === 409) {
    throw new MCPError(
      ErrorType.ALREADY_EXISTS,
      `workflow template '${name}' already exists in namespace '${namespace}'`
    );
  }
  throw error;
}
```

#### 3. 验证错误
```typescript
// 验证输入参数
function validateTemplateSpec(spec: any): void {
  if (typeof spec !== 'object' || spec === null) {
    throw new MCPError(
      ErrorType.VALIDATION_ERROR,
      'template spec must be an object'
    );
  }
  // 更多验证逻辑...
}
```

#### 4. 连接错误
```typescript
// 处理 Kubernetes API 连接失败
try {
  await kubeClient.getWorkflowTemplate(name, namespace);
} catch (error: any) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new MCPError(
      ErrorType.CONNECTION_ERROR,
      `failed to connect to Kubernetes API: ${error.message}`
    );
  }
  throw error;
}
```

#### 5. 权限错误
```typescript
// 处理权限不足
try {
  await kubeClient.createWorkflowTemplate(name, namespace, spec);
} catch (error: any) {
  if (error.statusCode === 403) {
    throw new MCPError(
      ErrorType.AUTHORIZATION_ERROR,
      'insufficient permissions to create workflow template. Required: workflowtemplates.create',
      { requiredPermissions: ['workflowtemplates.create'] }
    );
  }
  throw error;
}
```

### 日志记录

使用 `winston` 库记录详细的操作日志：

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// 成功操作
logger.info('workflow template created successfully', {
  templateName: name,
  namespace: namespace,
});

// 错误操作
logger.error('failed to create workflow template', {
  templateName: name,
  namespace: namespace,
  error: error.message,
});

// 调试信息
logger.debug('processing tool call', {
  requestId: id,
  toolName: tool,
});
```

## 测试策略

### 双重测试方法

本项目将采用单元测试和属性测试相结合的方法：

- **单元测试**：验证特定示例、边界条件和错误情况
- **属性测试**：验证应该在所有输入中保持的通用属性

两者互补：单元测试捕获具体的 bug，属性测试验证通用的正确性。

### 属性测试框架

使用 **fast-check** 作为 TypeScript 的属性测试库。

配置要求：
- 每个属性测试至少运行 **100 次迭代**
- 每个属性测试必须标注验证的需求编号

### 单元测试

单元测试覆盖以下场景：

#### 1. KubeClient 模块测试
- 测试 Kubernetes API 客户端初始化
- 测试各个 API 调用的正确性
- 测试错误处理（使用 mock Kubernetes API）

#### 2. ToolHandler 模块测试
- 测试工具参数验证
- 测试工具调用成功场景
- 测试工具调用失败场景

#### 3. MCPServer 模块测试
- 测试 MCP 协议消息解析
- 测试工具注册和调用
- 测试响应格式化

#### 4. ErrorHandler 模块测试
- 测试各种错误类型的创建
- 测试错误转换为 MCP 响应格式

### 属性测试

属性测试实现设计文档中定义的正确性属性：

#### 模板管理属性测试

**属性测试 1: 模板创建后可查询**
```typescript
// **Feature: argo-workflow-mcp, Property 1: 模板创建后可查询**
// **Validates: Requirements 1.1, 2.1**
fc.assert(
  fc.asyncProperty(
    validWorkflowTemplateArbitrary(),
    async (template) => {
      const created = await kubeClient.createWorkflowTemplate(
        template.name,
        template.namespace,
        template.spec
      );
      const retrieved = await kubeClient.getWorkflowTemplate(
        template.name,
        template.namespace
      );
      expect(retrieved.spec).toEqual(template.spec);
    }
  ),
  { numRuns: 100 }
);
```

**属性测试 2: 模板创建返回完整信息**
```typescript
// **Feature: argo-workflow-mcp, Property 2: 模板创建返回完整信息**
// **Validates: Requirements 1.2**
fc.assert(
  fc.asyncProperty(
    validWorkflowTemplateArbitrary(),
    async (template) => {
      const result = await kubeClient.createWorkflowTemplate(
        template.name,
        template.namespace,
        template.spec
      );
      expect(result.metadata.name).toBe(template.name);
      expect(result.metadata.namespace).toBe(template.namespace);
      expect(result.metadata.creationTimestamp).toBeDefined();
    }
  ),
  { numRuns: 100 }
);
```

**属性测试 3: 无效模板定义被拒绝**
```typescript
// **Feature: argo-workflow-mcp, Property 3: 无效模板定义被拒绝**
// **Validates: Requirements 1.3**
fc.assert(
  fc.asyncProperty(
    invalidWorkflowTemplateArbitrary(),
    async (template) => {
      await expect(
        kubeClient.createWorkflowTemplate(
          template.name,
          template.namespace,
          template.spec
        )
      ).rejects.toThrow(MCPError);
    }
  ),
  { numRuns: 100 }
);
```

**属性测试 7: 删除后模板不可查询**
```typescript
// **Feature: argo-workflow-mcp, Property 7: 删除后模板不可查询**
// **Validates: Requirements 3.1**
fc.assert(
  fc.asyncProperty(
    validWorkflowTemplateArbitrary(),
    async (template) => {
      await kubeClient.createWorkflowTemplate(
        template.name,
        template.namespace,
        template.spec
      );
      await kubeClient.deleteWorkflowTemplate(
        template.name,
        template.namespace
      );
      await expect(
        kubeClient.getWorkflowTemplate(template.name, template.namespace)
      ).rejects.toThrow(MCPError);
    }
  ),
  { numRuns: 100 }
);
```

#### 工作流管理属性测试

**属性测试 9: 有效模板可以创建工作流**
```typescript
// **Feature: argo-workflow-mcp, Property 9: 有效模板可以创建工作流**
// **Validates: Requirements 4.1**
fc.assert(
  fc.asyncProperty(
    validWorkflowTemplateArbitrary(),
    async (template) => {
      await kubeClient.createWorkflowTemplate(
        template.name,
        template.namespace,
        template.spec
      );
      const workflow = await kubeClient.submitWorkflow(
        template.name,
        template.namespace
      );
      expect(workflow.metadata.name).toBeDefined();
      expect(workflow.spec.workflowTemplateRef?.name).toBe(template.name);
    }
  ),
  { numRuns: 100 }
);
```

**属性测试 18: 删除后工作流不可查询**
```typescript
// **Feature: argo-workflow-mcp, Property 18: 删除后工作流不可查询**
// **Validates: Requirements 7.1**
fc.assert(
  fc.asyncProperty(
    validWorkflowArbitrary(),
    async (workflow) => {
      const created = await kubeClient.submitWorkflow(
        workflow.templateName,
        workflow.namespace
      );
      await kubeClient.deleteWorkflow(
        created.metadata.name,
        workflow.namespace
      );
      await expect(
        kubeClient.getWorkflow(created.metadata.name, workflow.namespace)
      ).rejects.toThrow(MCPError);
    }
  ),
  { numRuns: 100 }
);
```

#### MCP 协议属性测试

**属性测试 21: MCP 协议响应格式正确**
```typescript
// **Feature: argo-workflow-mcp, Property 21: MCP 协议响应格式正确**
// **Validates: Requirements 10.3**
fc.assert(
  fc.asyncProperty(
    validToolCallArbitrary(),
    async (toolCall) => {
      const response = await mcpServer.handleToolCall(toolCall);
      expect(response).toHaveProperty('jsonrpc', '2.0');
      expect(response).toHaveProperty('id', toolCall.id);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
      expect(Array.isArray(response.result.content)).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

### 测试数据生成器

使用 fast-check 的 Arbitrary 生成器创建测试数据：

```typescript
import * as fc from 'fast-check';

// 生成有效的 Workflow Template
function validWorkflowTemplateArbitrary() {
  return fc.record({
    name: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'), { minLength: 1, maxLength: 63 }),
    namespace: fc.constantFrom('default', 'argo', 'test'),
    spec: fc.record({
      templates: fc.array(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          container: fc.record({
            image: fc.constantFrom('alpine:latest', 'busybox:latest'),
            command: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      entrypoint: fc.string({ minLength: 1, maxLength: 20 }),
    }),
  });
}

// 生成无效的 Workflow Template
function invalidWorkflowTemplateArbitrary() {
  return fc.oneof(
    // 空名称
    fc.record({
      name: fc.constant(''),
      namespace: fc.string(),
      spec: fc.anything(),
    }),
    // 无效的 spec
    fc.record({
      name: fc.string({ minLength: 1 }),
      namespace: fc.string(),
      spec: fc.constant(null),
    }),
    // 缺少必需字段
    fc.record({
      name: fc.string({ minLength: 1 }),
      namespace: fc.string(),
      spec: fc.record({
        templates: fc.constant([]),
      }),
    })
  );
}

// 生成有效的工作流提交参数
function validWorkflowArbitrary() {
  return fc.record({
    templateName: fc.string({ minLength: 1, maxLength: 63 }),
    namespace: fc.constantFrom('default', 'argo', 'test'),
    parameters: fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string()
      )
    ),
  });
}

// 生成有效的 MCP 工具调用
function validToolCallArbitrary() {
  return fc.record({
    jsonrpc: fc.constant('2.0'),
    id: fc.integer({ min: 1, max: 10000 }),
    method: fc.constant('tools/call'),
    params: fc.record({
      name: fc.constantFrom(
        'create_workflow_template',
        'get_workflow_template',
        'list_workflow_templates',
        'delete_workflow_template',
        'submit_workflow',
        'get_workflow_status',
        'list_workflows',
        'delete_workflow'
      ),
      arguments: fc.anything(),
    }),
  });
}
```

### 集成测试

集成测试验证 MCP Server 与 Kubernetes 集群的完整交互：

#### 测试环境要求
- 需要运行的 Kubernetes 集群（可以使用 kind 或 minikube）
- 需要安装 Argo Workflow CRDs
- 需要配置 kubeconfig

#### 集成测试场景
1. 完整的模板生命周期（创建、查询、列表、删除）
2. 完整的工作流生命周期（提交、查询状态、列表、删除）
3. 跨命名空间操作
4. 并发操作测试

### 端到端测试

端到端测试验证 AI Agent 通过 MCP 协议与服务器交互的完整流程：

1. AI Agent 连接到 MCP Server
2. AI Agent 创建 Workflow Template
3. AI Agent 提交 Workflow
4. AI Agent 查询 Workflow 状态
5. AI Agent 删除 Workflow 和 Template

### MCP Inspector 手动测试

使用 MCP Inspector 进行交互式测试和调试：

#### 启动 Inspector

```bash
# 启动 MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js -- \
  --argo-server http://localhost:2746 \
  --argo-insecure \
  --namespace argo

# Inspector 会输出访问地址和 token
# 例如：http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=xxx
```

#### 测试流程

1. **在浏览器中打开 Inspector URL**
2. **查看工具列表**：验证所有 8 个工具都正确注册
3. **测试创建模板**：
   - 选择 `create_workflow_template` 工具
   - 输入测试参数
   - 验证返回结果
4. **测试查询模板**：使用 `get_workflow_template` 查询刚创建的模板
5. **测试提交工作流**：使用 `submit_workflow` 运行模板
6. **测试查询状态**：使用 `get_workflow_status` 查看工作流状态
7. **测试列表功能**：验证 `list_workflow_templates` 和 `list_workflows`
8. **测试删除功能**：清理测试资源

#### Inspector 优势

- 可视化工具参数和返回值
- 实时查看 MCP 协议消息
- 方便调试和验证工具行为
- 无需编写测试代码即可快速验证

### 测试执行

```bash
# 运行所有单元测试
npm test

# 运行属性测试
npm run test:property

# 运行集成测试（需要 Argo Server）
npm run test:integration

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage

# 使用 MCP Inspector 手动测试
npm run test:inspector
```

### 测试覆盖率目标

- **核心功能**：100% 覆盖
- **整体代码**：> 80% 覆盖
- **关键路径**：100% 覆盖

## 部署和配置

### npm 包发布

#### 发布准备

在发布到 npm 之前，需要完成以下准备工作：

1. **更新 package.json**
   - 设置正确的包名称（确保在 npm 上可用）
   - 设置版本号（遵循语义化版本）
   - 添加描述、关键词、仓库信息
   - 配置 `bin` 字段指向可执行文件
   - 设置 `files` 字段指定要发布的文件

2. **准备 README.md**
   - 项目简介和功能说明
   - 安装和使用指南
   - 配置示例
   - API 文档链接

3. **添加 LICENSE 文件**
   - 选择合适的开源许可证（如 MIT）

4. **构建项目**
   ```bash
   npm run build
   ```

5. **本地测试**
   ```bash
   # 本地链接测试
   npm link
   argo-workflow-mcp-server --help
   
   # 使用 MCP Inspector 测试
   npm run test:inspector
   ```

#### 发布流程

```bash
# 1. 登录 npm（首次发布需要）
npm login

# 2. 检查包内容
npm pack --dry-run

# 3. 发布到 npm
npm publish

# 4. 验证发布
npm info argo-workflow-mcp-server
```

#### 版本管理

```bash
# 补丁版本（bug 修复）
npm version patch
npm publish

# 次版本（新功能，向后兼容）
npm version minor
npm publish

# 主版本（破坏性变更）
npm version major
npm publish
```

#### 发布检查清单

- [ ] 所有测试通过
- [ ] 代码已编译（`dist/` 目录存在）
- [ ] README.md 完整且准确
- [ ] package.json 信息正确
- [ ] LICENSE 文件存在
- [ ] 版本号已更新
- [ ] 使用 MCP Inspector 验证功能
- [ ] 本地 `npm link` 测试通过

### 用户安装

MCP Server 发布后，用户可以通过以下方式安装：

```bash
# 全局安装
npm install -g argo-workflow-mcp-server

# 或使用 npx（无需安装）
npx argo-workflow-mcp-server --help
```

### package.json 配置要点

发布到 npm 需要在 package.json 中配置以下关键字段：

```json
{
  "name": "argo-workflow-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for managing Argo Workflows",
  "main": "dist/index.js",
  "type": "module",
  "bin": {
    "argo-workflow-mcp-server": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "mcp",
    "model-context-protocol",
    "argo-workflows",
    "kubernetes",
    "workflow",
    "ai-agent"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/argo-workflow-mcp-server"
  },
  "bugs": {
    "url": "https://github.com/your-org/argo-workflow-mcp-server/issues"
  },
  "homepage": "https://github.com/your-org/argo-workflow-mcp-server#readme",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**关键配置说明**：
- `bin`: 定义命令行工具的入口点
- `files`: 指定发布到 npm 的文件（只包含必需文件，减小包体积）
- `type: "module"`: 使用 ES 模块
- `engines`: 指定 Node.js 版本要求

### 命令行参数配置

MCP Server 通过命令行参数进行配置，不将配置写死在代码中：

#### Argo Server 配置（必需）

- `--argo-server <url>`: Argo Server 地址（必需，例如：`https://argo-server.example.com`）
- `--argo-token <token>`: Argo Server 认证 token（可选，如果 Argo Server 需要认证）
- `--argo-insecure`: 跳过 TLS 证书验证（可选，用于自签名证书，不推荐在生产环境使用）
- `--namespace <name>`: 默认命名空间（可选，默认为 "argo"）

#### 服务器配置

- `--log-level <level>`: 日志级别（可选，默认为 "info"，可选值：error, warn, info, debug）

#### 示例配置

```bash
# 基本配置（生产环境）
npx argo-workflow-mcp-server --argo-server https://argo-server.example.com --argo-token your-token

# 指定命名空间
npx argo-workflow-mcp-server --argo-server https://argo-server.example.com --argo-token your-token --namespace argo

# 本地开发（通过 port-forward，跳过 TLS 验证）
npx argo-workflow-mcp-server --argo-server http://localhost:2746 --argo-insecure

# 启用调试日志
npx argo-workflow-mcp-server --argo-server https://argo-server.example.com --argo-token your-token --log-level debug

# 完整配置示例
npx argo-workflow-mcp-server \
  --argo-server https://argo-server.example.com \
  --argo-token your-token \
  --namespace argo \
  --log-level info
```

### AI Agent 配置

AI Agent（如 Kiro）需要在 MCP 配置中添加 argo-workflow 服务器：

#### 生产环境配置

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

#### 本地开发配置

连接本地 Argo Server（通过 port-forward）：

```bash
# 在终端中运行 port-forward
kubectl port-forward -n argo svc/argo-server 2746:2746
```

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
        "--argo-insecure",
        "--namespace",
        "argo"
      ]
    }
  }
}
```

#### 使用全局安装

```bash
npm install -g argo-workflow-mcp-server
```

```json
{
  "mcpServers": {
    "argo-workflow": {
      "command": "argo-workflow-mcp-server",
      "args": [
        "--argo-server",
        "https://argo-server.example.com",
        "--argo-token",
        "your-token",
        "--namespace",
        "argo"
      ]
    }
  }
}
```

#### 配置参数说明

- `npx -y`: 自动确认安装，无需手动确认
- `--argo-server`: Argo Server 地址（必需）
- `--argo-token`: Argo Server 认证 token（可选，如果服务器需要认证）
- `--argo-insecure`: 跳过 TLS 验证（可选，仅用于开发环境）
- `--namespace`: 指定默认命名空间（可选，默认为 "argo"）
- `--log-level`: 指定日志级别（可选，默认为 "info"）

### 监控和日志

#### 日志输出
- 所有日志输出到 stderr（stdout 保留给 MCP 协议通信）
- 日志格式：JSON 或彩色文本（根据终端环境自动选择）
- 日志级别可通过 `--log-level` 参数控制

## 安全考虑

### 1. 认证和授权
- MCP Server 使用 Argo Server 的认证机制
- 用户需要提供有效的 Argo Server token（如果服务器启用了认证）
- Argo Server 负责与 Kubernetes 的 RBAC 集成
- 建议使用最小权限原则，只授予必需的权限

### 2. 凭证安全
- Argo Server token 应妥善保管，不要提交到版本控制
- 建议通过 MCP 配置文件的 `args` 参数传递 token
- 在共享环境中，为每个用户创建独立的 token
- 定期轮换 token

### 3. 输入验证
- 验证所有工具调用的输入参数
- 防止注入攻击（如命令注入、YAML 注入）
- 限制资源名称和命名空间的格式
- 验证 Workflow Template spec 的合法性

### 4. 网络安全
- MCP Server 通过 stdio 与 AI Agent 通信，不暴露网络端口
- 与 Argo Server 的通信使用 HTTPS 加密（生产环境）
- 仅在开发环境使用 `--argo-insecure` 跳过 TLS 验证
- 建议在生产环境使用有效的 TLS 证书

### 5. 审计日志
- 记录所有工具调用和操作
- 记录错误和异常情况
- 日志包含操作类型、资源名称等信息
- 建议将日志导出到集中式日志系统进行分析
- Argo Server 本身也提供审计日志功能

