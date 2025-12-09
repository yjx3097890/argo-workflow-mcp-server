/**
 * MCP Server 核心模块
 * 
 * 实现 Model Context Protocol 服务器，提供 Argo Workflow 管理工具
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { ArgoClient } from './services/index.js';
import { 
  TemplateToolHandler,
  WorkflowToolHandler,
  CreateTemplateArgs,
  GetTemplateArgs,
  ListTemplatesArgs,
  DeleteTemplateArgs,
  SubmitWorkflowArgs,
  GetWorkflowStatusArgs,
  ListWorkflowsArgs,
  DeleteWorkflowArgs,
} from './handlers/index.js';
import { MCPError, ErrorType } from './models/errors.js';
import { toolDefinitions } from './tool-definitions.js';

/**
 * 工具调用结果类型
 * 使用 unknown 而不是 Record<string, unknown> 以允许任何返回类型
 */
type ToolCallResult = unknown;

/**
 * MCP Server 类
 * 
 * 负责 MCP 协议的实现和工具注册
 */
export class MCPServer {
  private server: Server;
  private templateHandler: TemplateToolHandler;
  private workflowHandler: WorkflowToolHandler;

  /**
   * 创建 MCP Server 实例
   * 
   * @param argoClient - Argo Server 客户端
   * @param logger - 日志记录器
   */
  constructor(
    argoClient: ArgoClient,
    private logger: winston.Logger
  ) {
    this.server = new Server(
      {
        name: 'argo-workflow-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.templateHandler = new TemplateToolHandler(argoClient, logger);
    this.workflowHandler = new WorkflowToolHandler(argoClient, logger);
  }

  /**
   * 初始化 MCP Server
   * 
   * 注册所有工具和请求处理器
   */
  async initialize(): Promise<void> {
    this.logger.info('初始化 MCP Server...');

    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('处理 tools/list 请求');
      return {
        tools: toolDefinitions as Tool[],
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('处理工具调用', { toolName: name, arguments: args });

      try {
        const result = await this.handleToolCall(name, args || {});
        
        this.logger.info('工具调用成功', { toolName: name });
        
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error('工具调用失败', {
          toolName: name,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof MCPError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(error.toMCPResponse(), null, 2),
              },
            ],
            isError: true,
          };
        }

        // 处理未知错误
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error_type: 'InternalError',
                message: error instanceof Error ? error.message : String(error),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });

    this.logger.info('MCP Server 初始化完成');
  }

  /**
   * 启动 MCP Server
   * 
   * 使用 stdio 传输层启动服务器
   */
  async start(): Promise<void> {
    this.logger.info('启动 MCP Server（stdio 模式）...');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('MCP Server 已启动，等待 stdio 请求...');
  }

  /**
   * 处理工具调用
   * 
   * 根据工具名称路由到相应的处理器
   * 
   * @param toolName - 工具名称
   * @param args - 工具参数
   * @returns 工具执行结果
   */
  private async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    this.logger.debug('路由工具调用', { toolName, args });

    switch (toolName) {
      // WorkflowTemplate 工具
      case 'create_workflow_template':
        return await this.templateHandler.handleCreate(args as unknown as CreateTemplateArgs);
      
      case 'get_workflow_template':
        return await this.templateHandler.handleGet(args as unknown as GetTemplateArgs);
      
      case 'list_workflow_templates':
        return await this.templateHandler.handleList(args as unknown as ListTemplatesArgs);
      
      case 'delete_workflow_template':
        return await this.templateHandler.handleDelete(args as unknown as DeleteTemplateArgs);

      // Workflow 工具
      case 'submit_workflow':
        return await this.workflowHandler.handleSubmit(args as unknown as SubmitWorkflowArgs);
      
      case 'get_workflow_status':
        return await this.workflowHandler.handleGetStatus(args as unknown as GetWorkflowStatusArgs);
      
      case 'list_workflows':
        return await this.workflowHandler.handleList(args as unknown as ListWorkflowsArgs);
      
      case 'delete_workflow':
        return await this.workflowHandler.handleDelete(args as unknown as DeleteWorkflowArgs);

      default:
        throw new MCPError(
          ErrorType.INVALID_INPUT,
          `Unknown tool: ${toolName}`,
          { toolName }
        );
    }
  }
}
