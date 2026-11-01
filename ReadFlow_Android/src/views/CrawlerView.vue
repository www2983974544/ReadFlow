<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui'
import { initCrawlerView, renderCrawlerDiscoveryGrid } from '../legacy/crawler-view'

const ui = useUiStore()

onMounted(() => {
  initCrawlerView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'crawler') {
      renderCrawlerDiscoveryGrid()
    }
  },
)
</script>

<template>
  <section id="viewCrawler" class="view-scroll crawler-page">
    <!-- 紧凑命令栏（移动端纵向堆叠） -->
    <div class="surface-card p-3.5 shadow-sm space-y-3">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-bold whitespace-nowrap" style="margin: 0">🌐 同源外刊发现池</h2>
          <span id="crawlerPulseDot" class="inline-flex items-center gap-1 text-emerald-400 shrink-0"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>READY</span>
        </div>
        <span id="crawlerStatusHint" class="text-xs opacity-75 leading-relaxed">已就绪 · 在线/离线双模式自动切换</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button id="btnStartCrawlBatch" type="button" class="col-span-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition">
          🚀 立即抓取同源外刊
        </button>
        <button id="btnAddAllDiscoveryToLib" type="button" class="py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">✓ 全部入库</button>
        <button id="btnOpenCustomModalFromCrawler" type="button" class="py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition">📋 手动导入</button>
      </div>

      <div class="flex flex-col gap-2 pt-3" style="border-top: 1px solid var(--border-col)">
        <label class="flex items-center gap-2 text-xs opacity-80">难度
          <select id="crawlTargetLevel" class="crawl-filter-select flex-1 min-w-0" title="目标考试难度">
            <option value="all">智能混排 (CET-4 &amp; CET-6)</option>
            <option value="CET-4">大学英语四级 (250-350词 · 蓝思 950L)</option>
            <option value="CET-6">大学英语六级 (350-480词 · 蓝思 1150L)</option>
            <option value="安徽专升本">安徽专升本英语 (300-450词 · 蓝思 900L)</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-xs opacity-80">题型
          <select id="crawlTargetCategory" class="crawl-filter-select flex-1 min-w-0" title="高频真题题型">
            <option value="all">🔥 全部五大高频题型</option>
            <option value="科技与人工智能">🤖 科技与人工智能 (高频首选)</option>
            <option value="生态与气候环境">🌱 生态与气候环境 (常考议题)</option>
            <option value="心理与教育认知">🧠 心理与教育认知 (实验研究类)</option>
            <option value="经济与商业职场">💼 经济与商业职场 (经济学人风格)</option>
            <option value="社会文化与健康">🏥 社会文化与健康 (公共议题)</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-xs opacity-80">刊物源
          <select id="crawlTargetSource" class="crawl-filter-select flex-1 min-w-0" title="定向爬取外刊源">
            <option value="all">🌍 全网主流题源聚合</option>
            <option value="The Economist">The Economist (经济学人)</option>
            <option value="Scientific American">Scientific American (科学美国人)</option>
            <option value="The Guardian">The Guardian (卫报)</option>
            <option value="NPR / BBC Future">NPR &amp; BBC Future</option>
            <option value="Live Web Feed">⚡ 实时在线英文科学/社会接口</option>
          </select>
        </label>

        <details class="crawl-log-drawer">
          <summary>📟 引擎日志</summary>
          <div class="crawl-log-panel">
            <div id="crawlerTerminalOutput" class="space-y-1 text-[11px] leading-relaxed max-h-28 overflow-y-auto text-emerald-300 font-mono">
              <div>[SYSTEM] ReadFlow v1.0 题源引擎已加载，内置牛津离线词典与 5 大高频外刊规则。</div>
              <div>[FILTER] 词数过滤区间：240-480 词 | 考纲核心词覆盖率阈值 ≥ 14%。</div>
              <div>[READY] 点击「立即抓取同源外刊」获取最新匹配文章...</div>
            </div>
          </div>
        </details>

        <!-- 抓取源健康度（v1.1）：✓成功 / ✗失败可点重试 / –未尝试 -->
        <div class="src-health-wrap">
          <span class="src-health-label">源状态</span>
          <div id="crawlerSourceHealth" class="src-health-strip"></div>
        </div>
      </div>
    </div>

    <!-- 候选文章单列卡片 -->
    <div id="crawlerDiscoveryGrid" class="grid grid-cols-1 gap-3 mt-3"></div>
    <div class="h-4"></div>
  </section>
</template>

<style scoped>
.crawler-page {
  padding: 10px 12px 0;
}
.src-health-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.src-health-label {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: 0.65;
  padding-top: 5px;
}
.src-health-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
}
.src-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.src-idle {
  background-color: var(--bg-subcard);
  border: 1px solid var(--border-col);
  color: var(--text-muted);
}
.src-ok {
  background-color: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #047857;
}
body.theme-dark .src-ok {
  color: #34d399;
}
.src-fail {
  background-color: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.45);
  color: #be123c;
  cursor: pointer;
}
body.theme-dark .src-fail {
  color: #fb7185;
}
.src-retry:active {
  background-color: rgba(244, 63, 94, 0.22);
}
</style>
