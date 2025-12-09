# 实施计划

## 重要说明

**架构变更：从 Kubernetes API 迁移到 Argo Server API**

当前代码实现使用 `@kubernetes/client-node` 直接与 Kubernetes API 交互，但根据需求文档和设计文档，应该使用 **Argo Server 的 HTTP REST API**。这需要进行重大重构：

1. **客户端层变更**：
   - 将 `KubeClient` 重构为 `ArgoClient`
   - 移除 `@kubernetes/client-node` 依赖
   - 添加 HTTP 客户端库（axios 或 node-fetch）
   - 使用 Argo Server REST API 端点而非 Kubernetes CRD API

2. **配置方式变更**：
   - 从 KUBECONFIG 配置改为命令行参数配置
   - 必需参数：`--argo-server <url>`
   - 可选参数：`--argo-token <token>`, `--argo-insecure`, `--namespace`

3. **认证方式变更**：
   - 从 Kubernetes 认证改为 Argo Server token 认证
   - 支持 TLS 证书验证和不安全模式

4. **API 端点变更**：
   - WorkflowTemplate: `/api/v1/workflow-templates/{namespace}`
   - Workflow: `/api/v1/workflows/{namespace}`

这个重构是必需的，以符合设计文档中定义的架构。

## 阶段 1: 项目初始化和基础设施

- [x] 1. 项目初始化和基础设施搭建
  - 创建 Node.js TypeScript 项目结构
  - 配置 package.json 和 tsconfig.json
  - 安装核心依赖：@modelcontextprotocol/sdk, winston
  - 设置测试框架（Jest）和属性测试库（fast-check）
  - 创建基本的目录结构（src/models, src/services, src/handlers, src/utils）
  - _需求: 8.1, 9.3_

## 阶段 2: 核心模型和错误处理

- [x] 2. 实现数据模型和类型定义
  - 定义 WorkflowTemplate 接口和类型
  - 定义 Workflow 接口和类型
  - 定义 MCP 协议消息类型
  - 定义错误类型枚举
  - _需求: 11.1, 11.3, 11.4_

- [x] 3. 实现错误处理模块
  - 创建 MCPError 类
  - 实现错误类型分类（NotFound, AlreadyExists, InvalidInput, ValidationError, ConnectionError, AuthorizationError, InternalError）
  - 实现错误转换为 MCP 响应格式的方法
  - _需求: 10.1, 10.2, 10.3, 10.4_

- [ ]* 3.1 编写错误处理单元测试
  - 测试各种错误类型的创建
  - 测试错误转换为 MCP 响应格式
  - _需求: 10.1_

## 阶段 3: 代码质量改进

- [x] 4. 修复 TypeScript 类型警告


  - 修复 src/mcp-server.ts 中的所有 `any` 类型警告
  - 为工具参数定义明确的接口类型
  - 为工具返回值定义明确的类型
  - 确保所有函数参数和返回值都有明确的类型注解
  - 运行 `npm run lint` 确保没有类型警告
  - _需求: 11.1, 11.3_

## 阶段 4: Argo Server 客户端（重构）

- [x] 5. 重构为 Argo Server HTTP 客户端


  - 将 KubeClient 重构为 ArgoClient（使用 HTTP REST API 而非 Kubernetes API）
  - 移除 @kubernetes/client-node 依赖，添加 axios 或 node-fetch
  - 实现 Argo Server HTTP 客户端初始化（使用 baseUrl, token, insecure 参数）
  - 实现 createWorkflowTemplate 方法（调用 Argo Server REST API: POST /api/v1/workflow-templates/{namespace}）
  - 实现 getWorkflowTemplate 方法（GET /api/v1/workflow-templates/{namespace}/{name}）
  - 实现 listWorkflowTemplates 方法（GET /api/v1/workflow-templates/{namespace}）
  - 实现 deleteWorkflowTemplate 方法（DELETE /api/v1/workflow-templates/{namespace}/{name}）
  - 实现 submitWorkflow 方法（POST /api/v1/workflows/{namespace}）
  - 实现 getWorkflow 方法（GET /api/v1/workflows/{namespace}/{name}）
  - 实现 listWorkflows 方法（GET /api/v1/workflows/{namespace}）
  - 实现 deleteWorkflow 方法（DELETE /api/v1/workflows/{namespace}/{name}）
  - 添加 HTTP 错误处理和重试逻辑
  - 添加日志记录（输出到 stderr）
  - 更新所有导入和引用
  - _需求: 1.1, 2.1, 2.3, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 8.2, 8.3_

- [ ]* 5.1 编写 ArgoClient 单元测试
  - 使用 mock HTTP 响应测试各个方法
  - 测试错误处理场景（404, 409, 403, 500 等）
  - 测试连接失败场景
  - 测试 HTTP 认证（token）
  - 测试 TLS 证书验证和不安全模式
  - _需求: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.2, 8.4_

