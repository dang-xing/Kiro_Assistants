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
  <b>🚀 Smart Kiro IDE account management with one-click switching and quota monitoring</b>
</p>

---

## ✨ Features

### 🔐 Account Login
- **Desktop OAuth** - Desktop authorization for Google/GitHub/BuilderId
- **Web Portal OAuth** - Web authorization in WebView window
- Two methods complement each other for reliable login

### 📊 Account Display
- Card grid layout, clear at a glance
- Quota progress bar (main/trial/bonus)
- Subscription type badge (Free/PRO/PRO+)
- Token expiration countdown
- Status highlight (normal/expired/banned/current)

### 🔄 One-Click Switch
- Seamless Kiro IDE account switching
- Auto reset machine ID
- Real-time switch progress

### 📦 Batch Operations
- Batch refresh / batch delete
- JSON import/export (Social & IdC formats)
- SSO Token batch import
- Keyword search filter

### 🔌 Kiro Config
- **MCP Servers** - CRUD, enable/disable
- **Powers** - View, install, uninstall
- **Steering Rules** - View, edit

### ⚙️ System Settings
- Four themes (light/dark/purple/green)
- AI model selection & lock
- Auto token refresh (configurable interval)
- Auto reset machine ID on switch

### 🌐 Browser & Proxy
- Custom browser / auto detect
- Incognito mode launch
- HTTP proxy config / auto detect

### 🔑 Machine Code
- View / backup / restore / reset
- Windows / macOS support

### 🖥️ IDE Integration
- Detect Kiro IDE running status
- One-click start / stop
- Auto sync proxy and model settings

## 📥 Download

[![Release](https://img.shields.io/github/v/release/ipiggyzhu/KiroAccountManager?style=flat-square)](https://github.com/ipiggyzhu/KiroAccountManager/releases/latest)

👉 **[Download Latest Version](https://github.com/ipiggyzhu/KiroAccountManager/releases/latest)**

| Platform | File Type | Description |
|----------|-----------|-------------|
| Windows | `.msi` | Recommended, double-click to install |
| Windows | `.exe` | NSIS installer |
| macOS | `.dmg` | Drag to Applications |

## 💻 System Requirements

- **Windows**: Windows 10/11 (64-bit), WebView2 required (built-in on Win11)
- **macOS**: macOS 10.15+ (Intel/Apple Silicon universal)

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5 + TailwindCSS 3 + Lingui (i18n)
- **Backend**: Tauri 2.x + Rust + Tokio
- **Icons**: Lucide React
- **Storage**: Local JSON files

## 🚀 Quick Start

1. Download the installer for your platform from [Releases](https://github.com/ipiggyzhu/KiroAccountManager/releases/latest)
2. Install and launch the application
3. Login with Google, GitHub, or BuilderId
4. Manage your Kiro accounts with ease!

## 💬 Feedback

- 🐛 [Submit Issue](https://github.com/ipiggyzhu/KiroAccountManager/issues)

## ⚠️ Disclaimer

This software is for learning and communication purposes only. Do not use for commercial purposes. Users are responsible for any consequences.

## 📄 License

[GPL-3.0](LICENSE) - Modifications must be open-sourced.
