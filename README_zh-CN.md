# Kiro Account Manager

<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="Logo" width="80">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue" alt="Platform">
  <img src="https://img.shields.io/github/v/release/ipiggyzhu/KiroAccountManager?label=Version&color=green" alt="Version">
  <img src="https://img.shields.io/github/downloads/ipiggyzhu/KiroAccountManager/total?color=brightgreen" alt="Downloads">
  <img src="https://img.shields.io/github/license/ipiggyzhu/KiroAccountManager?color=orange" alt="License">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_zh-CN.md">简体中文</a> | <a href="README_ru-RU.md">Русский</a>
</p>

<p align="center">
  <b>🚀 智能管理 Kiro IDE 账号，一键切换，配额监控</b>
</p>

---

## ✨ 功能特性

### 🔐 账号登录
- **Desktop OAuth** - 桌面端授权，支持 Google/GitHub/BuilderId
- **Web Portal OAuth** - 网页端授权，WebView 窗口内完成
- 两种方式互补，确保登录成功率

### 📊 账号展示
- 卡片网格布局，一目了然
- 配额进度条（主配额/试用/奖励）
- 订阅类型标识（Free/PRO/PRO+）
- Token 过期倒计时
- 状态高亮（正常/过期/封禁/当前使用）

### 🔄 一键切号
- 无感切换 Kiro IDE 账号
- 自动重置机器 ID
- 切换进度实时显示

### 📦 批量操作
- 批量刷新 / 批量删除
- JSON 导入导出
- SSO Token 批量导入
- 关键词搜索过滤

### 🔌 Kiro 配置
- **MCP 服务器** - 增删改查、启用/禁用
- **Powers** - 查看、安装、卸载
- **Steering 规则** - 查看、编辑

### ⚙️ 系统设置
- 四种主题（浅色/深色/紫色/绿色）
- AI 模型选择与锁定
- Token 自动刷新（可配置间隔）
- 切号自动重置机器 ID

### 🌐 浏览器与代理
- 自定义浏览器 / 自动检测
- 无痕模式启动
- HTTP 代理配置 / 自动检测

### 🔑 机器码管理
- 查看 / 备份 / 恢复 / 重置
- 支持 Windows / macOS

### 🖥️ IDE 集成
- 检测 Kiro IDE 运行状态
- 一键启动 / 关闭
- 自动同步代理和模型设置

## 📥 下载

[![Release](https://img.shields.io/github/v/release/ipiggyzhu/KiroAccountManager?style=flat-square)](https://github.com/ipiggyzhu/KiroAccountManager/releases/latest)

👉 **[点击这里下载最新版本](https://github.com/ipiggyzhu/KiroAccountManager/releases/latest)**

| 平台 | 文件类型 | 说明 |
|------|----------|------|
| Windows | `.msi` | 推荐，双击安装 |
| Windows | `.exe` | NSIS 安装程序 |
| macOS | `.dmg` | 拖入 Applications |

## 💻 系统要求

- **Windows**: Windows 10/11 (64-bit)，需要 WebView2 (Win11 已内置)
- **macOS**: macOS 10.15+ (Intel/Apple Silicon 通用)

## 🛠️ 技术栈

- **前端**: React 18 + Vite 5 + TailwindCSS 3 + Lingui (i18n)
- **后端**: Tauri 2.x + Rust + Tokio
- **图标**: Lucide React
- **存储**: JSON 文件本地存储

## 📁 数据存储

| 数据 | 路径 |
|------|------|
| 账号数据 | `%APPDATA%\.kiro-account-manager\accounts.json` |
| 应用设置 | `%APPDATA%\.kiro-account-manager\settings.json` |
| MCP 配置 | `~/.kiro/settings/mcp.json` |
| Powers 注册表 | `~/.kiro/powers/registry.json` |

## 💬 反馈

- 🐛 [提交 Issue](https://github.com/ipiggyzhu/KiroAccountManager/issues)

## ⚠️ 免责声明

本软件仅供学习交流使用，请勿用于商业用途。使用本软件所产生的任何后果由用户自行承担。

## 📄 开源协议

[GPL-3.0](LICENSE) - 修改后必须开源。


