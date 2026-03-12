// Obsidian API Shim
// 这是一个 shim 文件，让 Obsidian 插件可以使用 require('obsidian')
// 在运行时，Obsidian 会自动提供全局的 obsidian 对象

module.exports = window.obsidian || global.obsidian;
