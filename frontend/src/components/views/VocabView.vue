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
<section id="viewVocab" class="single-view-scroll-pane space-y-5">
      <div class="surface-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold">🔖 ReadFlow 单词库 (含词性派生词 & 同义替换词)</h2>
          <p class="text-xs opacity-70 mt-0.5">汇总你在阅读时标注的所有词汇，自动附带「不同词性派生词」与「四六级高频同义替换词」，支持一键遮盖自测与导出。</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button id="btnFilterVocabAll" data-vfilter="all" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white">全部标注词</button>
          <button id="btnFilterVocabUnknown" data-vfilter="unknown" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 陌生生词</button>
          <button id="btnFilterVocabCore" data-vfilter="core" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">🟡 四六级核心</button>
          <button id="btnFilterVocabMastered" data-vfilter="mastered" type="button" class="vocab-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 已掌握</button>
          <button id="btnToggleFlashcardMask" type="button" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition">
            🙈 遮盖中文释义自测
          </button>
          <button id="btnExportVocabCsv" type="button" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition">
            📥 导出 Excel/CSV 生词表
          </button>
        </div>
      </div>

      <div id="vocabNotebookGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>
</template>
