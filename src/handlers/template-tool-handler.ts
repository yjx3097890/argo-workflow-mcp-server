/**
 * Workflow Template 工具处理器
 * 
 * 处理与 Workflow Template 相关的 MCP 工具调用
 */

import winston from 'winston';
import { ArgoClient } from '../services/argo-client.js';
import { ErrorFactory } from '../models/errors.js';

/**
 * 创建模板的参数接口
 */
export interface CreateTemplateArgs {
  name: string;
  namespace?: string;
  spec: unknown;
}

/**
 * 获取模板的参数接口
 */
export interface GetTemplateArgs {
  name: string;
  namespace?: string;
}

/**
 * 列出模板的参数接口
 */
export interface ListTemplatesArgs {
  namespace?: string;
}

/**
 * 删除模板的参数接口
 */
export interface DeleteTemplateArgs {
  name: string;
  namespace?: string;
}

/**
 * 创建模板的响应接口
 */
export interface CreateTemplateResponse {
  name: string;
  namespace: string;
  created_at: string;
}

/**
 * 获取模板的响应接口
 */
export interface GetTemplateResponse {
  name: string;
  namespace: string;
  spec: unknown;
  created_at: string;
}

/**
 * 列出模板的响应接口
 */
export interface ListTemplatesResponse {
  templates: TemplateListItem[];
}

/**
 * 模板列表项接口
 */
export interface TemplateListItem {
  name: string;
  namespace: string;
  created_at: string;
}

/**
 * 删除模板的响应接口
 */
export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
}

/**
 * Workflow Template 工具处理器类
 * 
 * 封装 Workflow Template 相关操作的业务逻辑
 */
export class TemplateToolHandler {
  private readonly DEFAULT_NAMESPACE = 'argo';

  /**
   * 创建 TemplateToolHandler 实例
   * 
   * @param argoClient - Argo Server 客户端
   * @param logger - Winston 日志记录器
   */
  constructor(
    private readonly argoClient: ArgoClient,
    private readonly logger: winston.Logger
  ) {}

