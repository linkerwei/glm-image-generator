/**
 * 历史记录查看面板
 * 显示所有图片生成历史
 */

import { App, Modal, Notice } from 'obsidian';
import { HistoryManager } from '../services/history-manager';
import { HistoryRecord } from '../types';

export class HistoryPanel extends Modal {
  private historyManager: HistoryManager;

  constructor(app: App, historyManager: HistoryManager) {
    super(app);
    this.historyManager = historyManager;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('glm-history-panel');

    // 标题
    contentEl.createEl('h2', { text: '图片生成历史记录' });

    // 获取历史记录
    const records = this.historyManager.getRecords();

    if (records.length === 0) {
      contentEl.createEl('p', {
        text: '暂无历史记录',
        cls: 'glm-empty-history',
      });
      return;
    }

    // 统计信息
    const stats = this.historyManager.getStatistics();
    const statsContainer = contentEl.createDiv({ cls: 'glm-stats' });

    statsContainer.createEl('div', {
      text: `总计: ${stats.totalCalls} 次生成`,
      cls: 'glm-stat-item',
    });

    statsContainer.createEl('div', {
      text: `总成本: ¥${stats.totalCost.toFixed(2)}`,
      cls: 'glm-stat-item',
    });

    // 历史记录列表
    const listContainer = contentEl.createDiv({ cls: 'glm-history-list' });

    for (const record of records) {
      this.renderRecord(listContainer, record);
    }

    // 底部按钮
    const buttonContainer = contentEl.createDiv({ cls: 'glm-button-container' });

    buttonContainer.createEl('button', {
      text: '关闭',
    }).addEventListener('click', () => {
      this.close();
    });

    // 清空历史按钮
    const clearBtn = buttonContainer.createEl('button', {
      text: '清空历史',
      cls: 'glm-btn-danger',
    });

    clearBtn.addEventListener('click', async () => {
      const confirmed = confirm('确定要清空所有历史记录吗？此操作不可恢复。');
      if (confirmed) {
        await this.historyManager.clearHistory();
        new Notice('历史记录已清空');
        this.close();
      }
    });
  }

  /**
   * 渲染单条记录
   */
  private renderRecord(container: HTMLElement, record: HistoryRecord) {
    const recordEl = container.createDiv({ cls: 'glm-history-record' });

    // 左侧：图片预览（如果有）
    if (record.status === 'success' && record.localPath) {
      const imageContainer = recordEl.createDiv({ cls: 'glm-record-image' });

      // 使用 Obsidian 的资源路径
      const resourcePath = this.app.vault.adapter.getResourcePath(record.localPath);

      const img = imageContainer.createEl('img', {
        attr: {
          src: resourcePath,
          alt: record.prompt,
        },
      });

      // 点击图片放大查看
      img.addEventListener('click', () => {
        this.showImagePreview(record.localPath!);
      });
    } else {
      const placeholder = recordEl.createDiv({ cls: 'glm-record-placeholder' });
      placeholder.createEl('span', { text: record.status === 'failed' ? '❌' : '⏳' });
    }

    // 右侧：记录信息
    const infoContainer = recordEl.createDiv({ cls: 'glm-record-info' });

    // 提示词
    const promptEl = infoContainer.createDiv({ cls: 'glm-record-prompt' });
    promptEl.createEl('strong', { text: '提示词:' });
    promptEl.createEl('span', { text: record.prompt.substring(0, 100) + (record.prompt.length > 100 ? '...' : '') });

    // 详细信息
    const detailsEl = infoContainer.createDiv({ cls: 'glm-record-details' });

    const time = new Date(record.timestamp).toLocaleString('zh-CN');
    detailsEl.createEl('span', { text: `⏰ ${time}` });

    detailsEl.createEl('span', { text: `🎨 ${record.model}` });

    detailsEl.createEl('span', { text: `📐 ${record.size}` });

    if (record.status === 'success') {
      detailsEl.createEl('span', { text: `💰 ¥${record.cost.toFixed(2)}` });
    } else if (record.errorMessage) {
      const errorEl = detailsEl.createEl('span', {
        text: `错误: ${record.errorMessage}`,
        cls: 'glm-error-text',
      });
    }

    // 操作按钮
    const actionsEl = infoContainer.createDiv({ cls: 'glm-record-actions' });

    if (record.status === 'success' && record.localPath) {
      // 复制图片链接按钮
      actionsEl.createEl('button', {
        text: '复制链接',
      }).addEventListener('click', () => {
        navigator.clipboard.writeText(`![](${record.localPath})`);
        new Notice('图片链接已复制');
      });

      // 打开文件按钮
      actionsEl.createEl('button', {
        text: '打开文件',
      }).addEventListener('click', async () => {
        const file = this.app.vault.getAbstractFileByPath(record.localPath);
        if (file) {
          // 在文件浏览器中显示
          this.app.workspace.openLinkText(record.localPath, '', true);
        }
      });
    }

    // 删除按钮
    actionsEl.createEl('button', {
      text: '删除',
      cls: 'glm-btn-danger',
    }).addEventListener('click', async () => {
      await this.historyManager.deleteRecord(record.id);
      recordEl.remove();
      new Notice('记录已删除');
    });
  }

  /**
   * 显示图片预览
   */
  private showImagePreview(imagePath: string) {
    const modal = new Modal(this.app);
    modal.onOpen = () => {
      const { contentEl } = modal;
      contentEl.addClass('glm-image-preview-modal');

      const img = contentEl.createEl('img', {
        attr: {
          src: imagePath,
        },
      });

      img.style.maxWidth = '100%';
      img.style.maxHeight = '80vh';

      contentEl.addEventListener('click', () => {
        modal.close();
      });
    };

    modal.open();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
