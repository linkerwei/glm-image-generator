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
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`下载失败: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('网络连接失败'));
      };

      xhr.send();
    });
  }

  private async saveImage(filePath: string, data: ArrayBuffer): Promise<void> {
    const uint8Array = new Uint8Array(data);
    await this.vault.createBinary(filePath, uint8Array);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    // 检查目录是否存在，不存在则创建
    try {
      const existingFiles = this.vault.getFiles();
      const dirExists = existingFiles.some(
        (f: any) => f.path === dirPath || f.path.startsWith(dirPath)
      );

      if (!dirExists) {
        // 尝试创建目录（Obsidian vault API 不支持直接创建目录，
        // 但可以在保存文件时自动创建父目录）
        await this.vault.create('', dirPath + '.placeholder');
      }
    } catch (error) {
      // 目录可能已存在或 Vault API 不支持，忽略错误
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
