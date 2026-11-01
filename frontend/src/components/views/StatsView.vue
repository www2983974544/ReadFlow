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
<section id="viewStats" class="single-view-scroll-pane space-y-5">
      <!-- Top Header & Study Check-in / Reset Controls -->
      <div class="surface-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold flex items-center gap-2">
            <span>📊 ReadFlow 个人时间与精读数据统计中心</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">从零真实记录</span>
          </h2>
          <p class="text-xs opacity-70 mt-0.5">所有初始统计数据已全部清空归零 · 当你完成外刊精读、使用计时器、标注生词或完成自测题时将自动实时累加。</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button id="btnLogStudySession" type="button" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition">
            ➕ 今日打卡记录 (+15分钟 / +350词)
          </button>
          <button id="btnResetAllStats" type="button" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition">
            🗑️ 清空重置全部统计数据
          </button>
        </div>
      </div>

      <!-- 6 Key Statistical Indicators Grid (All Initialized to 0!) -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">⏱️ 累计精读时长</div>
          <div id="statPageTotalHours" class="text-2xl font-bold text-indigo-600">0.0 小时</div>
          <div id="statPageTodayMins" class="text-[11px] text-emerald-600 font-semibold">今日已读 0 分钟</div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">📖 累计阅读词数</div>
          <div id="statPageTotalWords" class="text-2xl font-bold text-indigo-600">0 词</div>
          <div id="statPageTotalPassages" class="text-[11px] opacity-75">已精读 0 篇同源外刊</div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">🔖 累计攻克生词</div>
          <div id="statPageVocabCount" class="text-2xl font-bold text-rose-600">0 词</div>
          <div id="statPageVocabSub" class="text-[11px] opacity-75">标注单词后自动累计</div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">🔥 连续打卡天数</div>
          <div id="statPageStreak" class="text-2xl font-bold text-amber-600">0 天</div>
          <div id="statPageLongestStreak" class="text-[11px] text-emerald-600 font-semibold">历史最长 0 天</div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">🚀 平均阅读语速</div>
          <div id="statPageAvgWpm" class="text-2xl font-bold text-emerald-600">0 WPM</div>
          <div id="statPageWpmSub" class="text-[11px] opacity-75">开始精读后自动测算</div>
        </div>
        <div class="surface-card p-4 shadow-sm space-y-1">
          <div class="text-xs opacity-65 font-medium">🎯 模考自测正确率</div>
          <div id="statPageQuizRate" class="text-2xl font-bold text-violet-600">0%</div>
          <div id="statPageQuizSub" class="text-[11px] opacity-75">已答 0 题 · 正确 0 题</div>
        </div>
      </div>

      <!-- GitHub-Style 52-Week Annual Reading & Vocabulary Contribution Heatmap -->
      <div class="surface-card p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold flex items-center gap-2">
              <span>🟩 年度阅读与生词积累热力图 (GitHub Contribution Graph)</span>
            </h3>
            <p class="text-xs opacity-70 mt-0.5">过去 52 周（364 天）每日阅读贡献度矩阵 · 初始状态全为空白（Lv.0），随你每日学习实时点亮</p>
          </div>

          <!-- Heatmap Metric Switcher -->
          <div class="flex items-center gap-1.5 text-xs">
            <button data-hmtype="all" type="button" class="hm-mode-btn px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white">综合活跃度</button>
            <button data-hmtype="words" type="button" class="hm-mode-btn px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">阅读词数</button>
            <button data-hmtype="vocab" type="button" class="hm-mode-btn px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">标注生词数</button>
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
            <div>
              <h3 class="text-sm font-bold">📈 近 14 天每日精读时长趋势 (分钟/天)</h3>
              <p class="text-xs opacity-65">初始为 0 分钟，当你每日完成外刊阅读或使用阅读计时器后将自动生成柱状趋势</p>
            </div>
            <span id="stat14DayAvgLabel" class="text-xs font-bold text-indigo-600">日均 0 分钟</span>
          </div>
          <div id="chart14DaysBars" class="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200/80"></div>
        </div>

        <!-- Right: 5 High-Frequency CET Exam Categories Mastery Breakdown (5 cols) -->
        <div class="lg:col-span-5 surface-card p-5 shadow-sm space-y-3.5">
          <div>
            <h3 class="text-sm font-bold">🎯 四六级五大高频题型精读覆盖度与掌握率</h3>
            <p class="text-xs opacity-65">根据你实际标记「已精读完成」的文章体裁自动统计覆盖进度</p>
          </div>
          <div id="categoryMasteryContainer" class="space-y-3 text-xs"></div>
        </div>
      </div>
    </section>
</template>
