/**
 * 健康检查服务器模块
 * 
 * 提供 HTTP 端点用于健康检查和就绪检查
 */

import express, { Request, Response } from 'express';
import { Server } from 'http';
import winston from 'winston';

/**
 * 健康状态枚举
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
}

/**
 * 就绪状态枚举
 */
export enum ReadyStatus {
  READY = 'ready',
  NOT_READY = 'not_ready',
}

/**
 * 健康检查服务器类
 * 
 * 提供 /health 和 /ready 端点
 */
export class HealthServer {
  private app: express.Application;
  private server: Server | null = null;
  private isReady: boolean = false;
  private isHealthy: boolean = true;

  /**
   * 创建健康检查服务器实例
   * 
   * @param port - 监听端口
   * @param logger - 日志记录器
   */
  constructor(
    private port: number,
    private logger: winston.Logger
  ) {
    this.app = express();
    this.setupRoutes();
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查端点
    this.app.get('/health', (_req: Request, res: Response) => {
      this.logger.debug('收到健康检查请求');
      
      if (this.isHealthy) {
        res.status(200).json({
          status: HealthStatus.HEALTHY,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: HealthStatus.UNHEALTHY,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 就绪检查端点
    this.app.get('/ready', (_req: Request, res: Response) => {
      this.logger.debug('收到就绪检查请求');
      
      if (this.isReady) {
        res.status(200).json({
          status: ReadyStatus.READY,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: ReadyStatus.NOT_READY,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 根路径
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).json({
        name: 'Argo Workflow MCP Server',
        version: '1.0.0',
        status: this.isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        ready: this.isReady ? ReadyStatus.READY : ReadyStatus.NOT_READY,
      });
    });
  }

  /**
   * 启动健康检查服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          this.logger.info(`健康检查服务器已启动，监听端口 ${this.port}`);
          resolve();
        });

        this.server.on('error', (error) => {
          this.logger.error('健康检查服务器错误', { error: error.message });
          reject(error);
        });
      } catch (error) {
        this.logger.error('启动健康检查服务器失败', {
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
  }

  /**
   * 停止健康检查服务器
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((error) => {
          if (error) {
            this.logger.error('关闭健康检查服务器失败', { error: error.message });
            reject(error);
          } else {
            this.logger.info('健康检查服务器已关闭');
            resolve();
          }
        });
      });
    }
  }

  /**
   * 设置就绪状态
   * 
   * @param ready - 是否就绪
   */
  setReady(ready: boolean): void {
    this.isReady = ready;
    this.logger.info(`就绪状态已更新: ${ready ? 'ready' : 'not_ready'}`);
  }

  /**
   * 设置健康状态
   * 
   * @param healthy - 是否健康
   */
  setHealthy(healthy: boolean): void {
    this.isHealthy = healthy;
    this.logger.info(`健康状态已更新: ${healthy ? 'healthy' : 'unhealthy'}`);
  }

  /**
   * 获取就绪状态
   */
  getReady(): boolean {
    return this.isReady;
  }

  /**
   * 获取健康状态
   */
  getHealthy(): boolean {
    return this.isHealthy;
  }
}
