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
    containerEl.createEl('h2', { text: 'GLM 图片生成器' });

    // 快捷操作区域
    containerEl.createEl('h3', { text: '🚀 快捷操作' });

    new Setting(containerEl)
      .setName('生成图片')
      .setDesc('打开单张图片生成面板')
      .addButton((button) => {
        button.setButtonText('🎨 生成图片');
        button.onClick(() => {
          // @ts-ignore
          const GeneratorModal = require('./generator-modal').GeneratorModal;
          new GeneratorModal(this.app, this.generator, this.plugin.settings).open();
        });
      });

    new Setting(containerEl)
      .setName('批量生成图片')
      .setDesc('手动输入提示词，批量生成')
      .addButton((button) => {
        button.setButtonText('📝 批量生成');
        button.onClick(() => {
          // @ts-ignore
          const BatchGeneratorModal = require('./batch-generator-modal').BatchGeneratorModal;
          new BatchGeneratorModal(this.app, this.generator, this.plugin.settings).open();
        });
      });

    new Setting(containerEl)
      .setName('从文件批量生成')
      .setDesc('从当前打开的 Markdown 文件批量生成')
      .addButton((button) => {
        button.setButtonText('📁 文件批量生成');
        button.onClick(() => {
          // @ts-ignore
          this.plugin.handleBatchGenerateFromFile();
        });
      });

    new Setting(containerEl)
      .setName('查看历史记录')
      .setDesc('查看所有图片生成历史')
      .addButton((button) => {
        button.setButtonText('📊 查看历史');
        button.onClick(() => {
          // @ts-ignore
          const HistoryPanel = require('./history-panel').HistoryPanel;
          new HistoryPanel(this.app, this.generator.getHistoryManager()).open();
        });
      });

    new Setting(containerEl)
      .setName('创建示例模板')
      .setDesc('在当前文件夹创建批量生成示例文件')
      .addButton((button) => {
        button.setButtonText('📄 创建模板');
        button.onClick(async () => {
          await this.createBatchTemplate();
        });
      });

    containerEl.createEl('hr'); // 分隔线

    // API 配置
    containerEl.createEl('h3', { text: '⚙️ API 配置' });

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

  /**
   * 创建批量生成示例模板
   */
  private async createBatchTemplate(): Promise<void> {
    try {
      // 获取当前活动文件所在的文件夹
      const activeFile = this.app.workspace.getActiveFile();
      let targetFolder = '';

      if (activeFile) {
        // 如果有活动文件，使用其所在文件夹
        const parentPath = activeFile.parent?.path || '';
        targetFolder = parentPath ? `${parentPath}/` : '';
      }

      // 生成文件名（避免重复）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
      const fileName = `批量生成示例-${timestamp}.md`;
      const filePath = targetFolder + fileName;

      // 检查文件是否已存在
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile) {
        new Notice(`文件已存在: ${filePath}`);
        return;
      }

      // 模板内容
      const templateContent = `---
glm_batch:
  model: glm-image
  resolution: 1280x1280
  auto_insert: true
---

# 批量图片生成示例

## 📝 使用说明

1. **执行命令**: 按 \`Ctrl/Cmd + P\`，输入"从文件批量生成"
2. **查看预览**: 确认任务数量和预估成本
3. **开始生成**: 点击"开始生成"按钮
4. **查看结果**: 生成完成后图片会自动插入到下方

## 💡 提示

- 支持的模型: \`glm-image\`（擅长文字渲染）、\`cogView-4-250304\`（擅长中文）
- 支持的分辨率: \`1280x1280\`、\`1056x1568\`、\`1568x1056\`、\`1728x960\`、\`960x1728\`
- 参数覆盖: 在提示词前一行添加 \`<!-- glm: model=xxx resolution=xxx -->\`

## 📋 任务列表

1. 一只可爱的小猫咪，坐在阳光明媚的窗台上，背景是蓝天白云，温馨治愈的风格

2. 餐饮美食宣传海报，红烧狮子头，高清摄影，暖色调，食欲感强烈

3. 科技感产品宣传图，智能手机，蓝色渐变背景，极简设计，未来感

4. <!-- glm: model=cogView-4-250304 resolution=1056x1568 -->
   餐厅菜单设计，宫保鸡丁，高清美食摄影，包含中文菜名

5. 春季促销海报，粉色樱花背景，优惠信息醒目，节日氛围浓厚

---

**预估成本**: ¥0.50 (5张 × ¥0.10/张)

## 🎯 高级用法

### 自定义参数示例

\`\`\`markdown
3. <!-- glm: model=cogView-4-250304 resolution=1056x1568 -->
   这个任务使用 CogView-4 模型和 3:4 分辨率
\`\`\`

### 支持的参数

| 参数 | 说明 | 可选值 |
|------|------|--------|
| \`model\` | 使用的模型 | \`glm-image\`, \`cogView-4-250304\` |
| \`resolution\` | 图片分辨率 | \`1280x1280\`, \`1056x1568\`, \`1568x1056\`, \`1728x960\`, \`960x1728\` |
| \`auto_insert\` | 是否自动插入结果 | \`true\`, \`false\` |

---

**创建时间**: ${new Date().toLocaleString('zh-CN')}
`;

      // 创建文件
      await this.app.vault.create(filePath, templateContent);

      // 在编辑器中打开文件
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }

      new Notice(`✅ 模板已创建: ${fileName}`);
    } catch (error) {
      console.error('创建模板失败:', error);
      new Notice(`❌ 创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
