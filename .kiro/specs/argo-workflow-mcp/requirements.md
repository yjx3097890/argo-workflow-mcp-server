# 需求文档

## 简介

本项目旨在开发一个 MCP (Model Context Protocol) 服务器，使 AI Agent 能够通过标准化接口管理 Argo Workflow。该服务器通过 Argo Server API 与 Argo Workflows 交互，提供 Workflow Template 和 Workflow 实例的完整生命周期管理功能，并最终发布到 npm，方便用户安装和使用。

## 术语表

- **MCP Server**: Model Context Protocol 服务器，提供标准化的工具接口供 AI Agent 调用
- **Argo Workflow**: Kubernetes 原生的工作流引擎，用于编排容器化任务
- **Argo Server**: Argo Workflows 的 REST API 服务器，提供 HTTP 接口访问工作流
- **Workflow Template**: 工作流模板，定义可重用的工作流结构
- **Workflow**: 工作流实例，从模板创建的具体执行实例
- **AI Agent**: 调用 MCP 服务器的人工智能代理
- **npm**: Node.js 包管理器，用于发布和分发 JavaScript/TypeScript 包

## 需求

### 需求 1

**用户故事：** 作为 AI Agent，我希望能够创建 Workflow Template，以便定义可重用的工作流结构

#### 验收标准

1. WHEN AI Agent 提供有效的 Workflow Template 定义 THEN MCP Server SHALL 通过 Argo Server API 创建该模板
2. WHEN 创建成功 THEN MCP Server SHALL 返回创建的模板名称和命名空间信息
3. WHEN 提供的模板定义无效 THEN MCP Server SHALL 返回明确的错误信息说明验证失败的原因
4. WHEN 创建同名模板 THEN MCP Server SHALL 返回冲突错误并保持原有模板不变

### 需求 2

**用户故事：** 作为 AI Agent，我希望能够查询 Workflow Template，以便了解可用的工作流模板

#### 验收标准

1. WHEN AI Agent 请求查询特定名称的 Workflow Template THEN MCP Server SHALL 返回该模板的完整定义
2. WHEN 请求的模板不存在 THEN MCP Server SHALL 返回明确的未找到错误
3. WHEN AI Agent 请求列出所有 Workflow Template THEN MCP Server SHALL 返回所有模板的名称和基本信息列表
4. WHERE 指定命名空间参数 THEN MCP Server SHALL 仅返回该命名空间下的模板

### 需求 3

**用户故事：** 作为 AI Agent，我希望能够删除 Workflow Template，以便清理不再需要的模板

#### 验收标准

1. WHEN AI Agent 请求删除指定的 Workflow Template THEN MCP Server SHALL 通过 Argo Server API 删除该模板
2. WHEN 删除成功 THEN MCP Server SHALL 返回确认信息
3. WHEN 请求删除不存在的模板 THEN MCP Server SHALL 返回明确的未找到错误
4. WHEN 模板正在被使用 THEN MCP Server SHALL 成功删除模板但不影响已运行的工作流实例

### 需求 4

**用户故事：** 作为 AI Agent，我希望能够运行指定的 Workflow Template，以便执行具体的工作流任务

#### 验收标准

1. WHEN AI Agent 指定有效的 Workflow Template 名称 THEN MCP Server SHALL 创建并启动一个新的 Workflow 实例
2. WHEN 提供运行参数 THEN MCP Server SHALL 将参数传递给 Workflow 实例
3. WHEN 创建成功 THEN MCP Server SHALL 返回新创建的 Workflow 实例名称和状态
4. WHEN 指定的模板不存在 THEN MCP Server SHALL 返回明确的错误信息
5. WHEN 提供的参数不符合模板要求 THEN MCP Server SHALL 返回参数验证错误

### 需求 5

**用户故事：** 作为 AI Agent，我希望能够查询 Workflow 运行状态，以便监控工作流执行情况

#### 验收标准

1. WHEN AI Agent 请求查询特定 Workflow 的状态 THEN MCP Server SHALL 返回该工作流的当前状态、阶段和进度信息
2. WHEN 工作流包含多个步骤 THEN MCP Server SHALL 返回每个步骤的状态信息
3. WHEN 工作流执行失败 THEN MCP Server SHALL 返回失败原因和错误日志
4. WHEN 请求的工作流不存在 THEN MCP Server SHALL 返回明确的未找到错误

### 需求 6

