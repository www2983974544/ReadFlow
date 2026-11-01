<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/ui'
import { initLibraryView, renderMyLibraryGrid } from '../../legacy/library'

const ui = useUiStore()

onMounted(() => {
  initLibraryView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'library') {
      renderMyLibraryGrid()
    }
  },
)
</script>

<template>
<section id="viewLibrary" class="single-view-scroll-pane space-y-4">
      <!-- Compact toolbar: search/status/export + triple filter (same as crawler) -->
      <div class="surface-card p-4 shadow-sm space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <h2 class="text-base font-bold whitespace-nowrap" style="margin: 0">📚 个人文章库</h2>
            <span class="text-xs opacity-70 truncate">精选外刊 · 支持随时切换或取消「已精读完成」状态</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <input id="inputSearchLibrary" type="text" placeholder="搜索文章标题、来源或主题..." class="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
            <select id="selectLibraryStatusFilter" class="crawl-filter-select">
              <option value="all">全部阅读状态</option>
              <option value="unread">⏳ 未读 / 待精读</option>
              <option value="reading">📖 精读进行中</option>
              <option value="finished">✅ 已完成精读</option>
            </select>
            <button id="btnExportLibraryJson" type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition whitespace-nowrap">
              💾 导出备份 (.json)
            </button>
          </div>
        </div>

        <!-- Triple filter strip (identical to the crawler page, default: show all) -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 pt-3" style="border-top: 1px solid var(--border-col)">
          <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">难度
            <select id="libTargetLevel" class="crawl-filter-select" title="目标考试难度">
              <option value="all">智能混排 (CET-4 &amp; CET-6)</option>
              <option value="CET-4">大学英语四级 (250-350词 · 蓝思 950L)</option>
              <option value="CET-6">大学英语六级 (350-480词 · 蓝思 1150L)</option>
              <option value="安徽专升本">安徽专升本英语 (300-450词 · 蓝思 900L)</option>
            </select>
          </label>
          <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">题型
            <select id="libTargetCategory" class="crawl-filter-select" title="高频真题题型">
              <option value="all">🔥 全部五大高频题型</option>
              <option value="科技与人工智能">🤖 科技与人工智能 (高频首选)</option>
              <option value="生态与气候环境">🌱 生态与气候环境 (常考议题)</option>
              <option value="心理与教育认知">🧠 心理与教育认知 (实验研究类)</option>
              <option value="经济与商业职场">💼 经济与商业职场 (经济学人风格)</option>
              <option value="社会文化与健康">🏥 社会文化与健康 (公共议题)</option>
            </select>
          </label>
          <label class="flex items-center gap-1.5 text-xs opacity-70 whitespace-nowrap">刊物源
            <select id="libTargetSource" class="crawl-filter-select" title="定向外刊源">
              <option value="all">🌍 全网主流题源聚合</option>
              <option value="The Economist">The Economist (经济学人)</option>
              <option value="Scientific American">Scientific American (科学美国人)</option>
              <option value="The Guardian">The Guardian (卫报)</option>
              <option value="NPR / BBC Future">NPR &amp; BBC Future</option>
              <option value="Live Web Feed">⚡ 实时在线英文科学/社会接口</option>
            </select>
          </label>
        </div>
      </div>

      <div id="myLibraryGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>
</template>
