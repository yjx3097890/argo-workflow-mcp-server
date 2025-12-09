/**
 * WorkflowTemplate 数据模型
 * 
 * 定义 Argo Workflow Template 的类型结构
 */

/**
 * WorkflowTemplate 接口
 * 表示 Argo Workflow 的模板定义
 */
export interface WorkflowTemplate {
  apiVersion: 'argoproj.io/v1alpha1';
  kind: 'WorkflowTemplate';
  metadata: WorkflowTemplateMetadata;
  spec: WorkflowTemplateSpec;
}

/**
 * WorkflowTemplate 元数据
 */
export interface WorkflowTemplateMetadata {
  name: string;
  namespace: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * WorkflowTemplate 规范
 */
export interface WorkflowTemplateSpec {
  templates: Template[];
  arguments?: Arguments;
  entrypoint?: string;
  serviceAccountName?: string;
  volumeClaimTemplates?: any[];
  volumes?: any[];
}

/**
 * 模板定义
 */
export interface Template {
  name: string;
  inputs?: TemplateInputs;
  outputs?: TemplateOutputs;
  container?: ContainerTemplate;
  script?: ScriptTemplate;
  steps?: StepTemplate[][];
  dag?: DAGTemplate;
  resource?: ResourceTemplate;
}

/**
 * 模板输入
 */
export interface TemplateInputs {
  parameters?: Parameter[];
  artifacts?: Artifact[];
}

/**
 * 模板输出
 */
export interface TemplateOutputs {
  parameters?: Parameter[];
  artifacts?: Artifact[];
  result?: string;
}

/**
 * 容器模板
 */
export interface ContainerTemplate {
  image: string;
  command?: string[];
  args?: string[];
  env?: EnvVar[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
}

/**
 * 脚本模板
 */
export interface ScriptTemplate {
  image: string;
  command?: string[];
  source: string;
  env?: EnvVar[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
}

/**
 * 步骤模板
 */
export interface StepTemplate {
  name: string;
  template: string;
  arguments?: Arguments;
  when?: string;
}

/**
 * DAG 模板
 */
export interface DAGTemplate {
  tasks: DAGTask[];
}

/**
 * DAG 任务
 */
export interface DAGTask {
  name: string;
  template: string;
  arguments?: Arguments;
  dependencies?: string[];
  when?: string;
}

/**
 * 资源模板
 */
export interface ResourceTemplate {
  action: string;
  manifest: string;
  successCondition?: string;
  failureCondition?: string;
}

/**
 * 参数定义
 */
export interface Parameter {
  name: string;
  value?: string;
  default?: string;
  description?: string;
}

/**
 * 工件定义
 */
export interface Artifact {
  name: string;
  path: string;
  optional?: boolean;
  s3?: S3Artifact;
  http?: HTTPArtifact;
}

/**
 * S3 工件
 */
export interface S3Artifact {
  endpoint?: string;
  bucket: string;
  key: string;
  accessKeySecret?: SecretKeySelector;
  secretKeySecret?: SecretKeySelector;
}

/**
 * HTTP 工件
 */
export interface HTTPArtifact {
  url: string;
  headers?: Header[];
}

/**
 * 环境变量
 */
export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
}

/**
 * 环境变量来源
 */
export interface EnvVarSource {
  secretKeyRef?: SecretKeySelector;
  configMapKeyRef?: ConfigMapKeySelector;
}

/**
 * Secret 键选择器
 */
export interface SecretKeySelector {
  name: string;
  key: string;
}

/**
 * ConfigMap 键选择器
 */
export interface ConfigMapKeySelector {
  name: string;
  key: string;
}

/**
 * 资源需求
 */
export interface ResourceRequirements {
  requests?: ResourceList;
  limits?: ResourceList;
}

/**
 * 资源列表
 */
export interface ResourceList {
  cpu?: string;
  memory?: string;
}

/**
 * 卷挂载
 */
export interface VolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

/**
 * HTTP 头
 */
export interface Header {
  name: string;
  value: string;
}

/**
 * 参数集合
 */
export interface Arguments {
  parameters?: Parameter[];
  artifacts?: Artifact[];
}
