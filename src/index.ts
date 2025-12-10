#!/usr/bin/env node
/**
 * Argo Workflow MCP Server 主入口文件
 * 
 * 该服务器为 AI Agent 提供管理 Argo Workflow 的 MCP 协议接口
 */

import { Command } from 'commander';
import winston from 'winston';
import { ArgoClient, ArgoClientConfig } from './services/index.js';
import { MCPServer } from './mcp-server.js';

// 配置日志级别和格式
// 重要：MCP stdio 传输要求 stdout 只能用于 JSON-RPC 消息
// 所有日志必须输出到 stderr
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'argo-workflow-mcp-server' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug', 'verbose', 'silly'],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      ),
    }),
  ],
});

// 全局变量用于优雅关闭
let isShuttingDown = false;

/**
 * 优雅关闭处理函数
 * 
 * 确保所有资源正确释放
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('已经在关闭过程中，忽略重复信号');
    return;
  }

  isShuttingDown = true;
  logger.info(`收到 ${signal} 信号，开始优雅关闭...`);

  try {
    logger.info('优雅关闭完成');
    process.exit(0);
  } catch (error) {
    logger.error('优雅关闭过程中发生错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

/**
 * 解析命令行参数
 */
function parseCommandLineArgs() {
  const program = new Command();

  program
    .name('argo-workflow-mcp-server')
    .description('MCP Server for managing Argo Workflows')
    .version('1.0.0')
    .requiredOption(
      '--argo-server <url>',
      'Argo Server URL (e.g., https://argo-server.example.com)'
    )
    .option(
      '--argo-token <token>',
      'Argo Server authentication token'
    )
    .option(
      '--argo-insecure',
      'Skip TLS certificate verification (for development only)',
      false
    )
    .option(
      '--namespace <name>',
      'Default namespace for Argo Workflows',
      'argo'
    )
    .option(
      '--log-level <level>',
      'Log level (error, warn, info, debug)',
      'info'
    )
    .parse(process.argv);

  return program.opts();
}

/**
 * 主函数
 * 
 * 初始化并启动 MCP Server 和健康检查服务器
 */
async function main() {
  // 解析命令行参数
  const options = parseCommandLineArgs();

  // 更新日志级别
  logger.level = options.logLevel;

  logger.info('Argo Workflow MCP Server 启动中...', {
    argoServer: options.argoServer,
    namespace: options.namespace,
    insecure: options.argoInsecure,
    logLevel: options.logLevel,
    nodeVersion: process.version,
    platform: process.platform,
  });
  
  try {
    // 初始化 Argo Server 客户端
    logger.info('正在初始化 Argo Server 客户端...');
    const argoConfig: ArgoClientConfig = {
      baseUrl: options.argoServer,
      token: options.argoToken,
      insecure: options.argoInsecure,
      namespace: options.namespace,
    };
    const argoClient = new ArgoClient(argoConfig, logger);
    await argoClient.initialize();
    logger.info('Argo Server 客户端初始化成功');
    
    // 初始化 MCP Server
    logger.info('正在初始化 MCP Server...');
    const mcpServer = new MCPServer(argoClient, logger);
    await mcpServer.initialize();
    logger.info('MCP Server 初始化成功');
    
    // 启动 MCP Server（这会阻塞直到服务器关闭）
    logger.info('正在启动 MCP Server...');
    await mcpServer.start();
    logger.info('Argo Workflow MCP Server 已完全启动');
  } catch (error) {
    logger.error('服务器启动失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    throw error;
  }
}

// 启动服务器
main().catch((error) => {
  logger.error('致命错误，服务器无法启动', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});

// 注册优雅关闭处理器
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown('uncaughtException');
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('未处理的 Promise 拒绝', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  gracefulShutdown('unhandledRejection');
});
