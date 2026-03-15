/**
 * 批量生成编排器
 * 负责协调任务解析、执行、结果写回
 */

import { Vault, TFile, Notice } from 'obsidian';
import { TaskFileParser, TaskFileParseError } from './task-file-parser';
import { ResultWriter } from './result-writer';
import { ImageGenerator } from './image-generator';
import { HistoryManager } from './history-manager';
import {
  BatchConfig,
  BatchTask,
  BatchProgress,
  BatchResult,
  BatchHistoryRecord,
  ParsedBatchFile,
  PluginSettings,
  calculateCost,
  generateRecordId,
} from '../types';

/**
 * 批量生成器类
 */
export class BatchGenerator {
  private parser: TaskFileParser;
  private writer: ResultWriter;
  private imageGenerator: ImageGenerator;
  private historyManager: HistoryManager;
  private settings: PluginSettings;
  private vault: Vault;

  constructor(
    vault: Vault,
    imageGenerator: ImageGenerator,
    historyManager: HistoryManager,
    settings: PluginSettings
  ) {
    this.vault = vault;
    this.parser = new TaskFileParser();
    this.writer = new ResultWriter(vault);
    this.imageGenerator = imageGenerator;
    this.historyManager = historyManager;
    this.settings = settings;
  }

  /**
   * 从文件解析批量任务
   * @param file 任务文件
   * @returns 解析后的任务文件
   * @throws {TaskFileParseError} 解析失败
   */
  async parseBatchFile(file: TFile): Promise<ParsedBatchFile> {
    const content = await this.vault.read(file);
    return this.parser.parseFile(content, file);
  }

  /**
   * 执行批量生成
   * @param parsed 解析后的任务文件
   * @param onProgress 进度回调
   * @returns 批量生成结果
   */
  async executeBatch(
    parsed: ParsedBatchFile,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<BatchResult> {
    const batchId = generateRecordId();
    const startTime = new Date().toISOString();
    const tasks = parsed.tasks;

    let successCount = 0;
    let failedCount = 0;
    let totalCost = 0;

    // 初始化进度
    const progress: BatchProgress = {
      current: 0,
      total: tasks.length,
      successCount: 0,
      failedCount: 0,
    };

    // 逐个执行任务
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'generating';

      // 更新进度
      progress.current = i + 1;
      progress.currentTask = task;
      onProgress?.(progress);

      try {
        // 调用现有生成器
        const result = await this.imageGenerator.generateImage(
          task.prompt,
          task.model,
          task.resolution
        );

        // 更新任务状态
        task.status = 'success';
        task.result = {
          localPath: result.localPath,
          remoteUrl: result.remoteUrl,
        };

        successCount++;
        totalCost += calculateCost(task.model);

        // 更新进度
        progress.successCount = successCount;
        onProgress?.(progress);
      } catch (error) {
        // 更新任务状态
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : '生成失败';
        task.retryCount++;

        failedCount++;

        // 更新进度
        progress.failedCount = failedCount;
        onProgress?.(progress);

        console.error(`任务 ${i + 1} 生成失败:`, error);
      }

      // 添加延迟,避免 API 限流(每张图片间隔 500ms)
      if (i < tasks.length - 1) {
        await this.sleep(500);
      }
    }

    const endTime = new Date().toISOString();

    // 判断执行状态
    let status: 'completed' | 'partial_completed' | 'failed';
    if (failedCount === 0) {
      status = 'completed';
    } else if (successCount === 0) {
      status = 'failed';
    } else {
      status = 'partial_completed';
    }

    const result: BatchResult = {
      batchId,
      sourceFilePath: parsed.sourceFile.path,
      totalCount: tasks.length,
      successCount,
      failedCount,
      totalCost,
      tasks,
      startTime,
      endTime,
      status,
    };

    // 写回结果到文件
    if (parsed.config.auto_insert !== false) {
      try {
        await this.writer.writeBack(
          parsed.sourceFile,
          tasks,
          parsed.originalContent
        );
      } catch (error) {
        console.error('写回文件失败:', error);
        new Notice('⚠️ 写回文件失败,请检查文件权限');
      }
    }

    // 保存批量生成历史记录
    await this.saveBatchHistory(result);

    return result;
  }

  /**
   * 预估批量生成成本
   * @param tasks 任务列表
   * @returns 预估成本(元)
   */
  estimateCost(tasks: BatchTask[]): number {
    return tasks.reduce((sum, task) => sum + calculateCost(task.model), 0);
  }

  /**
   * 提取失败的任务
   * @param result 批量生成结果
   * @returns 失败任务列表
   */
  extractFailedTasks(result: BatchResult): BatchTask[] {
    return result.tasks.filter((task) => task.status === 'failed');
  }

  /**
   * 生成重试文件
   * @param failedTasks 失败的任务列表
   * @returns 重试文件内容
   */
  generateRetryContent(failedTasks: BatchTask[]): string {
    return this.writer.generateRetryContent(failedTasks);
  }

  /**
   * 保存批量生成历史记录
   * @param result 批量生成结果
   */
  private async saveBatchHistory(result: BatchResult): Promise<void> {
    const record: BatchHistoryRecord = {
      id: result.batchId,
      type: 'batch',
      timestamp: result.startTime,
      sourceFile: result.sourceFilePath,
      totalTasks: result.totalCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      totalCost: result.totalCost,
      tasks: result.tasks.map((task) => ({
        prompt: task.prompt,
        status: task.status === 'success' ? 'success' : 'failed',
        localPath: task.result?.localPath,
        error: task.error,
      })),
    };

    // 添加到历史记录
    await this.historyManager.addBatchRecord(record);
  }

  /**
   * 更新设置
   * @param settings 新设置
   */
  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.imageGenerator.updateSettings(settings);
    this.historyManager.updateSettings(settings);
  }

  /**
   * 延迟函数
   * @param ms 毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 创建批量生成器实例
 */
export function createBatchGenerator(
  vault: Vault,
  imageGenerator: ImageGenerator,
  historyManager: HistoryManager,
  settings: PluginSettings
): BatchGenerator {
  return new BatchGenerator(vault, imageGenerator, historyManager, settings);
}
