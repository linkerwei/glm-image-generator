import {
  ModelType,
  GLMImageRequest,
  GLMImageResponse,
  GLMApiError,
} from '../types';

const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

export class GLMApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async generateImage(request: GLMImageRequest): Promise<GLMImageResponse> {
    const url = `${API_BASE_URL}/images/generations`;

    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        size: request.size,
      }),
    });

    return response as GLMImageResponse;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/models`;
      await this.request(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async request(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
    },
    retryCount = 3
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await this.makeRequest(url, options);

        // 检查 HTTP 状态码
        if (response.status >= 200 && response.status < 300) {
          const data = JSON.parse(response.text);

          // 检查 API 错误
          if (data.error) {
            throw new Error(data.error.message || 'API 调用失败');
          }

          return data;
        }

        // 处理特定错误码
        if (response.status === 401) {
          throw new Error('API Key 无效，请检查配置');
        }
        if (response.status === 403) {
          throw new Error('权限不足，请检查 API Key 权限');
        }
        if (response.status === 429) {
          // 速率限制，直接抛出错误不重试
          throw new Error('API 请求频率过高，请稍后重试');
        }
        if (response.status >= 500) {
          // 服务器错误，等待后重试
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
          lastError = new Error(`服务器错误: ${response.status}`);
          continue;
        }

        const errorData = response.text ? JSON.parse(response.text) : {};
        throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
      } catch (error) {
        if (error instanceof Error) {
          // 如果是 API 错误或网络错误，不重试
          if (error.message.includes('API Key') || error.message.includes('权限')) {
            throw error;
          }
          lastError = error;
        } else {
          lastError = new Error('未知错误');
        }

        // 如果还有重试次数，等待后继续
        if (i < retryCount - 1) {
          const delay = Math.pow(2, i) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('请求失败');
  }

  private makeRequest(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
    }
  ): Promise<{ status: number; text: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method, url);

      for (const [key, value] of Object.entries(options.headers)) {
        xhr.setRequestHeader(key, value);
      }

      xhr.onload = () => {
        resolve({
          status: xhr.status,
          text: xhr.responseText,
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出供测试使用
export function createGLMApiClient(apiKey: string): GLMApiClient {
  return new GLMApiClient(apiKey);
}
