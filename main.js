"use strict";
var exports = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/types.ts
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

  // src/ui/settings-tab.ts
  var import_obsidian, SettingsTab;
  var init_settings_tab = __esm({
    "src/ui/settings-tab.ts"() {
      "use strict";
      import_obsidian = __require("obsidian");
      init_types();
      SettingsTab = class extends import_obsidian.PluginSettingTab {
        constructor(app, plugin, generator) {
          super(app, plugin);
          this.plugin = plugin;
          this.generator = generator;
        }
        display() {
          const { containerEl } = this;
          containerEl.empty();
          containerEl.createEl("h2", { text: "GLM \u56FE\u7247\u751F\u6210\u5668\u8BBE\u7F6E" });
          containerEl.createEl("h3", { text: "API \u914D\u7F6E" });
          new import_obsidian.Setting(containerEl).setName("API Key").setDesc("\u667A\u8C31 AI API Key").addText((text) => {
            text.setPlaceholder("\u8F93\u5165 API Key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
              this.plugin.settings.apiKey = value;
              await this.plugin.saveSettings();
            });
            text.inputEl.type = "password";
          }).addButton((button) => {
            button.setButtonText("\u9A8C\u8BC1");
            button.onClick(async () => {
              if (!this.plugin.settings.apiKey) {
                new import_obsidian.Notice("\u8BF7\u5148\u8F93\u5165 API Key");
                return;
              }
              button.setButtonText("\u9A8C\u8BC1\u4E2D...");
              button.setDisabled(true);
              try {
                const isValid = await this.generator.validateApiKey();
                if (isValid) {
                  new import_obsidian.Notice("API Key \u9A8C\u8BC1\u6210\u529F");
                } else {
                  new import_obsidian.Notice("API Key \u65E0\u6548");
                }
              } catch (error) {
                new import_obsidian.Notice("\u9A8C\u8BC1\u5931\u8D25: " + (error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"));
              }
              button.setButtonText("\u9A8C\u8BC1");
              button.setDisabled(false);
            });
          });
          new import_obsidian.Setting(containerEl).setName("\u83B7\u53D6 API Key").setDesc("\u70B9\u51FB\u6253\u5F00\u667A\u8C31 AI \u63A7\u5236\u53F0").addButton((button) => {
            button.setButtonText("\u6253\u5F00\u667A\u8C31 AI \u63A7\u5236\u53F0");
            button.onClick(() => {
              window.open("https://open.bigmodel.cn/", "_blank");
            });
          });
          containerEl.createEl("h3", { text: "\u9ED8\u8BA4\u8BBE\u7F6E" });
          new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6A21\u578B").addDropdown((dropdown) => {
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
          new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u5206\u8FA8\u7387").addDropdown((dropdown) => {
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
          new import_obsidian.Setting(containerEl).setName("\u56FE\u7247\u4FDD\u5B58\u8DEF\u5F84").addText((text) => {
            text.setPlaceholder("\u9644\u4EF6/glm-images/");
            text.setValue(this.plugin.settings.savePath);
            text.onChange(async (value) => {
              this.plugin.settings.savePath = value || DEFAULT_SETTINGS.savePath;
              await this.plugin.saveSettings();
              this.generator.updateSettings(this.plugin.settings);
            });
          });
          new import_obsidian.Setting(containerEl).setName("\u751F\u6210\u540E\u81EA\u52A8\u63D2\u5165\u5230\u6587\u6863").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.autoInsert);
            toggle.onChange(async (value) => {
              this.plugin.settings.autoInsert = value;
              await this.plugin.saveSettings();
            });
          });
          containerEl.createEl("h3", { text: "\u9AD8\u7EA7\u8BBE\u7F6E" });
          new import_obsidian.Setting(containerEl).setName("\u6279\u91CF\u751F\u6210\u5E76\u53D1\u6570").setDesc("\u540C\u65F6\u751F\u6210\u7684\u6700\u5927\u56FE\u7247\u6570\u91CF").addSlider((slider) => {
            slider.setLimits(1, 5, 1);
            slider.setValue(this.plugin.settings.maxConcurrent);
            slider.onChange(async (value) => {
              this.plugin.settings.maxConcurrent = value;
              await this.plugin.saveSettings();
            });
            slider.sliderEl.style.width = "100px";
          });
          new import_obsidian.Setting(containerEl).setName("\u91CD\u8BD5\u6B21\u6570").setDesc("API \u8C03\u7528\u5931\u8D25\u65F6\u7684\u91CD\u8BD5\u6B21\u6570").addSlider((slider) => {
            slider.setLimits(1, 5, 1);
            slider.setValue(this.plugin.settings.retryCount);
            slider.onChange(async (value) => {
              this.plugin.settings.retryCount = value;
              await this.plugin.saveSettings();
            });
            slider.sliderEl.style.width = "100px";
          });
          new import_obsidian.Setting(containerEl).setName("\u6210\u672C\u9884\u8B66\u9608\u503C").setDesc("\u5355\u65E5\u7D2F\u8BA1\u6210\u672C\u8D85\u8FC7\u6B64\u503C\u65F6\u63D0\u9192\uFF08\u5143\uFF09").addText((text) => {
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
          new import_obsidian.Setting(containerEl).setName("\u5386\u53F2\u8BB0\u5F55\u4E0A\u9650").addText((text) => {
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
          new import_obsidian.Setting(containerEl).setName("\u6E05\u7A7A\u5386\u53F2\u8BB0\u5F55").addButton((button) => {
            button.setButtonText("\u6E05\u7A7A");
            button.onClick(async () => {
              if (confirm("\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u5386\u53F2\u8BB0\u5F55\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002")) {
                new import_obsidian.Notice("\u5386\u53F2\u8BB0\u5F55\u5DF2\u6E05\u7A7A");
              }
            });
          });
          containerEl.createEl("h3", { text: "\u6210\u672C\u7EDF\u8BA1" });
          this.displayStatistics(containerEl);
          new import_obsidian.Setting(containerEl).setName("\u5BFC\u51FA\u7EDF\u8BA1\u6570\u636E").addButton((button) => {
            button.setButtonText("\u5BFC\u51FA CSV");
            button.onClick(() => {
              new import_obsidian.Notice("\u5BFC\u51FA\u529F\u80FD\u5F00\u53D1\u4E2D");
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
      };
    }
  });

  // src/services/glm-api-client.ts
  var API_BASE_URL, GLMApiClient;
  var init_glm_api_client = __esm({
    "src/services/glm-api-client.ts"() {
      "use strict";
      API_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
      GLMApiClient = class {
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
                const delay = Math.pow(2, i) * 1e3;
                await this.sleep(delay);
                lastError = new Error("API \u8BF7\u6C42\u9891\u7387\u8FC7\u9AD8\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
                continue;
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
    }
  });

  // src/services/image-downloader.ts
  var ImageDownloader;
  var init_image_downloader = __esm({
    "src/services/image-downloader.ts"() {
      "use strict";
      init_types();
      ImageDownloader = class {
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
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
              } else {
                reject(new Error(`\u4E0B\u8F7D\u5931\u8D25: ${xhr.status}`));
              }
            };
            xhr.onerror = () => {
              reject(new Error("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25"));
            };
            xhr.send();
          });
        }
        async saveImage(filePath, data) {
          const uint8Array = new Uint8Array(data);
          await this.vault.createBinary(filePath, uint8Array);
        }
        async ensureDirectoryExists(dirPath) {
          try {
            const existingFiles = this.vault.getFiles();
            const dirExists = existingFiles.some(
              (f) => f.path === dirPath || f.path.startsWith(dirPath)
            );
            if (!dirExists) {
              await this.vault.create("", dirPath + ".placeholder");
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
    }
  });

  // src/services/history-manager.ts
  var HistoryManager;
  var init_history_manager = __esm({
    "src/services/history-manager.ts"() {
      "use strict";
      init_types();
      HistoryManager = class {
        constructor(vault, historyPath, settings) {
          this.vault = vault;
          this.historyPath = historyPath;
          this.settings = settings;
          this.historyData = { records: [] };
        }
        async load() {
          try {
            const file = this.vault.getFile(this.historyPath);
            if (file) {
              const content = await this.vault.read(file);
              this.historyData = JSON.parse(content);
            }
          } catch (error) {
            this.historyData = { records: [] };
          }
        }
        async save() {
          await this.ensureHistoryFileExists();
          const file = this.vault.getFile(this.historyPath);
          if (file) {
            await this.vault.modify(file, JSON.stringify(this.historyData, null, 2));
          } else {
            await this.vault.create(this.historyPath, JSON.stringify(this.historyData, null, 2));
          }
        }
        async ensureHistoryFileExists() {
          try {
            const file = this.vault.getFile(this.historyPath);
            if (!file) {
              await this.vault.create(this.historyPath, JSON.stringify({ records: [] }, null, 2));
            }
          } catch (error) {
            await this.vault.create(this.historyPath, JSON.stringify({ records: [] }, null, 2));
          }
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
          await this.save();
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
      };
    }
  });

  // src/services/image-generator.ts
  function createImageGenerator(vault, apiKey, savePath, historyPath, settings, maxRetries = 3) {
    const apiClient = new GLMApiClient(apiKey);
    const downloader = new ImageDownloader(vault, savePath, maxRetries);
    const historyManager = new HistoryManager(vault, historyPath, settings);
    return new ImageGenerator(vault, apiClient, downloader, historyManager, settings);
  }
  var ImageGenerator;
  var init_image_generator = __esm({
    "src/services/image-generator.ts"() {
      "use strict";
      init_types();
      init_glm_api_client();
      init_image_downloader();
      init_history_manager();
      ImageGenerator = class {
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
    }
  });

  // src/main.ts
  var require_main = __commonJS({
    "src/main.ts"(exports, module) {
      var import_obsidian2 = __require("obsidian");
      init_types();
      init_settings_tab();
      init_image_generator();
      var GLMImageGeneratorPlugin = class extends import_obsidian2.Plugin {
        async onload() {
          console.log("GLM Image Generator \u63D2\u4EF6\u52A0\u8F7D\u6210\u529F!");
          await this.loadSettings();
          this.generator = createImageGenerator(
            this.app.vault,
            this.settings.apiKey,
            this.settings.savePath,
            `${this.manifest.id}/history.json`,
            this.settings,
            this.settings.retryCount
          );
          this.addSettingTab(new SettingsTab(this.app, this, this.generator));
          this.addCommand({
            id: "glm-generate",
            name: "\u751F\u6210 GLM \u56FE\u7247",
            callback: async () => {
              const file = this.app.workspace.getActiveFile();
              const prompt = (file == null ? void 0 : file.basename) || "\u793A\u4F8B\u63D0\u793A\u8BCD";
              try {
                const result = await this.generator.generateImage(prompt);
                console.log("\u751F\u6210\u6210\u529F", result);
              } catch (e) {
                console.error("\u751F\u6210\u5931\u8D25", e);
              }
            }
          });
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
    }
  });
  return require_main();
})();
