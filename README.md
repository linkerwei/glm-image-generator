# GLM Image Generator - Obsidian 插件

调用智谱 AI GLM 图像生成 API，在 Obsidian 中快速生成高质量图片。

## ✨ 功能特性

- 🎨 **图片生成** - 通过文本提示词生成图片
- 🎯 **多模型支持** - 支持 GLM-Image 和 CogView-4
- 📐 **多种分辨率** - 预设尺寸 + 自定义分辨率
- 📝 **提示词模板** - 内置常用提示词模板库
- 💾 **自动保存** - 自动下载图片到本地
- 📄 **快速插入** - 一键插入到 Markdown 文档
- 🔧 **API Key 验证** - 验证 API Key 有效性
- 💰 **成本统计** - 统计 API 调用次数和成本

## 📦 安装

### 方法 1：手动安装

1. 下载 `main.js`、`manifest.json`、`styles.css`
2. 创建目录：`你的vault/.obsidian/plugins/glm-image-generator/`
3. 将文件复制到该目录
4. 重启 Obsidian 并启用插件

### 方法 2：BRAT 安装（推荐）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中添加仓库 URL：`https://github.com/linkerwei/glm-image-generator`
3. 点击安装

## 🚀 使用方法

### 1. 配置 API Key

1. 打开插件设置
2. 输入智谱 AI API Key（[获取 API Key](https://open.bigmodel.cn/)）
3. 点击"验证"按钮验证

### 2. 生成图片

**方法 1：命令面板**
- 按 `Ctrl+P`（Windows）或 `Cmd+P`（Mac）
- 输入 "GLM 生成图片"
- 输入提示词、选择模型和分辨率
- 点击"生成图片"

**方法 2：从剪贴板**
- 复制提示词到剪贴板
- 按 `Ctrl+P` 输入 "从剪贴板生成图片"

### 3. 插入到文档

生成成功后：
- 点击"插入到文档"按钮
- 图片会自动插入到当前光标位置

## 💡 使用示例

### 提示词示例

```
一只可爱的小猫咪，坐在阳光明媚的窗台上，背景是蓝天白云
```

```
科技感的微服务架构示意图，简洁现代风格，浅色背景
```

```
中国传统节日春节主题海报，红色喜庆氛围，文字排版精美
```

## ⚙️ 设置说明

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| API Key | - | 智谱 AI API Key |
| 默认模型 | GLM-Image | 优先使用的模型 |
| 默认分辨率 | 1280x1280 | 默认图片尺寸 |
| 图片保存路径 | 附件/glm-images/ | 图片保存目录 |
| 自动插入 | 开启 | 生成后自动插入到文档 |
| 历史记录上限 | 1000 | 最多保存的历史记录数 |

## 📊 模型对比

| 模型 | 价格 | 特点 |
|------|------|------|
| GLM-Image | 0.1元/次 | 文字渲染强，适合海报、PPT、科普图 |
| CogView-4 | 0.1元/次 | 中文场景强，适合餐饮、电商、游戏素材 |

## 🔧 开发

### 构建

```bash
npm install
npm run build
```

### 测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 📝 更新日志

### v1.0.0 (2026-03-13)

- ✨ 初始版本发布
- 🎨 支持图片生成
- 🔧 支持 API Key 验证
- 💾 支持自动保存和插入
- 📊 支持成本统计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的知识库工具
- [智谱 AI](https://open.bigmodel.cn/) - GLM 图像生成 API

---

**注意**：使用本插件需要智谱 AI 账号和 API Key，API 调用会产生费用（GLM-Image: 0.1元/次）。
