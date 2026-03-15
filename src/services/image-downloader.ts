import { requestUrl } from 'obsidian';
import { generateFileName } from '../types';

export class ImageDownloader {
  private vault: any;
  private savePath: string;
  private maxRetries: number;

  constructor(vault: any, savePath: string, maxRetries = 3) {
    this.vault = vault;
    this.savePath = savePath;
    this.maxRetries = maxRetries;
  }

  setSavePath(savePath: string): void {
    this.savePath = savePath;
  }

  async downloadImage(imageUrl: string, customFileName?: string): Promise<string> {
    // 确保保存目录存在
    await this.ensureDirectoryExists(this.savePath);

    const fileName = customFileName || generateFileName();
    const filePath = `${this.savePath}${fileName}`;

    let lastError: Error | null = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const imageData = await this.fetchImage(imageUrl);
        await this.saveImage(filePath, imageData);
        return filePath;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('下载失败');

        if (i < this.maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('图片下载失败');
  }

  private async fetchImage(url: string): Promise<ArrayBuffer> {
    try {
      const response = await requestUrl({
        url: url,
        method: 'GET',
      });

      if (response.status >= 200 && response.status < 300) {
        return response.arrayBuffer;
      } else {
        throw new Error(`下载失败: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`图片下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async saveImage(filePath: string, data: ArrayBuffer): Promise<void> {
    const uint8Array = new Uint8Array(data);
    await this.vault.createBinary(filePath, uint8Array);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    // 确保路径以 / 结尾
    if (!dirPath.endsWith('/')) {
      dirPath += '/';
    }

    // 检查目录是否存在
    try {
      const abstractFile = this.vault.getAbstractFileByPath(dirPath);
      if (abstractFile) {
        // 目录已存在
        return;
      }
    } catch (error) {
      // 忽略错误，继续创建
    }

    // 目录不存在，需要创建
    try {
      // 使用 vault.adapter.mkdir 创建目录（支持多级目录）
      await this.vault.adapter.mkdir(dirPath);
      console.log('目录已创建:', dirPath);
    } catch (error) {
      // 可能是目录已存在或其他错误
      console.log('创建目录时出错:', error);
    }
  }

  async deleteImage(filePath: string): Promise<void> {
    try {
      const file = this.vault.getFile(filePath);
      if (file) {
        await this.vault.delete(file);
      }
    } catch (error) {
      // 文件可能不存在，忽略错误
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createImageDownloader(
  vault: any,
  savePath: string,
  maxRetries = 3
): ImageDownloader {
  return new ImageDownloader(vault, savePath, maxRetries);
}
