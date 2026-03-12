"use strict";
/**
 * GLM API Client 单元测试
 *
 * 注意：由于需要网络请求，这些测试使用模拟方式验证逻辑
 */
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../src/types");
describe('工具函数测试', () => {
    describe('isValidResolution', () => {
        it('应该返回 true 对于有效的分辨率', () => {
            expect((0, types_1.isValidResolution)(1280, 1280)).toBe(true);
            expect((0, types_1.isValidResolution)(1024, 1024)).toBe(true);
            expect((0, types_1.isValidResolution)(512, 512)).toBe(true);
            expect((0, types_1.isValidResolution)(2048, 2048)).toBe(true);
        });
        it('应该返回 false 对于无效的分辨率（太小）', () => {
            expect((0, types_1.isValidResolution)(511, 512)).toBe(false);
            expect((0, types_1.isValidResolution)(512, 511)).toBe(false);
        });
        it('应该返回 false 对于无效的分辨率（太大）', () => {
            expect((0, types_1.isValidResolution)(2049, 2048)).toBe(false);
            expect((0, types_1.isValidResolution)(2048, 2049)).toBe(false);
        });
        it('应该返回 false 对于不是 32 的整数倍的分辨率', () => {
            expect((0, types_1.isValidResolution)(1281, 1280)).toBe(false);
            expect((0, types_1.isValidResolution)(1280, 1281)).toBe(false);
            expect((0, types_1.isValidResolution)(1000, 1000)).toBe(false);
        });
        // 测试边界值
        it('应该正确处理边界值', () => {
            // 最小有效值
            expect((0, types_1.isValidResolution)(512, 512)).toBe(true);
            // 最大有效值
            expect((0, types_1.isValidResolution)(2048, 2048)).toBe(true);
            // 32 的倍数
            expect((0, types_1.isValidResolution)(544, 576)).toBe(true);
        });
    });
    describe('calculateCost', () => {
        it('应该返回正确的 GLM-Image 成本', () => {
            expect((0, types_1.calculateCost)('glm-image')).toBe(0.1);
        });
        it('应该返回正确的 CogView-4 成本', () => {
            expect((0, types_1.calculateCost)('cogView-4-250304')).toBe(0.1);
        });
        it('应该返回默认成本对于未知模型', () => {
            expect((0, types_1.calculateCost)('unknown-model')).toBe(0);
        });
    });
    describe('generateFileName', () => {
        it('应该生成以 glm- 开头的文件名', () => {
            const fileName = (0, types_1.generateFileName)();
            expect(fileName.startsWith('glm-')).toBe(true);
        });
        it('应该生成 .png 扩展名的文件名', () => {
            const fileName = (0, types_1.generateFileName)();
            expect(fileName.endsWith('.png')).toBe(true);
        });
        it('每次调用应该生成不同的文件名', () => {
            const fileName1 = (0, types_1.generateFileName)();
            const fileName2 = (0, types_1.generateFileName)();
            expect(fileName1).not.toBe(fileName2);
        });
        it('文件名格式应该正确', () => {
            const fileName = (0, types_1.generateFileName)();
            // 格式: glm-{timestamp}-{random}.png
            expect(fileName).toMatch(/^glm-\d+-[a-z0-9]+\.png$/);
        });
    });
    describe('generateRecordId', () => {
        it('应该生成包含时间戳和随机字符串的 ID', () => {
            const id = (0, types_1.generateRecordId)();
            expect(id).toMatch(/^\d+-[a-z0-9]+$/);
        });
        it('每次调用应该生成不同的 ID', () => {
            const id1 = (0, types_1.generateRecordId)();
            const id2 = (0, types_1.generateRecordId)();
            expect(id1).not.toBe(id2);
        });
    });
    describe('getTodayDate', () => {
        it('应该返回今天的日期，格式为 YYYY-MM-DD', () => {
            const date = (0, types_1.getTodayDate)();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
        it('应该返回正确的日期', () => {
            const today = new Date().toISOString().split('T')[0];
            expect((0, types_1.getTodayDate)()).toBe(today);
        });
    });
});
describe('类型定义测试', () => {
    it('ModelType 应该接受有效的模型值', () => {
        const models = ['glm-image', 'cogView-4-250304'];
        expect(models).toContain('glm-image');
        expect(models).toContain('cogView-4-250304');
    });
    it('分辨率预设应该包含所有标准尺寸', () => {
        const { RESOLUTION_PRESETS } = require('../src/types');
        expect(RESOLUTION_PRESETS.length).toBe(5);
        expect(RESOLUTION_PRESETS[0]).toEqual(expect.objectContaining({ label: '1:1 (1280x1280)', width: 1280, height: 1280 }));
    });
    it('模型列表应该包含所有支持的模型', () => {
        const { MODELS } = require('../src/types');
        expect(MODELS.length).toBe(2);
        expect(MODELS[0].id).toBe('glm-image');
        expect(MODELS[1].id).toBe('cogView-4-250304');
    });
    it('默认设置应该包含所有必需字段', () => {
        const { DEFAULT_SETTINGS } = require('../src/types');
        expect(DEFAULT_SETTINGS).toHaveProperty('apiKey');
        expect(DEFAULT_SETTINGS).toHaveProperty('defaultModel');
        expect(DEFAULT_SETTINGS).toHaveProperty('defaultResolution');
        expect(DEFAULT_SETTINGS).toHaveProperty('savePath');
        expect(DEFAULT_SETTINGS).toHaveProperty('autoInsert');
        expect(DEFAULT_SETTINGS).toHaveProperty('historyLimit');
        expect(DEFAULT_SETTINGS).toHaveProperty('maxConcurrent');
        expect(DEFAULT_SETTINGS).toHaveProperty('retryCount');
        expect(DEFAULT_SETTINGS).toHaveProperty('costThreshold');
    });
});
describe('数据验证测试', () => {
    it('应该验证分辨率字符串格式', () => {
        const validResolutions = ['1280x1280', '1024x1024', '1728x960'];
        const invalidResolutions = ['abc', '1280', ''];
        validResolutions.forEach(res => {
            const [w, h] = res.split('x').map(Number);
            expect((0, types_1.isValidResolution)(w, h)).toBe(true);
        });
    });
    it('应该计算正确的成本', () => {
        expect((0, types_1.calculateCost)('glm-image')).toBe(0.1);
        expect((0, types_1.calculateCost)('cogView-4-250304')).toBe(0.1);
        // 批量计算
        const models = ['glm-image', 'glm-image', 'cogView-4-250304'];
        const totalCost = models
            .reduce((sum, model) => sum + (0, types_1.calculateCost)(model), 0);
        expect(totalCost).toBeCloseTo(0.3);
    });
});
