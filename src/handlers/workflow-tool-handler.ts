/**
 * Workflow 工具处理器
 * 
 * 处理与 Workflow 实例相关的 MCP 工具调用
 */

import winston from 'winston';
import { ArgoClient } from '../services/argo-client.js';
import { WorkflowPhase } from '../models/workflow.js';
import {
  SubmitWorkflowArgs,
  GetWorkflowStatusArgs,
  ListWorkflowsArgs,
  DeleteWorkflowArgs,
  SubmitWorkflowResponse,
  GetWorkflowStatusResponse,
  ListWorkflowsResponse,
  DeleteWorkflowResponse,
  NodeStatusInfo,
} from './workflow-tool-handler-types.js';
import {
  validateSubmitArgs,
  validateGetStatusArgs,
  validateListArgs,
  validateDeleteArgs,
  parseWorkflowPhase,
} from './workflow-tool-handler-validators.js';

// 重新导出类型以便外部使用
export * from './workflow-tool-handler-types.js';

/**
 * Workflow 工具处理器类
 * 
 * 封装 Workflow 实例相关操作的业务逻辑
 */
export class WorkflowToolHandler {
  private readonly DEFAULT_NAMESPACE = 'argo';

  /**
   * 创建 WorkflowToolHandler 实例
   * 
   * @param argoClient - Argo Server 客户端
   * @param logger - Winston 日志记录器
   */
  constructor(
    private readonly argoClient: ArgoClient,
    private readonly logger: winston.Logger
  ) {}

  /**
   * 处理提交 Workflow 的请求
   * 
   * 验证需求: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
   * 
   * @param args - 提交工作流的参数
   * @returns 提交结果
   */
  async handleSubmit(args: SubmitWorkflowArgs): Promise<SubmitWorkflowResponse> {
    this.logger.info('处理提交 Workflow 请求', { 
      templateName: args.template_name,
      namespace: args.namespace || this.DEFAULT_NAMESPACE,
    });

    // 验证输入参数
    validateSubmitArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 提交工作流
      const workflow = await this.argoClient.submitWorkflow(
        args.template_name,
        namespace,
        args.parameters,
        args.generate_name
      );

      this.logger.info('成功提交 Workflow', {
        name: workflow.metadata.name,
        namespace: workflow.metadata.namespace,
        phase: workflow.status?.phase || 'Pending',
      });

      return {
        name: workflow.metadata.name,
        namespace: workflow.metadata.namespace,
        status: workflow.status?.phase || 'Pending',
        created_at: workflow.metadata.creationTimestamp || new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('提交 Workflow 失败', {
        templateName: args.template_name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理获取 Workflow 状态的请求
   * 
   * 验证需求: Requirements 5.1, 5.2, 5.3, 5.4
   * 
   * @param args - 获取工作流状态的参数
   * @returns 工作流状态详情
   */
  async handleGetStatus(args: GetWorkflowStatusArgs): Promise<GetWorkflowStatusResponse> {
    this.logger.info('处理获取 Workflow 状态请求', { name: args.name });

    // 验证输入参数
    validateGetStatusArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 获取工作流
      const workflow = await this.argoClient.getWorkflow(args.name, namespace);

      this.logger.info('成功获取 Workflow 状态', {
        name: workflow.metadata.name,
        namespace: workflow.metadata.namespace,
        phase: workflow.status?.phase || 'Unknown',
      });

      // 提取节点状态信息
      const nodes: NodeStatusInfo[] = [];
      if (workflow.status?.nodes) {
        for (const nodeId in workflow.status.nodes) {
          const node = workflow.status.nodes[nodeId];
          nodes.push({
            name: node.displayName || node.name,
            phase: node.phase,
            message: node.message,
          });
        }
      }

      return {
        name: workflow.metadata.name,
        namespace: workflow.metadata.namespace,
        phase: workflow.status?.phase || 'Unknown',
        progress: workflow.status?.progress,
        started_at: workflow.status?.startedAt,
        finished_at: workflow.status?.finishedAt,
        message: workflow.status?.message,
        nodes,
      };
    } catch (error: unknown) {
      this.logger.error('获取 Workflow 状态失败', {
        name: args.name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理列出 Workflows 的请求
   * 
   * 验证需求: Requirements 6.1, 6.2, 6.3, 6.4
   * 
   * @param args - 列出工作流的参数
   * @returns 工作流列表
   */
  async handleList(args: ListWorkflowsArgs): Promise<ListWorkflowsResponse> {
    this.logger.info('处理列出 Workflows 请求', {
      namespace: args.namespace || 'all',
      phase: args.phase || 'all',
    });

    // 验证输入参数
    validateListArgs(args);

    // 转换 phase 字符串为枚举
    let phase: WorkflowPhase | undefined;
    if (args.phase) {
      phase = parseWorkflowPhase(args.phase);
    }

    try {
      // 调用 ArgoClient 列出工作流
      const workflows = await this.argoClient.listWorkflows(args.namespace, phase);

      this.logger.info('成功列出 Workflows', {
        count: workflows.length,
        namespace: args.namespace || 'all',
        phase: args.phase || 'all',
      });

      return {
        workflows: workflows.map((workflow) => ({
          name: workflow.metadata.name,
          namespace: workflow.metadata.namespace,
          phase: workflow.status?.phase || 'Unknown',
          created_at: workflow.metadata.creationTimestamp || '',
          finished_at: workflow.status?.finishedAt,
        })),
      };
    } catch (error: unknown) {
      this.logger.error('列出 Workflows 失败', {
        namespace: args.namespace,
        phase: args.phase,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理删除 Workflow 的请求
   * 
   * 验证需求: Requirements 7.1, 7.2, 7.3, 7.4
   * 
   * @param args - 删除工作流的参数
   * @returns 删除结果
   */
  async handleDelete(args: DeleteWorkflowArgs): Promise<DeleteWorkflowResponse> {
    this.logger.info('处理删除 Workflow 请求', { name: args.name });

    // 验证输入参数
    validateDeleteArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 删除工作流
      await this.argoClient.deleteWorkflow(args.name, namespace);

      this.logger.info('成功删除 Workflow', {
        name: args.name,
        namespace,
      });

      return {
        success: true,
        message: `Workflow '${args.name}' deleted successfully from namespace '${namespace}'`,
      };
    } catch (error: unknown) {
      this.logger.error('删除 Workflow 失败', {
        name: args.name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }


}
