/**
 * 数据模型单元测试
 * 
 * 验证数据模型的基本功能
 */

import {
  WorkflowTemplate,
  Workflow,
  WorkflowPhase,
  ErrorType,
  MCPError,
  ErrorFactory,
  MCPToolName,
  JSONRPC_VERSION,
} from './index.js';

describe('数据模型测试', () => {
  describe('WorkflowTemplate 类型', () => {
    it('应该能够创建有效的 WorkflowTemplate 对象', () => {
      const template: WorkflowTemplate = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'WorkflowTemplate',
        metadata: {
          name: 'test-template',
          namespace: 'default',
        },
        spec: {
          templates: [
            {
              name: 'main',
              container: {
                image: 'alpine:latest',
                command: ['echo', 'hello'],
              },
            },
          ],
          entrypoint: 'main',
        },
      };

      expect(template.metadata.name).toBe('test-template');
      expect(template.spec.templates).toHaveLength(1);
    });
  });

  describe('Workflow 类型', () => {
    it('应该能够创建有效的 Workflow 对象', () => {
      const workflow: Workflow = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: {
          name: 'test-workflow',
          namespace: 'default',
        },
        spec: {
          workflowTemplateRef: {
            name: 'test-template',
          },
        },
        status: {
          phase: WorkflowPhase.Running,
          startedAt: '2024-01-01T00:00:00Z',
        },
      };

      expect(workflow.metadata.name).toBe('test-workflow');
      expect(workflow.status?.phase).toBe(WorkflowPhase.Running);
    });
  });

  describe('MCPError 类', () => {
    it('应该能够创建 MCPError 实例', () => {
      const error = new MCPError(
        ErrorType.NOT_FOUND,
        'Resource not found',
        { resource: 'WorkflowTemplate' }
      );

      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.details).toEqual({ resource: 'WorkflowTemplate' });
    });

    it('应该能够转换为 MCP 响应格式', () => {
      const error = new MCPError(
        ErrorType.INVALID_INPUT,
        'Invalid input',
        { field: 'name' }
      );

      const response = error.toMCPResponse();

      expect(response.error_type).toBe(ErrorType.INVALID_INPUT);
      expect(response.message).toBe('Invalid input');
      expect(response.details).toEqual({ field: 'name' });
    });

    it('应该能够转换为 JSON-RPC 错误格式', () => {
      const error = new MCPError(
        ErrorType.NOT_FOUND,
        'Resource not found'
      );

      const jsonRpcError = error.toJSONRPCError();

      expect(jsonRpcError.code).toBe(-32001);
      expect(jsonRpcError.message).toBe('Resource not found');
      expect(jsonRpcError.data.error_type).toBe(ErrorType.NOT_FOUND);
    });
  });

  describe('ErrorFactory 类', () => {
    it('应该能够创建 notFound 错误', () => {
      const error = ErrorFactory.notFound(
        'WorkflowTemplate',
        'test-template',
        'default'
      );

      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.message).toContain('test-template');
      expect(error.message).toContain('default');
    });

    it('应该能够创建 alreadyExists 错误', () => {
      const error = ErrorFactory.alreadyExists(
        'WorkflowTemplate',
        'test-template',
        'default'
      );

      expect(error.type).toBe(ErrorType.ALREADY_EXISTS);
      expect(error.message).toContain('already exists');
    });

    it('应该能够创建 invalidInput 错误', () => {
      const error = ErrorFactory.invalidInput('name', 'cannot be empty');

      expect(error.type).toBe(ErrorType.INVALID_INPUT);
      expect(error.message).toContain('name');
      expect(error.message).toContain('cannot be empty');
    });

    it('应该能够创建 validationError 错误', () => {
      const error = ErrorFactory.validationError('Validation failed', [
        { field: 'name', message: 'required' },
      ]);

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.details.errors).toHaveLength(1);
    });

    it('应该能够创建 connectionError 错误', () => {
      const error = ErrorFactory.connectionError('Connection refused');

      expect(error.type).toBe(ErrorType.CONNECTION_ERROR);
      expect(error.message).toContain('Kubernetes API');
    });

    it('应该能够创建 authorizationError 错误', () => {
      const error = ErrorFactory.authorizationError('create workflow', [
        'workflows.create',
      ]);

      expect(error.type).toBe(ErrorType.AUTHORIZATION_ERROR);
      expect(error.message).toContain('Insufficient permissions');
      expect(error.details.requiredPermissions).toContain('workflows.create');
    });

    it('应该能够创建 internalError 错误', () => {
      const originalError = new Error('Original error');
      const error = ErrorFactory.internalError('Internal error', originalError);

      expect(error.type).toBe(ErrorType.INTERNAL_ERROR);
      expect(error.details.originalError).toBe('Original error');
    });
  });

  describe('MCP 协议类型', () => {
    it('应该定义正确的 JSONRPC 版本', () => {
      expect(JSONRPC_VERSION).toBe('2.0');
    });

    it('应该定义所有工具名称', () => {
      expect(MCPToolName.CREATE_WORKFLOW_TEMPLATE).toBe('create_workflow_template');
      expect(MCPToolName.GET_WORKFLOW_TEMPLATE).toBe('get_workflow_template');
      expect(MCPToolName.LIST_WORKFLOW_TEMPLATES).toBe('list_workflow_templates');
      expect(MCPToolName.DELETE_WORKFLOW_TEMPLATE).toBe('delete_workflow_template');
      expect(MCPToolName.SUBMIT_WORKFLOW).toBe('submit_workflow');
      expect(MCPToolName.GET_WORKFLOW_STATUS).toBe('get_workflow_status');
      expect(MCPToolName.LIST_WORKFLOWS).toBe('list_workflows');
      expect(MCPToolName.DELETE_WORKFLOW).toBe('delete_workflow');
    });
  });

  describe('WorkflowPhase 枚举', () => {
    it('应该定义所有工作流阶段', () => {
      expect(WorkflowPhase.Pending).toBe('Pending');
      expect(WorkflowPhase.Running).toBe('Running');
      expect(WorkflowPhase.Succeeded).toBe('Succeeded');
      expect(WorkflowPhase.Failed).toBe('Failed');
      expect(WorkflowPhase.Error).toBe('Error');
      expect(WorkflowPhase.Skipped).toBe('Skipped');
      expect(WorkflowPhase.Omitted).toBe('Omitted');
    });
  });

  describe('ErrorType 枚举', () => {
    it('应该定义所有错误类型', () => {
      expect(ErrorType.NOT_FOUND).toBe('NotFound');
      expect(ErrorType.ALREADY_EXISTS).toBe('AlreadyExists');
      expect(ErrorType.INVALID_INPUT).toBe('InvalidInput');
      expect(ErrorType.VALIDATION_ERROR).toBe('ValidationError');
      expect(ErrorType.CONNECTION_ERROR).toBe('ConnectionError');
      expect(ErrorType.AUTHORIZATION_ERROR).toBe('AuthorizationError');
      expect(ErrorType.INTERNAL_ERROR).toBe('InternalError');
      expect(ErrorType.TIMEOUT_ERROR).toBe('TimeoutError');
      expect(ErrorType.NETWORK_ERROR).toBe('NetworkError');
      expect(ErrorType.AUTHENTICATION_ERROR).toBe('AuthenticationError');
    });
  });
});
