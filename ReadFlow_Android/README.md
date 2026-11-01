# ReadFlow Android（四六级精读器 APK）

基于 Gemini 版 ReadFlow v1.1（Windows 网页版）完整移植的安卓应用。
**功能 100% 保留**（首页星环倒计时 / 外刊精读 / 文章获取 / 文章库 / 单词库 / 时间统计 / 三主题 / 离线词典 / 朗读 / 三色标注 / 导出），仅更换了底层载体与移动端 UI 适配。

## 技术架构
- **Web 层**：`www/index.html` —— 原版 `cet_reading_master.html` 的副本，追加了一层移动端适配 CSS 与一个桥接 shim 脚本（原 JS 逻辑零改动）；Tailwind 已本地化（`www/tailwind.js`），离线可用。
- **原生壳**：Capacitor 8（`com.readflow.app`），WebView 加载本地资源。
- **原生能力桥接**（仅安卓环境启用，浏览器中自动走原 Web 路径）：
  - 语音兜底：Web Speech API → 系统原生 TTS（`@capacitor-community/text-to-speech`）
  - 导出 CSV/JSON：blob 下载 → 写入文档目录 + 系统分享面板（Filesystem + Share）
  - 安卓返回键：关闭弹层/抽屉 → 返回首页 → 退出
  - 音频自动播放：`MainActivity` 中放开逐段手势限制（全文朗读队列需要）

## 手机端 UI 适配（≤900px 生效，平板/桌面保持原三栏布局）
- 顶部 6 页签 → 底部标签栏（角标实时同步）
- 左侧文章目录 → 侧滑抽屉（工具栏「◀ 左栏」开关，点遮罩关闭）
- 右侧查词台 → 底部弹层（点词自动弹出，收起按钮/返回键关闭）
- 安全区适配、触控目标加大、星空动画支持触屏视差

## 数据存储
与 Windows 版同机制：localStorage 存于应用私有目录，重启/关机不丢，卸载才清除。请定期用「导出备份」留底。

## 构建
```bash
# 依赖：Node 20+、JDK 21（已在 gradle.properties 配置）、Android SDK（已在 local.properties 配置）
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

## 安装到手机
1. 将 `dist/ReadFlow_v1.1_android.apk` 传到手机（微信文件传输助手/数据线/网盘均可）。
2. 手机上点击安装；若提示「禁止安装未知来源应用」，允许该来源安装即可（系统不同入口：设置 → 安全 → 安装未知应用，或安装时弹窗里点「仍要安装」）。
3. 首次打开即可离线使用；单词真人发音与全文朗读联网时使用有道真人录音，离线时用系统语音引擎（建议在 系统设置 → 文字转语音 中安装英语语音包以获得更好音质）。
