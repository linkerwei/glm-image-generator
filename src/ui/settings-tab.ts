import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, Statistics, ModelType, MODELS, RESOLUTION_PRESETS } from '../types';
import { ImageGenerator } from '../services/image-generator';

export class SettingsTab extends PluginSettingTab {
  plugin: any;
  generator: ImageGenerator;

  constructor(app: App, plugin: any, generator: ImageGenerator) {
    super(app, plugin);
    this.plugin = plugin;
    this.generator = generator;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 标题
    containerEl.createEl('h2', { text: 'GLM 图片生成器设置' });

    // API 配置
    containerEl.createEl('h3', { text: 'API 配置' });

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('智谱 AI API Key')
      .addText((text) => {
        text
          .setPlaceholder('输入 API Key')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value: string) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      })
      .addButton((button) => {
        button.setButtonText('验证');
        button.onClick(async () => {
          if (!this.plugin.settings.apiKey) {
            new Notice('请先输入 API Key');
            return;
          }
          button.setButtonText('验证中...');
          button.setDisabled(true);
          try {
            const isValid = await this.generator.validateApiKey();
            if (isValid) {
              new Notice('API Key 验证成功');
            } else {
              new Notice('API Key 无效');
            }
          } catch (error) {
            new Notice('验证失败: ' + (error instanceof Error ? error.message : '未知错误'));
          }
          button.setButtonText('验证');
          button.setDisabled(false);
        });
      });

    new Setting(containerEl)
      .setName('获取 API Key')
      .setDesc('点击打开智谱 AI 控制台')
      .addButton((button) => {
        button.setButtonText('打开智谱 AI 控制台');
        button.onClick(() => {
          window.open('https://open.bigmodel.cn/', '_blank');
        });
      });

    // 默认设置
    containerEl.createEl('h3', { text: '默认设置' });

    new Setting(containerEl)
      .setName('默认模型')
      .addDropdown((dropdown) => {
        MODELS.forEach((model) => {
          dropdown.addOption(model.id, `${model.name} (${model.price}元/次)`);
        });
        dropdown.setValue(this.plugin.settings.defaultModel);
        dropdown.onChange(async (value: string) => {
          this.plugin.settings.defaultModel = value as ModelType;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName('默认分辨率')
      .addDropdown((dropdown) => {
        RESOLUTION_PRESETS.forEach((preset) => {
          dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
        });
        dropdown.setValue(this.plugin.settings.defaultResolution);
        dropdown.onChange(async (value: string) => {
          this.plugin.settings.defaultResolution = value;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName('图片保存路径')
      .addText((text) => {
        text.setPlaceholder('附件/glm-images/');
        text.setValue(this.plugin.settings.savePath);
        text.onChange(async (value: string) => {
          this.plugin.settings.savePath = value || DEFAULT_SETTINGS.savePath;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName('生成后自动插入到文档')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoInsert);
        toggle.onChange(async (value: boolean) => {
          this.plugin.settings.autoInsert = value;
          await this.plugin.saveSettings();
        });
      });

    // 高级设置
    containerEl.createEl('h3', { text: '高级设置' });

    new Setting(containerEl)
      .setName('批量生成并发数')
      .setDesc('同时生成的最大图片数量')
      .addSlider((slider) => {
        slider.setLimits(1, 5, 1);
        slider.setValue(this.plugin.settings.maxConcurrent);
        slider.onChange(async (value: number) => {
          this.plugin.settings.maxConcurrent = value;
          await this.plugin.saveSettings();
        });
        slider.sliderEl.style.width = '100px';
      });

    new Setting(containerEl)
      .setName('重试次数')
      .setDesc('API 调用失败时的重试次数')
      .addSlider((slider) => {
        slider.setLimits(1, 5, 1);
        slider.setValue(this.plugin.settings.retryCount);
        slider.onChange(async (value: number) => {
          this.plugin.settings.retryCount = value;
          await this.plugin.saveSettings();
        });
        slider.sliderEl.style.width = '100px';
      });

    new Setting(containerEl)
      .setName('成本预警阈值')
      .setDesc('单日累计成本超过此值时提醒（元）')
      .addText((text) => {
        text.setPlaceholder('10');
        text.setValue(String(this.plugin.settings.costThreshold));
        text.onChange(async (value: string) => {
          const num = parseFloat(value);
          if (!isNaN(num) && num >= 0) {
            this.plugin.settings.costThreshold = num;
            await this.plugin.saveSettings();
          }
        });
      });

    // 历史记录
    containerEl.createEl('h3', { text: '历史记录' });

    new Setting(containerEl)
      .setName('历史记录上限')
      .addText((text) => {
        text.setPlaceholder('1000');
        text.setValue(String(this.plugin.settings.historyLimit));
        text.onChange(async (value: string) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.historyLimit = num;
            await this.plugin.saveSettings();
          }
        });
      });

    const history = this.generator.getSettings();
    containerEl.createEl('p', {
      text: `当前记录数: ${history.historyLimit} 条`,
      cls: 'setting-item-description',
    });

    new Setting(containerEl)
      .setName('清空历史记录')
      .addButton((button) => {
        button.setButtonText('清空');
        button.onClick(async () => {
          if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            // 清空历史记录
            new Notice('历史记录已清空');
          }
        });
      });

    // 成本统计
    containerEl.createEl('h3', { text: '成本统计' });

    this.displayStatistics(containerEl);

    new Setting(containerEl)
      .setName('导出统计数据')
      .addButton((button) => {
        button.setButtonText('导出 CSV');
        button.onClick(() => {
          // TODO: 实现导出功能
          new Notice('导出功能开发中');
        });
      });
  }

  private displayStatistics(containerEl: HTMLElement): void {
    // 这里可以从 history manager 获取统计数据
    // 暂时显示静态文本
    containerEl.createEl('p', {
      text: '总调用次数: 0 次',
      cls: 'setting-item-description',
    });
    containerEl.createEl('p', {
      text: '总成本: ¥0.00',
      cls: 'setting-item-description',
    });
  }
}
