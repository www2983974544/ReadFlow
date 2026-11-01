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
<section id="viewLibrary" class="single-view-scroll-pane space-y-5">
      <div class="surface-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold flex items-center gap-2">
            <span>📚 ReadFlow 个人文章库</span>
          </h2>
          <p class="text-xs opacity-70 mt-0.5">这里存放你主动选择加入文章库的精选外刊，支持随时切换或取消「已精读完成」状态。</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <input id="inputSearchLibrary" type="text" placeholder="搜索文章标题、来源或主题..." class="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56" />
          <select id="selectLibraryStatusFilter" class="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-transparent">
            <option value="all">全部阅读状态</option>
            <option value="unread">⏳ 未读 / 待精读</option>
            <option value="reading">📖 精读进行中</option>
            <option value="finished">✅ 已完成精读</option>
          </select>
          <button id="btnExportLibraryJson" type="button" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition">
            💾 导出备份文章库 (.json)
          </button>
        </div>
      </div>

      <div id="myLibraryGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>
</template>
