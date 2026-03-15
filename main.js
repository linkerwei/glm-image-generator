"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types.ts
function isValidResolution(width, height) {
  if (width < 512 || width > 2048 || height < 512 || height > 2048) {
    return false;
  }
  if (width % 32 !== 0 || height % 32 !== 0) {
    return false;
  }
  return true;
}
function calculateCost(model) {
  const costs = {
    "glm-image": 0.1,
    "cogView-4-250304": 0.1
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
function getTodayDate() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function isValidResolutionString(resolution) {
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) return false;
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  return isValidResolution(width, height);
}
function mergeTaskParams(globalConfig, override) {
  return {
    model: (override == null ? void 0 : override.model) || globalConfig.model || "glm-image",
    resolution: (override == null ? void 0 : override.resolution) || globalConfig.resolution || "1280x1280"
  };
}
var MODELS, RESOLUTION_PRESETS, DEFAULT_SETTINGS;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    MODELS = [
      {
        id: "glm-image",
        name: "GLM-Image",
        description: "\u667A\u8C31\u65B0\u65D7\u8230\u56FE\u50CF\u751F\u6210\u6A21\u578B\uFF0C\u64C5\u957F\u6587\u5B57\u6E32\u67D3",
        price: 0.1,
        maxPromptLength: 1e3,
        features: [
          "\u6587\u5B57\u6E32\u67D3\uFF08\u6D77\u62A5\u3001PPT\u3001\u79D1\u666E\u56FE\uFF09",
          "\u5546\u4E1A\u6D77\u62A5",
          "\u79D1\u666E\u63D2\u753B",
          "\u591A\u683C\u56FE\u753B",
          "\u793E\u4EA4\u5A92\u4F53\u56FE\u6587"
        ]
      },
      {
        id: "cogView-4-250304",
        name: "CogView-4",
        description: "\u652F\u6301\u751F\u6210\u6C49\u5B57\u7684\u5F00\u6E90\u6587\u751F\u56FE\u6A21\u578B",
        price: 0.1,
        maxPromptLength: 1e3,
        features: [
          "\u4E2D\u6587\u6587\u5B57\u751F\u6210",
          "\u9910\u996E\u7F8E\u98DF\u5BA3\u4F20",
          "\u7535\u5546\u4EA7\u54C1\u914D\u56FE",
          "\u6E38\u620F\u7D20\u6750\u521B\u4F5C",
          "\u6587\u65C5\u5BA3\u4F20\u5236\u4F5C"
        ]
      }
    ];
    RESOLUTION_PRESETS = [
      { label: "1:1 (1280x1280)", width: 1280, height: 1280, aspectRatio: "1:1" },
      { label: "3:4 (1056x1568)", width: 1056, height: 1568, aspectRatio: "3:4" },
      { label: "4:3 (1568x1056)", width: 1568, height: 1056, aspectRatio: "4:3" },
      { label: "16:9 (1728x960)", width: 1728, height: 960, aspectRatio: "16:9" },
      { label: "9:16 (960x1728)", width: 960, height: 1728, aspectRatio: "9:16" }
    ];
    DEFAULT_SETTINGS = {
      apiKey: "",
      defaultModel: "glm-image",
      defaultResolution: "1280x1280",
      savePath: "\u9644\u4EF6/glm-images/",
      autoInsert: true,
      saveRemoteUrl: false,
      historyLimit: 1e3,
      maxConcurrent: 3,
      retryCount: 3,
      costThreshold: 10
    };
  }
});

// src/ui/generator-modal.ts
var generator_modal_exports = {};
__export(generator_modal_exports, {
  GeneratorModal: () => GeneratorModal
});
var import_obsidian, GeneratorModal;
var init_generator_modal = __esm({
  "src/ui/generator-modal.ts"() {
    "use strict";
    import_obsidian = require("obsidian");
    init_types();
    GeneratorModal = class extends import_obsidian.Modal {
      constructor(app, generator, settings, onSuccess, onCloseCallback) {
        super(app);
        // 表单状态
        this.prompt = "";
        this.isGenerating = false;
        // UI 元素
        this.promptTextarea = null;
        this.charCountEl = null;
        this.generateBtn = null;
        this.statusEl = null;
        this.previewContainer = null;
        this.generator = generator;
        this.settings = settings;
        this.model = settings.defaultModel;
        this.resolution = settings.defaultResolution;
        this.autoInsert = settings.autoInsert;
        this.onSuccess = onSuccess;
        this.onCloseCallback = onCloseCallback;
      }
      display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "GLM \u56FE\u7247\u751F\u6210", cls: "glm-modal-title" });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u63D0\u793A\u8BCD *",
          cls: "glm-form-label"
        });
        this.promptTextarea = contentEl.createEl("textarea", {
          cls: "glm-textarea",
          attr: {
            placeholder: "\u63CF\u8FF0\u4F60\u60F3\u751F\u6210\u7684\u56FE\u7247...",
            rows: 4
          }
        });
        this.promptTextarea.addEventListener("input", () => {
          this.prompt = this.promptTextarea.value;
          this.updateCharCount();
          this.validateForm();
        });
        this.charCountEl = contentEl.createEl("div", {
          cls: "glm-char-count"
        });
        this.updateCharCount();
        new import_obsidian.Setting(contentEl).addButton((button) => {
          button.setButtonText("\u6A21\u677F\u5E93");
          button.onClick(() => {
            this.showTemplates();
          });
        });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u6A21\u578B",
          cls: "glm-form-label"
        });
        new import_obsidian.Setting(contentEl).addDropdown((dropdown) => {
          MODELS.forEach((model) => {
            dropdown.addOption(model.id, `${model.name} (${model.price}\u5143/\u6B21)`);
          });
          dropdown.setValue(this.model);
          dropdown.onChange(async (value) => {
            this.model = value;
            this.updateCharCount();
            this.validateForm();
          });
        });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u5206\u8FA8\u7387",
          cls: "glm-form-label"
        });
        new import_obsidian.Setting(contentEl).addDropdown((dropdown) => {
          RESOLUTION_PRESETS.forEach((preset) => {
            dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
          });
          dropdown.setValue(this.resolution);
          dropdown.onChange((value) => {
            this.resolution = value;
          });
        });
        new import_obsidian.Setting(contentEl).addToggle((toggle) => {
          toggle.setValue(this.autoInsert);
          toggle.onChange((value) => {
            this.autoInsert = value;
          });
        }).setName("\u751F\u6210\u540E\u81EA\u52A8\u63D2\u5165\u5230\u6587\u6863");
        this.statusEl = contentEl.createEl("div", {
          cls: "glm-status"
        });
        this.previewContainer = contentEl.createEl("div", {
          cls: "glm-preview-container"
        });
        const buttonContainer = contentEl.createEl("div", {
          cls: "glm-button-container"
        });
        buttonContainer.createEl("button", {
          text: "\u53D6\u6D88",
          cls: "glm-btn glm-btn-secondary"
        }).addEventListener("click", () => {
          this.close();
        });
        this.generateBtn = buttonContainer.createEl("button", {
          text: "\u751F\u6210\u56FE\u7247",
          cls: "glm-btn glm-btn-primary"
        });
        this.generateBtn.addEventListener("click", () => {
          this.generateImage();
        });
        this.validateForm();
      }
      updateCharCount() {
        if (!this.charCountEl || !this.promptTextarea) return;
        const maxLength = this.model === "glm-image" ? 1e3 : 1e3;
        const currentLength = this.prompt.length;
        this.charCountEl.textContent = `${currentLength}/${maxLength} \u5B57\u7B26`;
        if (currentLength > maxLength) {
          this.charCountEl.addClass("glm-char-count-error");
        } else {
          this.charCountEl.removeClass("glm-char-count-error");
        }
      }
      validateForm() {
        if (!this.generateBtn) return;
        const isValid = this.prompt.trim().length > 0 && this.prompt.length <= (this.model === "glm-image" ? 1e3 : 1e3);
        this.generateBtn.disabled = !isValid || this.isGenerating;
      }
      showTemplates() {
        const templates = [
          { name: "\u6982\u5FF5\u56FE", prompt: "\u7B80\u6D01\u7684{\u6982\u5FF5\u540D\u79F0}\u793A\u610F\u56FE\uFF0C\u6D45\u8272\u80CC\u666F\uFF0C\u6E05\u6670\u7684\u4FE1\u606F\u5C42\u6B21\uFF0C\u73B0\u4EE3\u6241\u5E73\u5316\u8BBE\u8BA1" },
          { name: "\u6D41\u7A0B\u56FE", prompt: "{\u6D41\u7A0B\u540D\u79F0}\u6D41\u7A0B\u56FE\uFF0C\u6B65\u9AA4\u6E05\u6670\uFF0C\u7BAD\u5934\u8FDE\u63A5\uFF0C\u914D\u8272\u67D4\u548C" },
          { name: "\u601D\u7EF4\u5BFC\u56FE", prompt: "{\u4E3B\u9898}\u601D\u7EF4\u5BFC\u56FE\uFF0C\u4E2D\u5FC3\u4E3B\u9898\u7A81\u51FA\uFF0C\u5206\u652F\u6E05\u6670\uFF0C\u989C\u8272\u4E30\u5BCC" },
          { name: "\u8282\u65E5\u6D77\u62A5", prompt: "{\u8282\u65E5\u540D\u79F0}\u4E3B\u9898\u6D77\u62A5\uFF0C{\u5177\u4F53\u5143\u7D20}\uFF0C\u559C\u5E86\u6C1B\u56F4\uFF0C\u6587\u5B57\u6392\u7248\u7CBE\u7F8E" },
          { name: "\u4EA7\u54C1\u5BA3\u4F20", prompt: "{\u4EA7\u54C1\u540D\u79F0}\u4EA7\u54C1\u5BA3\u4F20\u56FE\uFF0C{\u4EA7\u54C1\u7279\u70B9}\uFF0C\u9AD8\u8D28\u91CF\uFF0C\u4E13\u4E1A\u6444\u5F71\u98CE\u683C" },
          { name: "\u5C01\u9762\u56FE", prompt: "\u793E\u4EA4\u5A92\u4F53\u5C01\u9762\uFF0C{\u4E3B\u9898}\uFF0C16:9\u6BD4\u4F8B\uFF0C\u89C6\u89C9\u51B2\u51FB\u529B\u5F3A" },
          { name: "\u77E5\u8BC6\u5361\u7247", prompt: "{\u77E5\u8BC6\u70B9\u5185\u5BB9}\u77E5\u8BC6\u5361\u7247\uFF0C\u56FE\u6587\u5E76\u8302\uFF0C\u6613\u4E8E\u7406\u89E3\uFF0C\u7F8E\u89C2\u5927\u65B9" },
          { name: "\u5F15\u8A00\u5361\u7247", prompt: "\u5F15\u8A00\u5361\u7247\uFF0C'\u5F15\u8A00\u5185\u5BB9'\uFF0C\u4F18\u96C5\u7684\u6392\u7248\uFF0C\u80CC\u666F\u7B80\u7EA6" }
        ];
        const templateModal = new import_obsidian.Modal(this.app);
        templateModal.titleEl.textContent = "\u63D0\u793A\u8BCD\u6A21\u677F";
        const listEl = templateModal.contentEl.createEl("div", {
          cls: "glm-template-list"
        });
        templates.forEach((template) => {
          const itemEl = listEl.createEl("div", {
            cls: "glm-template-item"
          });
          itemEl.createEl("strong", { text: template.name });
          itemEl.createEl("p", {
            text: template.prompt,
            cls: "glm-template-prompt"
          });
          itemEl.addEventListener("click", () => {
            const prompt = template.prompt.replace(/\{[^}]+\}/g, "");
            this.promptTextarea.value = prompt;
            this.prompt = prompt;
            this.updateCharCount();
            this.validateForm();
            templateModal.close();
          });
        });
        templateModal.open();
      }
      async generateImage() {
        var _a;
        if (this.isGenerating) return;
        if (!this.settings.apiKey) {
          new import_obsidian.Notice("\u8BF7\u5148\u914D\u7F6E API Key");
          return;
        }
        this.isGenerating = true;
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = "\u751F\u6210\u4E2D...";
        this.updateStatus("\u6B63\u5728\u751F\u6210\u56FE\u7247\uFF0C\u8BF7\u7A0D\u5019...");
        this.previewContainer.empty();
        try {
          const result = await this.generator.generateImage(
            this.prompt,
            this.model,
            this.resolution
          );
          this.updateStatus("\u751F\u6210\u6210\u529F\uFF01");
          const previewEl = this.previewContainer.createEl("div", {
            cls: "glm-preview"
          });
          try {
            const vault = this.app.vault;
            const file = vault.getFileByPath(result.localPath);
            if (file) {
              const blob = await vault.readBinary(file);
              const blobUrl = URL.createObjectURL(new Blob([blob], { type: "image/png" }));
              previewEl.createEl("img", {
                attr: { src: blobUrl },
                cls: "glm-preview-image"
              });
            }
          } catch (e) {
            previewEl.createEl("p", { text: "\u56FE\u7247\u5DF2\u4FDD\u5B58\u5230: " + result.localPath });
          }
          const actionContainer = this.previewContainer.createEl("div", {
            cls: "glm-action-buttons"
          });
          if (this.autoInsert || true) {
            actionContainer.createEl("button", {
              text: "\u63D2\u5165\u5230\u6587\u6863",
              cls: "glm-btn glm-btn-primary"
            }).addEventListener("click", () => {
              this.insertToDocument(result.localPath);
              this.close();
            });
          }
          actionContainer.createEl("button", {
            text: "\u5173\u95ED",
            cls: "glm-btn glm-btn-secondary"
          }).addEventListener("click", () => {
            this.close();
          });
          (_a = this.onSuccess) == null ? void 0 : _a.call(this, result.localPath);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "\u751F\u6210\u5931\u8D25";
          this.updateStatus(`\u751F\u6210\u5931\u8D25: ${errorMessage}`, true);
          new import_obsidian.Notice("\u751F\u6210\u5931\u8D25: " + errorMessage);
        } finally {
          this.isGenerating = false;
          this.generateBtn.disabled = false;
          this.generateBtn.textContent = "\u751F\u6210\u56FE\u7247";
        }
      }
      updateStatus(message, isError = false) {
        if (!this.statusEl) return;
        this.statusEl.textContent = message;
        if (isError) {
          this.statusEl.addClass("glm-status-error");
        } else {
          this.statusEl.removeClass("glm-status-error");
        }
      }
      insertToDocument(imagePath) {
        const fileName = imagePath.split("/").pop() || imagePath;
        const imageMarkdown = `![${this.prompt.slice(0, 50)}](${imagePath})`;
        const activeEditor = this.app.workspace.activeEditor;
        if (activeEditor && activeEditor.editor) {
          activeEditor.editor.replaceSelection(imageMarkdown + "\n");
          new import_obsidian.Notice("\u56FE\u7247\u5DF2\u63D2\u5165\u5230\u6587\u6863");
        } else {
          new import_obsidian.Notice("\u672A\u627E\u5230\u6D3B\u52A8\u7F16\u8F91\u5668");
        }
      }
      onClose() {
        var _a;
        (_a = this.onCloseCallback) == null ? void 0 : _a.call(this);
        super.onClose();
      }
    };
  }
});

