/**
 * Workflow 工具处理器验证器
 * 
 * 提供输入参数验证功能
 */

import { ErrorFactory } from '../models/errors.js';
import { WorkflowPhase } from '../models/workflow.js';
import {
  SubmitWorkflowArgs,
  GetWorkflowStatusArgs,
  ListWorkflowsArgs,
  DeleteWorkflowArgs,
} from './workflow-tool-handler-types.js';

/**
 * 验证提交工作流的参数
 * 
 * @param args - 提交工作流的参数
 * @throws MCPError 如果参数无效
 */
export function validateSubmitArgs(args: SubmitWorkflowArgs): void {
  // 验证模板名称
  if (!args.template_name || typeof args.template_name !== 'string') {
    throw ErrorFactory.invalidInput('template_name', 'template_name must be a non-empty string');
  }

  if (args.template_name.trim().length === 0) {
    throw ErrorFactory.invalidInput('template_name', 'template_name cannot be empty or whitespace only');
  }

  // 验证命名空间（如果提供）
  if (args.namespace !== undefined) {
    if (typeof args.namespace !== 'string' || args.namespace.trim().length === 0) {
      throw ErrorFactory.invalidInput('namespace', 'namespace must be a non-empty string');
    }
  }

  // 验证参数（如果提供）
  if (args.parameters !== undefined) {
    if (typeof args.parameters !== 'object' || args.parameters === null) {
      throw ErrorFactory.invalidInput('parameters', 'parameters must be an object');
    }

    // 验证参数值都是字符串
    for (const [key, value] of Object.entries(args.parameters)) {
      if (typeof value !== 'string') {
        throw ErrorFactory.invalidInput(
          'parameters',
          `parameter '${key}' must be a string, got ${typeof value}`
        );
      }
    }
  }

  // 验证 generate_name（如果提供）
  if (args.generate_name !== undefined) {
    if (typeof args.generate_name !== 'string' || args.generate_name.trim().length === 0) {
      throw ErrorFactory.invalidInput('generate_name', 'generate_name must be a non-empty string');
    }
  }
}

/**
 * 验证获取工作流状态的参数
 * 
 * @param args - 获取工作流状态的参数
 * @throws MCPError 如果参数无效
 */
export function validateGetStatusArgs(args: GetWorkflowStatusArgs): void {
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
 * 验证列出工作流的参数
 * 
 * @param args - 列出工作流的参数
 * @throws MCPError 如果参数无效
 */
export function validateListArgs(args: ListWorkflowsArgs): void {
  // 验证命名空间（如果提供）
  if (args.namespace !== undefined) {
    if (typeof args.namespace !== 'string' || args.namespace.trim().length === 0) {
      throw ErrorFactory.invalidInput('namespace', 'namespace must be a non-empty string');
    }
  }

  // 验证 phase（如果提供）
  if (args.phase !== undefined) {
    if (typeof args.phase !== 'string' || args.phase.trim().length === 0) {
      throw ErrorFactory.invalidInput('phase', 'phase must be a non-empty string');
    }

    // 验证 phase 是否为有效值
    const validPhases = Object.values(WorkflowPhase);
    if (!validPhases.includes(args.phase as WorkflowPhase)) {
      throw ErrorFactory.invalidInput(
        'phase',
        `phase must be one of: ${validPhases.join(', ')}`
      );
    }
  }
}

/**
 * 验证删除工作流的参数
 * 
 * @param args - 删除工作流的参数
 * @throws MCPError 如果参数无效
 */
export function validateDeleteArgs(args: DeleteWorkflowArgs): void {
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
 * 解析工作流阶段字符串
 * 
 * @param phase - 阶段字符串
 * @returns WorkflowPhase 枚举值
 * @throws MCPError 如果阶段无效
 */
export function parseWorkflowPhase(phase: string): WorkflowPhase {
  const validPhases = Object.values(WorkflowPhase);
  if (validPhases.includes(phase as WorkflowPhase)) {
    return phase as WorkflowPhase;
  }

  throw ErrorFactory.invalidInput(
    'phase',
    `Invalid phase '${phase}'. Must be one of: ${validPhases.join(', ')}`
  );
}