**用户故事：** 作为 AI Agent，我希望能够查询 Workflow 列表，以便了解所有运行中和历史的工作流

#### 验收标准

1. WHEN AI Agent 请求列出所有 Workflow THEN MCP Server SHALL 返回工作流列表包含名称、状态、创建时间和完成时间
2. WHERE 指定状态过滤参数 THEN MCP Server SHALL 仅返回匹配指定状态的工作流
3. WHERE 指定命名空间参数 THEN MCP Server SHALL 仅返回该命名空间下的工作流
4. WHEN 列表为空 THEN MCP Server SHALL 返回空列表而不是错误

### 需求 7

**用户故事：** 作为 AI Agent，我希望能够删除指定的 Workflow，以便清理已完成或失败的工作流实例

#### 验收标准

1. WHEN AI Agent 请求删除指定的 Workflow THEN MCP Server SHALL 通过 Argo Server API 删除该工作流实例
2. WHEN 删除成功 THEN MCP Server SHALL 返回确认信息
3. WHEN 请求删除不存在的工作流 THEN MCP Server SHALL 返回明确的未找到错误
4. WHEN 删除正在运行的工作流 THEN MCP Server SHALL 先终止工作流然后删除

### 需求 8

**用户故事：** 作为开发者，我希望能够通过命令行参数配置 MCP Server，以便灵活地连接到不同的 Argo Server 环境

#### 验收标准

1. WHEN 启动 MCP Server THEN 系统 SHALL 接受 Argo Server 地址作为必需参数
2. WHEN 提供认证 token THEN MCP Server SHALL 使用该 token 与 Argo Server 进行认证
3. WHEN 指定命名空间参数 THEN MCP Server SHALL 使用该命名空间作为默认命名空间
4. WHEN 启用不安全模式 THEN MCP Server SHALL 跳过 TLS 证书验证（仅用于开发环境）
5. WHEN 未提供必需参数 THEN MCP Server SHALL 返回清晰的错误信息说明缺少哪些参数

### 需求 9

**用户故事：** 作为开发者，我希望能够将 MCP Server 发布到 npm，以便其他用户可以方便地安装和使用

#### 验收标准

1. WHEN MCP Server 发布到 npm THEN 用户 SHALL 能够通过 `npm install` 或 `npx` 命令安装和运行
2. WHEN 用户运行 `--help` 参数 THEN MCP Server SHALL 显示所有可用的命令行参数和使用说明
3. WHEN package.json 配置正确 THEN npm 包 SHALL 包含所有必需的文件和依赖
4. WHEN 用户安装包 THEN 可执行文件 SHALL 正确链接到系统路径


### 需求 10

**用户故事：** 作为开发者，我希望 MCP Server 提供清晰的错误处理，以便快速定位和解决问题

#### 验收标准

1. WHEN 发生错误 THEN MCP Server SHALL 返回结构化的错误响应包含错误类型和详细信息
2. WHEN Argo Server API 调用失败 THEN MCP Server SHALL 记录详细的错误日志
3. WHEN 网络连接失败 THEN MCP Server SHALL 返回明确的连接错误信息
4. WHEN 权限不足 THEN MCP Server SHALL 返回授权错误并说明所需权限

### 需求 11

**用户故事：** 作为 AI Agent，我希望 MCP Server 提供标准的 MCP 协议接口，以便能够无缝集成

#### 验收标准

1. WHEN AI Agent 连接到 MCP Server THEN 服务器 SHALL 遵循 MCP 协议规范
2. WHEN AI Agent 请求工具列表 THEN MCP Server SHALL 返回所有可用的 Argo Workflow 管理工具
3. WHEN AI Agent 调用工具 THEN MCP Server SHALL 按照 MCP 协议格式返回结果
4. WHEN 工具调用失败 THEN MCP Server SHALL 按照 MCP 协议格式返回错误信息

### 需求 12

**用户故事：** 作为开发者，我希望能够使用 MCP Inspector 测试 MCP Server，以便验证所有工具的功能

#### 验收标准

1. WHEN 使用 MCP Inspector 启动 MCP Server THEN Inspector SHALL 提供可视化界面显示所有工具
2. WHEN 在 Inspector 中调用工具 THEN 系统 SHALL 显示请求参数和响应结果
3. WHEN 工具调用失败 THEN Inspector SHALL 显示详细的错误信息
4. WHEN 查看 MCP 协议消息 THEN Inspector SHALL 显示完整的 JSON-RPC 消息内容
