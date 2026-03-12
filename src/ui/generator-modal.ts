import { App, Modal, Setting, Notice, Editor, Vault } from 'obsidian';
import { PluginSettings, ModelType, MODELS, RESOLUTION_PRESETS } from '../types';
import { ImageGenerator } from '../services/image-generator';

export class GeneratorModal extends Modal {
  private generator: ImageGenerator;
  private settings: PluginSettings;
  private onSuccess?: (localPath: string) => void;
  private onCloseCallback?: () => void;

  // 表单状态
  private prompt: string = '';
  private model: ModelType;
  private resolution: string;
  private autoInsert: boolean;
  private isGenerating: boolean = false;

  // UI 元素
  private promptTextarea: HTMLTextAreaElement | null = null;
  private charCountEl: HTMLElement | null = null;
  private generateBtn: HTMLButtonElement | null = null;
  private statusEl: HTMLElement | null = null;
  private previewContainer: HTMLElement | null = null;

  constructor(
    app: App,
    generator: ImageGenerator,
    settings: PluginSettings,
    onSuccess?: (localPath: string) => void,
    onCloseCallback?: () => void
  ) {
    super(app);
    this.generator = generator;
    this.settings = settings;
    this.model = settings.defaultModel;
    this.resolution = settings.defaultResolution;
    this.autoInsert = settings.autoInsert;
    this.onSuccess = onSuccess;
    this.onCloseCallback = onCloseCallback;
  }

