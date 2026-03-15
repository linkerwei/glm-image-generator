/**
 * 任务文件解析器
 * 负责解析 Markdown 任务文件,提取配置和任务列表
 */

import { TFile } from 'obsidian';
import {
  BatchConfig,
  BatchTask,
  ParsedBatchFile,
  TaskOverrideParams,
  mergeTaskParams,
  generateRecordId,
  isValidResolutionString,
} from '../types';

/**
 * 任务文件解析错误
 */
export class TaskFileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskFileParseError';
  }
}

/**
 * 任务文件解析器类
 */
export class TaskFileParser {
  /**
   * 解析批量任务文件
   * @param content 文件内容
   * @param file 文件对象
   * @returns 解析后的任务文件数据
   * @throws {TaskFileParseError} 文件格式错误
   */
  parseFile(content: string, file: TFile): ParsedBatchFile {
    // 1. 提取 YAML Frontmatter
    const frontmatter = this.extractYAMLFrontmatter(content);
    if (!frontmatter) {
      throw new TaskFileParseError('未找到 YAML Frontmatter,请在文件开头添加配置');
    }

    // 2. 解析配置
    const config = this.parseBatchConfig(frontmatter);

    // 3. 提取任务列表
    const tasks = this.extractTasks(content, config);

    if (tasks.length === 0) {
      throw new TaskFileParseError('未找到任何任务,请添加编号列表(如: 1. 提示词)');
    }

    // 4. 限制最大任务数
    if (tasks.length > 100) {
      throw new TaskFileParseError(`任务数量过多(${tasks.length}个),最多支持100个任务`);
    }

    return {
      config,
      tasks,
      originalContent: content,
      sourceFile: file,
    };
  }

  /**
   * 提取 YAML Frontmatter
   * @param content 文件内容
   * @returns YAML 内容或 null
   */
  private extractYAMLFrontmatter(content: string): string | null {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    return match ? match[1] : null;
  }

  /**
   * 解析批量任务配置
   * @param frontmatter YAML 内容
   * @returns 批量配置
   * @throws {TaskFileParseError} 解析失败
   */
  private parseBatchConfig(frontmatter: string): BatchConfig {
    try {
      // 简单的 YAML 解析(不使用外部库)
      const config: BatchConfig = {};
      const lines = frontmatter.split('\n');

      // 查找 glm_batch 块
      let inBatchBlock = false;
      let batchLines: string[] = [];

      for (const line of lines) {
        if (line.trim().startsWith('glm_batch:')) {
          inBatchBlock = true;
          continue;
        }

        if (inBatchBlock) {
          // 如果遇到顶级键,退出块
          if (line.match(/^[a-zA-Z_]/)) {
            break;
          }
          batchLines.push(line);
        }
      }

      if (batchLines.length === 0 && !inBatchBlock) {
        throw new Error('未找到 glm_batch 配置字段');
      }

      // 解析 glm_batch 内的字段
      for (const line of batchLines) {
        const trimmed = line.trim();

        // model: glm-image
        const modelMatch = trimmed.match(/^model:\s*['"]?(.+?)['"]?$/);
        if (modelMatch) {
          const model = modelMatch[1].trim();
          if (model !== 'glm-image' && model !== 'cogView-4-250304') {
            throw new Error(`无效的模型: ${model}`);
          }
          config.model = model as any;
          continue;
        }

        // resolution: 1280x1280
        const resolutionMatch = trimmed.match(/^resolution:\s*['"]?(.+?)['"]?$/);
        if (resolutionMatch) {
          const resolution = resolutionMatch[1].trim();
          if (!isValidResolutionString(resolution)) {
            throw new Error(`无效的分辨率: ${resolution}`);
          }
          config.resolution = resolution;
          continue;
        }

        // auto_insert: true/false
        const autoInsertMatch = trimmed.match(/^auto_insert:\s*(true|false)$/);
        if (autoInsertMatch) {
          config.auto_insert = autoInsertMatch[1] === 'true';
          continue;
        }
      }

      return config;
    } catch (error) {
      throw new TaskFileParseError(
        `配置解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 提取任务列表
   * @param content 文件内容
   * @param config 全局配置
   * @returns 任务列表
   */
  private extractTasks(content: string, config: BatchConfig): BatchTask[] {
    const tasks: BatchTask[] = [];
    const lines = content.split('\n');

    // 正则匹配编号列表: 1. 提示词
    const listPattern = /^(\d+)\.\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(listPattern);

      if (match) {
        const prompt = match[2].trim();

        // 跳过空提示词
        if (!prompt) {
          continue;
        }

        // 检查提示词长度
        if (prompt.length > 1000) {
          console.warn(`任务 ${match[1]} 提示词过长(${prompt.length}字符),可能生成失败`);
        }

        // 检查是否有参数覆盖注释(在前一行)
        const overrideParams = this.parseOverrideParams(lines, i);

        // 合并全局配置和覆盖参数
        const finalParams = mergeTaskParams(config, overrideParams);

        // 创建任务对象
        const task: BatchTask = {
          id: generateRecordId(),
          prompt,
          model: finalParams.model,
          resolution: finalParams.resolution,
          lineNumber: i,
          status: 'pending',
          retryCount: 0,
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * 解析参数覆盖注释
   * 格式: <!-- glm: model=xxx resolution=xxx -->
   * @param lines 文件所有行
   * @param currentLine 当前行号
   * @returns 覆盖参数或 undefined
   */
  private parseOverrideParams(lines: string[], currentLine: number): TaskOverrideParams | undefined {
    // 检查前一行是否有注释
    if (currentLine === 0) return undefined;

    const prevLine = lines[currentLine - 1].trim();
    const commentPattern = /<!--\s*glm:\s*(.+?)\s*-->/;
    const match = prevLine.match(commentPattern);

    if (!match) return undefined;

    const paramsStr = match[1];
    const params: TaskOverrideParams = {};

    // 解析 key=value 对
    const pairs = paramsStr.split(/\s+/);
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (!key || !value) continue;

      if (key === 'model') {
        if (value === 'glm-image' || value === 'cogView-4-250304') {
          params.model = value as any;
        }
      } else if (key === 'resolution') {
        if (isValidResolutionString(value)) {
          params.resolution = value;
        }
      }
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }
}

/**
 * 创建任务文件解析器实例
 */
export function createTaskFileParser(): TaskFileParser {
  return new TaskFileParser();
}
