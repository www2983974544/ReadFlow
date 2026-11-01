<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/ui'
import { initCrawlerView, renderCrawlerDiscoveryGrid } from '../../legacy/crawler-view'

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
  <section id="viewCrawler" class="single-view-scroll-pane space-y-4">
    <!-- Compact command bar (replaces the legacy hero banner + terminal panel) -->
    <div class="surface-card p-4 shadow-sm space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <h2 class="text-base font-bold whitespace-nowrap" style="margin: 0">🌐 同源外刊发现池</h2>
          <span class="inline-flex items-center gap-1.5 text-xs opacity-75 min-w-0">
            <span id="crawlerPulseDot" class="inline-flex items-center gap-1 text-emerald-400 shrink-0"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>READY</span>
            <span id="crawlerStatusHint" class="truncate">已就绪 · 在线/离线双模式自动切换</span>
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button id="btnOpenCustomModalFromCrawler" type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition">
            📋 手动粘贴导入
          </button>
          <button id="btnAddAllDiscoveryToLib" type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
            ✓ 全部加入文章库
          </button>
          <button id="btnStartCrawlBatch" type="button" class="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition">
            🚀 立即抓取同源外刊
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3" style="border-top: 1px solid var(--border-col)">
        <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">难度
          <select id="crawlTargetLevel" class="crawl-filter-select" title="目标考试难度">
            <option value="all">智能混排 (CET-4 &amp; CET-6)</option>
            <option value="CET-4">大学英语四级 (250-350词 · 蓝思 950L)</option>
            <option value="CET-6">大学英语六级 (350-480词 · 蓝思 1150L)</option>
          </select>
        </label>
        <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">题型
          <select id="crawlTargetCategory" class="crawl-filter-select" title="高频真题题型">
            <option value="all">🔥 全部五大高频题型</option>
            <option value="科技与人工智能">🤖 科技与人工智能 (高频首选)</option>
            <option value="生态与气候环境">🌱 生态与气候环境 (常考议题)</option>
            <option value="心理与教育认知">🧠 心理与教育认知 (实验研究类)</option>
            <option value="经济与商业职场">💼 经济与商业职场 (经济学人风格)</option>
            <option value="社会文化与健康">🏥 社会文化与健康 (公共议题)</option>
          </select>
        </label>
        <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">刊物源
          <select id="crawlTargetSource" class="crawl-filter-select" title="定向爬取外刊源">
            <option value="all">🌍 全网主流题源聚合</option>
            <option value="The Economist">The Economist (经济学人)</option>
            <option value="Scientific American">Scientific American (科学美国人)</option>
            <option value="The Guardian">The Guardian (卫报)</option>
            <option value="NPR / BBC Future">NPR &amp; BBC Future</option>
            <option value="Live Web Feed">⚡ 实时在线英文科学/社会接口</option>
          </select>
        </label>

        <details class="crawl-log-drawer ml-auto">
          <summary>📟 引擎日志</summary>
          <div class="crawl-log-panel">
            <div id="crawlerTerminalOutput" class="space-y-1 text-[11px] leading-relaxed max-h-24 overflow-y-auto text-emerald-300 font-mono">
              <div>[SYSTEM] ReadFlow v1.1 题源引擎已加载，内置牛津离线词典与 5 大高频外刊规则。</div>
              <div>[FILTER] 词数过滤区间：240-480 词 | 考纲核心词覆盖率阈值 ≥ 14%。</div>
              <div>[READY] 点击「立即抓取同源外刊」获取最新匹配文章...</div>
            </div>
          </div>
        </details>
      </div>
    </div>

    <!-- Candidate article grid (first screen shows the cards, not the controls) -->
    <div id="crawlerDiscoveryGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
  </section>
</template>
