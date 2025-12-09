/**
 * Argo Server 客户端模块
 * 
 * 封装与 Argo Server HTTP REST API 的交互，提供 Argo Workflow 资源的 CRUD 操作
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import winston from 'winston';
import { WorkflowTemplate } from '../models/workflow-template.js';
import { Workflow, WorkflowPhase } from '../models/workflow.js';
import { ErrorFactory } from '../models/errors.js';

/**
 * Argo Server 客户端配置接口
 */
export interface ArgoClientConfig {
  /** Argo Server 基础 URL */
  baseUrl: string;
  /** 认证 token（可选） */
  token?: string;
  /** 是否跳过 TLS 证书验证（仅用于开发环境） */
  insecure?: boolean;
  /** 默认命名空间 */
  namespace?: string;
}

/**
 * Argo Server 客户端类
 * 
 * 提供与 Argo Server REST API 交互的方法，管理 Argo Workflow 资源
 */
export class ArgoClient {
  private httpClient: AxiosInstance;
  private logger: winston.Logger;
  private defaultNamespace: string;

  /**
   * 创建 ArgoClient 实例
   * 
   * @param config - Argo Server 客户端配置
   * @param logger - Winston 日志记录器
   */
  constructor(config: ArgoClientConfig, logger: winston.Logger) {
    this.logger = logger;
    this.defaultNamespace = config.namespace || 'argo';

    // 创建 axios 实例
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.token && { 'Authorization': `Bearer ${config.token}` }),
      },
      // 如果启用不安全模式，跳过 TLS 证书验证
      ...(config.insecure && {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    });

    // 添加响应拦截器用于错误处理
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleHttpError(error));
      }
    );
  }

  /**
   * 初始化 Argo Server 客户端
   * 
   * 验证与 Argo Server 的连接
   */
  async initialize(): Promise<void> {
    this.logger.info('初始化 Argo Server 客户端...', {
      baseUrl: this.httpClient.defaults.baseURL,
      defaultNamespace: this.defaultNamespace,
    });

    try {
      // 验证连接：尝试列出 WorkflowTemplates
      await this.httpClient.get(`/api/v1/workflow-templates/${this.defaultNamespace}`);
      this.logger.info('成功连接到 Argo Server');
    } catch (error) {
      // 如果是 404 错误，说明连接成功但命名空间可能不存在或没有模板
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.info('成功连接到 Argo Server（命名空间可能为空）');
        return;
      }
      
      this.logger.error('无法连接到 Argo Server', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ========== WorkflowTemplate 操作 ==========

  /**
   * 创建 Workflow Template
   * 
   * @param name - 模板名称
   * @param namespace - 命名空间
   * @param spec - 模板规范
   * @returns 创建的模板
   */
  async createWorkflowTemplate(
    name: string,
    namespace: string,
    spec: unknown
  ): Promise<WorkflowTemplate> {
    this.logger.info('创建 Workflow Template', { name, namespace });

    try {
      const template: WorkflowTemplate = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'WorkflowTemplate',
        metadata: {
          name,
          namespace,
        },
        spec: spec as WorkflowTemplate['spec'],
      };

      const response = await this.httpClient.post<WorkflowTemplate>(
        `/api/v1/workflow-templates/${namespace}`,
        { template }
      );

      this.logger.info('成功创建 Workflow Template', { name, namespace });
      return response.data;
    } catch (error) {
      this.logger.error('创建 Workflow Template 失败', {
        name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取 Workflow Template
   * 
   * @param name - 模板名称
   * @param namespace - 命名空间
   * @returns 模板详情
   */
  async getWorkflowTemplate(
    name: string,
    namespace: string
  ): Promise<WorkflowTemplate> {
    this.logger.info('获取 Workflow Template', { name, namespace });

    try {
      const response = await this.httpClient.get<WorkflowTemplate>(
        `/api/v1/workflow-templates/${namespace}/${name}`
      );

      this.logger.info('成功获取 Workflow Template', { name, namespace });
      return response.data;
    } catch (error) {
      this.logger.error('获取 Workflow Template 失败', {
        name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 列出 Workflow Templates
   * 
   * @param namespace - 命名空间（可选，不指定则列出所有命名空间）
   * @returns 模板列表
   */
  async listWorkflowTemplates(namespace?: string): Promise<WorkflowTemplate[]> {
    const ns = namespace || this.defaultNamespace;
    this.logger.info('列出 Workflow Templates', { namespace: ns });

    try {
      const response = await this.httpClient.get<{ items: WorkflowTemplate[] }>(
        `/api/v1/workflow-templates/${ns}`
      );

      this.logger.info('成功列出 Workflow Templates', {
        namespace: ns,
        count: response.data.items?.length || 0,
      });
      return response.data.items || [];
    } catch (error) {
      this.logger.error('列出 Workflow Templates 失败', {
        namespace: ns,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 删除 Workflow Template
   * 
   * @param name - 模板名称
   * @param namespace - 命名空间
   */
  async deleteWorkflowTemplate(name: string, namespace: string): Promise<void> {
    this.logger.info('删除 Workflow Template', { name, namespace });

    try {
      await this.httpClient.delete(
        `/api/v1/workflow-templates/${namespace}/${name}`
      );

      this.logger.info('成功删除 Workflow Template', { name, namespace });
    } catch (error) {
      this.logger.error('删除 Workflow Template 失败', {
        name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ========== Workflow 操作 ==========

  /**
   * 提交 Workflow（从模板创建工作流实例）
   * 
   * @param templateName - 模板名称
   * @param namespace - 命名空间
   * @param parameters - 运行参数（可选）
   * @param generateName - 工作流名称前缀（可选）
   * @returns 创建的工作流
   */
  async submitWorkflow(
    templateName: string,
    namespace: string,
    parameters?: Record<string, string>,
    generateName?: string
  ): Promise<Workflow> {
    this.logger.info('提交 Workflow', { templateName, namespace });

    try {
      const workflowName = generateName || `${templateName}-${Date.now()}`;
      const workflow: Partial<Workflow> = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: {
          name: workflowName,
          namespace,
          ...(generateName && { generateName }),
        },
        spec: {
          workflowTemplateRef: {
            name: templateName,
          },
          ...(parameters && {
            arguments: {
              parameters: Object.entries(parameters).map(([name, value]) => ({
                name,
                value,
              })),
            },
          }),
        },
      };

      const response = await this.httpClient.post<Workflow>(
        `/api/v1/workflows/${namespace}`,
        { workflow }
      );

      this.logger.info('成功提交 Workflow', {
        name: response.data.metadata.name,
        namespace,
      });
      return response.data;
    } catch (error) {
      this.logger.error('提交 Workflow 失败', {
        templateName,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取 Workflow
   * 
   * @param name - 工作流名称
   * @param namespace - 命名空间
   * @returns 工作流详情
   */
  async getWorkflow(name: string, namespace: string): Promise<Workflow> {
    this.logger.info('获取 Workflow', { name, namespace });

    try {
      const response = await this.httpClient.get<Workflow>(
        `/api/v1/workflows/${namespace}/${name}`
      );

      this.logger.info('成功获取 Workflow', { name, namespace });
      return response.data;
    } catch (error) {
      this.logger.error('获取 Workflow 失败', {
        name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 列出 Workflows
   * 
   * @param namespace - 命名空间（可选）
   * @param phase - 工作流阶段过滤（可选）
   * @returns 工作流列表
   */
  async listWorkflows(
    namespace?: string,
    phase?: WorkflowPhase
  ): Promise<Workflow[]> {
    const ns = namespace || this.defaultNamespace;
    this.logger.info('列出 Workflows', { namespace: ns, phase });

    try {
      const params: Record<string, string> = {};
      if (phase) {
        params.phase = phase;
      }

      const response = await this.httpClient.get<{ items: Workflow[] }>(
        `/api/v1/workflows/${ns}`,
        { params }
      );

      this.logger.info('成功列出 Workflows', {
        namespace: ns,
        count: response.data.items?.length || 0,
      });
      return response.data.items || [];
    } catch (error) {
      this.logger.error('列出 Workflows 失败', {
        namespace: ns,
        phase,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 删除 Workflow
   * 
   * @param name - 工作流名称
   * @param namespace - 命名空间
   */
  async deleteWorkflow(name: string, namespace: string): Promise<void> {
    this.logger.info('删除 Workflow', { name, namespace });

    try {
      await this.httpClient.delete(
        `/api/v1/workflows/${namespace}/${name}`
      );

      this.logger.info('成功删除 Workflow', { name, namespace });
    } catch (error) {
      this.logger.error('删除 Workflow 失败', {
        name,
        namespace,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理 HTTP 错误
   * 
   * 将 Axios 错误转换为 MCPError
   * 
   * @param error - Axios 错误
   * @returns MCPError
   */
  private handleHttpError(error: AxiosError): Error {
    if (!error.response) {
      // 网络错误或连接失败
      return ErrorFactory.connectionError(
        `Failed to connect to Argo Server: ${error.message}`
      );
    }

    const status = error.response.status;
    const data = error.response.data as { message?: string } | undefined;
    const message = data?.message || error.message;

    switch (status) {
      case 404:
        return ErrorFactory.notFound('resource', 'unknown', this.defaultNamespace);
      
      case 409:
        return ErrorFactory.alreadyExists('resource', 'unknown', this.defaultNamespace);
      
      case 400:
        return ErrorFactory.validationError('Invalid request', [message]);
      
      case 401:
      case 403:
        return ErrorFactory.authorizationError(
          'Insufficient permissions or invalid credentials',
          [message]
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorFactory.internalError('Argo Server error', new Error(message));
      
      default:
        return ErrorFactory.internalError(`HTTP ${status} error`, new Error(message));
    }
  }
}
