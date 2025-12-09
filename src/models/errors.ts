/**
 * 错误类型定义
 * 
 * 定义 MCP Server 使用的错误类型和错误处理类
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 资源未找到 */
  NOT_FOUND = 'NotFound',
  /** 资源已存在 */
  ALREADY_EXISTS = 'AlreadyExists',
  /** 无效输入 */
  INVALID_INPUT = 'InvalidInput',
  /** 验证错误 */
  VALIDATION_ERROR = 'ValidationError',
  /** 连接错误 */
  CONNECTION_ERROR = 'ConnectionError',
  /** 授权错误 */
  AUTHORIZATION_ERROR = 'AuthorizationError',
  /** 内部错误 */
  INTERNAL_ERROR = 'InternalError',
  /** 超时错误 */
  TIMEOUT_ERROR = 'TimeoutError',
  /** 网络错误 */
  NETWORK_ERROR = 'NetworkError',
  /** 认证错误 */
  AUTHENTICATION_ERROR = 'AuthenticationError',
}

/**
 * MCP 错误类
 * 
 * 统一的错误处理类，用于封装各种错误情况
 */
export class MCPError extends Error {
  /**
   * 创建 MCP 错误实例
   * 
   * @param type - 错误类型
   * @param message - 错误消息
   * @param details - 错误详细信息（可选）
   */
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'MCPError';
    
    // 维护正确的原型链
    Object.setPrototypeOf(this, MCPError.prototype);
  }

  /**
   * 转换为 MCP 协议响应格式
   * 
   * @returns MCP 错误响应对象
   */
  toMCPResponse(): MCPErrorResponse {
    return {
      error_type: this.type,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * 转换为 JSON-RPC 错误格式
   * 
   * @returns JSON-RPC 错误对象
   */
  toJSONRPCError(): JSONRPCError {
    return {
      code: this.getErrorCode(),
      message: this.message,
      data: {
        error_type: this.type,
        details: this.details,
      },
    };
  }

  /**
   * 获取错误代码
   * 
   * @returns JSON-RPC 错误代码
   */
  private getErrorCode(): number {
    switch (this.type) {
      case ErrorType.NOT_FOUND:
        return -32001;
      case ErrorType.ALREADY_EXISTS:
        return -32002;
      case ErrorType.INVALID_INPUT:
        return -32003;
      case ErrorType.VALIDATION_ERROR:
        return -32004;
      case ErrorType.CONNECTION_ERROR:
        return -32005;
      case ErrorType.AUTHORIZATION_ERROR:
        return -32006;
      case ErrorType.AUTHENTICATION_ERROR:
        return -32007;
      case ErrorType.TIMEOUT_ERROR:
        return -32008;
      case ErrorType.NETWORK_ERROR:
        return -32009;
      case ErrorType.INTERNAL_ERROR:
      default:
        return -32000;
    }
  }
}

/**
 * MCP 错误响应接口
 */
export interface MCPErrorResponse {
  error_type: ErrorType;
  message: string;
  details?: any;
}

/**
 * JSON-RPC 错误接口
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * 错误工厂函数
 */
export class ErrorFactory {
  /**
   * 创建资源未找到错误
   */
  static notFound(resource: string, name: string, namespace: string): MCPError {
    return new MCPError(
      ErrorType.NOT_FOUND,
      `${resource} '${name}' not found in namespace '${namespace}'`,
      { resource, name, namespace }
    );
  }

  /**
   * 创建资源已存在错误
   */
  static alreadyExists(resource: string, name: string, namespace: string): MCPError {
    return new MCPError(
      ErrorType.ALREADY_EXISTS,
      `${resource} '${name}' already exists in namespace '${namespace}'`,
      { resource, name, namespace }
    );
  }

  /**
   * 创建无效输入错误
   */
  static invalidInput(field: string, reason: string): MCPError {
    return new MCPError(
      ErrorType.INVALID_INPUT,
      `Invalid input for field '${field}': ${reason}`,
      { field, reason }
    );
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string, errors?: any[]): MCPError {
    return new MCPError(
      ErrorType.VALIDATION_ERROR,
      message,
      { errors }
    );
  }

  /**
   * 创建连接错误
   */
  static connectionError(message: string): MCPError {
    return new MCPError(
      ErrorType.CONNECTION_ERROR,
      `Failed to connect to Kubernetes API: ${message}`
    );
  }

  /**
   * 创建授权错误
   */
  static authorizationError(action: string, requiredPermissions?: string[]): MCPError {
    return new MCPError(
      ErrorType.AUTHORIZATION_ERROR,
      `Insufficient permissions to ${action}`,
      { requiredPermissions }
    );
  }

  /**
   * 创建内部错误
   */
  static internalError(message: string, originalError?: Error): MCPError {
    return new MCPError(
      ErrorType.INTERNAL_ERROR,
      message,
      { originalError: originalError?.message }
    );
  }
}
