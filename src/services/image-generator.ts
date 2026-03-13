import {
  ModelType,
  PluginSettings,
  GenerationTask,
  BatchGenerationTask,
  generateRecordId,
  calculateCost,
  getTodayDate,
} from '../types';
import { GLMApiClient } from './glm-api-client';
import { ImageDownloader } from './image-downloader';
import { HistoryManager } from './history-manager';

export class ImageGenerator {
  private apiClient: GLMApiClient;
  private downloader: ImageDownloader;
  private historyManager: HistoryManager;
  private settings: PluginSettings;
  private vault: any;

  constructor(
    vault: any,
    apiClient: GLMApiClient,
    downloader: ImageDownloader,
    historyManager: HistoryManager,
    settings: PluginSettings
  ) {
    this.vault = vault;
    this.apiClient = apiClient;
    this.downloader = downloader;
    this.historyManager = historyManager;
    this.settings = settings;
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.apiClient.setApiKey(settings.apiKey);
    this.downloader.setSavePath(settings.savePath);
    this.historyManager.updateSettings(settings);
  }

  async generateImage(
    prompt: string,
    model?: ModelType,
    size?: string
  ): Promise<{
    localPath: string;
    remoteUrl: string;
    record: any;
  }> {
    const finalModel = model || this.settings.defaultModel;
    const finalSize = size || this.settings.defaultResolution;

    // 调用 API 生成图片
    const response = await this.apiClient.generateImage({
      model: finalModel,
      prompt,
      size: finalSize,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('未获取到图片 URL');
    }

    // 下载图片到本地
    const localPath = await this.downloader.downloadImage(imageUrl);

    // 保存历史记录
    const record = await this.historyManager.addRecord(
      prompt,
      finalModel,
      finalSize,
      localPath,
      imageUrl,
      'success'
    );

    return {
      localPath,
      remoteUrl: imageUrl,
      record,
    };
  }

  async batchGenerate(
    prompts: string[],
    model?: ModelType,
    size?: string,
    onProgress?: (current: number, total: number, result?: any) => void
  ): Promise<BatchGenerationTask> {
    const batchId = generateRecordId();
    const tasks: GenerationTask[] = prompts.map((prompt) => ({
      id: generateRecordId(),
      prompt,
      model: model || this.settings.defaultModel,
      size: size || this.settings.defaultResolution,
      status: 'pending' as const,
      retryCount: 0,
    }));

    const batchTask: BatchGenerationTask = {
      id: batchId,
      tasks,
      totalCount: tasks.length,
      successCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      status: 'running',
    };

    // 逐个生成图片
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'processing';

      onProgress?.(i + 1, tasks.length);

      try {
        const result = await this.generateImage(
          task.prompt,
          task.model,
          task.size
        );

        task.status = 'success';
        task.result = {
          imageUrl: result.remoteUrl,
          localPath: result.localPath,
        };
        batchTask.successCount++;

        onProgress?.(i + 1, tasks.length, result);
      } catch (error) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : '生成失败';
        batchTask.failedCount++;

        // 保存失败记录
        await this.historyManager.addRecord(
          task.prompt,
          task.model,
          task.size,
          '',
          '',
          'failed',
          task.error
        );

        onProgress?.(i + 1, tasks.length, { error: task.error });
      }
    }

    batchTask.status = 'completed';
    return batchTask;
  }

  async validateApiKey(): Promise<boolean> {
    return this.apiClient.validateApiKey();
  }

  getSettings(): PluginSettings {
    return this.settings;
  }
}

export function createImageGenerator(
  vault: any,
  apiKey: string,
  savePath: string,
  historyPath: string,
  settings: PluginSettings,
  maxRetries = 3
): ImageGenerator {
  const apiClient = new GLMApiClient(apiKey);
  const downloader = new ImageDownloader(vault, savePath, maxRetries);
  const historyManager = new HistoryManager(vault, historyPath, settings);

  return new ImageGenerator(vault, apiClient, downloader, historyManager, settings);
}
