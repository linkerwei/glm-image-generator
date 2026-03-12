const obsidian = require('obsidian');

// 类型定义
const MODELS = [
  {
    id: 'glm-image',
    name: 'GLM-Image',
    description: '智谱新旗舰图像生成模型，擅长文字渲染',
    price: 0.1,
    maxPromptLength: 1000,
    features: ['文字渲染（海报、PPT、科普图）', '商业海报', '科普插画', '多格图画', '社交媒体图文']
  },
  {
    id: 'cogView-4-250304',
    name: 'CogView-4',
    description: '支持生成汉字的开源文生图模型',
    price: 0.1,
    maxPromptLength: 1000,
    features: ['中文文字生成', '餐饮美食宣传', '电商产品配图', '游戏素材创作', '文旅宣传制作']
  }
];

const RESOLUTION_PRESETS = [
  { label: '1:1 (1280x1280)', width: 1280, height: 1280, aspectRatio: '1:1' },
  { label: '3:4 (1056x1568)', width: 1056, height: 1568, aspectRatio: '3:4' },
  { label: '4:3 (1568x1056)', width: 1568, height: 1056, aspectRatio: '4:3' },
  { label: '16:9 (1728x960)', width: 1728, height: 960, aspectRatio: '16:9' },
  { label: '9:16 (960x1728)', width: 960, height: 1728, aspectRatio: '9:16' }
];

const DEFAULT_SETTINGS = {
  apiKey: '',
  defaultModel: 'glm-image',
  defaultResolution: '1280x1280',
  savePath: '附件/glm-images/',
  autoInsert: true,
  saveRemoteUrl: false,
  historyLimit: 1000,
  maxConcurrent: 3,
  retryCount: 3,
  costThreshold: 10
};

// 工具函数
function calculateCost(model) {
  const costs = {
    'glm-image': 0.1,
    'cogView-4-250304': 0.1
  };
  return costs[model] || 0;
}

function generateFileName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `glm-${timestamp}-${random}.png`;
}

function generateRecordId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// GLM API Client
class GLMApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async generateImage(request) {
    const url = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        size: request.size
      })
    });

    return response;
  }

  async validateApiKey() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API Key 为空，请先输入');
    }

    console.log('[GLM API] 开始验证 API Key...');
    console.log('[GLM API] API Key 长度:', this.apiKey.length);
    console.log('[GLM API] API Key 前缀:', this.apiKey.substring(0, 10) + '...');

    try {
      const url = 'https://open.bigmodel.cn/api/paas/v4/models';
      console.log('[GLM API] 请求 URL:', url);

      const response = await this.request(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('[GLM API] 验证成功，响应:', response);
      return true;
    } catch (error) {
      console.error('[GLM API] 验证失败，错误详情:', error);
      console.error('[GLM API] 错误类型:', error.constructor.name);
      console.error('[GLM API] 错误消息:', error.message);

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('API Key 格式不正确或已过期');
      } else if (error.message.includes('网络') || error.message.includes('连接')) {
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.message.includes('CORS') || error.message.includes('跨域')) {
        throw new Error('跨域请求被阻止，可能需要配置代理');
      } else {
        throw new Error(`验证失败: ${error.message}`);
      }
    }
  }

  async request(url, options, retryCount = 3) {
    let lastError = null;

    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await this.makeRequest(url, options);

        if (response.status >= 200 && response.status < 300) {
          const data = JSON.parse(response.text);
          if (data.error) {
            throw new Error(data.error.message || 'API 调用失败');
          }
          return data;
        }

        if (response.status === 401) {
          throw new Error('API Key 无效，请检查配置');
        }
        if (response.status === 403) {
          throw new Error('权限不足，请检查 API Key 权限');
        }
        if (response.status === 429) {
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
          lastError = new Error('API 请求频率过高，请稍后重试');
          continue;
        }
        if (response.status >= 500) {
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
          lastError = new Error(`服务器错误: ${response.status}`);
          continue;
        }

        const errorData = response.text ? JSON.parse(response.text) : {};
        throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
      } catch (error) {
        if (error.message.includes('API Key') || error.message.includes('权限')) {
          throw error;
        }
        lastError = error;

        if (i < retryCount - 1) {
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('请求失败');
  }

  makeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method, url);

      for (const [key, value] of Object.entries(options.headers)) {
        xhr.setRequestHeader(key, value);
      }

      xhr.onload = () => {
        resolve({
          status: xhr.status,
          text: xhr.responseText
        });
      };

      xhr.onerror = () => {
        reject(new Error('网络连接失败，请检查网络'));
      };

      if (options.body) {
        xhr.send(options.body);
      } else {
        xhr.send();
      }
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Image Downloader
class ImageDownloader {
  constructor(vault, savePath, maxRetries = 3) {
    this.vault = vault;
    this.savePath = savePath;
    this.maxRetries = maxRetries;
  }