  display(): void {
    const { contentEl } = this;
    contentEl.empty();

    // 标题
    contentEl.createEl('h2', { text: 'GLM 图片生成', cls: 'glm-modal-title' });

    // 提示词输入
    contentEl.createEl('div', { cls: 'glm-form-group' });
    contentEl.createEl('label', {
      text: '提示词 *',
      cls: 'glm-form-label',
    });

    this.promptTextarea = contentEl.createEl('textarea', {
      cls: 'glm-textarea',
      attr: {
        placeholder: '描述你想生成的图片...',
        rows: 4,
      },
    }) as HTMLTextAreaElement;

    this.promptTextarea.addEventListener('input', () => {
      this.prompt = this.promptTextarea!.value;
      this.updateCharCount();
      this.validateForm();
    });

    // 字符计数
    this.charCountEl = contentEl.createEl('div', {
      cls: 'glm-char-count',
    });
    this.updateCharCount();

    // 模板按钮
    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText('模板库');
        button.onClick(() => {
          this.showTemplates();
        });
      });

    // 模型选择
    contentEl.createEl('div', { cls: 'glm-form-group' });
    contentEl.createEl('label', {
      text: '模型',
      cls: 'glm-form-label',
    });

    new Setting(contentEl).addDropdown((dropdown) => {
      MODELS.forEach((model) => {
        dropdown.addOption(model.id, `${model.name} (${model.price}元/次)`);
      });
      dropdown.setValue(this.model);
      dropdown.onChange(async (value: string) => {
        this.model = value as ModelType;
        this.updateCharCount();
        this.validateForm();
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

    // 自动插入选项
    new Setting(contentEl).addToggle((toggle) => {
      toggle.setValue(this.autoInsert);
      toggle.onChange((value: boolean) => {
        this.autoInsert = value;
      });
    }).setName('生成后自动插入到文档');

    // 状态显示
    this.statusEl = contentEl.createEl('div', {
      cls: 'glm-status',
    });

    // 图片预览
    this.previewContainer = contentEl.createEl('div', {
      cls: 'glm-preview-container',
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
      text: '生成图片',
      cls: 'glm-btn glm-btn-primary',
    }) as HTMLButtonElement;

    this.generateBtn.addEventListener('click', () => {
      this.generateImage();
    });

    this.validateForm();
  }

  private updateCharCount(): void {
    if (!this.charCountEl || !this.promptTextarea) return;

    const maxLength = this.model === 'glm-image' ? 1000 : 1000;
    const currentLength = this.prompt.length;

    this.charCountEl.textContent = `${currentLength}/${maxLength} 字符`;

    if (currentLength > maxLength) {
      this.charCountEl.addClass('glm-char-count-error');
    } else {
      this.charCountEl.removeClass('glm-char-count-error');
    }
  }

  private validateForm(): void {
    if (!this.generateBtn) return;

    const isValid = this.prompt.trim().length > 0 &&
      this.prompt.length <= (this.model === 'glm-image' ? 1000 : 1000);

    this.generateBtn.disabled = !isValid || this.isGenerating;
  }

  private showTemplates(): void {
    const templates = [
      { name: '概念图', prompt: '简洁的{概念名称}示意图，浅色背景，清晰的信息层次，现代扁平化设计' },
      { name: '流程图', prompt: '{流程名称}流程图，步骤清晰，箭头连接，配色柔和' },
      { name: '思维导图', prompt: '{主题}思维导图，中心主题突出，分支清晰，颜色丰富' },
      { name: '节日海报', prompt: '{节日名称}主题海报，{具体元素}，喜庆氛围，文字排版精美' },
      { name: '产品宣传', prompt: '{产品名称}产品宣传图，{产品特点}，高质量，专业摄影风格' },
      { name: '封面图', prompt: '社交媒体封面，{主题}，16:9比例，视觉冲击力强' },
      { name: '知识卡片', prompt: '{知识点内容}知识卡片，图文并茂，易于理解，美观大方' },
      { name: '引言卡片', prompt: '引言卡片，\'引言内容\'，优雅的排版，背景简约' },
    ];

    // 简单的模板选择 UI
    const templateModal = new Modal(this.app);
    templateModal.titleEl.textContent = '提示词模板';

    const listEl = templateModal.contentEl.createEl('div', {
      cls: 'glm-template-list',
    });

    templates.forEach((template) => {
      const itemEl = listEl.createEl('div', {
        cls: 'glm-template-item',
      });
      itemEl.createEl('strong', { text: template.name });
      itemEl.createEl('p', {
        text: template.prompt,
        cls: 'glm-template-prompt',
      });
      itemEl.addEventListener('click', () => {
        const prompt = template.prompt.replace(/\{[^}]+\}/g, '');
        this.promptTextarea!.value = prompt;
        this.prompt = prompt;
        this.updateCharCount();
        this.validateForm();
        templateModal.close();
      });
    });

    templateModal.open();
  }

  private async generateImage(): Promise<void> {
    if (this.isGenerating) return;

    if (!this.settings.apiKey) {
      new Notice('请先配置 API Key');
      return;
    }

    this.isGenerating = true;
    this.generateBtn!.disabled = true;
    this.generateBtn!.textContent = '生成中...';
    this.updateStatus('正在生成图片，请稍候...');
    this.previewContainer!.empty();

    try {
      const result = await this.generator.generateImage(
        this.prompt,
        this.model,
        this.resolution
      );

      this.updateStatus('生成成功！');

      // 显示预览
      const previewEl = this.previewContainer!.createEl('div', {
        cls: 'glm-preview',
      });

      // 获取图片文件并创建 blob URL
      try {
        const vault = this.app.vault;
        const file = vault.getFileByPath(result.localPath);
        if (file) {
          const blob = await vault.readBinary(file);
          const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'image/png' }));
          previewEl.createEl('img', {
            attr: { src: blobUrl },
            cls: 'glm-preview-image',
          });
        }
      } catch (e) {
        previewEl.createEl('p', { text: '图片已保存到: ' + result.localPath });
      }

      // 按钮区域
      const actionContainer = this.previewContainer!.createEl('div', {
        cls: 'glm-action-buttons',
      });

      if (this.autoInsert || true) { // 默认显示插入按钮
        actionContainer.createEl('button', {
          text: '插入到文档',
          cls: 'glm-btn glm-btn-primary',
        }).addEventListener('click', () => {
          this.insertToDocument(result.localPath);
          this.close();
        });
      }

      actionContainer.createEl('button', {
        text: '关闭',
        cls: 'glm-btn glm-btn-secondary',
      }).addEventListener('click', () => {
        this.close();
      });

      this.onSuccess?.(result.localPath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成失败';
      this.updateStatus(`生成失败: ${errorMessage}`, true);
      new Notice('生成失败: ' + errorMessage);
    } finally {
      this.isGenerating = false;
      this.generateBtn!.disabled = false;
      this.generateBtn!.textContent = '生成图片';
    }
  }

  private updateStatus(message: string, isError: boolean = false): void {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    if (isError) {
      this.statusEl.addClass('glm-status-error');
    } else {
      this.statusEl.removeClass('glm-status-error');
    }
  }

  private insertToDocument(imagePath: string): void {
    // 从路径中提取文件名
    const fileName = imagePath.split('/').pop() || imagePath;
    const imageMarkdown = `![${this.prompt.slice(0, 50)}](${imagePath})`;

    // 获取当前活动编辑器
    const activeEditor = this.app.workspace.activeEditor;
    if (activeEditor && activeEditor.editor) {
      activeEditor.editor.replaceSelection(imageMarkdown + '\n');
      new Notice('图片已插入到文档');
    } else {
      new Notice('未找到活动编辑器');
    }
  }

  onClose(): void {
    this.onCloseCallback?.();
    super.onClose();
  }
}
