<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui'
import { initStatsView, renderStatsAndHeatmap } from '../legacy/stats-view'

const ui = useUiStore()

onMounted(() => {
  initStatsView()
})

watch(
  () => ui.activeView,
  (v) => {
    if (v === 'stats') renderStatsAndHeatmap()
  },
)
</script>

<template>
  <section id="viewStats" class="view-scroll stats-page space-y-3">
    <!-- 头部 + 打卡/清零 -->
    <div class="surface-card p-3.5 shadow-sm space-y-2.5">
      <div class="text-center">
        <h2 class="text-base font-bold" style="margin: 0">📊 个人时间与精读统计</h2>
        <p class="text-xs opacity-70 mt-1">从零真实记录 · 完成精读、计时、标注或自测时自动累加</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button id="btnLogStudySession" type="button" class="py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition">
          ➕ 今日打卡 (+15分/+350词)
        </button>
        <button id="btnResetAllStats" type="button" title="清空全部统计数据（不可恢复）" class="py-2.5 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition">
          🗑️ 清空重置全部数据
        </button>
      </div>
    </div>

    <!-- 6 大核心指标（移动端两列，数字居中） -->
    <div class="grid grid-cols-2 gap-3">
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">⏱️ 累计精读时长</div>
        <div id="statPageTotalHours" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0.0 小时</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1"></span><span id="statPageTodayMins">今日已读 0 分钟</span></div>
      </div>
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">📖 累计阅读词数</div>
        <div id="statPageTotalWords" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 词</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1"></span><span id="statPageTotalPassages">已精读 0 篇同源外刊</span></div>
      </div>
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">🔖 累计攻克生词</div>
        <div id="statPageVocabCount" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 词</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span><span id="statPageVocabSub">标注单词后自动累计</span></div>
      </div>
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">🔥 连续打卡</div>
        <div id="statPageStreak" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 天</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1"></span><span id="statPageLongestStreak">历史最长 0 天</span></div>
      </div>
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">🚀 平均阅读语速</div>
        <div id="statPageAvgWpm" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 WPM</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span><span id="statPageWpmSub">开始精读后自动测算</span></div>
      </div>
      <div class="surface-card p-3.5 shadow-sm space-y-1 text-center">
        <div class="text-[11px] opacity-60 font-medium">🎯 模考自测正确率</div>
        <div id="statPageQuizRate" class="text-xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0%</div>
        <div class="text-[11px] opacity-70"><span class="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 mr-1"></span><span id="statPageQuizSub">已答 0 题 · 正确 0 题</span></div>
      </div>
    </div>

    <!-- GitHub 风格年度热力图（横向滚动） -->
    <div class="surface-card p-3.5 shadow-sm space-y-3">
      <div class="text-center space-y-1">
        <h3 class="text-sm font-bold" style="margin: 0">🟩 年度阅读热力图</h3>
        <p class="text-[11px] opacity-65">过去 52 周（364 天）每日贡献矩阵</p>
        <div class="hm-mode-strip">
          <button data-hmtype="all" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-semibold bg-white text-indigo-700 shadow-sm shrink-0">综合活跃度</button>
          <button data-hmtype="words" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-medium text-slate-600 shrink-0">阅读词数</button>
          <button data-hmtype="vocab" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-medium text-slate-600 shrink-0">标注生词</button>
        </div>
      </div>

      <div class="heatmap-scroll">
        <div class="heatmap-inner">
          <div class="grid grid-cols-12 text-[10px] opacity-65 pl-7 mb-1">
            <span>11月</span><span>12月</span><span>1月</span><span>2月</span><span>3月</span><span>4月</span>
            <span>5月</span><span>6月</span><span>7月</span><span>8月</span><span>9月</span><span>10月</span>
          </div>
          <div class="flex items-start gap-2">
            <div class="flex flex-col justify-between h-[102px] text-[9px] opacity-60 pr-1 py-1 shrink-0">
              <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
            </div>
            <div id="githubHeatmapGrid" class="flex items-center gap-[3px]"></div>
          </div>
        </div>
      </div>

      <div class="pt-2 space-y-2" style="border-top: 1px solid var(--border-col)">
        <div id="heatmapInspectorText" class="text-[11px] font-semibold text-indigo-600 leading-relaxed"></div>
        <div class="flex items-center justify-center gap-1.5 text-[10px] opacity-75">
          <span>0 记录</span>
          <span class="hm-cell hm-lv-0 inline-block"></span>
          <span class="hm-cell hm-lv-1 inline-block"></span>
          <span class="hm-cell hm-lv-2 inline-block"></span>
          <span class="hm-cell hm-lv-3 inline-block"></span>
          <span class="hm-cell hm-lv-4 inline-block"></span>
          <span>高强度</span>
        </div>
      </div>
    </div>

    <!-- 14 天趋势 -->
    <div class="surface-card p-3.5 shadow-sm space-y-3">
      <div class="text-center space-y-0.5">
        <h3 class="text-sm font-bold" style="margin: 0">📈 近 14 天精读时长趋势</h3>
        <span id="stat14DayAvgLabel" class="text-[11px] font-bold text-indigo-600">日均 0 分钟</span>
      </div>
      <div id="chart14DaysBars" class="h-40 flex items-end justify-between gap-1.5 pt-4 px-1" style="border-bottom: 1px solid var(--border-col)"></div>
    </div>

    <!-- 五大题型掌握度 -->
    <div class="surface-card p-3.5 shadow-sm space-y-3">
      <div class="text-center space-y-0.5">
        <h3 class="text-sm font-bold" style="margin: 0">🎯 五大高频题型覆盖度</h3>
        <p class="text-[11px] opacity-65">根据实际标记「已精读完成」的文章体裁统计</p>
      </div>
      <div id="categoryMasteryContainer" class="space-y-3 text-xs"></div>
    </div>
    <div class="h-4"></div>
  </section>
</template>

<style scoped>
.stats-page {
  padding: 10px 12px 0;
}
.hm-mode-strip {
  display: flex;
  flex-direction: row;
  gap: 6px;
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;
}
.hm-mode-strip::-webkit-scrollbar {
  display: none;
}
.heatmap-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.heatmap-inner {
  min-width: 800px;
}
</style>
