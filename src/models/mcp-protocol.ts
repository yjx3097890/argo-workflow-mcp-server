/**
 * MCP 协议消息类型定义
 * 
 * 定义 Model Context Protocol 的消息格式
 */

/**
 * JSON-RPC 版本
 */
export const JSONRPC_VERSION = '2.0';

/**
 * JSON-RPC 请求基础接口
 */
export interface JSONRPCRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  id: string | number;
  method: string;
  params?: any;
}

/**
 * JSON-RPC 响应基础接口
 */
export interface JSONRPCResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: string | number;
  result?: any;
  error?: JSONRPCErrorObject;
}

/**
 * JSON-RPC 错误对象
 */
export interface JSONRPCErrorObject {
  code: number;
  message: string;
  data?: any;
}

/**
 * MCP 工具调用请求
 */
export interface MCPToolCallRequest extends JSONRPCRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

/**
 * MCP 工具列表请求
 */
export interface MCPToolListRequest extends JSONRPCRequest {
  method: 'tools/list';
  params?: Record<string, never>;
}

/**
 * MCP 工具调用响应
 */
export interface MCPToolCallResponse extends JSONRPCResponse {
  result: {
    content: ContentItem[];
    isError?: boolean;
  };
}

/**
 * MCP 工具列表响应
 */
export interface MCPToolListResponse extends JSONRPCResponse {
  result: {
    tools: ToolDefinition[];
  };
}

/**
 * 内容项
 */
export interface ContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: InputSchema;
}

/**
 * 输入模式（JSON Schema）
 */
export interface InputSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

/**
 * 属性模式
 */
export interface PropertySchema {
  type: string;
  description?: string;
  enum?: any[];
  default?: any;
  items?: PropertySchema;
  properties?: Record<string, PropertySchema>;
}

/**
 * MCP 工具名称枚举
 */
export enum MCPToolName {
  CREATE_WORKFLOW_TEMPLATE = 'create_workflow_template',
  GET_WORKFLOW_TEMPLATE = 'get_workflow_template',
  LIST_WORKFLOW_TEMPLATES = 'list_workflow_templates',
  DELETE_WORKFLOW_TEMPLATE = 'delete_workflow_template',
  SUBMIT_WORKFLOW = 'submit_workflow',
  GET_WORKFLOW_STATUS = 'get_workflow_status',
  LIST_WORKFLOWS = 'list_workflows',
  DELETE_WORKFLOW = 'delete_workflow',
}

/**
 * 创建 WorkflowTemplate 工具参数
 */
export interface CreateWorkflowTemplateArgs {
  name: string;
  namespace?: string;
  spec: any;
}

/**
 * 获取 WorkflowTemplate 工具参数
 */
export interface GetWorkflowTemplateArgs {
  name: string;
  namespace?: string;
}

/**
 * 列出 WorkflowTemplate 工具参数
 */
export interface ListWorkflowTemplatesArgs {
  namespace?: string;
}

/**
 * 删除 WorkflowTemplate 工具参数
 */
export interface DeleteWorkflowTemplateArgs {
  name: string;
  namespace?: string;
}

/**
 * 提交 Workflow 工具参数
 */
export interface SubmitWorkflowArgs {
  template_name: string;
  namespace?: string;
  parameters?: Record<string, string>;
  generate_name?: string;
}

/**
 * 获取 Workflow 状态工具参数
 */
export interface GetWorkflowStatusArgs {
  name: string;
  namespace?: string;
}

/**
 * 列出 Workflow 工具参数
 */
export interface ListWorkflowsArgs {
  namespace?: string;
  phase?: string;
}

/**
 * 删除 Workflow 工具参数
 */
export interface DeleteWorkflowArgs {
  name: string;
  namespace?: string;
}

/**
 * 创建 WorkflowTemplate 响应
 */
export interface CreateWorkflowTemplateResponse {
  name: string;
  namespace: string;
  created_at: string;
}

/**
 * 获取 WorkflowTemplate 响应
 */
export interface GetWorkflowTemplateResponse {
  name: string;
  namespace: string;
  spec: any;
  created_at: string;
}

/**
 * 列出 WorkflowTemplate 响应
 */
export interface ListWorkflowTemplatesResponse {
  templates: {
    name: string;
    namespace: string;
    created_at: string;
  }[];
}

/**
 * 删除 WorkflowTemplate 响应
 */
export interface DeleteWorkflowTemplateResponse {
  success: boolean;
  message: string;
}

/**
 * 提交 Workflow 响应
 */
export interface SubmitWorkflowResponse {
  name: string;
  namespace: string;
  status: string;
  created_at: string;
}

/**
 * 获取 Workflow 状态响应
 */
export interface GetWorkflowStatusResponse {
  name: string;
  namespace: string;
  phase: string;
  progress?: string;
  started_at?: string;
  finished_at?: string;
  nodes?: {
    name: string;
    phase: string;
    message?: string;
  }[];
}

/**
 * 列出 Workflow 响应
 */
export interface ListWorkflowsResponse {
  workflows: {
    name: string;
    namespace: string;
    phase: string;
    created_at: string;
    finished_at?: string;
  }[];
}

/**
 * 删除 Workflow 响应
 */
export interface DeleteWorkflowResponse {
  success: boolean;
  message: string;
}
