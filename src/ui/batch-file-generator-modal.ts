/**
 * 批量文件生成弹窗
 * 专门用于从文件批量生成的预览和进度显示
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import { BatchGenerator } from '../services/batch-generator';
import { ParsedBatchFile, BatchResult, BatchProgress } from '../types';

/**
 * 批量文件生成弹窗类
 */
export class BatchFileGeneratorModal extends Modal {
  private generator: BatchGenerator;
  private parsed: ParsedBatchFile;
  private onConfirm: () => void;
  private estimatedCost: number;

  constructor(
    app: App,
    generator: BatchGenerator,
    parsed: ParsedBatchFile,
    onConfirm: () => void
  ) {
    super(app);
    this.generator = generator;
    this.parsed = parsed;
    this.onConfirm = onConfirm;
    this.estimatedCost = generator.estimateCost(parsed.tasks);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('glm-batch-file-modal');

    // 标题
    contentEl.createEl('h2', { text: '批量生成任务预览' });

    // 统计信息
    const statsContainer = contentEl.createDiv({ cls: 'glm-batch-stats' });

    new Setting(statsContainer)
      .setName('任务数量')
      .setDesc(`${this.parsed.tasks.length} 个`);

    new Setting(statsContainer)
      .setName('模型')
      .setDesc(this.getModelDisplayName(this.parsed.config.model));

    new Setting(statsContainer)
      .setName('分辨率')
      .setDesc(this.parsed.config.resolution || '1280x1280');

    const costSetting = new Setting(statsContainer)
      .setName('预估成本')
      .setDesc(`¥${this.estimatedCost.toFixed(2)}`);

    // 添加高亮样式
    costSetting.descEl.addClass('glm-cost-highlight');

    // 任务列表(折叠显示)
    const taskListContainer = contentEl.createDiv({ cls: 'glm-task-list-container' });

    const details = taskListContainer.createEl('details');
    details.createEl('summary', { text: '查看任务列表' });

    const taskList = details.createDiv({ cls: 'glm-task-list' });
    const displayCount = Math.min(this.parsed.tasks.length, 10);

    for (let i = 0; i < displayCount; i++) {
      const task = this.parsed.tasks[i];
      const taskItem = taskList.createDiv({ cls: 'glm-task-item' });
      const number = taskItem.createEl('span', { cls: 'glm-task-number' });
      number.textContent = `${i + 1}. `;

      const text = taskItem.createEl('span', { cls: 'glm-task-text' });
      text.textContent = task.prompt.substring(0, 50) + (task.prompt.length > 50 ? '...' : '');
    }

    if (this.parsed.tasks.length > 10) {
      const moreItem = taskList.createDiv({ cls: 'glm-task-item glm-more-tasks' });
      moreItem.createEl('span', {
        text: `... 还有 ${this.parsed.tasks.length - 10} 个任务`,
      });
    }

    // 警告提示
    const warningContainer = contentEl.createDiv({ cls: 'glm-warning-container' });
    warningContainer.createEl('p', {
      text: '⚠️ 执行后将自动修改当前文件,插入生成的图片链接',
    });

    // 按钮区域
    const buttonContainer = contentEl.createDiv({ cls: 'glm-button-container' });

    const cancelButton = buttonContainer.createEl('button', { text: '取消' });
    cancelButton.addEventListener('click', () => {
      this.close();
    });

    const confirmButton = buttonContainer.createEl('button', {
      text: '开始生成',
      cls: 'mod-cta',
    });
    confirmButton.addEventListener('click', async () => {
      this.close();
      await this.executeBatch();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * 执行批量生成
   */
  private async executeBatch() {
    // 显示进度通知
    const notice = new Notice('', 0); // 0 = 不自动关闭

    try {
      const result = await this.generator.executeBatch(
        this.parsed,
        (progress: BatchProgress) => {
          // 更新进度通知
          const progressBar = this.generateProgressBar(progress.current, progress.total);
          const message =
            `${progressBar}\n` +
            `正在生成第 ${progress.current}/${progress.total} 张...\n` +
            `✅ 成功: ${progress.successCount}  ❌ 失败: ${progress.failedCount}`;

          notice.setMessage(message);
        }
      );

      // 隐藏进度通知
      notice.hide();

      // 显示结果
      this.showResult(result);
    } catch (error) {
      notice.hide();
      new Notice(
        `❌ 批量生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        5000
      );
    }
  }

  /**
   * 显示生成结果
   */
  private showResult(result: BatchResult) {
    let message: string;
    let icon: string;

    if (result.status === 'completed') {
      icon = '✅';
      message =
        `批量生成完成!\n` +
        `成功: ${result.successCount} 张\n` +
        `总成本: ¥${result.totalCost.toFixed(2)}`;
    } else if (result.status === 'partial_completed') {
      icon = '⚠️';
      message =
        `批量生成完成(部分失败)\n` +
        `成功: ${result.successCount} 张\n` +
        `失败: ${result.failedCount} 张\n` +
        `总成本: ¥${result.totalCost.toFixed(2)}`;
    } else {
      icon = '❌';
      message =
        `批量生成失败\n` +
        `失败: ${result.failedCount} 张`;
    }

    new Notice(`${icon} ${message}`, 5000);

    // 调用确认回调
    this.onConfirm();
  }

  /**
   * 生成进度条
   */
  private generateProgressBar(current: number, total: number): string {
    const length = 20;
    const progress = current / total;
    const filled = Math.round(length * progress);
    const empty = length - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = Math.round(progress * 100);

    return `[${bar}] ${percentage}%`;
  }

  /**
   * 获取模型显示名称
   */
  private getModelDisplayName(model?: string): string {
    if (!model) return 'GLM-Image';

    const modelNames: Record<string, string> = {
      'glm-image': 'GLM-Image',
      'cogView-4-250304': 'CogView-4',
    };

    return modelNames[model] || model;
  }
}
