import {
  HistoryRecord,
  HistoryData,
  ModelType,
  Statistics,
  PluginSettings,
  calculateCost,
  getTodayDate,
  generateRecordId,
} from '../types';

export class HistoryManager {
  private vault: any;
  private historyPath: string;
  private historyData: HistoryData;
  private settings: PluginSettings;

  constructor(vault: any, historyPath: string, settings: PluginSettings) {
    this.vault = vault;
    this.historyPath = historyPath;
    this.settings = settings;
    this.historyData = { records: [] };
  }

  async load(): Promise<void> {
    try {
      const file = this.vault.getFile(this.historyPath);
      if (file) {
        const content = await this.vault.read(file);
        this.historyData = JSON.parse(content);
      }
    } catch (error) {
      // 文件不存在或解析失败，使用空数据
      this.historyData = { records: [] };
    }
  }

  async save(): Promise<void> {
    await this.ensureHistoryFileExists();
    const file = this.vault.getFile(this.historyPath);
    if (file) {
      await this.vault.modify(file, JSON.stringify(this.historyData, null, 2));
    } else {
      await this.vault.create(this.historyPath, JSON.stringify(this.historyData, null, 2));
    }
  }

  private async ensureHistoryFileExists(): Promise<void> {
    try {
      const file = this.vault.getFile(this.historyPath);
      if (!file) {
        await this.vault.create(this.historyPath, JSON.stringify({ records: [] }, null, 2));
      }
    } catch (error) {
      await this.vault.create(this.historyPath, JSON.stringify({ records: [] }, null, 2));
    }
  }

  async addRecord(
    prompt: string,
    model: ModelType,
    size: string,
    localPath: string,
    remoteUrl: string,
    status: 'success' | 'failed',
    errorMessage?: string
  ): Promise<HistoryRecord> {
    const record: HistoryRecord = {
      id: generateRecordId(),
      prompt,
      model,
      size,
      timestamp: new Date().toISOString(),
      localPath,
      remoteUrl: status === 'success' ? remoteUrl : undefined,
      cost: status === 'success' ? calculateCost(model) : 0,
      status,
      errorMessage,
    };

    // 添加到记录头部
    this.historyData.records.unshift(record);

    // 检查是否超过上限
    if (this.historyData.records.length > this.settings.historyLimit) {
      this.historyData.records = this.historyData.records.slice(
        0,
        this.settings.historyLimit
      );
    }

    await this.save();
    return record;
  }

  getRecords(): HistoryRecord[] {
    return this.historyData.records;
  }

  getRecordById(id: string): HistoryRecord | undefined {
    return this.historyData.records.find((r) => r.id === id);
  }

  async deleteRecord(id: string): Promise<void> {
    this.historyData.records = this.historyData.records.filter((r) => r.id !== id);
    await this.save();
  }

  async clearHistory(): Promise<void> {
    this.historyData.records = [];
    await this.save();
  }

  searchRecords(query: string): HistoryRecord[] {
    const lowerQuery = query.toLowerCase();
    return this.historyData.records.filter((r) =>
      r.prompt.toLowerCase().includes(lowerQuery)
    );
  }

  filterByModel(model: ModelType): HistoryRecord[] {
    return this.historyData.records.filter((r) => r.model === model);
  }

  getStatistics(): Statistics {
    const stats: Statistics = {
      totalCalls: 0,
      totalCost: 0,
      byModel: {},
      byDate: {},
    };

    const today = getTodayDate();

    for (const record of this.historyData.records) {
      if (record.status === 'success') {
        stats.totalCalls++;
        stats.totalCost += record.cost;

        // 按模型统计
        if (!stats.byModel[record.model]) {
          stats.byModel[record.model] = { calls: 0, cost: 0 };
        }
        stats.byModel[record.model]!.calls++;
        stats.byModel[record.model]!.cost += record.cost;

        // 按日期统计
        const date = record.timestamp.split('T')[0];
        if (!stats.byDate[date]) {
          stats.byDate[date] = { calls: 0, cost: 0 };
        }
        stats.byDate[date]!.calls++;
        stats.byDate[date]!.cost += record.cost;
      }
    }

    return stats;
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
  }
}

export function createHistoryManager(
  vault: any,
  historyPath: string,
  settings: PluginSettings
): HistoryManager {
  return new HistoryManager(vault, historyPath, settings);
}
