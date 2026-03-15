// 类型定义文件

export type ModelType = 'glm-image' | 'cogView-4-250304';

export interface ModelInfo {
  id: ModelType;
  name: string;
  description: string;
  price: number;
  maxPromptLength: number;
  features: string[];
}

export const MODELS: ModelInfo[] = [
  {
    id: 'glm-image',
    name: 'GLM-Image',
    description: '智谱新旗舰图像生成模型，擅长文字渲染',
    price: 0.1,
    maxPromptLength: 1000,
    features: [
      '文字渲染（海报、PPT、科普图）',
      '商业海报',
      '科普插画',
      '多格图画',
      '社交媒体图文',
    ],
  },
  {
    id: 'cogView-4-250304',
    name: 'CogView-4',
    description: '支持生成汉字的开源文生图模型',
    price: 0.1,
    maxPromptLength: 1000,
    features: [
      '中文文字生成',
      '餐饮美食宣传',
      '电商产品配图',
      '游戏素材创作',
      '文旅宣传制作',
    ],
  },
];

export interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '1:1 (1280x1280)', width: 1280, height: 1280, aspectRatio: '1:1' },
  { label: '3:4 (1056x1568)', width: 1056, height: 1568, aspectRatio: '3:4' },
  { label: '4:3 (1568x1056)', width: 1568, height: 1056, aspectRatio: '4:3' },
  { label: '16:9 (1728x960)', width: 1728, height: 960, aspectRatio: '16:9' },
  { label: '9:16 (960x1728)', width: 960, height: 1728, aspectRatio: '9:16' },
];

export interface PluginSettings {
  apiKey: string;
  defaultModel: ModelType;
  defaultResolution: string;
  savePath: string;
  autoInsert: boolean;
  saveRemoteUrl: boolean;
  historyLimit: number;
  maxConcurrent: number;
  retryCount: number;
  costThreshold: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  apiKey: '',
  defaultModel: 'glm-image',
  defaultResolution: '1280x1280',
  savePath: '附件/glm-images/',
  autoInsert: true,
  saveRemoteUrl: false,
  historyLimit: 1000,
  maxConcurrent: 3,
  retryCount: 3,
  costThreshold: 10,
};

export interface Statistics {
  totalCalls: number;
  totalCost: number;
  byModel: {
    [key in ModelType]?: {
      calls: number;
      cost: number;
    };
  };
  byDate: {
    [date: string]: {
      calls: number;
      cost: number;
    };
  };
}

export interface HistoryRecord {
  id: string;
  prompt: string;
  model: ModelType;
  size: string;
  timestamp: string;
  localPath: string;
  remoteUrl?: string;
  cost: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface HistoryData {
  records: HistoryRecord[];
}

export interface GLMImageRequest {
  model: ModelType;
  prompt: string;
  size?: string;
}

export interface GLMImageResponse {
  created: number;
  data: Array<{
    url: string;
  }>;
}

export interface GLMApiError {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

export interface GenerationTask {
  id: string;
  prompt: string;
  model: ModelType;
  size: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  result?: {
    imageUrl: string;
    localPath: string;
  };
  error?: string;
  retryCount: number;
}

export interface BatchGenerationTask {
  id: string;
  tasks: GenerationTask[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  status: 'running' | 'completed';
}

// 工具函数
export function isValidResolution(width: number, height: number): boolean {
  if (width < 512 || width > 2048 || height < 512 || height > 2048) {
    return false;
  }
  if (width % 32 !== 0 || height % 32 !== 0) {
    return false;
  }
  return true;
}

export function calculateCost(model: ModelType): number {
  const costs: Record<ModelType, number> = {
    'glm-image': 0.1,
    'cogView-4-250304': 0.1,
  };
  return costs[model] || 0;
}

export function generateFileName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `glm-${timestamp}-${random}.png`;
}

export function generateRecordId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ========== 批量生成相关类型 ==========

/**
 * 批量任务全局配置(YAML Frontmatter)
 */
export interface BatchConfig {
  /** 使用的模型,默认 'glm-image' */
  model?: ModelType;
  /** 分辨率,默认 '1280x1280' */
  resolution?: string;
  /** 是否自动插入结果,默认 true */
  auto_insert?: boolean;
}

/**
 * 单个任务参数覆盖(HTML 注释)
 */
export interface TaskOverrideParams {
  model?: ModelType;
  resolution?: string;
}

/**
 * 单个批量任务
 */
export interface BatchTask {
  /** 任务 ID */
  id: string;
  /** 提示词内容 */
  prompt: string;
  /** 使用的模型(可能被覆盖) */
  model: ModelType;
  /** 分辨率(可能被覆盖) */
  resolution: string;
  /** 在文件中的行号(0-based) */
  lineNumber: number;
  /** 任务状态 */
  status: 'pending' | 'generating' | 'success' | 'failed';
  /** 生成结果(成功时) */
  result?: {
    localPath: string;
    remoteUrl?: string;
  };
  /** 错误信息(失败时) */
  error?: string;
  /** 重试次数 */
  retryCount: number;
}

/**
 * 解析后的批量任务文件
 */
export interface ParsedBatchFile {
  /** 全局配置 */
  config: BatchConfig;
  /** 任务列表 */
  tasks: BatchTask[];
  /** 原始文件内容 */
  originalContent: string;
  /** 源文件对象 */
  sourceFile: any; // TFile 类型
}

/**
 * 批量生成进度
 */
export interface BatchProgress {
  /** 当前任务索引(1-based) */
  current: number;
  /** 总任务数 */
  total: number;
  /** 当前正在处理的任务 */
  currentTask?: BatchTask;
  /** 已成功数量 */
  successCount: number;
  /** 已失败数量 */
  failedCount: number;
}

/**
 * 批量生成结果
 */
export interface BatchResult {
  /** 批量任务 ID */
  batchId: string;
  /** 源文件路径 */
  sourceFilePath: string;
  /** 总任务数 */
  totalCount: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 总成本(元) */
  totalCost: number;
  /** 任务详情 */
  tasks: BatchTask[];
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 执行状态 */
  status: 'completed' | 'partial_completed' | 'failed';
}

/**
 * 批量生成历史记录
 */
export interface BatchHistoryRecord {
  /** 记录 ID */
  id: string;
  /** 类型标识 */
  type: 'batch';
  /** 执行时间 */
  timestamp: string;
  /** 源文件路径 */
  sourceFile: string;
  /** 总任务数 */
  totalTasks: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 总成本 */
  totalCost: number;
  /** 任务详情 */
  tasks: Array<{
    prompt: string;
    status: 'success' | 'failed';
    localPath?: string;
    error?: string;
  }>;
}

// ========== 批量生成工具函数 ==========

/**
 * 检查分辨率字符串是否有效(格式: WxH)
 */
export function isValidResolutionString(resolution: string): boolean {
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) return false;

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);

  return isValidResolution(width, height);
}

/**
 * 解析分辨率字符串
 */
export function parseResolution(resolution: string): { width: number; height: number } {
  const [width, height] = resolution.split('x').map(s => parseInt(s, 10));
  return { width, height };
}

/**
 * 合并全局配置和任务参数覆盖
 */
export function mergeTaskParams(
  globalConfig: BatchConfig,
  override?: TaskOverrideParams
): { model: ModelType; resolution: string } {
  return {
    model: override?.model || globalConfig.model || 'glm-image',
    resolution: override?.resolution || globalConfig.resolution || '1280x1280',
  };
}
