<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui'
import { initLibraryView, renderMyLibraryGrid } from '../legacy/library'

const ui = useUiStore()

onMounted(() => {
  initLibraryView()
})

watch(
  () => ui.activeView,
  (v) => {
    if (v === 'library') renderMyLibraryGrid()
  },
)
</script>

<template>
  <section id="viewLibrary" class="view-scroll library-page">
    <div class="surface-card p-3.5 shadow-sm space-y-2.5">
      <div class="text-center">
        <h2 class="text-base font-bold" style="margin: 0">📚 我的文章库</h2>
        <p class="text-xs opacity-70 mt-1 leading-relaxed">精选外刊收藏夹，支持切换或取消「已精读完成」状态。</p>
      </div>

      <input id="inputSearchLibrary" type="text" placeholder="搜索文章标题、来源或主题..." class="lib-input" />

      <select id="selectLibraryStatusFilter" class="lib-input">
        <option value="all">全部阅读状态</option>
        <option value="unread">⏳ 未读 / 待精读</option>
        <option value="reading">📖 精读进行中</option>
        <option value="finished">✅ 已完成精读</option>
      </select>

      <details class="reader-filter-drawer">
        <summary>⚙️ 三联筛选（难度 / 题型 / 来源）</summary>
        <div class="pt-2.5 pb-1 space-y-2">
          <label class="flex items-center gap-2 text-xs opacity-80">难度
            <select id="libTargetLevel" class="crawl-filter-select flex-1 min-w-0">
              <option value="all">全部难度</option>
              <option value="CET-4">四级 CET-4</option>
              <option value="CET-6">六级 CET-6</option>
              <option value="安徽专升本">安徽专升本</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-xs opacity-80">题型
            <select id="libTargetCategory" class="crawl-filter-select flex-1 min-w-0">
              <option value="all">全部题型</option>
              <option value="科技与人工智能">🤖 科技与人工智能</option>
              <option value="生态与气候环境">🌱 生态与气候环境</option>
              <option value="心理与教育认知">🧠 心理与教育认知</option>
              <option value="经济与商业职场">💼 经济与商业职场</option>
              <option value="社会文化与健康">🏥 社会文化与健康</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-xs opacity-80">来源
            <select id="libTargetSource" class="crawl-filter-select flex-1 min-w-0">
              <option value="all">全部来源</option>
              <option value="The Economist">The Economist (经济学人)</option>
              <option value="Scientific American">Scientific American</option>
              <option value="The Guardian">The Guardian (卫报)</option>
              <option value="NPR / BBC Future">NPR &amp; BBC Future</option>
              <option value="Live Web Feed">⚡ 实时在线接口</option>
            </select>
          </label>
        </div>
      </details>

      <button id="btnExportLibraryJson" type="button" class="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition">
        💾 导出备份文章库 (.json)
      </button>
    </div>

    <div id="myLibraryGrid" class="grid grid-cols-1 gap-3 mt-3"></div>
    <div class="h-4"></div>
  </section>
</template>

<style scoped>
.library-page {
  padding: 10px 12px 0;
}
.lib-input {
  width: 100%;
  height: 36px;
  font-size: 12.5px;
  border-radius: 10px;
  border: 1px solid var(--border-col);
  background-color: var(--bg-input);
  color: var(--text-main);
  padding: 0 10px;
  outline: none;
}
.lib-input:focus {
  border-color: #818cf8;
}
</style>