// src/ui/history-panel.ts
var history_panel_exports = {};
__export(history_panel_exports, {
  HistoryPanel: () => HistoryPanel
});
var import_obsidian2, HistoryPanel;
var init_history_panel = __esm({
  "src/ui/history-panel.ts"() {
    "use strict";
    import_obsidian2 = require("obsidian");
    HistoryPanel = class extends import_obsidian2.Modal {
      constructor(app, historyManager) {
        super(app);
        this.historyManager = historyManager;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("glm-history-panel");
        contentEl.createEl("h2", { text: "\u56FE\u7247\u751F\u6210\u5386\u53F2\u8BB0\u5F55" });
        const records = this.historyManager.getRecords();
        if (records.length === 0) {
          contentEl.createEl("p", {
            text: "\u6682\u65E0\u5386\u53F2\u8BB0\u5F55",
            cls: "glm-empty-history"
          });
          return;
        }
        const stats = this.historyManager.getStatistics();
        const statsContainer = contentEl.createDiv({ cls: "glm-stats" });
        statsContainer.createEl("div", {
          text: `\u603B\u8BA1: ${stats.totalCalls} \u6B21\u751F\u6210`,
          cls: "glm-stat-item"
        });
        statsContainer.createEl("div", {
          text: `\u603B\u6210\u672C: \xA5${stats.totalCost.toFixed(2)}`,
          cls: "glm-stat-item"
        });
        const listContainer = contentEl.createDiv({ cls: "glm-history-list" });
        for (const record of records) {
          this.renderRecord(listContainer, record);
        }
        const buttonContainer = contentEl.createDiv({ cls: "glm-button-container" });
        buttonContainer.createEl("button", {
          text: "\u5173\u95ED"
        }).addEventListener("click", () => {
          this.close();
        });
        const clearBtn = buttonContainer.createEl("button", {
          text: "\u6E05\u7A7A\u5386\u53F2",
          cls: "glm-btn-danger"
        });
        clearBtn.addEventListener("click", async () => {
          const confirmed = confirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u5386\u53F2\u8BB0\u5F55\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002");
          if (confirmed) {
            await this.historyManager.clearHistory();
            new import_obsidian2.Notice("\u5386\u53F2\u8BB0\u5F55\u5DF2\u6E05\u7A7A");
            this.close();
          }
        });
      }
      /**
       * 渲染单条记录
       */
      renderRecord(container, record) {
        const recordEl = container.createDiv({ cls: "glm-history-record" });
        if (record.status === "success" && record.localPath) {
          const imageContainer = recordEl.createDiv({ cls: "glm-record-image" });
          const resourcePath = this.app.vault.adapter.getResourcePath(record.localPath);
          const img = imageContainer.createEl("img", {
            attr: {
              src: resourcePath,
              alt: record.prompt
            }
          });
          img.addEventListener("click", () => {
            this.showImagePreview(record.localPath);
          });
        } else {
          const placeholder = recordEl.createDiv({ cls: "glm-record-placeholder" });
          placeholder.createEl("span", { text: record.status === "failed" ? "\u274C" : "\u23F3" });
        }
        const infoContainer = recordEl.createDiv({ cls: "glm-record-info" });
        const promptEl = infoContainer.createDiv({ cls: "glm-record-prompt" });
        promptEl.createEl("strong", { text: "\u63D0\u793A\u8BCD:" });
        promptEl.createEl("span", { text: record.prompt.substring(0, 100) + (record.prompt.length > 100 ? "..." : "") });
        const detailsEl = infoContainer.createDiv({ cls: "glm-record-details" });
        const time = new Date(record.timestamp).toLocaleString("zh-CN");
        detailsEl.createEl("span", { text: `\u23F0 ${time}` });
        detailsEl.createEl("span", { text: `\u{1F3A8} ${record.model}` });
        detailsEl.createEl("span", { text: `\u{1F4D0} ${record.size}` });
        if (record.status === "success") {
          detailsEl.createEl("span", { text: `\u{1F4B0} \xA5${record.cost.toFixed(2)}` });
        } else if (record.errorMessage) {
          const errorEl = detailsEl.createEl("span", {
            text: `\u9519\u8BEF: ${record.errorMessage}`,
            cls: "glm-error-text"
          });
        }
        const actionsEl = infoContainer.createDiv({ cls: "glm-record-actions" });
        if (record.status === "success" && record.localPath) {
          actionsEl.createEl("button", {
            text: "\u590D\u5236\u94FE\u63A5"
          }).addEventListener("click", () => {
            navigator.clipboard.writeText(`![](${record.localPath})`);
            new import_obsidian2.Notice("\u56FE\u7247\u94FE\u63A5\u5DF2\u590D\u5236");
          });
          actionsEl.createEl("button", {
            text: "\u6253\u5F00\u6587\u4EF6"
          }).addEventListener("click", async () => {
            const file = this.app.vault.getAbstractFileByPath(record.localPath);
            if (file) {
              this.app.workspace.openLinkText(record.localPath, "", true);
            }
          });
        }
        actionsEl.createEl("button", {
          text: "\u5220\u9664",
          cls: "glm-btn-danger"
        }).addEventListener("click", async () => {
          await this.historyManager.deleteRecord(record.id);
          recordEl.remove();
          new import_obsidian2.Notice("\u8BB0\u5F55\u5DF2\u5220\u9664");
        });
      }
      /**
       * 显示图片预览
       */
      showImagePreview(imagePath) {
        const modal = new import_obsidian2.Modal(this.app);
        modal.onOpen = () => {
          const { contentEl } = modal;
          contentEl.addClass("glm-image-preview-modal");
          const img = contentEl.createEl("img", {
            attr: {
              src: imagePath
            }
          });
          img.style.maxWidth = "100%";
          img.style.maxHeight = "80vh";
          contentEl.addEventListener("click", () => {
            modal.close();
          });
        };
        modal.open();
      }
      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    };
  }
});

