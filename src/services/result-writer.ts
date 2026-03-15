/**
 * 结果写回器
 * 负责将生成结果写回 Markdown 文件
 */

import { Vault, TFile } from 'obsidian';
import { BatchTask } from '../types';

/**
 * 结果写回器类
 */
export class ResultWriter {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * 写回结果到文件
   * @param file 目标文件
   * @param tasks 任务列表(包含结果)
   * @param originalContent 原始文件内容
   */
  async writeBack(
    file: TFile,
    tasks: BatchTask[],
    originalContent: string
  ): Promise<void> {
    const lines = originalContent.split('\n');

    // 按行号倒序排序,避免插入时行号偏移
    const sortedTasks = [...tasks].sort((a, b) => b.lineNumber - a.lineNumber);

    for (const task of sortedTasks) {
      // 在提示词下方插入结果
      const insertLine = task.lineNumber + 1;
      const resultText = this.formatResultText(task);

      lines.splice(insertLine, 0, resultText);
    }

    const newContent = lines.join('\n');
    await this.vault.modify(file, newContent);
  }

  /**
   * 格式化结果文本
   * @param task 任务对象
   * @returns 格式化后的文本
   */
  private formatResultText(task: BatchTask): string {
    if (task.status === 'success' && task.result) {
      // 成功: 插入图片链接
      return `\n   ![](${task.result.localPath})\n`;
    } else if (task.status === 'failed' && task.error) {
      // 失败: 插入错误信息
      return `\n   ❌ 生成失败: ${task.error}\n`;
    } else {
      return '\n   ⚠️ 未知状态\n';
    }
  }

  /**
   * 生成重试文件内容
   * @param failedTasks 失败的任务列表
   * @returns 重试文件内容
   */
  generateRetryContent(failedTasks: BatchTask[]): string {
    const frontmatter = `---
glm_batch:
  model: glm-image
  resolution: 1280x1280
---

# 重试任务(失败项)

以下任务在之前的批量生成中失败,可以重新执行。
`;

    const taskList = failedTasks
      .map((task, index) => {
        let line = `${index + 1}. ${task.prompt}`;
        if (task.error) {
          line += `\n   <!-- 上次错误: ${task.error} -->`;
        }
        return line;
      })
      .join('\n\n');

    return frontmatter + '\n' + taskList;
  }
}

/**
 * 创建结果写回器实例
 */
export function createResultWriter(vault: Vault): ResultWriter {
  return new ResultWriter(vault);
}
