import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types';
import { SettingsTab } from './ui/settings-tab';
import { createImageGenerator, ImageGenerator } from './services/image-generator';
import { GeneratorModal } from './ui/generator-modal';

class GLMImageGeneratorPlugin extends Plugin {
  settings!: PluginSettings;
  generator!: ImageGenerator;

  async onload() {
    console.log('GLM Image Generator 插件加载成功!');
    // 加载或初始化设置
    await this.loadSettings();

    // 创建 ImageGenerator 实例
    this.generator = createImageGenerator(
      this.app.vault,
      this.settings.apiKey,
      this.settings.savePath,
      `${this.manifest.id}/history.json`,
      this.settings,
      this.settings.retryCount
    );

    // 注册插件设置面板
    this.addSettingTab(new SettingsTab(this.app, this, this.generator));

    // 命令：打开图片生成面板
    this.addCommand({
      id: 'glm-generate',
      name: '生成 GLM 图片',
      callback: () => {
        new GeneratorModal(this.app, this.generator, this.settings).open();
      }
    });
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