// src/ui/batch-generator-modal.ts
var batch_generator_modal_exports = {};
__export(batch_generator_modal_exports, {
  BatchGeneratorModal: () => BatchGeneratorModal
});
var import_obsidian3, BatchGeneratorModal;
var init_batch_generator_modal = __esm({
  "src/ui/batch-generator-modal.ts"() {
    "use strict";
    import_obsidian3 = require("obsidian");
    init_types();
    init_history_panel();
    BatchGeneratorModal = class extends import_obsidian3.Modal {
      constructor(app, generator, settings, onCloseCallback) {
        super(app);
        // 表单状态
        this.prompts = "";
        this.isGenerating = false;
        // UI 元素
        this.generateBtn = null;
        this.progressEl = null;
        this.progressBar = null;
        this.resultsContainer = null;
        // 存储生成结果
        this.generatedImages = [];
        this.generator = generator;
        this.settings = settings;
        this.model = settings.defaultModel;
        this.resolution = settings.defaultResolution;
        this.onCloseCallback = onCloseCallback;
      }
      onOpen() {
        this.display();
      }
      display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "GLM \u6279\u91CF\u56FE\u7247\u751F\u6210", cls: "glm-modal-title" });
        contentEl.createEl("p", {
          text: "\u6BCF\u884C\u8F93\u5165\u4E00\u4E2A\u63D0\u793A\u8BCD\uFF0C\u5C06\u6279\u91CF\u751F\u6210\u591A\u5F20\u56FE\u7247",
          cls: "glm-description"
        });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u63D0\u793A\u8BCD\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09*",
          cls: "glm-form-label"
        });
        const textarea = contentEl.createEl("textarea", {
          cls: "glm-textarea",
          attr: {
            placeholder: "\u4E00\u53EA\u53EF\u7231\u7684\u5C0F\u732B\u54AA\n\u4E00\u5F20\u98CE\u666F\u56FE\u7247\n\u5546\u4E1A\u6D77\u62A5\u8BBE\u8BA1",
            rows: 8
          }
        });
        textarea.addEventListener("input", () => {
          this.prompts = textarea.value;
          this.validateForm();
        });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u6A21\u578B",
          cls: "glm-form-label"
        });
        new import_obsidian3.Setting(contentEl).addDropdown((dropdown) => {
          dropdown.addOption("glm-image", "GLM-Image (0.1\u5143/\u6B21)");
          dropdown.addOption("cogView-4-250304", "CogView-4 (0.1\u5143/\u6B21)");
          dropdown.setValue(this.model);
          dropdown.onChange((value) => {
            this.model = value;
          });
        });
        contentEl.createEl("div", { cls: "glm-form-group" });
        contentEl.createEl("label", {
          text: "\u5206\u8FA8\u7387",
          cls: "glm-form-label"
        });
        new import_obsidian3.Setting(contentEl).addDropdown((dropdown) => {
          RESOLUTION_PRESETS.forEach((preset) => {
            dropdown.addOption(`${preset.width}x${preset.height}`, preset.label);
          });
          dropdown.setValue(this.resolution);
          dropdown.onChange((value) => {
            this.resolution = value;
          });
        });
        this.progressEl = contentEl.createEl("div", {
          cls: "glm-progress"
        });
        this.progressBar = contentEl.createEl("div", {
          cls: "glm-progress-bar"
        });
        this.resultsContainer = contentEl.createEl("div", {
          cls: "glm-results-container"
        });
        const buttonContainer = contentEl.createEl("div", {
          cls: "glm-button-container"
        });
        buttonContainer.createEl("button", {
          text: "\u53D6\u6D88",
          cls: "glm-btn glm-btn-secondary"
        }).addEventListener("click", () => {
          this.close();
        });
        this.generateBtn = buttonContainer.createEl("button", {
          text: "\u5F00\u59CB\u6279\u91CF\u751F\u6210",
          cls: "glm-btn glm-btn-primary"
        });
        this.generateBtn.addEventListener("click", () => {
          this.startBatchGeneration();
        });
        this.validateForm();
      }
      validateForm() {
        if (!this.generateBtn) return;
        const promptList = this.prompts.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
        const isValid = promptList.length > 0;
        this.generateBtn.disabled = !isValid || this.isGenerating;
      }
      updateProgress(current, total) {
        if (!this.progressEl || !this.progressBar) return;
        this.progressEl.textContent = `\u8FDB\u5EA6: ${current}/${total}`;
        const percentage = current / total * 100;
        this.progressBar.style.width = `${percentage}%`;
      }
      addResult(prompt, index, result) {
        if (!this.resultsContainer) return;
        const resultEl = this.resultsContainer.createEl("div", {
          cls: "glm-result-item"
        });
        if (result == null ? void 0 : result.error) {
          this.generatedImages[index] = { prompt, error: result.error };
        } else {
          this.generatedImages[index] = { prompt, localPath: result == null ? void 0 : result.localPath };
        }
        if (result == null ? void 0 : result.error) {
          resultEl.createEl("span", {
            text: "\u274C",
            cls: "glm-result-icon"
          });
          const textContainer = resultEl.createEl("div", { cls: "glm-result-content" });
          textContainer.createEl("div", {
            text: `${index + 1}. ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
            cls: "glm-result-prompt"
          });
          textContainer.createEl("div", {
            text: `\u9519\u8BEF: ${result.error}`,
            cls: "glm-result-error"
          });
        } else {
          resultEl.createEl("span", {
            text: "\u2705",
            cls: "glm-result-icon"
          });
          const textContainer = resultEl.createEl("div", { cls: "glm-result-content" });
          textContainer.createEl("div", {
            text: `${index + 1}. ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
            cls: "glm-result-prompt"
          });
          if (result == null ? void 0 : result.localPath) {
            const imageContainer = textContainer.createEl("div", { cls: "glm-result-preview" });
            const resourcePath = this.app.vault.adapter.getResourcePath(result.localPath);
            const img = imageContainer.createEl("img", {
              attr: {
                src: resourcePath,
                alt: prompt
              }
            });
            img.style.maxWidth = "200px";
            img.style.maxHeight = "150px";
            img.style.marginTop = "8px";
            img.style.borderRadius = "4px";
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
              this.showImagePreview(result.localPath);
            });
            const actionsContainer = textContainer.createEl("div", { cls: "glm-result-actions" });
            actionsContainer.createEl("button", {
              text: "\u590D\u5236\u94FE\u63A5",
              cls: "glm-btn-small"
            }).addEventListener("click", () => {
              navigator.clipboard.writeText(`![](${result.localPath})`);
              new import_obsidian3.Notice("\u56FE\u7247\u94FE\u63A5\u5DF2\u590D\u5236");
            });
            actionsContainer.createEl("button", {
              text: "\u63D2\u5165\u5230\u6587\u6863",
              cls: "glm-btn-small"
            }).addEventListener("click", async () => {
              var _a;
              const activeFile = this.app.workspace.getActiveFile();
              if (activeFile) {
                const editor = (_a = this.app.workspace.activeEditor) == null ? void 0 : _a.editor;
                if (editor) {
                  editor.replaceSelection(`![](${result.localPath})
`);
                  new import_obsidian3.Notice("\u56FE\u7247\u5DF2\u63D2\u5165");
                }
              }
            });
          }
        }
      }
      async startBatchGeneration() {
        if (this.isGenerating) return;
        if (!this.settings.apiKey) {
          new import_obsidian3.Notice("\u8BF7\u5148\u914D\u7F6E API Key");
          return;
        }
        const promptList = this.prompts.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
        if (promptList.length === 0) {
          new import_obsidian3.Notice("\u8BF7\u8F93\u5165\u81F3\u5C11\u4E00\u4E2A\u63D0\u793A\u8BCD");
          return;
        }
        this.isGenerating = true;
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = "\u751F\u6210\u4E2D...";
        this.resultsContainer.empty();
        let successCount = 0;
        let failedCount = 0;
        try {
          await this.generator.batchGenerate(
            promptList,
            this.model,
            this.resolution,
            (current, total, result) => {
              this.updateProgress(current, total);
              if (result) {
                if (result.error) {
                  failedCount++;
                } else {
                  successCount++;
                }
                const prompt = promptList[current - 1];
                this.addResult(prompt, current - 1, result);
              }
            }
          );
          this.progressEl.textContent = `\u5B8C\u6210\uFF01\u6210\u529F: ${successCount}, \u5931\u8D25: ${failedCount}`;
          new import_obsidian3.Notice(`\u6279\u91CF\u751F\u6210\u5B8C\u6210\uFF01\u6210\u529F: ${successCount}, \u5931\u8D25: ${failedCount}`);
          if (successCount > 0) {
            const actionContainer = this.resultsContainer.createEl("div", {
              cls: "glm-action-buttons"
            });
            actionContainer.createEl("button", {
              text: "\u{1F4CA} \u67E5\u770B\u5386\u53F2\u8BB0\u5F55",
              cls: "glm-btn glm-btn-primary"
            }).addEventListener("click", () => {
              this.close();
              const historyPanel = new HistoryPanel(
                this.app,
                this.generator["historyManager"]
              );
              historyPanel.open();
            });
            actionContainer.createEl("button", {
              text: "\u5173\u95ED",
              cls: "glm-btn glm-btn-secondary"
            }).addEventListener("click", () => {
              this.close();
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "\u6279\u91CF\u751F\u6210\u5931\u8D25";
          this.progressEl.textContent = `\u9519\u8BEF: ${errorMessage}`;
          new import_obsidian3.Notice("\u6279\u91CF\u751F\u6210\u5931\u8D25: " + errorMessage);
        } finally {
          this.isGenerating = false;
          this.generateBtn.disabled = false;
          this.generateBtn.textContent = "\u5F00\u59CB\u6279\u91CF\u751F\u6210";
        }
      }
      onClose() {
        var _a;
        (_a = this.onCloseCallback) == null ? void 0 : _a.call(this);
        super.onClose();
      }
      /**
       * 显示图片预览
       */
      showImagePreview(imagePath) {
        const modal = new import_obsidian3.Modal(this.app);
        modal.onOpen = () => {
          const { contentEl } = modal;
          contentEl.addClass("glm-image-preview-modal");
          const resourcePath = this.app.vault.adapter.getResourcePath(imagePath);
          const img = contentEl.createEl("img", {
            attr: {
              src: resourcePath
            }
          });
          img.style.maxWidth = "100%";
          img.style.maxHeight = "80vh";
          contentEl.addEventListener("click", () => {
            modal.close();
          });
        };
        modal.open();
      }
    };
  }
});

