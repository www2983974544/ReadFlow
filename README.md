<div align="center">
  <img src="ReadFlow_icon_preview.png" width="88" alt="ReadFlow icon" />
</div>

# ReadFlow

四六级同源外刊智能获取与精读系统 —— 逐词精读、离线查词、真 RSS 抓取与学习统计，提供 Windows 桌面版与 Android 移动版。

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)](LICENSE)
[![Windows v2.1](https://img.shields.io/badge/Windows-v2.1-0078D6)](https://github.com/www2983974544/ReadFlow/releases/tag/v2.1)
[![Android v1.2](https://img.shields.io/badge/Android-v1.2-3DDC84)](https://github.com/www2983974544/ReadFlow/releases/tag/android-v1.2)

> **源码公开，禁止任何商业用途。** 采用 PolyForm Noncommercial License 1.0.0，详见 [LICENSE](LICENSE)。

## 这是什么

ReadFlow 把英文外刊文章变成可逐词精读的学习材料：点词即查离线词典、三色标注生词、拆解长难句、跟读朗读、生成自测题，并记录阅读时长与学习热力图。文章可直接使用内置预置，也可通过内置 RSS 爬虫实时获取（Guardian / NPR / SciAm / Atlantic / Nature / BBC 六源，Wikipedia 摘要作为离线兜底）。

仓库包含两条独立版本线，功能对齐，界面各自按平台设计：

| | Windows 桌面版 | Android 移动版 |
|---|---|---|
| 当前版本 | v2.1 | v1.2（versionCode 6） |
| 运行环境 | Windows 10/11（自带 WebView2） | Android 7.0+（API 24） |
| 技术栈 | Vue 3 + FastAPI + SQLite + pywebview | Vue 3 + Capacitor 8 + localStorage |
| 安装包 | 单个 exe，约 40 MB | APK，约 4.5 MB |

## 核心能力

- **逐词精读**：分词点查、离线词典、派生词与同义词、行内批注、长难句拆解、四六级仿真自测、专注阅读模式
- **文章获取**：客户端真 RSS 爬虫，正文抽取、词数分级（>330 词判为 CET-6）、60 天时效门控、Wikipedia 兜底
- **单词库**：四态生词筛选、闪卡遮盖自测、模糊搜索、CSV / JSON 导出
- **朗读**：在线真人音频 + 离线系统语音引擎降级；安卓端支持段落朗读悬浮球
- **学习统计**：6 项 KPI、364 天热力图、14 天趋势、题型覆盖度与打卡记录
- **其它**：三主题（明亮 / 护眼 / 夜间）、三联筛选（难度 / 题型 / 来源）、安徽专升本全链路、三 Tab 查词台

移动端为移动优先设计（底部 6 键标签栏、目录侧滑抽屉、查词台底部弹层），不是桌面布局的缩放。

## 下载与安装

| 版本 | 下载 | 说明 |
|---|---|---|
| Windows v2.1 | [Releases · v2.1](https://github.com/www2983974544/ReadFlow/releases/tag/v2.1) | 下载 `ReadFlow.exe` 后双击即可，无需安装 Python / Node |
| Android v1.2 | [Releases · android-v1.2](https://github.com/www2983974544/ReadFlow/releases/tag/android-v1.2) | 把 APK 传到手机安装，需允许「安装未知来源应用」 |

安装包作为 Release 附件发布，**不在 Git 仓库中**（`dist/` 与 `*.exe` 已被忽略）。安卓版使用 debug 签名，覆盖安装同一密钥签名的旧版可直接升级；若提示签名冲突，需先卸载旧版（会清除应用内数据）。

Windows 版数据存于 `%APPDATA%\ReadFlow\readflow.db`，卸载时删除 exe 与该文件夹即可完全清除；首次启动内置 6 篇预置外刊文章与 6 个 RSS 源。

## 项目结构

```
backend/            FastAPI + SQLAlchemy（SQLite）
frontend/           Vue 3 + Vite + TS + Pinia + Tailwind（桌面前端）
shell/              pywebview 桌面壳与自检脚本
scripts/            旧资产提取、图标生成、旧数据导入
ReadFlow_Android/   Android 移动版（自包含 Vue 3 + Capacitor 工程）
docs/               开发、构建与移植细节
```

## 文档与更新记录

- [开发与构建细节](docs/DEVELOPMENT.md) —— 环境搭建、打包命令与移植说明
- [Android 版说明](ReadFlow_Android/README.md)
- 更新记录：[桌面版](<ReadFlow_版本更新日志(CHANGELOG).md>) · [移动版](ReadFlow_Android/CHANGELOG.md)

版本线互相独立：桌面版按 `v2.x` 递增，移动版按 `android-v1.x` 递增，对应标签见 [Tags](https://github.com/www2983974544/ReadFlow/tags)。

## 许可

本项目**源码公开（source-available），不是 OSI 定义的开源软件**，且**禁止任何商业用途**。

采用 [PolyForm Noncommercial License 1.0.0](LICENSE)：允许个人学习、研究、实验、私人娱乐以及非营利组织使用；商业使用须另行获得授权。全文见 [LICENSE](LICENSE)，官方文本见 [polyformproject.org](https://polyformproject.org/licenses/noncommercial/1.0.0)。

请注意：公开仓库无法在技术上阻止他人复制，本许可提供的是法律层面的约束。
