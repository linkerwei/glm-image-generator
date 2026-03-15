import { App, Modal, Setting, Notice } from 'obsidian';
import { PluginSettings, ModelType, RESOLUTION_PRESETS } from '../types';
import { ImageGenerator } from '../services/image-generator';
import { HistoryPanel } from './history-panel';

export class BatchGeneratorModal extends Modal {
  private generator: ImageGenerator;
  private settings: PluginSettings;
  private onCloseCallback?: () => void;

  // 表单状态
  private prompts: string = '';
  private model: ModelType;
  private resolution: string;
  private isGenerating: boolean = false;

  // UI 元素
  private generateBtn: HTMLButtonElement | null = null;
  private progressEl: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private resultsContainer: HTMLElement | null = null;

  // 存储生成结果
  private generatedImages: Array<{ prompt: string; localPath?: string; error?: string }> = [];

  constructor(
    app: App,
    generator: ImageGenerator,
    settings: PluginSettings,
    onCloseCallback?: () => void
  ) {
    super(app);
    this.generator = generator;
    this.settings = settings;
    this.model = settings.defaultModel;
    this.resolution = settings.defaultResolution;
    this.onCloseCallback = onCloseCallback;
  }

  onOpen(): void {
    this.display();
  }

  display(): void {
    const { contentEl } = this;
    contentEl.empty();

    // 标题
    contentEl.createEl('h2', { text: 'GLM 批量图片生成', cls: 'glm-modal-title' });

    // 说明
    contentEl.createEl('p', {
      text: '每行输入一个提示词，将批量生成多张图片',
      cls: 'glm-description',
    });

    // 提示词输入
    contentEl.createEl('div', { cls: 'glm-form-group' });
    contentEl.createEl('label', {
      text: '提示词（每行一个）*',
      cls: 'glm-form-label',
    });

    const textarea = contentEl.createEl('textarea', {
      cls: 'glm-textarea',
      attr: {
        placeholder: '一只可爱的小猫咪\n一张风景图片\n商业海报设计',
        rows: 8,
      },
    }) as HTMLTextAreaElement;

    textarea.addEventListener('input', () => {
      this.prompts = textarea.value;
      this.validateForm();
    });

    // 模型选择
    contentEl.createEl('div', { cls: 'glm-form-group' });
    contentEl.createEl('label', {
      text: '模型',
      cls: 'glm-form-label',
    });

    new Setting(contentEl).addDropdown((dropdown) => {
      dropdown.addOption('glm-image', 'GLM-Image (0.1元/次)');
      dropdown.addOption('cogView-4-250304', 'CogView-4 (0.1元/次)');
      dropdown.setValue(this.model);
      dropdown.onChange((value: string) => {
        this.model = value as ModelType;
      });
    });

    // 分辨率选择
    contentEl.createEl('div', { cls: 'glm-form-group' });
    contentEl.createEl('label', {
      text: '分辨率',
      cls: 'glm-form-label',
    });

    new Setting(contentEl).addDropdown((dropdown) => {
      RESOLUTION_PRESETS.forEach((preset) => {
        dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
      });
      dropdown.setValue(this.resolution);
      dropdown.onChange((value: string) => {
        this.resolution = value;
      });
    });

    // 进度显示
    this.progressEl = contentEl.createEl('div', {
      cls: 'glm-progress',
    });

    this.progressBar = contentEl.createEl('div', {
      cls: 'glm-progress-bar',
    });

    // 结果显示
    this.resultsContainer = contentEl.createEl('div', {
      cls: 'glm-results-container',
    });

    // 按钮
    const buttonContainer = contentEl.createEl('div', {
      cls: 'glm-button-container',
    });

    buttonContainer.createEl('button', {
      text: '取消',
      cls: 'glm-btn glm-btn-secondary',
    }).addEventListener('click', () => {
      this.close();
    });

    this.generateBtn = buttonContainer.createEl('button', {
      text: '开始批量生成',
      cls: 'glm-btn glm-btn-primary',
    }) as HTMLButtonElement;

    this.generateBtn.addEventListener('click', () => {
      this.startBatchGeneration();
    });

    this.validateForm();
  }

  private validateForm(): void {
    if (!this.generateBtn) return;

    const promptList = this.prompts
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const isValid = promptList.length > 0;

    this.generateBtn.disabled = !isValid || this.isGenerating;
  }

  private updateProgress(current: number, total: number): void {
    if (!this.progressEl || !this.progressBar) return;

    this.progressEl.textContent = `进度: ${current}/${total}`;
    const percentage = (current / total) * 100;
    this.progressBar.style.width = `${percentage}%`;
  }

