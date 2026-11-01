<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui'
import { initVocabView, renderVocabNotebook } from '../legacy/vocab-view'

const ui = useUiStore()

onMounted(() => {
  initVocabView()
})

watch(
  () => ui.activeView,
  (v) => {
    if (v === 'vocab') renderVocabNotebook()
  },
)
</script>

<template>
  <section id="viewVocab" class="view-scroll vocab-page">
    <div class="surface-card p-3.5 shadow-sm space-y-2.5">
      <div class="text-center">
        <h2 class="text-base font-bold" style="margin: 0">🔖 我的单词库</h2>
        <p class="text-xs opacity-70 mt-1 leading-relaxed">汇总阅读时标注的全部词汇，附派生词与同义替换词。</p>
      </div>

      <!-- 四态筛选 chips 横滑 -->
      <div class="vocab-filter-strip">
        <button id="btnFilterVocabAll" data-vfilter="all" type="button" class="vocab-filter-btn px-3 py-2 rounded-lg text-xs font-semibold bg-white text-indigo-700 shadow-sm shrink-0">全部标注词</button>
        <button id="btnFilterVocabUnknown" data-vfilter="unknown" type="button" class="vocab-filter-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shrink-0">🔴 陌生生词</button>
        <button id="btnFilterVocabCore" data-vfilter="core" type="button" class="vocab-filter-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shrink-0">🟡 四六级核心</button>
        <button id="btnFilterVocabMastered" data-vfilter="mastered" type="button" class="vocab-filter-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shrink-0">🟢 已掌握</button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button id="btnToggleFlashcardMask" type="button" class="py-2.5 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition">
          🙈 遮盖自测
        </button>
        <button id="btnExportVocabCsv" type="button" class="py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition">
          📥 导出 CSV
        </button>
      </div>
    </div>

    <div id="vocabNotebookGrid" class="grid grid-cols-1 gap-3 mt-3"></div>
    <div class="h-4"></div>
  </section>
</template>

<style scoped>
.vocab-page {
  padding: 10px 12px 0;
}
.vocab-filter-strip {
  display: flex;
  flex-direction: row;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}
.vocab-filter-strip::-webkit-scrollbar {
  display: none;
}
</style>
