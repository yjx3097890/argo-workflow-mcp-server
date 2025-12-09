/**
 * MCP 工具定义
 * 
 * 定义所有可用的 Argo Workflow 管理工具
 */

import { ToolDefinition } from './models/mcp-protocol.js';

/**
 * 所有工具的定义列表
 */
export const toolDefinitions: ToolDefinition[] = [
  // WorkflowTemplate 工具
  {
    name: 'create_workflow_template',
    description: '创建新的 Workflow Template',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '模板名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
        spec: {
          type: 'object',
          description: '模板规范（JSON 格式的 Argo WorkflowTemplate spec）',
        },
      },
      required: ['name', 'spec'],
    },
  },
  {
    name: 'get_workflow_template',
    description: '查询指定的 Workflow Template',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '模板名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_workflow_templates',
    description: '列出所有 Workflow Template',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: '命名空间过滤（可选，不指定则列出所有命名空间）',
        },
      },
    },
  },
  {
    name: 'delete_workflow_template',
    description: '删除指定的 Workflow Template',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '模板名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
      },
      required: ['name'],
    },
  },

  // Workflow 工具
  {
    name: 'submit_workflow',
    description: '运行指定的 Workflow Template',
    inputSchema: {
      type: 'object',
      properties: {
        template_name: {
          type: 'string',
          description: '模板名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
        parameters: {
          type: 'object',
          description: '运行参数（可选）',
        },
        generate_name: {
          type: 'string',
          description: '工作流名称前缀（可选）',
        },
      },
      required: ['template_name'],
    },
  },
  {
    name: 'get_workflow_status',
    description: '查询 Workflow 运行状态',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '工作流名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_workflows',
    description: '列出所有 Workflow',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: '命名空间过滤（可选）',
        },
        phase: {
          type: 'string',
          description: '状态过滤（可选）',
          enum: ['Pending', 'Running', 'Succeeded', 'Failed', 'Error'],
        },
      },
    },
  },
  {
    name: 'delete_workflow',
    description: '删除指定的 Workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '工作流名称',
        },
        namespace: {
          type: 'string',
          description: '命名空间（可选，默认为 "argo"）',
          default: 'argo',
        },
      },
      required: ['name'],
    },
  },
];