  private addResult(prompt: string, index: number, result: any): void {
    if (!this.resultsContainer) return;

    const resultEl = this.resultsContainer.createEl('div', {
      cls: 'glm-result-item',
    });

    // 保存结果
    if (result?.error) {
      this.generatedImages[index] = { prompt, error: result.error };
    } else {
      this.generatedImages[index] = { prompt, localPath: result?.localPath };
    }

    if (result?.error) {
      // 失败情况
      resultEl.createEl('span', {
        text: '❌',
        cls: 'glm-result-icon',
      });

      const textContainer = resultEl.createEl('div', { cls: 'glm-result-content' });
      textContainer.createEl('div', {
        text: `${index + 1}. ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        cls: 'glm-result-prompt',
      });
      textContainer.createEl('div', {
        text: `错误: ${result.error}`,
        cls: 'glm-result-error',
      });
    } else {
      // 成功情况 - 显示图片预览
      resultEl.createEl('span', {
        text: '✅',
        cls: 'glm-result-icon',
      });

      const textContainer = resultEl.createEl('div', { cls: 'glm-result-content' });

      textContainer.createEl('div', {
        text: `${index + 1}. ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        cls: 'glm-result-prompt',
      });

      // 显示图片预览
      if (result?.localPath) {
        const imageContainer = textContainer.createEl('div', { cls: 'glm-result-preview' });

        // 使用 Obsidian 的资源路径
        const resourcePath = this.app.vault.adapter.getResourcePath(result.localPath);

        const img = imageContainer.createEl('img', {
          attr: {
            src: resourcePath,
            alt: prompt,
          },
        });

        img.style.maxWidth = '200px';
        img.style.maxHeight = '150px';
        img.style.marginTop = '8px';
        img.style.borderRadius = '4px';
        img.style.cursor = 'pointer';

        // 点击放大
        img.addEventListener('click', () => {
          this.showImagePreview(result.localPath);
        });

        // 复制链接按钮
        const actionsContainer = textContainer.createEl('div', { cls: 'glm-result-actions' });
        actionsContainer.createEl('button', {
          text: '复制链接',
          cls: 'glm-btn-small',
        }).addEventListener('click', () => {
          navigator.clipboard.writeText(`![](${result.localPath})`);
          new Notice('图片链接已复制');
        });

        actionsContainer.createEl('button', {
          text: '插入到文档',
          cls: 'glm-btn-small',
        }).addEventListener('click', async () => {
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile) {
            const editor = this.app.workspace.activeEditor?.editor;
            if (editor) {
              editor.replaceSelection(`![](${result.localPath})\n`);
              new Notice('图片已插入');
            }
          }
        });
      }
    }
  }

  private async startBatchGeneration(): Promise<void> {
    if (this.isGenerating) return;

    if (!this.settings.apiKey) {
      new Notice('请先配置 API Key');
      return;
    }

    const promptList = this.prompts
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (promptList.length === 0) {
      new Notice('请输入至少一个提示词');
      return;
    }

    this.isGenerating = true;
    this.generateBtn!.disabled = true;
    this.generateBtn!.textContent = '生成中...';
    this.resultsContainer!.empty();

    let successCount = 0;
    let failedCount = 0;

    try {
      await this.generator.batchGenerate(
        promptList,
        this.model,
        this.resolution,
        (current: number, total: number, result?: { error?: string }) => {
          this.updateProgress(current, total);

          if (result) {
            if (result.error) {
              failedCount++;
            } else {
              successCount++;
            }
            // 找到对应的提示词
            const prompt = promptList[current - 1];
            this.addResult(prompt, current - 1, result);
          }
        }
      );

      // 完成
      this.progressEl!.textContent = `完成！成功: ${successCount}, 失败: ${failedCount}`;
      new Notice(`批量生成完成！成功: ${successCount}, 失败: ${failedCount}`);

      // 添加操作按钮
      if (successCount > 0) {
        const actionContainer = this.resultsContainer!.createEl('div', {
          cls: 'glm-action-buttons',
        });

        // 查看历史按钮
        actionContainer.createEl('button', {
          text: '📊 查看历史记录',
          cls: 'glm-btn glm-btn-primary',
        }).addEventListener('click', () => {
          this.close();
          // 打开历史面板
          const historyPanel = new HistoryPanel(
            this.app,
            this.generator['historyManager']
          );
          historyPanel.open();
        });

        // 关闭按钮
        actionContainer.createEl('button', {
          text: '关闭',
          cls: 'glm-btn glm-btn-secondary',
        }).addEventListener('click', () => {
          this.close();
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量生成失败';
      this.progressEl!.textContent = `错误: ${errorMessage}`;
      new Notice('批量生成失败: ' + errorMessage);
    } finally {
      this.isGenerating = false;
      this.generateBtn!.disabled = false;
      this.generateBtn!.textContent = '开始批量生成';
    }
  }

  onClose(): void {
    this.onCloseCallback?.();
    super.onClose();
  }

  /**
   * 显示图片预览
   */
  private showImagePreview(imagePath: string) {
    const modal = new Modal(this.app);
    modal.onOpen = () => {
      const { contentEl } = modal;
      contentEl.addClass('glm-image-preview-modal');

      // 使用 Obsidian 的资源路径
      const resourcePath = this.app.vault.adapter.getResourcePath(imagePath);

      const img = contentEl.createEl('img', {
        attr: {
          src: resourcePath,
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
}