// src/main.ts
var import_obsidian8 = require("obsidian");
init_types();

// src/ui/settings-tab.ts
var import_obsidian4 = require("obsidian");
init_types();
var SettingsTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin, generator) {
    super(app, plugin);
    this.plugin = plugin;
    this.generator = generator;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "GLM \u56FE\u7247\u751F\u6210\u5668" });
    containerEl.createEl("h3", { text: "\u{1F680} \u5FEB\u6377\u64CD\u4F5C" });
    new import_obsidian4.Setting(containerEl).setName("\u751F\u6210\u56FE\u7247").setDesc("\u6253\u5F00\u5355\u5F20\u56FE\u7247\u751F\u6210\u9762\u677F").addButton((button) => {
      button.setButtonText("\u{1F3A8} \u751F\u6210\u56FE\u7247");
      button.onClick(() => {
        const GeneratorModal2 = (init_generator_modal(), __toCommonJS(generator_modal_exports)).GeneratorModal;
        new GeneratorModal2(this.app, this.generator, this.plugin.settings).open();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u6279\u91CF\u751F\u6210\u56FE\u7247").setDesc("\u624B\u52A8\u8F93\u5165\u63D0\u793A\u8BCD\uFF0C\u6279\u91CF\u751F\u6210").addButton((button) => {
      button.setButtonText("\u{1F4DD} \u6279\u91CF\u751F\u6210");
      button.onClick(() => {
        const BatchGeneratorModal2 = (init_batch_generator_modal(), __toCommonJS(batch_generator_modal_exports)).BatchGeneratorModal;
        new BatchGeneratorModal2(this.app, this.generator, this.plugin.settings).open();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u4ECE\u6587\u4EF6\u6279\u91CF\u751F\u6210").setDesc("\u4ECE\u5F53\u524D\u6253\u5F00\u7684 Markdown \u6587\u4EF6\u6279\u91CF\u751F\u6210").addButton((button) => {
      button.setButtonText("\u{1F4C1} \u6587\u4EF6\u6279\u91CF\u751F\u6210");
      button.onClick(() => {
        this.plugin.handleBatchGenerateFromFile();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u67E5\u770B\u5386\u53F2\u8BB0\u5F55").setDesc("\u67E5\u770B\u6240\u6709\u56FE\u7247\u751F\u6210\u5386\u53F2").addButton((button) => {
      button.setButtonText("\u{1F4CA} \u67E5\u770B\u5386\u53F2");
      button.onClick(() => {
        const HistoryPanel2 = (init_history_panel(), __toCommonJS(history_panel_exports)).HistoryPanel;
        new HistoryPanel2(this.app, this.generator.getHistoryManager()).open();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u521B\u5EFA\u793A\u4F8B\u6A21\u677F").setDesc("\u5728\u5F53\u524D\u6587\u4EF6\u5939\u521B\u5EFA\u6279\u91CF\u751F\u6210\u793A\u4F8B\u6587\u4EF6").addButton((button) => {
      button.setButtonText("\u{1F4C4} \u521B\u5EFA\u6A21\u677F");
      button.onClick(async () => {
        await this.createBatchTemplate();
      });
    });
    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: "\u2699\uFE0F API \u914D\u7F6E" });
    new import_obsidian4.Setting(containerEl).setName("API Key").setDesc("\u667A\u8C31 AI API Key").addText((text) => {
      text.setPlaceholder("\u8F93\u5165 API Key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      });
      text.inputEl.type = "password";
    }).addButton((button) => {
      button.setButtonText("\u9A8C\u8BC1");
      button.onClick(async () => {
        if (!this.plugin.settings.apiKey) {
          new import_obsidian4.Notice("\u8BF7\u5148\u8F93\u5165 API Key");
          return;
        }
        button.setButtonText("\u9A8C\u8BC1\u4E2D...");
        button.setDisabled(true);
        try {
          const isValid = await this.generator.validateApiKey();
          if (isValid) {
            new import_obsidian4.Notice("API Key \u9A8C\u8BC1\u6210\u529F");
          } else {
            new import_obsidian4.Notice("API Key \u65E0\u6548");
          }
        } catch (error) {
          new import_obsidian4.Notice("\u9A8C\u8BC1\u5931\u8D25: " + (error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"));
        }
        button.setButtonText("\u9A8C\u8BC1");
        button.setDisabled(false);
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u83B7\u53D6 API Key").setDesc("\u70B9\u51FB\u6253\u5F00\u667A\u8C31 AI \u63A7\u5236\u53F0").addButton((button) => {
      button.setButtonText("\u6253\u5F00\u667A\u8C31 AI \u63A7\u5236\u53F0");
      button.onClick(() => {
        window.open("https://open.bigmodel.cn/", "_blank");
      });
    });
    containerEl.createEl("h3", { text: "\u9ED8\u8BA4\u8BBE\u7F6E" });
    new import_obsidian4.Setting(containerEl).setName("\u9ED8\u8BA4\u6A21\u578B").addDropdown((dropdown) => {
      MODELS.forEach((model) => {
        dropdown.addOption(model.id, `${model.name} (${model.price}\u5143/\u6B21)`);
      });
      dropdown.setValue(this.plugin.settings.defaultModel);
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultModel = value;
        await this.plugin.saveSettings();
        this.generator.updateSettings(this.plugin.settings);
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u9ED8\u8BA4\u5206\u8FA8\u7387").addDropdown((dropdown) => {
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
    new import_obsidian4.Setting(containerEl).setName("\u56FE\u7247\u4FDD\u5B58\u8DEF\u5F84").addText((text) => {
      text.setPlaceholder("\u9644\u4EF6/glm-images/");
      text.setValue(this.plugin.settings.savePath);
      text.onChange(async (value) => {
        this.plugin.settings.savePath = value || DEFAULT_SETTINGS.savePath;
        await this.plugin.saveSettings();
        this.generator.updateSettings(this.plugin.settings);
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u751F\u6210\u540E\u81EA\u52A8\u63D2\u5165\u5230\u6587\u6863").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.autoInsert);
      toggle.onChange(async (value) => {
        this.plugin.settings.autoInsert = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("h3", { text: "\u9AD8\u7EA7\u8BBE\u7F6E" });
    new import_obsidian4.Setting(containerEl).setName("\u6279\u91CF\u751F\u6210\u5E76\u53D1\u6570").setDesc("\u540C\u65F6\u751F\u6210\u7684\u6700\u5927\u56FE\u7247\u6570\u91CF").addSlider((slider) => {
      slider.setLimits(1, 5, 1);
      slider.setValue(this.plugin.settings.maxConcurrent);
      slider.onChange(async (value) => {
        this.plugin.settings.maxConcurrent = value;
        await this.plugin.saveSettings();
      });
      slider.sliderEl.style.width = "100px";
    });
    new import_obsidian4.Setting(containerEl).setName("\u91CD\u8BD5\u6B21\u6570").setDesc("API \u8C03\u7528\u5931\u8D25\u65F6\u7684\u91CD\u8BD5\u6B21\u6570").addSlider((slider) => {
      slider.setLimits(1, 5, 1);
      slider.setValue(this.plugin.settings.retryCount);
      slider.onChange(async (value) => {
        this.plugin.settings.retryCount = value;
        await this.plugin.saveSettings();
      });
      slider.sliderEl.style.width = "100px";
    });
    new import_obsidian4.Setting(containerEl).setName("\u6210\u672C\u9884\u8B66\u9608\u503C").setDesc("\u5355\u65E5\u7D2F\u8BA1\u6210\u672C\u8D85\u8FC7\u6B64\u503C\u65F6\u63D0\u9192\uFF08\u5143\uFF09").addText((text) => {
      text.setPlaceholder("10");
      text.setValue(String(this.plugin.settings.costThreshold));
      text.onChange(async (value) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          this.plugin.settings.costThreshold = num;
          await this.plugin.saveSettings();
        }
      });
    });
    containerEl.createEl("h3", { text: "\u5386\u53F2\u8BB0\u5F55" });
    new import_obsidian4.Setting(containerEl).setName("\u5386\u53F2\u8BB0\u5F55\u4E0A\u9650").addText((text) => {
      text.setPlaceholder("1000");
      text.setValue(String(this.plugin.settings.historyLimit));
      text.onChange(async (value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          this.plugin.settings.historyLimit = num;
          await this.plugin.saveSettings();
        }
      });
    });
    const history = this.generator.getSettings();
    containerEl.createEl("p", {
      text: `\u5F53\u524D\u8BB0\u5F55\u6570: ${history.historyLimit} \u6761`,
      cls: "setting-item-description"
    });
    new import_obsidian4.Setting(containerEl).setName("\u6E05\u7A7A\u5386\u53F2\u8BB0\u5F55").addButton((button) => {
      button.setButtonText("\u6E05\u7A7A");
      button.onClick(async () => {
        if (confirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u5386\u53F2\u8BB0\u5F55\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002")) {
          new import_obsidian4.Notice("\u5386\u53F2\u8BB0\u5F55\u5DF2\u6E05\u7A7A");
        }
      });
    });
    containerEl.createEl("h3", { text: "\u6210\u672C\u7EDF\u8BA1" });
    this.displayStatistics(containerEl);
    new import_obsidian4.Setting(containerEl).setName("\u5BFC\u51FA\u7EDF\u8BA1\u6570\u636E").addButton((button) => {
      button.setButtonText("\u5BFC\u51FA CSV");
      button.onClick(() => {
        new import_obsidian4.Notice("\u5BFC\u51FA\u529F\u80FD\u5F00\u53D1\u4E2D");
      });
    });
  }
  displayStatistics(containerEl) {
    containerEl.createEl("p", {
      text: "\u603B\u8C03\u7528\u6B21\u6570: 0 \u6B21",
      cls: "setting-item-description"
    });
    containerEl.createEl("p", {
      text: "\u603B\u6210\u672C: \xA50.00",
      cls: "setting-item-description"
    });
  }
  /**
   * 创建批量生成示例模板
   */
  async createBatchTemplate() {
    var _a;
    try {
      const activeFile = this.app.workspace.getActiveFile();
      let targetFolder = "";
      if (activeFile) {
        const parentPath = ((_a = activeFile.parent) == null ? void 0 : _a.path) || "";
        targetFolder = parentPath ? `${parentPath}/` : "";
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 10);
      const fileName = `\u6279\u91CF\u751F\u6210\u793A\u4F8B-${timestamp}.md`;
      const filePath = targetFolder + fileName;
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile) {
        new import_obsidian4.Notice(`\u6587\u4EF6\u5DF2\u5B58\u5728: ${filePath}`);
        return;
      }
      const templateContent = `---
glm_batch:
  model: glm-image
  resolution: 1280x1280
  auto_insert: true
---

# \u6279\u91CF\u56FE\u7247\u751F\u6210\u793A\u4F8B

## \u{1F4DD} \u4F7F\u7528\u8BF4\u660E

1. **\u6267\u884C\u547D\u4EE4**: \u6309 \`Ctrl/Cmd + P\`\uFF0C\u8F93\u5165"\u4ECE\u6587\u4EF6\u6279\u91CF\u751F\u6210"
2. **\u67E5\u770B\u9884\u89C8**: \u786E\u8BA4\u4EFB\u52A1\u6570\u91CF\u548C\u9884\u4F30\u6210\u672C
3. **\u5F00\u59CB\u751F\u6210**: \u70B9\u51FB"\u5F00\u59CB\u751F\u6210"\u6309\u94AE
4. **\u67E5\u770B\u7ED3\u679C**: \u751F\u6210\u5B8C\u6210\u540E\u56FE\u7247\u4F1A\u81EA\u52A8\u63D2\u5165\u5230\u4E0B\u65B9

## \u{1F4A1} \u63D0\u793A

- \u652F\u6301\u7684\u6A21\u578B: \`glm-image\`\uFF08\u64C5\u957F\u6587\u5B57\u6E32\u67D3\uFF09\u3001\`cogView-4-250304\`\uFF08\u64C5\u957F\u4E2D\u6587\uFF09
- \u652F\u6301\u7684\u5206\u8FA8\u7387: \`1280x1280\`\u3001\`1056x1568\`\u3001\`1568x1056\`\u3001\`1728x960\`\u3001\`960x1728\`
- \u53C2\u6570\u8986\u76D6: \u5728\u63D0\u793A\u8BCD\u524D\u4E00\u884C\u6DFB\u52A0 \`<!-- glm: model=xxx resolution=xxx -->\`

## \u{1F4CB} \u4EFB\u52A1\u5217\u8868

1. \u4E00\u53EA\u53EF\u7231\u7684\u5C0F\u732B\u54AA\uFF0C\u5750\u5728\u9633\u5149\u660E\u5A9A\u7684\u7A97\u53F0\u4E0A\uFF0C\u80CC\u666F\u662F\u84DD\u5929\u767D\u4E91\uFF0C\u6E29\u99A8\u6CBB\u6108\u7684\u98CE\u683C

2. \u9910\u996E\u7F8E\u98DF\u5BA3\u4F20\u6D77\u62A5\uFF0C\u7EA2\u70E7\u72EE\u5B50\u5934\uFF0C\u9AD8\u6E05\u6444\u5F71\uFF0C\u6696\u8272\u8C03\uFF0C\u98DF\u6B32\u611F\u5F3A\u70C8

3. \u79D1\u6280\u611F\u4EA7\u54C1\u5BA3\u4F20\u56FE\uFF0C\u667A\u80FD\u624B\u673A\uFF0C\u84DD\u8272\u6E10\u53D8\u80CC\u666F\uFF0C\u6781\u7B80\u8BBE\u8BA1\uFF0C\u672A\u6765\u611F

4. <!-- glm: model=cogView-4-250304 resolution=1056x1568 -->
   \u9910\u5385\u83DC\u5355\u8BBE\u8BA1\uFF0C\u5BAB\u4FDD\u9E21\u4E01\uFF0C\u9AD8\u6E05\u7F8E\u98DF\u6444\u5F71\uFF0C\u5305\u542B\u4E2D\u6587\u83DC\u540D

5. \u6625\u5B63\u4FC3\u9500\u6D77\u62A5\uFF0C\u7C89\u8272\u6A31\u82B1\u80CC\u666F\uFF0C\u4F18\u60E0\u4FE1\u606F\u9192\u76EE\uFF0C\u8282\u65E5\u6C1B\u56F4\u6D53\u539A

---

**\u9884\u4F30\u6210\u672C**: \xA50.50 (5\u5F20 \xD7 \xA50.10/\u5F20)

## \u{1F3AF} \u9AD8\u7EA7\u7528\u6CD5

### \u81EA\u5B9A\u4E49\u53C2\u6570\u793A\u4F8B

\`\`\`markdown
3. <!-- glm: model=cogView-4-250304 resolution=1056x1568 -->
   \u8FD9\u4E2A\u4EFB\u52A1\u4F7F\u7528 CogView-4 \u6A21\u578B\u548C 3:4 \u5206\u8FA8\u7387
\`\`\`

### \u652F\u6301\u7684\u53C2\u6570

| \u53C2\u6570 | \u8BF4\u660E | \u53EF\u9009\u503C |
|------|------|--------|
| \`model\` | \u4F7F\u7528\u7684\u6A21\u578B | \`glm-image\`, \`cogView-4-250304\` |
| \`resolution\` | \u56FE\u7247\u5206\u8FA8\u7387 | \`1280x1280\`, \`1056x1568\`, \`1568x1056\`, \`1728x960\`, \`960x1728\` |
| \`auto_insert\` | \u662F\u5426\u81EA\u52A8\u63D2\u5165\u7ED3\u679C | \`true\`, \`false\` |

---

**\u521B\u5EFA\u65F6\u95F4**: ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}
`;
      await this.app.vault.create(filePath, templateContent);
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
      }
      new import_obsidian4.Notice(`\u2705 \u6A21\u677F\u5DF2\u521B\u5EFA: ${fileName}`);
    } catch (error) {
      console.error("\u521B\u5EFA\u6A21\u677F\u5931\u8D25:", error);
      new import_obsidian4.Notice(`\u274C \u521B\u5EFA\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
};

// src/services/image-generator.ts
init_types();

// src/services/glm-api-client.ts
var API_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
var GLMApiClient = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  async generateImage(request) {
    const url = `${API_BASE_URL}/images/generations`;
    const response = await this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
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
    try {
      const url = `${API_BASE_URL}/models`;
      await this.request(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  async request(url, options, retryCount = 3) {
    var _a;
    let lastError = null;
    for (let i = 0; i < retryCount; i++) {
      try {
        const response = await this.makeRequest(url, options);
        if (response.status >= 200 && response.status < 300) {
          const data = JSON.parse(response.text);
          if (data.error) {
            throw new Error(data.error.message || "API \u8C03\u7528\u5931\u8D25");
          }
          return data;
        }
        if (response.status === 401) {
          throw new Error("API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E");
        }
        if (response.status === 403) {
          throw new Error("\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u68C0\u67E5 API Key \u6743\u9650");
        }
        if (response.status === 429) {
          throw new Error("API \u8BF7\u6C42\u9891\u7387\u8FC7\u9AD8\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
        }
        if (response.status >= 500) {
          const delay = Math.pow(2, i) * 1e3;
          await this.sleep(delay);
          lastError = new Error(`\u670D\u52A1\u5668\u9519\u8BEF: ${response.status}`);
          continue;
        }
        const errorData = response.text ? JSON.parse(response.text) : {};
        throw new Error(((_a = errorData.error) == null ? void 0 : _a.message) || `\u8BF7\u6C42\u5931\u8D25: ${response.status}`);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("API Key") || error.message.includes("\u6743\u9650")) {
            throw error;
          }
          lastError = error;
        } else {
          lastError = new Error("\u672A\u77E5\u9519\u8BEF");
        }
        if (i < retryCount - 1) {
          const delay = Math.pow(2, i) * 1e3;
          await this.sleep(delay);
        }
      }
    }
    throw lastError || new Error("\u8BF7\u6C42\u5931\u8D25");
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
        reject(new Error("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC"));
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
};

// src/services/image-downloader.ts
var import_obsidian5 = require("obsidian");
init_types();
var ImageDownloader = class {
  constructor(vault, savePath, maxRetries = 3) {
    this.vault = vault;
    this.savePath = savePath;
    this.maxRetries = maxRetries;
  }
  setSavePath(savePath) {
    this.savePath = savePath;
  }
  async downloadImage(imageUrl, customFileName) {
    await this.ensureDirectoryExists(this.savePath);
    const fileName = customFileName || generateFileName();
    const filePath = `${this.savePath}${fileName}`;
    let lastError = null;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const imageData = await this.fetchImage(imageUrl);
        await this.saveImage(filePath, imageData);
        return filePath;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("\u4E0B\u8F7D\u5931\u8D25");
        if (i < this.maxRetries - 1) {
          const delay = Math.pow(2, i) * 1e3;
          await this.sleep(delay);
        }
      }
    }
    throw lastError || new Error("\u56FE\u7247\u4E0B\u8F7D\u5931\u8D25");
  }
  async fetchImage(url) {
    try {
      const response = await (0, import_obsidian5.requestUrl)({
        url,
        method: "GET"
      });
      if (response.status >= 200 && response.status < 300) {
        return response.arrayBuffer;
      } else {
        throw new Error(`\u4E0B\u8F7D\u5931\u8D25: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`\u56FE\u7247\u4E0B\u8F7D\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
  async saveImage(filePath, data) {
    const uint8Array = new Uint8Array(data);
    await this.vault.createBinary(filePath, uint8Array);
  }
  async ensureDirectoryExists(dirPath) {
    if (!dirPath.endsWith("/")) {
      dirPath += "/";
    }
    try {
      const abstractFile = this.vault.getAbstractFileByPath(dirPath);
      if (!abstractFile) {
        console.log("\u76EE\u5F55\u5C06\u81EA\u52A8\u521B\u5EFA:", dirPath);
      }
    } catch (error) {
    }
  }
  async deleteImage(filePath) {
    try {
      const file = this.vault.getFile(filePath);
      if (file) {
        await this.vault.delete(file);
      }
    } catch (error) {
    }
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/services/history-manager.ts
init_types();
var HistoryManager = class {
  constructor(vault, historyPath, settings) {
    this.saveTimer = null;
    this.vault = vault;
    this.historyPath = historyPath;
    this.settings = settings;
    this.historyData = { records: [] };
  }
  async load() {
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
  async save() {
    const data = JSON.stringify(this.historyData, null, 2);
    try {
      const file = this.vault.getAbstractFileByPath(this.historyPath);
      if (file) {
        await this.vault.modify(file, data);
      } else {
        await this.vault.create(this.historyPath, data);
      }
    } catch (error) {
      console.debug("\u5386\u53F2\u8BB0\u5F55\u4FDD\u5B58\u5931\u8D25\uFF08\u9759\u9ED8\uFF09:", error);
    }
  }
  /**
   * 防抖保存 - 避免频繁保存
   */
  async debouncedSave() {
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
  async addRecord(prompt, model, size, localPath, remoteUrl, status, errorMessage) {
    const record = {
      id: generateRecordId(),
      prompt,
      model,
      size,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      localPath,
      remoteUrl: status === "success" ? remoteUrl : void 0,
      cost: status === "success" ? calculateCost(model) : 0,
      status,
      errorMessage
    };
    this.historyData.records.unshift(record);
    if (this.historyData.records.length > this.settings.historyLimit) {
      this.historyData.records = this.historyData.records.slice(
        0,
        this.settings.historyLimit
      );
    }
    await this.debouncedSave();
    return record;
  }
  getRecords() {
    return this.historyData.records;
  }
  getRecordById(id) {
    return this.historyData.records.find((r) => r.id === id);
  }
  async deleteRecord(id) {
    this.historyData.records = this.historyData.records.filter((r) => r.id !== id);
    await this.save();
  }
  async clearHistory() {
    this.historyData.records = [];
    await this.save();
  }
  searchRecords(query) {
    const lowerQuery = query.toLowerCase();
    return this.historyData.records.filter(
      (r) => r.prompt.toLowerCase().includes(lowerQuery)
    );
  }
  filterByModel(model) {
    return this.historyData.records.filter((r) => r.model === model);
  }
  getStatistics() {
    const stats = {
      totalCalls: 0,
      totalCost: 0,
      byModel: {},
      byDate: {}
    };
    const today = getTodayDate();
    for (const record of this.historyData.records) {
      if (record.status === "success") {
        stats.totalCalls++;
        stats.totalCost += record.cost;
        if (!stats.byModel[record.model]) {
          stats.byModel[record.model] = { calls: 0, cost: 0 };
        }
        stats.byModel[record.model].calls++;
        stats.byModel[record.model].cost += record.cost;
        const date = record.timestamp.split("T")[0];
        if (!stats.byDate[date]) {
          stats.byDate[date] = { calls: 0, cost: 0 };
        }
        stats.byDate[date].calls++;
        stats.byDate[date].cost += record.cost;
      }
    }
    return stats;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  /**
   * 添加批量生成记录
   */
  async addBatchRecord(record) {
    const batchRecord = {
      id: record.id,
      prompt: `[\u6279\u91CF\u751F\u6210] ${record.sourceFile}`,
      model: "glm-image",
      size: "batch",
      timestamp: record.timestamp,
      localPath: "",
      cost: record.totalCost,
      status: record.failedCount === 0 ? "success" : "failed",
      errorMessage: record.failedCount > 0 ? `\u90E8\u5206\u4EFB\u52A1\u5931\u8D25: ${record.failedCount}/${record.totalTasks}` : void 0
    };
    this.historyData.records.unshift(batchRecord);
    if (this.historyData.records.length > this.settings.historyLimit) {
      this.historyData.records = this.historyData.records.slice(
        0,
        this.settings.historyLimit
      );
    }
    await this.save();
    await this.saveDetailedBatchRecord(record);
  }
  /**
   * 保存详细的批量记录
   */
  async saveDetailedBatchRecord(record) {
    const batchHistoryPath = this.historyPath.replace(".json", "-batch.json");
    try {
      let batchRecords = [];
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
      console.debug("\u4FDD\u5B58\u6279\u91CF\u5386\u53F2\u8BB0\u5F55\u5931\u8D25\uFF08\u9759\u9ED8\uFF09:", error);
    }
  }
};

// src/services/image-generator.ts
var ImageGenerator = class {
  constructor(vault, apiClient, downloader, historyManager, settings) {
    this.vault = vault;
    this.apiClient = apiClient;
    this.downloader = downloader;
    this.historyManager = historyManager;
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
    this.apiClient.setApiKey(settings.apiKey);
    this.downloader.setSavePath(settings.savePath);
    this.historyManager.updateSettings(settings);
  }
  /**
   * 获取历史管理器
   */
  getHistoryManager() {
    return this.historyManager;
  }
  async generateImage(prompt, model, size) {
    var _a;
    const finalModel = model || this.settings.defaultModel;
    const finalSize = size || this.settings.defaultResolution;
    const response = await this.apiClient.generateImage({
      model: finalModel,
      prompt,
      size: finalSize
    });
    const imageUrl = (_a = response.data[0]) == null ? void 0 : _a.url;
    if (!imageUrl) {
      throw new Error("\u672A\u83B7\u53D6\u5230\u56FE\u7247 URL");
    }
    const localPath = await this.downloader.downloadImage(imageUrl);
    const record = await this.historyManager.addRecord(
      prompt,
      finalModel,
      finalSize,
      localPath,
      imageUrl,
      "success"
    );
    return {
      localPath,
      remoteUrl: imageUrl,
      record
    };
  }
  async batchGenerate(prompts, model, size, onProgress) {
    const batchId = generateRecordId();
    const tasks = prompts.map((prompt) => ({
      id: generateRecordId(),
      prompt,
      model: model || this.settings.defaultModel,
      size: size || this.settings.defaultResolution,
      status: "pending",
      retryCount: 0
    }));
    const batchTask = {
      id: batchId,
      tasks,
      totalCount: tasks.length,
      successCount: 0,
      failedCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "running"
    };
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = "processing";
      onProgress == null ? void 0 : onProgress(i + 1, tasks.length);
      try {
        const result = await this.generateImage(
          task.prompt,
          task.model,
          task.size
        );
        task.status = "success";
        task.result = {
          imageUrl: result.remoteUrl,
          localPath: result.localPath
        };
        batchTask.successCount++;
        onProgress == null ? void 0 : onProgress(i + 1, tasks.length, result);
      } catch (error) {
        task.status = "failed";
        task.error = error instanceof Error ? error.message : "\u751F\u6210\u5931\u8D25";
        batchTask.failedCount++;
        await this.historyManager.addRecord(
          task.prompt,
          task.model,
          task.size,
          "",
          "",
          "failed",
          task.error
        );
        onProgress == null ? void 0 : onProgress(i + 1, tasks.length, { error: task.error });
      }
    }
    batchTask.status = "completed";
    return batchTask;
  }
  async validateApiKey() {
    return this.apiClient.validateApiKey();
  }
  getSettings() {
    return this.settings;
  }
};
function createImageGenerator(vault, apiKey, savePath, historyPath, settings, maxRetries = 3) {
  const apiClient = new GLMApiClient(apiKey);
  const downloader = new ImageDownloader(vault, savePath, maxRetries);
  const historyManager = new HistoryManager(vault, historyPath, settings);
  historyManager.load().catch((err) => {
    console.error("\u52A0\u8F7D\u5386\u53F2\u8BB0\u5F55\u5931\u8D25:", err);
  });
  return new ImageGenerator(vault, apiClient, downloader, historyManager, settings);
}

// src/main.ts
init_generator_modal();
init_batch_generator_modal();

// src/ui/batch-file-generator-modal.ts
var import_obsidian6 = require("obsidian");
var BatchFileGeneratorModal = class extends import_obsidian6.Modal {
  constructor(app, generator, parsed, onConfirm) {
    super(app);
    this.generator = generator;
    this.parsed = parsed;
    this.onConfirm = onConfirm;
    this.estimatedCost = generator.estimateCost(parsed.tasks);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("glm-batch-file-modal");
    contentEl.createEl("h2", { text: "\u6279\u91CF\u751F\u6210\u4EFB\u52A1\u9884\u89C8" });
    const statsContainer = contentEl.createDiv({ cls: "glm-batch-stats" });
    new import_obsidian6.Setting(statsContainer).setName("\u4EFB\u52A1\u6570\u91CF").setDesc(`${this.parsed.tasks.length} \u4E2A`);
    new import_obsidian6.Setting(statsContainer).setName("\u6A21\u578B").setDesc(this.getModelDisplayName(this.parsed.config.model));
    new import_obsidian6.Setting(statsContainer).setName("\u5206\u8FA8\u7387").setDesc(this.parsed.config.resolution || "1280x1280");
    const costSetting = new import_obsidian6.Setting(statsContainer).setName("\u9884\u4F30\u6210\u672C").setDesc(`\xA5${this.estimatedCost.toFixed(2)}`);
    costSetting.descEl.addClass("glm-cost-highlight");
    const taskListContainer = contentEl.createDiv({ cls: "glm-task-list-container" });
    const details = taskListContainer.createEl("details");
    details.createEl("summary", { text: "\u67E5\u770B\u4EFB\u52A1\u5217\u8868" });
    const taskList = details.createDiv({ cls: "glm-task-list" });
    const displayCount = Math.min(this.parsed.tasks.length, 10);
    for (let i = 0; i < displayCount; i++) {
      const task = this.parsed.tasks[i];
      const taskItem = taskList.createDiv({ cls: "glm-task-item" });
      const number = taskItem.createEl("span", { cls: "glm-task-number" });
      number.textContent = `${i + 1}. `;
      const text = taskItem.createEl("span", { cls: "glm-task-text" });
      text.textContent = task.prompt.substring(0, 50) + (task.prompt.length > 50 ? "..." : "");
    }
    if (this.parsed.tasks.length > 10) {
      const moreItem = taskList.createDiv({ cls: "glm-task-item glm-more-tasks" });
      moreItem.createEl("span", {
        text: `... \u8FD8\u6709 ${this.parsed.tasks.length - 10} \u4E2A\u4EFB\u52A1`
      });
    }
    const warningContainer = contentEl.createDiv({ cls: "glm-warning-container" });
    warningContainer.createEl("p", {
      text: "\u26A0\uFE0F \u6267\u884C\u540E\u5C06\u81EA\u52A8\u4FEE\u6539\u5F53\u524D\u6587\u4EF6,\u63D2\u5165\u751F\u6210\u7684\u56FE\u7247\u94FE\u63A5"
    });
    const buttonContainer = contentEl.createDiv({ cls: "glm-button-container" });
    const cancelButton = buttonContainer.createEl("button", { text: "\u53D6\u6D88" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });
    const confirmButton = buttonContainer.createEl("button", {
      text: "\u5F00\u59CB\u751F\u6210",
      cls: "mod-cta"
    });
    confirmButton.addEventListener("click", async () => {
      this.close();
      await this.executeBatch();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  /**
   * 执行批量生成
   */
  async executeBatch() {
    const notice = new import_obsidian6.Notice("", 0);
    try {
      const result = await this.generator.executeBatch(
        this.parsed,
        (progress) => {
          const progressBar = this.generateProgressBar(progress.current, progress.total);
          const message = `${progressBar}
\u6B63\u5728\u751F\u6210\u7B2C ${progress.current}/${progress.total} \u5F20...
\u2705 \u6210\u529F: ${progress.successCount}  \u274C \u5931\u8D25: ${progress.failedCount}`;
          notice.setMessage(message);
        }
      );
      notice.hide();
      this.showResult(result);
    } catch (error) {
      notice.hide();
      new import_obsidian6.Notice(
        `\u274C \u6279\u91CF\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`,
        5e3
      );
    }
  }
  /**
   * 显示生成结果
   */
  showResult(result) {
    let message;
    let icon;
    if (result.status === "completed") {
      icon = "\u2705";
      message = `\u6279\u91CF\u751F\u6210\u5B8C\u6210!
\u6210\u529F: ${result.successCount} \u5F20
\u603B\u6210\u672C: \xA5${result.totalCost.toFixed(2)}`;
    } else if (result.status === "partial_completed") {
      icon = "\u26A0\uFE0F";
      message = `\u6279\u91CF\u751F\u6210\u5B8C\u6210(\u90E8\u5206\u5931\u8D25)
\u6210\u529F: ${result.successCount} \u5F20
\u5931\u8D25: ${result.failedCount} \u5F20
\u603B\u6210\u672C: \xA5${result.totalCost.toFixed(2)}`;
    } else {
      icon = "\u274C";
      message = `\u6279\u91CF\u751F\u6210\u5931\u8D25
\u5931\u8D25: ${result.failedCount} \u5F20`;
    }
    new import_obsidian6.Notice(`${icon} ${message}`, 5e3);
    this.onConfirm();
  }
  /**
   * 生成进度条
   */
  generateProgressBar(current, total) {
    const length = 20;
    const progress = current / total;
    const filled = Math.round(length * progress);
    const empty = length - filled;
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
    const percentage = Math.round(progress * 100);
    return `[${bar}] ${percentage}%`;
  }
  /**
   * 获取模型显示名称
   */
  getModelDisplayName(model) {
    if (!model) return "GLM-Image";
    const modelNames = {
      "glm-image": "GLM-Image",
      "cogView-4-250304": "CogView-4"
    };
    return modelNames[model] || model;
  }
};

// src/main.ts
init_history_panel();

// src/services/batch-generator.ts
var import_obsidian7 = require("obsidian");

// src/services/task-file-parser.ts
init_types();
var TaskFileParseError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TaskFileParseError";
  }
};
var TaskFileParser = class {
  /**
   * 解析批量任务文件
   * @param content 文件内容
   * @param file 文件对象
   * @returns 解析后的任务文件数据
   * @throws {TaskFileParseError} 文件格式错误
   */
  parseFile(content, file) {
    const frontmatter = this.extractYAMLFrontmatter(content);
    if (!frontmatter) {
      throw new TaskFileParseError("\u672A\u627E\u5230 YAML Frontmatter,\u8BF7\u5728\u6587\u4EF6\u5F00\u5934\u6DFB\u52A0\u914D\u7F6E");
    }
    const config = this.parseBatchConfig(frontmatter);
    const tasks = this.extractTasks(content, config);
    if (tasks.length === 0) {
      throw new TaskFileParseError("\u672A\u627E\u5230\u4EFB\u4F55\u4EFB\u52A1,\u8BF7\u6DFB\u52A0\u7F16\u53F7\u5217\u8868(\u5982: 1. \u63D0\u793A\u8BCD)");
    }
    if (tasks.length > 100) {
      throw new TaskFileParseError(`\u4EFB\u52A1\u6570\u91CF\u8FC7\u591A(${tasks.length}\u4E2A),\u6700\u591A\u652F\u6301100\u4E2A\u4EFB\u52A1`);
    }
    return {
      config,
      tasks,
      originalContent: content,
      sourceFile: file
    };
  }
  /**
   * 提取 YAML Frontmatter
   * @param content 文件内容
   * @returns YAML 内容或 null
   */
  extractYAMLFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    return match ? match[1] : null;
  }
  /**
   * 解析批量任务配置
   * @param frontmatter YAML 内容
   * @returns 批量配置
   * @throws {TaskFileParseError} 解析失败
   */
  parseBatchConfig(frontmatter) {
    try {
      const config = {};
      const lines = frontmatter.split("\n");
      let inBatchBlock = false;
      let batchLines = [];
      for (const line of lines) {
        if (line.trim().startsWith("glm_batch:")) {
          inBatchBlock = true;
          continue;
        }
        if (inBatchBlock) {
          if (line.match(/^[a-zA-Z_]/)) {
            break;
          }
          batchLines.push(line);
        }
      }
      if (batchLines.length === 0 && !inBatchBlock) {
        throw new Error("\u672A\u627E\u5230 glm_batch \u914D\u7F6E\u5B57\u6BB5");
      }
      for (const line of batchLines) {
        const trimmed = line.trim();
        const modelMatch = trimmed.match(/^model:\s*['"]?(.+?)['"]?$/);
        if (modelMatch) {
          const model = modelMatch[1].trim();
          if (model !== "glm-image" && model !== "cogView-4-250304") {
            throw new Error(`\u65E0\u6548\u7684\u6A21\u578B: ${model}`);
          }
          config.model = model;
          continue;
        }
        const resolutionMatch = trimmed.match(/^resolution:\s*['"]?(.+?)['"]?$/);
        if (resolutionMatch) {
          const resolution = resolutionMatch[1].trim();
          if (!isValidResolutionString(resolution)) {
            throw new Error(`\u65E0\u6548\u7684\u5206\u8FA8\u7387: ${resolution}`);
          }
          config.resolution = resolution;
          continue;
        }
        const autoInsertMatch = trimmed.match(/^auto_insert:\s*(true|false)$/);
        if (autoInsertMatch) {
          config.auto_insert = autoInsertMatch[1] === "true";
          continue;
        }
      }
      return config;
    } catch (error) {
      throw new TaskFileParseError(
        `\u914D\u7F6E\u89E3\u6790\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`
      );
    }
  }
  /**
   * 提取任务列表
   * @param content 文件内容
   * @param config 全局配置
   * @returns 任务列表
   */
  extractTasks(content, config) {
    const tasks = [];
    const lines = content.split("\n");
    const listPattern = /^(\d+)\.\s+(.+)$/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(listPattern);
      if (match) {
        const prompt = match[2].trim();
        if (!prompt) {
          continue;
        }
        if (prompt.length > 1e3) {
          console.warn(`\u4EFB\u52A1 ${match[1]} \u63D0\u793A\u8BCD\u8FC7\u957F(${prompt.length}\u5B57\u7B26),\u53EF\u80FD\u751F\u6210\u5931\u8D25`);
        }
        const overrideParams = this.parseOverrideParams(lines, i);
        const finalParams = mergeTaskParams(config, overrideParams);
        const task = {
          id: generateRecordId(),
          prompt,
          model: finalParams.model,
          resolution: finalParams.resolution,
          lineNumber: i,
          status: "pending",
          retryCount: 0
        };
        tasks.push(task);
      }
    }
    return tasks;
  }
  /**
   * 解析参数覆盖注释
   * 格式: <!-- glm: model=xxx resolution=xxx -->
   * @param lines 文件所有行
   * @param currentLine 当前行号
   * @returns 覆盖参数或 undefined
   */
  parseOverrideParams(lines, currentLine) {
    if (currentLine === 0) return void 0;
    const prevLine = lines[currentLine - 1].trim();
    const commentPattern = /<!--\s*glm:\s*(.+?)\s*-->/;
    const match = prevLine.match(commentPattern);
    if (!match) return void 0;
    const paramsStr = match[1];
    const params = {};
    const pairs = paramsStr.split(/\s+/);
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (!key || !value) continue;
      if (key === "model") {
        if (value === "glm-image" || value === "cogView-4-250304") {
          params.model = value;
        }
      } else if (key === "resolution") {
        if (isValidResolutionString(value)) {
          params.resolution = value;
        }
      }
    }
    return Object.keys(params).length > 0 ? params : void 0;
  }
};

// src/services/result-writer.ts
var ResultWriter = class {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * 写回结果到文件
   * @param file 目标文件
   * @param tasks 任务列表(包含结果)
   * @param originalContent 原始文件内容
   */
  async writeBack(file, tasks, originalContent) {
    const lines = originalContent.split("\n");
    const sortedTasks = [...tasks].sort((a, b) => b.lineNumber - a.lineNumber);
    for (const task of sortedTasks) {
      const insertLine = task.lineNumber + 1;
      const resultText = this.formatResultText(task);
      lines.splice(insertLine, 0, resultText);
    }
    const newContent = lines.join("\n");
    await this.vault.modify(file, newContent);
  }
  /**
   * 格式化结果文本
   * @param task 任务对象
   * @returns 格式化后的文本
   */
  formatResultText(task) {
    if (task.status === "success" && task.result) {
      return `
   ![](${task.result.localPath})
`;
    } else if (task.status === "failed" && task.error) {
      return `
   \u274C \u751F\u6210\u5931\u8D25: ${task.error}
`;
    } else {
      return "\n   \u26A0\uFE0F \u672A\u77E5\u72B6\u6001\n";
    }
  }
  /**
   * 生成重试文件内容
   * @param failedTasks 失败的任务列表
   * @returns 重试文件内容
   */
  generateRetryContent(failedTasks) {
    const frontmatter = `---
glm_batch:
  model: glm-image
  resolution: 1280x1280
---

# \u91CD\u8BD5\u4EFB\u52A1(\u5931\u8D25\u9879)

\u4EE5\u4E0B\u4EFB\u52A1\u5728\u4E4B\u524D\u7684\u6279\u91CF\u751F\u6210\u4E2D\u5931\u8D25,\u53EF\u4EE5\u91CD\u65B0\u6267\u884C\u3002
`;
    const taskList = failedTasks.map((task, index) => {
      let line = `${index + 1}. ${task.prompt}`;
      if (task.error) {
        line += `
   <!-- \u4E0A\u6B21\u9519\u8BEF: ${task.error} -->`;
      }
      return line;
    }).join("\n\n");
    return frontmatter + "\n" + taskList;
  }
};

// src/services/batch-generator.ts
init_types();
var BatchGenerator = class {
  constructor(vault, imageGenerator, historyManager, settings) {
    this.vault = vault;
    this.parser = new TaskFileParser();
    this.writer = new ResultWriter(vault);
    this.imageGenerator = imageGenerator;
    this.historyManager = historyManager;
    this.settings = settings;
  }
  /**
   * 从文件解析批量任务
   * @param file 任务文件
   * @returns 解析后的任务文件
   * @throws {TaskFileParseError} 解析失败
   */
  async parseBatchFile(file) {
    const content = await this.vault.read(file);
    return this.parser.parseFile(content, file);
  }
  /**
   * 执行批量生成
   * @param parsed 解析后的任务文件
   * @param onProgress 进度回调
   * @returns 批量生成结果
   */
  async executeBatch(parsed, onProgress) {
    const batchId = generateRecordId();
    const startTime = (/* @__PURE__ */ new Date()).toISOString();
    const tasks = parsed.tasks;
    let successCount = 0;
    let failedCount = 0;
    let totalCost = 0;
    const progress = {
      current: 0,
      total: tasks.length,
      successCount: 0,
      failedCount: 0
    };
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = "generating";
      progress.current = i + 1;
      progress.currentTask = task;
      onProgress == null ? void 0 : onProgress(progress);
      try {
        const result2 = await this.imageGenerator.generateImage(
          task.prompt,
          task.model,
          task.resolution
        );
        task.status = "success";
        task.result = {
          localPath: result2.localPath,
          remoteUrl: result2.remoteUrl
        };
        successCount++;
        totalCost += calculateCost(task.model);
        progress.successCount = successCount;
        onProgress == null ? void 0 : onProgress(progress);
      } catch (error) {
        task.status = "failed";
        task.error = error instanceof Error ? error.message : "\u751F\u6210\u5931\u8D25";
        task.retryCount++;
        failedCount++;
        progress.failedCount = failedCount;
        onProgress == null ? void 0 : onProgress(progress);
        console.error(`\u4EFB\u52A1 ${i + 1} \u751F\u6210\u5931\u8D25:`, error);
      }
      if (i < tasks.length - 1) {
        await this.sleep(500);
      }
    }
    const endTime = (/* @__PURE__ */ new Date()).toISOString();
    let status;
    if (failedCount === 0) {
      status = "completed";
    } else if (successCount === 0) {
      status = "failed";
    } else {
      status = "partial_completed";
    }
    const result = {
      batchId,
      sourceFilePath: parsed.sourceFile.path,
      totalCount: tasks.length,
      successCount,
      failedCount,
      totalCost,
      tasks,
      startTime,
      endTime,
      status
    };
    if (parsed.config.auto_insert !== false) {
      try {
        await this.writer.writeBack(
          parsed.sourceFile,
          tasks,
          parsed.originalContent
        );
      } catch (error) {
        console.error("\u5199\u56DE\u6587\u4EF6\u5931\u8D25:", error);
        new import_obsidian7.Notice("\u26A0\uFE0F \u5199\u56DE\u6587\u4EF6\u5931\u8D25,\u8BF7\u68C0\u67E5\u6587\u4EF6\u6743\u9650");
      }
    }
    await this.saveBatchHistory(result);
    return result;
  }
  /**
   * 预估批量生成成本
   * @param tasks 任务列表
   * @returns 预估成本(元)
   */
  estimateCost(tasks) {
    return tasks.reduce((sum, task) => sum + calculateCost(task.model), 0);
  }
  /**
   * 提取失败的任务
   * @param result 批量生成结果
   * @returns 失败任务列表
   */
  extractFailedTasks(result) {
    return result.tasks.filter((task) => task.status === "failed");
  }
  /**
   * 生成重试文件
   * @param failedTasks 失败的任务列表
   * @returns 重试文件内容
   */
  generateRetryContent(failedTasks) {
    return this.writer.generateRetryContent(failedTasks);
  }
  /**
   * 保存批量生成历史记录
   * @param result 批量生成结果
   */
  async saveBatchHistory(result) {
    const record = {
      id: result.batchId,
      type: "batch",
      timestamp: result.startTime,
      sourceFile: result.sourceFilePath,
      totalTasks: result.totalCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      totalCost: result.totalCost,
      tasks: result.tasks.map((task) => {
        var _a;
        return {
          prompt: task.prompt,
          status: task.status === "success" ? "success" : "failed",
          localPath: (_a = task.result) == null ? void 0 : _a.localPath,
          error: task.error
        };
      })
    };
    await this.historyManager.addBatchRecord(record);
  }
  /**
   * 更新设置
   * @param settings 新设置
   */
  updateSettings(settings) {
    this.settings = settings;
    this.imageGenerator.updateSettings(settings);
    this.historyManager.updateSettings(settings);
  }
  /**
   * 延迟函数
   * @param ms 毫秒数
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/main.ts
var GLMImageGeneratorPlugin = class extends import_obsidian8.Plugin {
  async onload() {
    console.log("GLM Image Generator \u63D2\u4EF6\u52A0\u8F7D\u6210\u529F!");
    await this.loadSettings();
    this.generator = createImageGenerator(
      this.app.vault,
      this.settings.apiKey,
      this.settings.savePath,
      `.obsidian/plugins/${this.manifest.id}/history.json`,
      this.settings,
      this.settings.retryCount
    );
    this.batchGenerator = new BatchGenerator(
      this.app.vault,
      this.generator,
      this.generator.getHistoryManager(),
      this.settings
    );
    this.addSettingTab(new SettingsTab(this.app, this, this.generator));
    this.addCommand({
      id: "glm-generate",
      name: "\u751F\u6210 GLM \u56FE\u7247",
      callback: () => {
        new GeneratorModal(this.app, this.generator, this.settings).open();
      }
    });
    this.addCommand({
      id: "glm-batch-generate",
      name: "\u6279\u91CF\u751F\u6210\u56FE\u7247(\u624B\u52A8\u8F93\u5165)",
      callback: () => {
        new BatchGeneratorModal(this.app, this.generator, this.settings).open();
      }
    });
    this.addCommand({
      id: "glm-batch-generate-from-file",
      name: "\u4ECE\u6587\u4EF6\u6279\u91CF\u751F\u6210\u56FE\u7247",
      callback: () => {
        this.handleBatchGenerateFromFile();
      }
    });
    this.addCommand({
      id: "glm-view-history",
      name: "\u67E5\u770B\u751F\u6210\u5386\u53F2",
      callback: () => {
        new HistoryPanel(this.app, this.generator.getHistoryManager()).open();
      }
    });
  }
  /**
   * 处理从文件批量生成命令
   */
  async handleBatchGenerateFromFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new import_obsidian8.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u4EFB\u52A1\u6587\u4EF6");
      return;
    }
    if (activeFile.extension !== "md") {
      new import_obsidian8.Notice("\u53EA\u652F\u6301 Markdown \u6587\u4EF6");
      return;
    }
    try {
      const parsed = await this.batchGenerator.parseBatchFile(activeFile);
      new BatchFileGeneratorModal(
        this.app,
        this.batchGenerator,
        parsed,
        () => {
          console.log("\u6279\u91CF\u751F\u6210\u5B8C\u6210");
        }
      ).open();
    } catch (error) {
      if (error instanceof TaskFileParseError) {
        new import_obsidian8.Notice(`\u4EFB\u52A1\u6587\u4EF6\u89E3\u6790\u5931\u8D25: ${error.message}`, 5e3);
      } else {
        new import_obsidian8.Notice(
          `\u6279\u91CF\u751F\u6210\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`,
          5e3
        );
      }
    }
  }
  // ----------- 设置持久化 -------------
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
module.exports = GLMImageGeneratorPlugin;
