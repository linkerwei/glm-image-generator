import {
  HistoryRecord,
  HistoryData,
  ModelType,
  Statistics,
  PluginSettings,
  BatchHistoryRecord,
  calculateCost,
  getTodayDate,
  generateRecordId,
} from '../types';

export class HistoryManager {
  private vault: any;
  private historyPath: string;
  private historyData: HistoryData;
  private settings: PluginSettings;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(vault: any, historyPath: string, settings: PluginSettings) {
    this.vault = vault;
    this.historyPath = historyPath;
    this.settings = settings;
    this.historyData = { records: [] };
  }

  async load(): Promise<void> {
    try {
      const file = this.vault.getAbstractFileByPath(this.historyPath);
      if (file) {
        const content = await this.vault.read(file);
        this.historyData = JSON.parse(content);
      }
    } catch (error) {
      this.historyData = { records: [] };
    }
  }

  async save(): Promise<void> {
    const data = JSON.stringify(this.historyData, null, 2);

    try {
      const file = this.vault.getAbstractFileByPath(this.historyPath);

      if (file) {
        await this.vault.modify(file, data);
      } else {
        await this.vault.create(this.historyPath, data);
      }
    } catch (error) {
      // 静默失败 - 历史记录保存失败不影响核心功能
      console.debug('历史记录保存失败（静默）:', error);
    }
  }

  /**
   * 防抖保存 - 避免频繁保存
   */
  private async debouncedSave(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    return new Promise((resolve) => {
      this.saveTimer = setTimeout(async () => {
        await this.save();
        this.saveTimer = null;
        resolve();
      }, 500);
    });
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

    this.historyData.records.unshift(record);

    if (this.historyData.records.length > this.settings.historyLimit) {
      this.historyData.records = this.historyData.records.slice(
        0,
        this.settings.historyLimit
      );
    }

    // 使用防抖保存
    await this.debouncedSave();
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

        if (!stats.byModel[record.model]) {
          stats.byModel[record.model] = { calls: 0, cost: 0 };
        }
        stats.byModel[record.model]!.calls++;
        stats.byModel[record.model]!.cost += record.cost;

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

  /**
   * 添加批量生成记录
   */
  async addBatchRecord(record: BatchHistoryRecord): Promise<void> {
    const batchRecord: HistoryRecord = {
      id: record.id,
      prompt: `[批量生成] ${record.sourceFile}`,
      model: 'glm-image' as ModelType,
      size: 'batch',
      timestamp: record.timestamp,
      localPath: '',
      cost: record.totalCost,
      status: record.failedCount === 0 ? 'success' : 'failed',
      errorMessage: record.failedCount > 0
        ? `部分任务失败: ${record.failedCount}/${record.totalTasks}`
        : undefined,
    };

    this.historyData.records.unshift(batchRecord);

    if (this.historyData.records.length > this.settings.historyLimit) {
      this.historyData.records = this.historyData.records.slice(
        0,
        this.settings.historyLimit
      );
    }

    await this.save();

    // 保存详细的批量记录到单独文件
    await this.saveDetailedBatchRecord(record);
  }

  /**
   * 保存详细的批量记录
   */
  private async saveDetailedBatchRecord(record: BatchHistoryRecord): Promise<void> {
    const batchHistoryPath = this.historyPath.replace('.json', '-batch.json');

    try {
      let batchRecords: BatchHistoryRecord[] = [];

      const file = this.vault.getAbstractFileByPath(batchHistoryPath);
      if (file) {
        try {
          const content = await this.vault.read(file);
          batchRecords = JSON.parse(content);
        } catch {
          batchRecords = [];
        }
      }

      batchRecords.unshift(record);

      if (batchRecords.length > this.settings.historyLimit) {
        batchRecords = batchRecords.slice(0, this.settings.historyLimit);
      }

      const data = JSON.stringify(batchRecords, null, 2);
      const existingFile = this.vault.getAbstractFileByPath(batchHistoryPath);
      if (existingFile) {
        await this.vault.modify(existingFile, data);
      } else {
        await this.vault.create(batchHistoryPath, data);
      }
    } catch (error) {
      console.debug('保存批量历史记录失败（静默）:', error);
    }
  }
}

export function createHistoryManager(
  vault: any,
  historyPath: string,
  settings: PluginSettings
): HistoryManager {
  return new HistoryManager(vault, historyPath, settings);
}
