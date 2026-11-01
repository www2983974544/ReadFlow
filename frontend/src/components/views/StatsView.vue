<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/ui'
import { initStatsView, renderStatsAndHeatmap } from '../../legacy/stats-view'

const ui = useUiStore()

onMounted(() => {
  initStatsView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'stats') {
      renderStatsAndHeatmap()
    }
  },
)
</script>

<template>
<section id="viewStats" class="single-view-scroll-pane space-y-4">
      <!-- Compact data-center header -->
      <div class="surface-card px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <h2 class="text-base font-bold whitespace-nowrap" style="margin: 0">📊 个人时间与精读统计</h2>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">实时记录</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button id="btnLogStudySession" type="button" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition whitespace-nowrap">
            ➕ 今日打卡 (+15分钟 / +350词)
          </button>
          <button id="btnResetAllStats" type="button" title="清空全部统计数据（不可恢复）" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition whitespace-nowrap">
            🗑️ 清空重置全部数据
          </button>
        </div>
      </div>

      <!-- 6 Key Statistical Indicators: unified monochrome numerals -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">⏱️ 累计精读时长</div>
          <div id="statPageTotalHours" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0.0 小时</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span><span id="statPageTodayMins">今日已读 0 分钟</span></div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">📖 累计阅读词数</div>
          <div id="statPageTotalWords" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 词</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span><span id="statPageTotalPassages">已精读 0 篇同源外刊</span></div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">🔖 累计攻克生词</div>
          <div id="statPageVocabCount" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 词</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span><span id="statPageVocabSub">标注单词后自动累计</span></div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">🔥 连续打卡天数</div>
          <div id="statPageStreak" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 天</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span><span id="statPageLongestStreak">历史最长 0 天</span></div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">🚀 平均阅读语速</div>
          <div id="statPageAvgWpm" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0 WPM</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span><span id="statPageWpmSub">开始精读后自动测算</span></div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-[11.5px] opacity-60 font-medium">🎯 模考自测正确率</div>
          <div id="statPageQuizRate" class="text-2xl font-bold tracking-tight font-mono" style="color: var(--text-main)">0%</div>
          <div class="flex items-center gap-1.5 text-[11px] opacity-70"><span class="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span><span id="statPageQuizSub">已答 0 题 · 正确 0 题</span></div>
        </div>
      </div>

      <!-- GitHub-Style 52-Week Annual Heatmap -->
      <div class="surface-card p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-base font-bold whitespace-nowrap" style="margin: 0">🟩 年度阅读与生词积累热力图</h3>

          <!-- Heatmap Metric Switcher (segmented slot) -->
          <div class="inline-flex items-center bg-slate-100/80 p-0.5 rounded-lg gap-0.5 text-xs">
            <button data-hmtype="all" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-semibold bg-white text-indigo-700 shadow-sm">综合活跃度</button>
            <button data-hmtype="words" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-medium text-slate-600">阅读词数</button>
            <button data-hmtype="vocab" type="button" class="hm-mode-btn px-3 py-1.5 rounded-md font-medium text-slate-600">标注生词数</button>
          </div>
        </div>

        <!-- Month Labels + 52x7 Heatmap Scroll Container -->
        <div class="overflow-x-auto pb-2">
          <div class="min-w-[780px] space-y-1.5">
            <!-- Months Row -->
            <div class="grid grid-cols-12 text-[11px] opacity-65 pl-8">
              <span>11月</span><span>12月</span><span>1月</span><span>2月</span><span>3月</span><span>4月</span>
              <span>5月</span><span>6月</span><span>7月</span><span>8月</span><span>9月</span><span>10月</span>
            </div>

            <div class="flex items-start gap-2">
              <!-- Day of Week Labels -->
              <div class="flex flex-col justify-between h-[102px] text-[10px] opacity-60 pr-1 py-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>

              <!-- 52 Weeks Columns Container -->
              <div id="githubHeatmapGrid" class="flex items-center gap-[3px]"></div>
            </div>
          </div>
        </div>

        <!-- Interactive Day Inspector Bar & Legend -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-xs">
          <div id="heatmapInspectorText" class="font-semibold text-indigo-600">
            📅 2026-10-31 (今日)：已精读 0 分钟 · 阅读 0 词 · 新增标注生词 0 个 (尚无学习记录，开始精读后自动点亮热力图)
          </div>

          <div class="flex items-center gap-1.5 text-[11px] opacity-75">
            <span>0 记录 (Lv.0)</span>
            <span class="hm-cell hm-lv-0 inline-block"></span>
            <span class="hm-cell hm-lv-1 inline-block"></span>
            <span class="hm-cell hm-lv-2 inline-block"></span>
            <span class="hm-cell hm-lv-3 inline-block"></span>
            <span class="hm-cell hm-lv-4 inline-block"></span>
            <span>高强度 (Lv.4)</span>
          </div>
        </div>
      </div>

      <!-- Lower Analytics Charts: 14-Day Reading Duration Trend & 5 CET Categories Mastery -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Left: 14-Day Reading Duration & Words Bar Chart (7 cols) -->
        <div class="lg:col-span-7 surface-card p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold" style="margin: 0">📈 近 14 天每日精读时长趋势</h3>
            <span id="stat14DayAvgLabel" class="text-xs font-bold text-indigo-600">日均 0 分钟</span>
          </div>
          <div id="chart14DaysBars" class="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200/80"></div>
        </div>

        <!-- Right: 5 High-Frequency CET Exam Categories Mastery Breakdown (5 cols) -->
        <div class="lg:col-span-5 surface-card p-5 shadow-sm space-y-3.5">
          <h3 class="text-sm font-bold" style="margin: 0">🎯 四六级五大高频题型精读覆盖度与掌握率</h3>
          <div id="categoryMasteryContainer" class="space-y-3 text-xs"></div>
        </div>
      </div>
    </section>
</template>