  /**
   * 处理创建 Workflow Template 的请求
   * 
   * 验证需求: Requirements 1.1, 1.2, 1.3, 1.4
   * 
   * @param args - 创建模板的参数
   * @returns 创建结果
   */
  async handleCreate(args: CreateTemplateArgs): Promise<CreateTemplateResponse> {
    this.logger.info('处理创建 Workflow Template 请求', { name: args.name });

    // 验证输入参数
    this.validateCreateArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 创建模板
      const template = await this.argoClient.createWorkflowTemplate(
        args.name,
        namespace,
        args.spec
      );

      this.logger.info('成功创建 Workflow Template', {
        name: template.metadata.name,
        namespace: template.metadata.namespace,
      });

      return {
        name: template.metadata.name,
        namespace: template.metadata.namespace,
        created_at: template.metadata.creationTimestamp || new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('创建 Workflow Template 失败', {
        name: args.name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理获取 Workflow Template 的请求
   * 
   * 验证需求: Requirements 2.1, 2.2
   * 
   * @param args - 获取模板的参数
   * @returns 模板详情
   */
  async handleGet(args: GetTemplateArgs): Promise<GetTemplateResponse> {
    this.logger.info('处理获取 Workflow Template 请求', { name: args.name });

    // 验证输入参数
    this.validateGetArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 获取模板
      const template = await this.argoClient.getWorkflowTemplate(args.name, namespace);

      this.logger.info('成功获取 Workflow Template', {
        name: template.metadata.name,
        namespace: template.metadata.namespace,
      });

      return {
        name: template.metadata.name,
        namespace: template.metadata.namespace,
        spec: template.spec,
        created_at: template.metadata.creationTimestamp || '',
      };
    } catch (error: unknown) {
      this.logger.error('获取 Workflow Template 失败', {
        name: args.name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理列出 Workflow Templates 的请求
   * 
   * 验证需求: Requirements 2.3, 2.4
   * 
   * @param args - 列出模板的参数
   * @returns 模板列表
   */
  async handleList(args: ListTemplatesArgs): Promise<ListTemplatesResponse> {
    this.logger.info('处理列出 Workflow Templates 请求', {
      namespace: args.namespace || 'all',
    });

    try {
      // 调用 ArgoClient 列出模板
      const templates = await this.argoClient.listWorkflowTemplates(args.namespace);

      this.logger.info('成功列出 Workflow Templates', {
        count: templates.length,
        namespace: args.namespace || 'all',
      });

      return {
        templates: templates.map((template) => ({
          name: template.metadata.name,
          namespace: template.metadata.namespace,
          created_at: template.metadata.creationTimestamp || '',
        })),
      };
    } catch (error: unknown) {
      this.logger.error('列出 Workflow Templates 失败', {
        namespace: args.namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理删除 Workflow Template 的请求
   * 
   * 验证需求: Requirements 3.1, 3.2, 3.3
   * 
   * @param args - 删除模板的参数
   * @returns 删除结果
   */
  async handleDelete(args: DeleteTemplateArgs): Promise<DeleteTemplateResponse> {
    this.logger.info('处理删除 Workflow Template 请求', { name: args.name });

    // 验证输入参数
    this.validateDeleteArgs(args);

    const namespace = args.namespace || this.DEFAULT_NAMESPACE;

    try {
      // 调用 ArgoClient 删除模板
      await this.argoClient.deleteWorkflowTemplate(args.name, namespace);

      this.logger.info('成功删除 Workflow Template', {
        name: args.name,
        namespace,
      });

      return {
        success: true,
        message: `Workflow Template '${args.name}' deleted successfully from namespace '${namespace}'`,
      };
    } catch (error: unknown) {
      this.logger.error('删除 Workflow Template 失败', {
        name: args.name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证创建模板的参数
   * 
   * @param args - 创建模板的参数
   * @throws MCPError 如果参数无效
   */
  private validateCreateArgs(args: CreateTemplateArgs): void {
    // 验证名称
    if (!args.name || typeof args.name !== 'string') {
      throw ErrorFactory.invalidInput('name', 'name must be a non-empty string');
    }

    if (args.name.trim().length === 0) {
      throw ErrorFactory.invalidInput('name', 'name cannot be empty or whitespace only');
    }

    // 验证名称格式（Kubernetes 资源名称规则）
    const nameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
    if (!nameRegex.test(args.name)) {
      throw ErrorFactory.invalidInput(
        'name',
        'name must consist of lower case alphanumeric characters or \'-\', and must start and end with an alphanumeric character'
      );
    }

    // 验证命名空间（如果提供）
    if (args.namespace !== undefined) {
      if (typeof args.namespace !== 'string' || args.namespace.trim().length === 0) {
        throw ErrorFactory.invalidInput('namespace', 'namespace must be a non-empty string');
      }

      if (!nameRegex.test(args.namespace)) {
        throw ErrorFactory.invalidInput(
          'namespace',
          'namespace must consist of lower case alphanumeric characters or \'-\', and must start and end with an alphanumeric character'
        );
      }
    }

    // 验证 spec
    if (!args.spec || typeof args.spec !== 'object') {
      throw ErrorFactory.invalidInput('spec', 'spec must be an object');
    }
  }

  /**
   * 验证获取模板的参数
   * 
   * @param args - 获取模板的参数
   * @throws MCPError 如果参数无效
   */
  private validateGetArgs(args: GetTemplateArgs): void {
    // 验证名称
    if (!args.name || typeof args.name !== 'string') {
      throw ErrorFactory.invalidInput('name', 'name must be a non-empty string');
    }

    if (args.name.trim().length === 0) {
      throw ErrorFactory.invalidInput('name', 'name cannot be empty or whitespace only');
    }

    // 验证命名空间（如果提供）
    if (args.namespace !== undefined) {
      if (typeof args.namespace !== 'string' || args.namespace.trim().length === 0) {
        throw ErrorFactory.invalidInput('namespace', 'namespace must be a non-empty string');
      }
    }
  }

  /**
   * 验证删除模板的参数
   * 
   * @param args - 删除模板的参数
   * @throws MCPError 如果参数无效
   */
  private validateDeleteArgs(args: DeleteTemplateArgs): void {
    // 验证名称
    if (!args.name || typeof args.name !== 'string') {
      throw ErrorFactory.invalidInput('name', 'name must be a non-empty string');
    }

    if (args.name.trim().length === 0) {
      throw ErrorFactory.invalidInput('name', 'name cannot be empty or whitespace only');
    }

    // 验证命名空间（如果提供）
    if (args.namespace !== undefined) {
      if (typeof args.namespace !== 'string' || args.namespace.trim().length === 0) {
        throw ErrorFactory.invalidInput('namespace', 'namespace must be a non-empty string');
      }
    }
  }
}