- [ ]* 5.2 编写属性测试：模板创建后可查询
  - **Property 1: 模板创建后可查询**
  - **验证需求: Requirements 1.1, 2.1**

- [ ]* 5.3 编写属性测试：模板创建返回完整信息
  - **Property 2: 模板创建返回完整信息**
  - **验证需求: Requirements 1.2**

- [ ]* 5.4 编写属性测试：无效模板定义被拒绝
  - **Property 3: 无效模板定义被拒绝**
  - **验证需求: Requirements 1.3**

- [ ]* 5.5 编写属性测试：删除后模板不可查询
  - **Property 7: 删除后模板不可查询**
  - **验证需求: Requirements 3.1**

- [ ]* 5.6 编写属性测试：有效模板可以创建工作流
  - **Property 9: 有效模板可以创建工作流**
  - **验证需求: Requirements 4.1**

- [ ]* 5.7 编写属性测试：删除后工作流不可查询
  - **Property 18: 删除后工作流不可查询**
  - **验证需求: Requirements 7.1**

## 阶段 5: 工具处理器

- [x] 6. 更新工具处理器以使用 ArgoClient

  - 更新 TemplateToolHandler 以使用 ArgoClient 而非 KubeClient
  - 更新 WorkflowToolHandler 以使用 ArgoClient 而非 KubeClient
  - 确保所有导入和类型引用正确
  - 验证默认命名空间为 "argo"
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ]* 6.1 编写 TemplateToolHandler 单元测试
  - 测试各个工具方法的成功场景
  - 测试参数验证
  - 测试错误处理
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [ ]* 6.2 编写 WorkflowToolHandler 单元测试
  - 测试各个工具方法的成功场景
  - 测试参数验证
  - 测试错误处理
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

## 阶段 6: MCP Server 核心

- [x] 7. 更新 MCP Server 以使用 ArgoClient

  - 更新 MCPServer 类以使用 ArgoClient 而非 KubeClient
  - 确保所有工具注册正确
  - 验证工具调用路由和分发
  - 确保日志输出到 stderr
  - _需求: 11.1, 11.2, 11.3, 11.4_

- [ ]* 7.1 编写 MCPServer 单元测试
  - 测试工具注册
  - 测试工具调用路由
  - 测试 MCP 协议消息解析和格式化
  - _需求: 11.1, 11.2, 11.3, 11.4_

- [ ]* 7.2 编写属性测试：MCP 协议响应格式正确
  - **Property 21: MCP 协议响应格式正确**
  - **验证需求: Requirements 11.3**

- [ ]* 7.3 编写属性测试：MCP 协议错误格式正确
  - **Property 22: MCP 协议错误格式正确**
  - **验证需求: Requirements 11.4**


## 阶段 7: 命令行参数和启动

- [x] 8. 重构命令行参数解析和服务器启动

  - 更新主入口文件（index.ts）以支持 Argo Server 参数
  - 添加 shebang（#!/usr/bin/env node）使其可执行
  - 实现命令行参数解析（使用 commander 或 yargs）
    - `--argo-server <url>` (必需) - Argo Server 地址
    - `--argo-token <token>` (可选) - Argo Server 认证 token
    - `--argo-insecure` (可选) - 跳过 TLS 证书验证
    - `--namespace <name>` (可选，默认 "argo")
    - `--log-level <level>` (可选，默认 "info")
    - `--help` 显示帮助信息
  - 移除 KUBECONFIG 相关配置
  - 实现参数验证（确保 --argo-server 参数存在）
  - 更新服务器初始化逻辑（创建 ArgoClient 而非 KubeClient）
  - 保持优雅关闭处理
  - 配置日志级别和格式（输出到 stderr）
  - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2_

- [ ]* 8.1 编写命令行参数解析测试
  - 测试必需参数验证（--argo-server）
  - 测试可选参数默认值
  - 测试 --help 输出
  - _需求: 8.5_

## 阶段 8: npm 包配置和发布

- [x] 9. 配置 npm 包


  - 更新 package.json
    - 设置包名称（确保在 npm 上可用）
    - 设置版本号（从 1.0.0 开始）
    - 添加描述、关键词、仓库信息
    - 配置 `bin` 字段指向 dist/index.js
    - 设置 `files` 字段（只包含 dist, README.md, LICENSE）
    - 设置 `type: "module"` 使用 ES 模块
    - 设置 `engines` 要求 Node.js >= 18.0.0
    - 移除 @kubernetes/client-node 依赖
    - 添加 axios 或 node-fetch 依赖
    - 添加 commander 或 yargs 依赖（用于命令行参数解析）
  - 添加 LICENSE 文件（MIT）
  - 更新 .gitignore 和 .npmignore
  - _需求: 9.1, 9.3, 9.4_

