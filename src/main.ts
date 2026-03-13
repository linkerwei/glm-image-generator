import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types';
import { SettingsTab } from './ui/settings-tab';
import { createImageGenerator } from './services/image-generator';
import { ImageGenerator } from './services/image-generator';

export default class GLMImageGeneratorPlugin extends Plugin {
  private settings!: PluginSettings;
  private generator!: ImageGenerator;

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

    // 示例命令：生成图片（仅演示）
    this.addCommand({
      id: 'glm-generate',
      name: '生成 GLM 图片',
      callback: async () => {
        const prompt = await this.app.workspace.getActiveFile()?.basename || '示例提示词';
        try {
          const result = await this.generator.generateImage(prompt);
          console.log('生成成功', result);
        } catch (e) {
          console.error('生成失败', e);
        }
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
