import { Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types';
import { SettingsTab } from './ui/settings-tab';
import { createImageGenerator, ImageGenerator } from './services/image-generator';
import { GeneratorModal } from './ui/generator-modal';
import { BatchGeneratorModal } from './ui/batch-generator-modal';
import { BatchFileGeneratorModal } from './ui/batch-file-generator-modal';
import { HistoryPanel } from './ui/history-panel';
import { BatchGenerator, createBatchGenerator } from './services/batch-generator';
import { TaskFileParseError } from './services/task-file-parser';

class GLMImageGeneratorPlugin extends Plugin {
  settings!: PluginSettings;
  generator!: ImageGenerator;
  batchGenerator!: BatchGenerator;

  async onload() {
    console.log('GLM Image Generator 插件加载成功!');

    // 加载或初始化设置
    await this.loadSettings();

    // 创建 ImageGenerator 实例
    this.generator = createImageGenerator(
      this.app.vault,
      this.settings.apiKey,
      this.settings.savePath,
      `.obsidian/plugins/${this.manifest.id}/history.json`,
      this.settings,
      this.settings.retryCount
    );

    // 创建 BatchGenerator 实例
    this.batchGenerator = new BatchGenerator(
      this.app.vault,
      this.generator,
      this.generator.getHistoryManager(),
      this.settings
    );

    // 注册插件设置面板
    this.addSettingTab(new SettingsTab(this.app, this, this.generator));

    // 命令：打开图片生成面板
    this.addCommand({
      id: 'glm-generate',
      name: '生成 GLM 图片',
      callback: () => {
        new GeneratorModal(this.app, this.generator, this.settings).open();
      },
    });

    // 命令：批量生成(手动输入)
    this.addCommand({
      id: 'glm-batch-generate',
      name: '批量生成图片(手动输入)',
      callback: () => {
        new BatchGeneratorModal(this.app, this.generator, this.settings).open();
      },
    });

    // 命令：从文件批量生成(新增)
    this.addCommand({
      id: 'glm-batch-generate-from-file',
      name: '从文件批量生成图片',
      callback: () => {
        this.handleBatchGenerateFromFile();
      },
    });

    // 命令：查看历史记录(新增)
    this.addCommand({
      id: 'glm-view-history',
      name: '查看生成历史',
      callback: () => {
        new HistoryPanel(this.app, this.generator.getHistoryManager()).open();
      },
    });
  }

  /**
   * 处理从文件批量生成命令
   */
  private async handleBatchGenerateFromFile() {
    // 获取当前活动文件
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      new Notice('请先打开一个任务文件');
      return;
    }

    if (activeFile.extension !== 'md') {
      new Notice('只支持 Markdown 文件');
      return;
    }

    try {
      // 解析任务文件
      const parsed = await this.batchGenerator.parseBatchFile(activeFile);

      // 打开预览弹窗
      new BatchFileGeneratorModal(
        this.app,
        this.batchGenerator,
        parsed,
        () => {
          // 完成后的回调
          console.log('批量生成完成');
        }
      ).open();
    } catch (error) {
      if (error instanceof TaskFileParseError) {
        new Notice(`任务文件解析失败: ${error.message}`, 5000);
      } else {
        new Notice(
          `批量生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
          5000
        );
      }
    }
  }

  // ----------- 设置持久化 -------------
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// 使用 CommonJS 导出方式，兼容 Obsidian
module.exports = GLMImageGeneratorPlugin;