- [x] 10. 编写用户文档


  - 更新 README.md 包含：
    - 项目简介和功能说明
    - 安装指南（npm install 和 npx）
    - 使用指南（Argo Server 命令行参数说明）
    - AI Agent 配置示例（Kiro mcp.json，使用 --argo-server 参数）
    - 快速开始示例（包括如何获取 Argo Server 地址和 token）
  - 更新 docs/QUICKSTART.md（快速开始指南，包含 Argo Server 配置）
  - 更新 docs/MCP_SERVER_USAGE.md（MCP Server 使用说明）
  - 更新 docs/TROUBLESHOOTING.md（故障排查指南，包含 Argo Server 连接问题）
  - _需求: 9.2_

- [x] 11. 本地测试 npm 包



  - 运行 `npm run build` 构建项目
  - 运行 `npm link` 本地链接
  - 测试命令行工具：`argo-workflow-mcp-server --help`
  - 测试参数解析和错误提示（--argo-server 必需参数）
  - 使用 `npm pack --dry-run` 检查包内容
  - _需求: 9.1, 9.2_

## 阶段 9: MCP Inspector 测试

- [ ] 12. 使用 MCP Inspector 进行手动测试




  - 启动 MCP Inspector：`npx @modelcontextprotocol/inspector node dist/index.js -- --argo-server <url> --argo-token <token> --namespace argo`
  - 在浏览器中打开 Inspector URL
  - 测试所有 8 个工具：
    - create_workflow_template
    - get_workflow_template
    - list_workflow_templates
    - delete_workflow_template
    - submit_workflow
    - get_workflow_status
    - list_workflows
    - delete_workflow
  - 验证工具参数和返回值格式
  - 验证错误处理（测试无效输入、认证失败等）
  - 验证与 Argo Server 的 HTTP 通信
  - 记录测试结果和发现的问题
  - _需求: 12.1, 12.2, 12.3, 12.4_

- [ ] 13. 修复 MCP Inspector 测试中发现的问题
  - 根据测试结果修复 bug
  - 优化错误消息
  - 改进参数验证
  - 修复 HTTP 请求相关问题
  - 更新文档（如有必要）
  - _需求: 12.1, 12.2, 12.3_

## 阶段 10: 属性测试

- [ ]* 14. 编写属性测试
  - 实现测试数据生成器（Arbitrary）
    - validWorkflowTemplateArbitrary
    - invalidWorkflowTemplateArbitrary
    - validWorkflowArbitrary
    - validToolCallArbitrary
  - 编写模板管理属性测试（Property 1-8）
  - 编写工作流管理属性测试（Property 9-19）
  - 编写 MCP 协议属性测试（Property 20-22）
  - 确保每个属性测试运行至少 100 次迭代
  - 确保每个属性测试标注验证的需求编号
  - _需求: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 3.1, 3.4, 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.4, 10.1, 11.3, 11.4_

## 阶段 11: 集成测试和端到端测试

- [ ]* 15. 集成测试（需要 Argo Server 环境）
  - 编写完整的模板生命周期集成测试（通过 Argo Server API）
  - 编写完整的工作流生命周期集成测试（通过 Argo Server API）
  - 编写跨命名空间操作测试
  - 测试并发操作场景
  - 测试错误处理和恢复
  - 测试 HTTP 认证和授权
  - _需求: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.2_

- [ ]* 16. 端到端测试（需要 Argo Server 环境）
  - 编写 AI Agent 连接测试
  - 编写完整的工作流管理流程测试（创建模板 → 提交工作流 → 查询状态 → 删除）
  - 测试错误场景和恢复
  - 测试命令行参数配置（--argo-server, --argo-token, --argo-insecure）
  - 测试 TLS 证书验证和不安全模式
  - _需求: 8.1, 8.2, 8.4, 11.1, 11.2, 11.3, 11.4_

## 阶段 12: 发布和最终检查

- [x] 17. 发布到 npm





  - 运行所有测试确保通过
  - 检查 package.json 配置
  - 运行 `npm pack --dry-run` 检查包内容
  - 登录 npm：`npm login`
  - 发布包：`npm publish`
  - 验证发布：`npm info argo-workflow-mcp-server`
  - 测试安装：`npx argo-workflow-mcp-server --help`
  - _需求: 9.1, 9.4_

- [ ] 18. 最终检查和清理
  - 清理临时测试和调试代码和无用的代码
  - 确保所有文档准确且最新
  - 验证所有需求都已实现
  - 运行完整的测试套件
  - 更新 CHANGELOG.md（如果有）
  - 标记 git tag（v1.0.0）

## 任务说明

- `[x]` 表示已完成的任务
- `[ ]` 表示待完成的任务
- `[ ]*` 表示测试任务（根据 testing-standards.md，需要编写单元测试和属性测试）
- 每个任务都标注了验证的需求编号（_需求: X.Y_）
- 任务按阶段组织，每个阶段有明确的目标
- 测试任务与实现任务分离，便于跟踪测试覆盖率
