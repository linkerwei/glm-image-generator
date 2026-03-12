import { Plugin } from 'obsidian';

export default class GLMImageGeneratorPlugin extends Plugin {
  async onload() {
    console.log('GLM Image Generator 插件加载成功!');
    this.addCommand({
      id: 'glm-test',
      name: '测试命令',
      callback: () => {
        console.log('测试命令被触发');
      }
    });
  }
}
