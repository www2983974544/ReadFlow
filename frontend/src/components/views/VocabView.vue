<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/ui'
import { initVocabView, renderVocabNotebook } from '../../legacy/vocab-view'

const ui = useUiStore()

onMounted(() => {
  initVocabView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'vocab') {
      renderVocabNotebook()
    }
  },
)
</script>

<template>
<section id="viewVocab" class="single-view-scroll-pane space-y-4">
      <!-- Compact toolbar: segmented filter slot + tool actions -->
      <div class="surface-card px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 min-w-0">
          <h2 class="text-base font-bold mr-1 whitespace-nowrap" style="margin: 0">🔖 个人单词库</h2>
          <div class="inline-flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
            <button id="btnFilterVocabAll" data-vfilter="all" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 shadow-sm">全部标注词</button>
            <button id="btnFilterVocabUnknown" data-vfilter="unknown" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">🔴 陌生生词</button>
            <button id="btnFilterVocabCore" data-vfilter="core" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">🟡 四六级核心</button>
            <button id="btnFilterVocabMastered" data-vfilter="mastered" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">🟢 已掌握</button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button id="btnToggleFlashcardMask" type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition whitespace-nowrap">
            🙈 遮盖中文释义自测
          </button>
          <button id="btnExportVocabCsv" type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition whitespace-nowrap">
            📥 导出 Excel/CSV 生词表
          </button>
        </div>
      </div>

      <div id="vocabNotebookGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>
</template>