  setSavePath(savePath) {
    this.savePath = savePath;
  }

  async downloadImage(imageUrl, customFileName) {
    const fileName = customFileName || generateFileName();

    // 确保路径格式正确
    let savePath = this.savePath;
    if (!savePath.endsWith('/')) {
      savePath += '/';
    }

    const filePath = `${savePath}${fileName}`;

    console.log('[下载] 开始下载图片');
    console.log('[下载] 图片 URL:', imageUrl);
    console.log('[下载] 保存路径:', filePath);
    console.log('[下载] 目录路径:', savePath);

    // 确保目录存在
    try {
      console.log('[下载] 检查目录是否存在...');
      const adapter = this.vault.adapter;
      const dirExists = await adapter.exists(savePath);

      if (!dirExists) {
        console.log('[下载] 目录不存在，开始创建:', savePath);
        await this.vault.createFolder(savePath);
        console.log('[下载] 目录创建成功');
      } else {
        console.log('[下载] 目录已存在');
      }
    } catch (error) {
      console.error('[下载] 目录检查/创建失败:', error);
      // 不要抛出错误，继续尝试保存
    }

    let lastError = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`[下载] 第 ${i + 1} 次尝试...`);
        const imageData = await this.fetchImage(imageUrl);
        console.log('[下载] 图片数据获取成功，大小:', imageData.byteLength, 'bytes');
        await this.saveImage(filePath, imageData);
        console.log('[下载] 图片保存成功:', filePath);
        return filePath;
      } catch (error) {
        console.error(`[下载] 第 ${i + 1} 次失败:`, error);
        lastError = error;

        if (i < this.maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          console.log(`[下载] 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('[下载] 所有重试均失败');
    throw lastError || new Error('图片下载失败');
  }

  async fetchImage(url) {
    console.log('[下载] 开始 fetch:', url);
    console.log('[下载] 使用 Obsidian requestUrl API (绕过 CORS)');

    try {
      // 使用 Obsidian 的 requestUrl API，可以绑过 CORS 限制
      const response = await obsidian.requestUrl({
        url: url,
        method: 'GET',
        arrayBuffer: true  // 以二进制形式返回
      });

      console.log('[下载] requestUrl 状态:', response.status);
      console.log('[下载] 响应大小:', response.arrayBuffer.byteLength, 'bytes');

      if (response.status >= 200 && response.status < 300) {
        return response.arrayBuffer;
      } else {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[下载] requestUrl 错误:', error);
      throw new Error(`图片下载失败: ${error.message}`);
    }
  }

  async saveImage(filePath, data) {
    console.log('[下载] 保存图片到:', filePath);
    try {
      const uint8Array = new Uint8Array(data);
      console.log('[下载] 数据大小:', uint8Array.length, 'bytes');
      await this.vault.createBinary(filePath, uint8Array);
      console.log('[下载] 保存成功');
    } catch (error) {
      console.error('[下载] 保存失败:', error);
      throw error;
    }
  }
}

// Image Generator
class ImageGenerator {
  constructor(vault, apiClient, downloader, settings) {
    this.vault = vault;
    this.apiClient = apiClient;
    this.downloader = downloader;
    this.settings = settings;
  }

  updateSettings(settings) {
    this.settings = settings;
    this.downloader.setSavePath(settings.savePath);
  }

  async generateImage(prompt, model, size) {
    console.log('[生成器] 开始生成图片');
    console.log('[生成器] 提示词:', prompt);
    console.log('[生成器] 模型:', model);
    console.log('[生成器] 尺寸:', size);

    const finalModel = model || this.settings.defaultModel;
    const finalSize = size || this.settings.defaultResolution;

    console.log('[生成器] 调用 API...');
    const response = await this.apiClient.generateImage({
      model: finalModel,
      prompt,
      size: finalSize
    });

    console.log('[生成器] API 响应:', response);
    const imageUrl = response.data[0]?.url;
    console.log('[生成器] 图片 URL:', imageUrl);

    if (!imageUrl) {
      console.error('[生成器] 未获取到图片 URL');
      throw new Error('未获取到图片 URL');
    }

    console.log('[生成器] 开始下载图片...');
    const localPath = await this.downloader.downloadImage(imageUrl);
    console.log('[生成器] 图片下载完成:', localPath);

    return {
      localPath,
      remoteUrl: imageUrl
    };
  }

  async validateApiKey() {
    return this.apiClient.validateApiKey();
  }

  getSettings() {
    return this.settings;
  }
}

// Generator Modal - 修复版本
class GeneratorModal extends obsidian.Modal {
  constructor(app, generator, settings, onSuccess, onCloseCallback) {
    super(app);
    this.generator = generator;
    this.settings = settings;
    this.model = settings.defaultModel;
    this.resolution = settings.defaultResolution;
    this.autoInsert = settings.autoInsert;
    this.onSuccess = onSuccess;
    this.onCloseCallback = onCloseCallback;
    this.prompt = '';
    this.isGenerating = false;
  }

  onOpen() {
    console.log('[Modal] onOpen 被调用');
    this.display();
  }

  display() {
    console.log('[Modal] display 开始渲染');
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'GLM 图片生成', cls: 'glm-modal-title' });

    // 提示词输入
    const promptLabel = contentEl.createEl('label', {
      text: '提示词 *',
      cls: 'glm-form-label'
    });

    this.promptTextarea = contentEl.createEl('textarea', {
      cls: 'glm-textarea',
      attr: {
        placeholder: '描述你想生成的图片...',
        rows: 4
      }
    });

    this.promptTextarea.addEventListener('input', () => {
      this.prompt = this.promptTextarea.value;
      this.updateCharCount();
      this.validateForm();
    });

    this.charCountEl = contentEl.createEl('div', { cls: 'glm-char-count' });
    this.updateCharCount();

    // 模型选择
    contentEl.createEl('label', { text: '模型', cls: 'glm-form-label' });
    new obsidian.Setting(contentEl).addDropdown((dropdown) => {
      MODELS.forEach((model) => {
        dropdown.addOption(model.id, `${model.name} (${model.price}元/次)`);
      });
      dropdown.setValue(this.model);
      dropdown.onChange((value) => {
        this.model = value;
      });
    });

    // 分辨率选择
    contentEl.createEl('label', { text: '分辨率', cls: 'glm-form-label' });
    new obsidian.Setting(contentEl).addDropdown((dropdown) => {
      RESOLUTION_PRESETS.forEach((preset) => {
        dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
      });
      dropdown.setValue(this.resolution);
      dropdown.onChange((value) => {
        this.resolution = value;
      });
    });

    // 自动插入选项
    new obsidian.Setting(contentEl)
      .setName('生成后自动插入到文档')
      .addToggle((toggle) => {
        toggle.setValue(this.autoInsert);
        toggle.onChange((value) => {
          this.autoInsert = value;
        });
      });

    this.statusEl = contentEl.createEl('div', { cls: 'glm-status' });
    this.previewContainer = contentEl.createEl('div', { cls: 'glm-preview-container' });

    // 按钮
    const buttonContainer = contentEl.createEl('div', { cls: 'glm-button-container' });

    buttonContainer.createEl('button', {
      text: '取消',
      cls: 'glm-btn glm-btn-secondary'
    }).addEventListener('click', () => {
      this.close();
    });

    this.generateBtn = buttonContainer.createEl('button', {
      text: '生成图片',
      cls: 'glm-btn glm-btn-primary'
    });

    this.generateBtn.addEventListener('click', () => {
      this.generateImage();
    });

    this.validateForm();
    console.log('[Modal] display 渲染完成');
  }

  updateCharCount() {
    if (!this.charCountEl) return;
    const currentLength = this.prompt.length;
    this.charCountEl.textContent = `${currentLength}/1000 字符`;

    if (currentLength > 1000) {
      this.charCountEl.addClass('glm-char-count-error');
    } else {
      this.charCountEl.removeClass('glm-char-count-error');
    }
  }

  validateForm() {
    if (!this.generateBtn) return;
    const isValid = this.prompt.trim().length > 0 && this.prompt.length <= 1000;
    this.generateBtn.disabled = !isValid || this.isGenerating;
  }

  async generateImage() {
    if (this.isGenerating) return;

    if (!this.settings.apiKey) {
      new obsidian.Notice('请先配置 API Key');
      return;
    }

    console.log('[Modal] ========== 开始生成图片 ==========');
    console.log('[Modal] 提示词:', this.prompt);
    console.log('[Modal] 模型:', this.model);
    console.log('[Modal] 分辨率:', this.resolution);

    this.isGenerating = true;
    this.generateBtn.disabled = true;
    this.generateBtn.textContent = '生成中...';
    this.updateStatus('正在生成图片，请稍候...');
    this.previewContainer.empty();

    try {
      console.log('[Modal] 调用 generator.generateImage...');
      const result = await this.generator.generateImage(
        this.prompt,
        this.model,
        this.resolution
      );

      console.log('[Modal] 生成结果:', result);
      this.updateStatus('生成成功！');

      const previewEl = this.previewContainer.createEl('div', { cls: 'glm-preview' });

      try {
        const file = this.app.vault.getFileByPath(result.localPath);
        if (file) {
          const blob = await this.app.vault.readBinary(file);
          const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'image/png' }));
          previewEl.createEl('img', {
            attr: { src: blobUrl },
            cls: 'glm-preview-image'
          });
        }
      } catch (e) {
        console.error('[Modal] 预览图片失败:', e);
        previewEl.createEl('p', { text: '图片已保存到: ' + result.localPath });
      }

      const actionContainer = this.previewContainer.createEl('div', { cls: 'glm-action-buttons' });

      actionContainer.createEl('button', {
        text: '插入到文档',
        cls: 'glm-btn glm-btn-primary'
      }).addEventListener('click', () => {
        this.insertToDocument(result.localPath);
        this.close();
      });

      actionContainer.createEl('button', {
        text: '关闭',
        cls: 'glm-btn glm-btn-secondary'
      }).addEventListener('click', () => {
        this.close();
      });

      console.log('[Modal] ========== 生成成功 ==========');

    } catch (error) {
      console.error('[Modal] ========== 生成失败 ==========');
      console.error('[Modal] 错误对象:', error);
      console.error('[Modal] 错误消息:', error.message);
      console.error('[Modal] 错误堆栈:', error.stack);

      const errorMessage = error.message || '生成失败';
      this.updateStatus(`生成失败: ${errorMessage}`, true);
      new obsidian.Notice('生成失败: ' + errorMessage, 8000);
    } finally {
      this.isGenerating = false;
      this.generateBtn.disabled = false;
      this.generateBtn.textContent = '生成图片';
    }
  }

  updateStatus(message, isError = false) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    if (isError) {
      this.statusEl.addClass('glm-status-error');
    } else {
      this.statusEl.removeClass('glm-status-error');
    }
  }

  insertToDocument(imagePath) {
    const imageMarkdown = `![${this.prompt.slice(0, 50)}](${imagePath})`;

    const activeEditor = this.app.workspace.activeEditor;
    if (activeEditor && activeEditor.editor) {
      activeEditor.editor.replaceSelection(imageMarkdown + '\n');
      new obsidian.Notice('图片已插入到文档');
    } else {
      new obsidian.Notice('未找到活动编辑器');
    }
  }

  onClose() {
    if (this.onCloseCallback) this.onCloseCallback();
    super.onClose();
  }
}

// Settings Tab
class SettingsTab extends obsidian.PluginSettingTab {
  constructor(app, plugin, generator) {
    super(app, plugin);
    this.plugin = plugin;
    this.generator = generator;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'GLM 图片生成器设置' });

    // API 配置
    containerEl.createEl('h3', { text: 'API 配置' });

    new obsidian.Setting(containerEl)
      .setName('API Key')
      .setDesc('智谱 AI API Key')
      .addText((text) => {
        text
          .setPlaceholder('输入 API Key')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      })
      .addButton((button) => {
        button.setButtonText('验证');
        button.onClick(async () => {
          if (!this.plugin.settings.apiKey) {
            new obsidian.Notice('请先输入 API Key');
            return;
          }
          button.setButtonText('验证中...');
          button.setDisabled(true);
          try {
            console.log('[设置] 开始验证 API Key:', this.plugin.settings.apiKey.substring(0, 10) + '...');
            const isValid = await this.generator.validateApiKey();
            console.log('[设置] 验证结果:', isValid);
            if (isValid) {
              new obsidian.Notice('✅ API Key 验证成功！');
              button.setButtonText('✓ 已验证');
            } else {
              new obsidian.Notice('❌ API Key 无效或网络错误，请检查控制台查看详情', 5000);
              button.setButtonText('重新验证');
            }
          } catch (error) {
            console.error('[设置] 验证异常:', error);
            const errorMsg = error.message || error.toString() || '未知错误';
            new obsidian.Notice(`❌ 验证失败: ${errorMsg}`, 8000);
            button.setButtonText('重新验证');
          }
          button.setDisabled(false);
        });
      });

    new obsidian.Setting(containerEl)
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

    new obsidian.Setting(containerEl)
      .setName('默认模型')
      .addDropdown((dropdown) => {
        MODELS.forEach((model) => {
          dropdown.addOption(model.id, `${model.name} (${model.price}元/次)`);
        });
        dropdown.setValue(this.plugin.settings.defaultModel);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultModel = value;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new obsidian.Setting(containerEl)
      .setName('默认分辨率')
      .addDropdown((dropdown) => {
        RESOLUTION_PRESETS.forEach((preset) => {
          dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
        });
        dropdown.setValue(this.plugin.settings.defaultResolution);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultResolution = value;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new obsidian.Setting(containerEl)
      .setName('图片保存路径')
      .addText((text) => {
        text.setPlaceholder('附件/glm-images/');
        text.setValue(this.plugin.settings.savePath);
        text.onChange(async (value) => {
          this.plugin.settings.savePath = value || DEFAULT_SETTINGS.savePath;
          await this.plugin.saveSettings();
          this.generator.updateSettings(this.plugin.settings);
        });
      });

    new obsidian.Setting(containerEl)
      .setName('生成后自动插入到文档')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoInsert);
        toggle.onChange(async (value) => {
          this.plugin.settings.autoInsert = value;
          await this.plugin.saveSettings();
        });
      });

    // 历史记录
    containerEl.createEl('h3', { text: '历史记录' });

    new obsidian.Setting(containerEl)
      .setName('历史记录上限')
      .addText((text) => {
        text.setPlaceholder('1000');
        text.setValue(String(this.plugin.settings.historyLimit));
        text.onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.historyLimit = num;
            await this.plugin.saveSettings();
          }
        });
      });
  }
}

// Main Plugin Class
class GLMImageGeneratorPlugin extends obsidian.Plugin {
  async onload() {
    console.log('GLM Image Generator 插件加载中...');

    // 加载设置
    await this.loadSettings();

    // 初始化组件
    const apiClient = new GLMApiClient(this.settings.apiKey);
    const downloader = new ImageDownloader(this.app.vault, this.settings.savePath, this.settings.retryCount);
    this.generator = new ImageGenerator(this.app.vault, apiClient, downloader, this.settings);

    // 注册设置面板
    this.addSettingTab(new SettingsTab(this.app, this, this.generator));

    // 注册命令
    this.addCommand({
      id: 'glm-generate-image',
      name: '生成图片',
      callback: () => {
        console.log('[插件] 打开生成图片 Modal');
        new GeneratorModal(this.app, this.generator, this.settings).open();
      }
    });

    this.addCommand({
      id: 'glm-test-api-key',
      name: '测试 API Key 连接',
      callback: async () => {
        if (!this.settings.apiKey) {
          new obsidian.Notice('请先在设置中配置 API Key');
          return;
        }

        new obsidian.Notice('正在测试 API Key...', 3000);

        try {
          console.log('=== 开始测试 API Key ===');
          console.log('API Key (前10位):', this.settings.apiKey.substring(0, 10) + '...');
          console.log('API Key 长度:', this.settings.apiKey.length);

          const isValid = await this.generator.validateApiKey();

          if (isValid) {
            new obsidian.Notice('✅ API Key 有效！连接成功', 5000);
            console.log('=== API Key 测试成功 ===');
          } else {
            new obsidian.Notice('❌ API Key 无效，请检查控制台查看详细错误', 8000);
            console.log('=== API Key 测试失败 ===');
          }
        } catch (error) {
          console.error('=== API Key 测试异常 ===');
          console.error('错误对象:', error);
          console.error('错误消息:', error.message);
          console.error('错误堆栈:', error.stack);

          new obsidian.Notice(`❌ 测试失败: ${error.message}`, 10000);
        }
      }
    });

    this.addCommand({
      id: 'glm-generate-from-clipboard',
      name: '从剪贴板生成图片',
      callback: async () => {
        try {
          const clipboardText = await navigator.clipboard.readText();
          if (!clipboardText || clipboardText.trim().length === 0) {
            new obsidian.Notice('剪贴板为空');
            return;
          }

          if (!this.settings.apiKey) {
            new obsidian.Notice('请先配置 API Key');
            return;
          }

          new GeneratorModal(this.app, this.generator, this.settings).open();
        } catch (error) {
          new obsidian.Notice('读取剪贴板失败: ' + error.message);
        }
      }
    });

    console.log('GLM Image Generator 插件加载完成');
  }

  onunload() {
    console.log('GLM Image Generator 插件已卸载');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    if (this.generator) {
      this.generator.updateSettings(this.settings);
    }
  }
}

module.exports = GLMImageGeneratorPlugin;
