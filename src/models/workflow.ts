/**
 * Workflow 数据模型
 * 
 * 定义 Argo Workflow 实例的类型结构
 */

import { Arguments, Parameter } from './workflow-template.js';

/**
 * Workflow 接口
 * 表示 Argo Workflow 的运行实例
 */
export interface Workflow {
  apiVersion: 'argoproj.io/v1alpha1';
  kind: 'Workflow';
  metadata: WorkflowMetadata;
  spec: WorkflowSpec;
  status?: WorkflowStatus;
}

/**
 * Workflow 元数据
 */
export interface WorkflowMetadata {
  name: string;
  namespace: string;
  generateName?: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * Workflow 规范
 */
export interface WorkflowSpec {
  workflowTemplateRef?: WorkflowTemplateRef;
  arguments?: Arguments;
  serviceAccountName?: string;
  entrypoint?: string;
  templates?: any[];
}

/**
 * WorkflowTemplate 引用
 */
export interface WorkflowTemplateRef {
  name: string;
}

/**
 * Workflow 状态
 */
export interface WorkflowStatus {
  phase: WorkflowPhase;
  startedAt?: string;
  finishedAt?: string;
  progress?: string;
  message?: string;
  nodes?: Record<string, NodeStatus>;
  conditions?: Condition[];
  resourcesDuration?: Record<string, number>;
}

/**
 * Workflow 阶段枚举
 */
export enum WorkflowPhase {
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Error = 'Error',
  Skipped = 'Skipped',
  Omitted = 'Omitted',
}

/**
 * 节点状态
 */
export interface NodeStatus {
  id: string;
  name: string;
  displayName: string;
  type: string;
  phase: string;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  templateName?: string;
  templateScope?: string;
  inputs?: NodeInputs;
  outputs?: NodeOutputs;
  children?: string[];
  outboundNodes?: string[];
}

/**
 * 节点输入
 */
export interface NodeInputs {
  parameters?: Parameter[];
}

/**
 * 节点输出
 */
export interface NodeOutputs {
  parameters?: Parameter[];
  artifacts?: any[];
  result?: string;
  exitCode?: string;
}

/**
 * 条件
 */
export interface Condition {
  type: string;
  status: string;
  message?: string;
  lastTransitionTime?: string;
}

/**
 * Workflow 列表项
 * 用于列表查询时的简化信息
 */
export interface WorkflowListItem {
  name: string;
  namespace: string;
  phase: WorkflowPhase;
  createdAt: string;
  finishedAt?: string;
  progress?: string;
}
