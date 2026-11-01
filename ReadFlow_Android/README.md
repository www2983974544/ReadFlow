# ReadFlow Android v2（四六级精读器 · 移动版）

基于桌面 **ReadFlow V2.1**（Vue3 + FastAPI + pywebview，git tag v2.1）的完整安卓移植。
与桌面版**功能逐项对齐**（六视图 / 专注阅读模式 / 三 Tab 查词台 / 真 RSS 爬虫 / 三联筛选 / 闪卡 / 热力图 / 安徽专升本全链路），UI 按手机习惯全新设计（移动优先，非桌面布局套壳）。

## 架构
- **移动优先 Vue3 + Vite + TS + Pinia + Tailwind**（`src/`），自包含工程
- 纯逻辑模块复制自 `frontend/src@v2.1`（文件头有标注）：dictionary / state(S()桥) / reader / translate / timer / inspector-tabs / crawler-view / library / vocab-view / stats-view / home / cosmos
- **持久化**：桌面为 FastAPI+SQLite；移动端为 localStorage（JSON shape 完全一致，跨实体清零守卫端内复刻）
- **Capacitor 8 壳**（`android/`，com.readflow.app，minSdk 24）：
  - TTS：有道真人音频（联网）→ 离线走 `native/tts-shim.ts`（Web Speech API → 原生 TTS 桥）
  - 爬虫：`native/crawler.ts` = CapacitorHttp（原生网络栈绕 CORS）+ fast-xml-parser + @mozilla/readability，逐行复刻 news.py 的 12s 时限 / 60d 时效 / 段落切分 / 词数分级 / Wikipedia 兜底
  - 导出：`native/exporter.ts` = Filesystem 写入 + 系统分享面板（浏览器回退 blob 下载）
  - 返回键：弹窗 → 查词台 → 抽屉 → 首页 → 退出

## 移动 UI（与桌面一一对应）
- 底部 6 键标签栏（角标实时同步）+ 精简头部（品牌/版本/三主题/❓）
- 精读页：单栏正文 + 目录侧滑抽屉（含筛选与统计条）+ 查词台底部弹层（三 Tab，点词自动弹出，非模态可连续查词）+ 单行横滑工具栏 + 段落按钮常显
- 三主题（明亮/护眼/夜间）与设置持久化

## 构建与发布
```bash
npm install
npm run apk        # vite build + cap sync + gradlew assembleDebug
# 产物: android/app/build/outputs/apk/debug/app-debug.apk → dist/ReadFlow_v2.1_android.apk
```
工具链：JDK 21（`C:/Users/wzc/.jdks/ms-21.0.10`，见 gradle.properties）+ Android SDK（`C:/Users/wzc/AppData/Local/Android/Sdk`，见 local.properties）。

## 安装到手机
1. 将 `dist/ReadFlow_v2.1_android.apk` 传到手机（微信文件传输助手/数据线均可）。
2. 点开安装；提示"未知来源"时选择允许/仍要安装。
3. 若已装旧版 v1.1 APK（versionCode 1），可直接覆盖安装（versionCode 2，数据兼容）。

## 版本（移动端独立版本线，与桌面 v2.x 互不重叠）
- **v1.0**（versionCode 3，分支 `mobile/v1.0`，标签 `android-v1.0`）：Android 版首发，功能基线对齐桌面 V2.1。后续移动端迭代按 v1.1、v1.2 递增（标签 `android-v1.x`）；桌面端继续在 main 分支按 v2.x 递增，两条线互不干扰。
- 注：versionCode 从 3 起跳是为了保证已装过内部测试包（versionCode 1/2）的设备可直接覆盖升级。
