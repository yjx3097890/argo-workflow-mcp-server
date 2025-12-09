/**
 * Workflow 工具处理器类型定义
 * 
 * 定义 Workflow 工具处理器使用的接口和类型
 */

/**
 * 提交工作流的参数接口
 */
export interface SubmitWorkflowArgs {
  template_name: string;
  namespace?: string;
  parameters?: Record<string, string>;
  generate_name?: string;
}

/**
 * 获取工作流状态的参数接口
 */
export interface GetWorkflowStatusArgs {
  name: string;
  namespace?: string;
}

/**
 * 列出工作流的参数接口
 */
export interface ListWorkflowsArgs {
  namespace?: string;
  phase?: string;
}

/**
 * 删除工作流的参数接口
 */
export interface DeleteWorkflowArgs {
  name: string;
  namespace?: string;
}

/**
 * 提交工作流的响应接口
 */
export interface SubmitWorkflowResponse {
  name: string;
  namespace: string;
  status: string;
  created_at: string;
}

/**
 * 获取工作流状态的响应接口
 */
export interface GetWorkflowStatusResponse {
  name: string;
  namespace: string;
  phase: string;
  progress?: string;
  started_at?: string;
  finished_at?: string;
  message?: string;
  nodes: NodeStatusInfo[];
}

/**
 * 节点状态信息接口
 */
export interface NodeStatusInfo {
  name: string;
  phase: string;
  message?: string;
}

/**
 * 列出工作流的响应接口
 */
export interface ListWorkflowsResponse {
  workflows: WorkflowListItemInfo[];
}

/**
 * 工作流列表项信息接口
 */
export interface WorkflowListItemInfo {
  name: string;
  namespace: string;
  phase: string;
  created_at: string;
  finished_at?: string;
}

/**
 * 删除工作流的响应接口
 */
export interface DeleteWorkflowResponse {
  success: boolean;
  message: string;
}
