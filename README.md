# ReadFlow · 四六级同源外刊智能获取与精读系统（桌面版 v2.0）

原 v1.1 单文件网页（`cet_reading_master.html`）的**桌面应用化重构版**：界面、功能、配色与原版 100% 一致，底层换新为 Vue 3 + FastAPI + SQLite，打包为单个 exe。

## 快速开始

双击 **`dist/ReadFlow.exe`** 即可（约 39MB，无需安装 Python/Node，Windows 10/11 自带 WebView2 运行时）。

- 数据存放位置：`%APPDATA%\ReadFlow\readflow.db`（SQLite，文章/生词/统计全部在此）
- 卸载：删除 exe + 删除 `%APPDATA%\ReadFlow` 文件夹即可完全清除
- 首次启动自动内置 6 篇预置外刊文章与 6 个 RSS 外刊源

## 旧版数据迁移（可选）

如果你在旧版（Edge 模式）里已标注过生词/导出过备份：

1. 在旧版中导出 `ReadFlow_Library_Backup.json` 和 `ReadFlow_Vocabulary_Export.csv`
2. 启动一次新版 exe（生成数据库），然后关闭
3. 执行导入：

```bash
.venv/Scripts/python scripts/import_legacy.py --library "旧导出.json" --vocab "旧导出.csv"
```

## 与原版仅有的两处行为差异（均已确认接受）

1. 主题/音色/语速/字号等设置现在保存进数据库，重启后保留（原版刷新即丢）
2. 「实时爬取新刊」按钮后端为真 RSS 爬虫（feedparser + trafilatura 正文抽取，内置 Guardian/NPR/SciAm/Atlantic/Nature/BBC 六源，Wikipedia 摘要保留为离线保底），按钮外观与交互不变

## 开发指南

```
frontend/   Vue 3 + Vite + TS + Pinia + Tailwind 3.4（npm run dev / npm run build）
backend/    FastAPI + SQLAlchemy（SQLite）
shell/      pywebview 桌面壳（main.py）+ 自检脚本（selftest/bootcheck/readercheck/fullcheck）
scripts/    旧资产提取、图标生成、旧数据导入
```

```bash
# 前端
cd frontend && npm install && npm run build

# 后端/壳（Python 3.13 venv）
.venv/Scripts/python -m venv .venv  # 首次
.venv/Scripts/python shell/main.py  # 本地跑桌面壳

# 重新打包 exe
.venv/Scripts/pyinstaller --noconfirm --clean --onefile --noconsole --icon=ReadFlow.ico \
  --name ReadFlow --add-data "frontend/dist;frontend_dist" \
  --add-data "backend/app/seed_articles.json;backend/app" \
  --collect-data trafilatura --collect-data certifi \
  shell/main.py --paths .
```

## 架构要点（视觉/功能保真策略）

- 原版约 890 行 CSS 原样搬运（含三主题 CSS 变量体系）；页面 DOM 结构与类名 1:1 移植
- 动态内容容器（正文分词、测验、列表、热力图）沿用原版命令式渲染函数 + 事件委托；静态骨架用 Vue 响应式
- 943 词条离线词典打包进前端 bundle（保持 0ms 秒查）；分词器/词形还原/查词链/统计聚合逐行移植
- 朗读双引擎：在线有道真人音频 + 离线 Web Speech 情感播音（WebView2 下已实测可用）
