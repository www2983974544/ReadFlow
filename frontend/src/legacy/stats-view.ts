// Stats view (ported from renderStatsAndHeatmap + reset flow + bindings).
import { S } from './state'
import { hooks, recordTodayStudyDelta, showToast, updateTopBadgesAndStats } from './ui-fns'
import { renderCurrentArticle, renderSidebarArticleList } from './reader'
import { useArticlesStore } from '../stores/articles'
import { useStatsStore } from '../stores/stats'
import { useVocabStore } from '../stores/vocab'

export function renderStatsAndHeatmap() {
  const s = S()
  const statsStore = useStatsStore()
  statsStore.rebuildHeatmapFromDailyMap()

  const totalHours = (statsStore.totalStudyMinutes / 60).toFixed(1)
  const markedCount = Object.keys(s.wordMarks).length
  const finishedArticles = s.articles.filter((a) => a.readStatus === 'finished')
  const finishedCount = finishedArticles.length
  const avgWpm =
    statsStore.totalStudyMinutes > 0 && statsStore.totalReadWords > 0
      ? Math.min(260, Math.max(80, Math.round(statsStore.totalReadWords / statsStore.totalStudyMinutes)))
      : 0
  const quizRate = s.quizAnswered > 0 ? Math.round((s.quizCorrect / s.quizAnswered) * 100) : 0

  const el = (id: string) => document.getElementById(id)
  const setText = (id: string, text: string) => {
    const node = el(id)
    if (node) node.textContent = text
  }

  setText('statPageTotalHours', totalHours + ' 小时')
  setText('statPageTodayMins', `今日已读 ${statsStore.todayStudyMinutes} 分钟`)
  setText('statPageTotalWords', statsStore.totalReadWords.toLocaleString() + ' 词')
  setText('statPageTotalPassages', `已精读 ${finishedCount} 篇同源外刊`)
  setText('statPageVocabCount', markedCount + ' 词')
  setText('statPageVocabSub', markedCount > 0 ? `已收录 ${markedCount} 个核心词族` : '标注单词后自动累计')
  setText('statPageStreak', statsStore.streakDays + ' 天')
  setText('statPageLongestStreak', `历史最长 ${statsStore.longestStreakDays} 天`)
  setText('statPageAvgWpm', avgWpm + ' WPM')
  setText('statPageWpmSub', avgWpm > 0 ? '基于已精读词数与用时测算' : '开始精读后自动测算')
  setText('statPageQuizRate', quizRate + '%')
  setText('statPageQuizSub', `已答 ${s.quizAnswered} 题 · 正确 ${s.quizCorrect} 题`)

  // Build 52 weeks x 7 days GitHub Heatmap Grid
  const hmGrid = el('githubHeatmapGrid')
  if (hmGrid) {
    const weeksHtml: string[] = []
    for (let w = 0; w < 52; w++) {
      const colCells: string[] = []
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d
        const item = statsStore.heatmapData[idx] || {
          date: statsStore.getTodayDateString(),
          mins: 0,
          words: 0,
          vocab: 0,
          lv: 0,
        }
        let lv = item.lv
        if (s.heatmapMode === 'words') {
          lv = item.words > 900 ? 4 : item.words > 600 ? 3 : item.words > 300 ? 2 : item.words > 0 ? 1 : 0
        } else if (s.heatmapMode === 'vocab') {
          lv = item.vocab >= 8 ? 4 : item.vocab >= 5 ? 3 : item.vocab >= 2 ? 2 : item.vocab > 0 ? 1 : 0
        }
        colCells.push(
          `<div data-hmidx="${idx}" class="hm-cell hm-lv-${lv}" title="${item.date}: 精读 ${item.mins} 分钟 | 阅读 ${item.words} 词 | 生词 ${item.vocab} 个"></div>`,
        )
      }
      weeksHtml.push(`<div class="flex flex-col gap-[3px]">${colCells.join('')}</div>`)
    }
    hmGrid.innerHTML = weeksHtml.join('')
  }

  // Update Heatmap Inspector Text for Today
  const todayItem =
    statsStore.heatmapData[statsStore.heatmapData.length - 1] ||
    { date: statsStore.getTodayDateString(), mins: 0, words: 0, vocab: 0, lv: 0 }
  const inspEl = el('heatmapInspectorText')
  if (inspEl) {
    if (todayItem.mins === 0 && todayItem.words === 0 && todayItem.vocab === 0) {
      inspEl.textContent = `📅 ${todayItem.date} (今日)：已精读 0 分钟 · 阅读 0 词 · 新增标注生词 0 个 (尚无学习记录，开始精读后自动点亮热力图)`
    } else {
      inspEl.textContent = `📅 ${todayItem.date} (今日)：已精读 ${todayItem.mins} 分钟 · 阅读 ${todayItem.words} 词 · 新增标注生词 ${todayItem.vocab} 个 (活跃度 Lv.${todayItem.lv})`
    }
  }

  // Render 14-Day Reading Duration Bar Chart
  const barsBox = el('chart14DaysBars')
  const avg14El = el('stat14DayAvgLabel')
  if (barsBox) {
    const last14 = statsStore.heatmapData.slice(-14)
    const sum14 = last14.reduce((acc, x) => acc + x.mins, 0)
    const avg14 = Math.round(sum14 / 14)
    if (avg14El) avg14El.textContent = `日均 ${avg14} 分钟`

    const maxMins = Math.max(45, ...last14.map((x) => x.mins))
    barsBox.innerHTML = last14
      .map((item, i) => {
        const hPct = item.mins > 0 ? Math.max(12, Math.round((item.mins / maxMins) * 100)) : 4
        const shortDate = item.date.slice(5)
        const isToday = i === last14.length - 1
        const barCol = item.mins > 0 ? (isToday ? 'bg-indigo-600' : 'bg-indigo-500/80') : 'bg-slate-200'
        return `
            <div class="flex-1 flex flex-col items-center justify-end h-full group">
              <div class="text-[10px] font-bold opacity-75 mb-1">${item.mins}m</div>
              <div class="w-full max-w-[26px] rounded-t-lg transition-all ${barCol}" style="height:${hPct}%;"></div>
              <div class="text-[10px] opacity-65 mt-1.5 truncate">${isToday ? '今日' : shortDate}</div>
            </div>
          `
      })
      .join('')
  }

  // Render 5 High-Frequency CET Exam Categories Mastery Breakdown
  const catBox = el('categoryMasteryContainer')
  if (catBox) {
    const categories = [
      { name: '科技与人工智能', label: '🤖 科技与人工智能 (The Economist / Wired)', colorText: 'text-indigo-600', colorBar: 'bg-indigo-600' },
      { name: '生态与气候环境', label: '🌱 生态与气候环境 (Scientific American / Nature)', colorText: 'text-emerald-600', colorBar: 'bg-emerald-500' },
      { name: '心理与教育认知', label: '🧠 心理与教育认知 (The Guardian / The Atlantic)', colorText: 'text-violet-600', colorBar: 'bg-violet-500' },
      { name: '经济与商业职场', label: '💼 经济与商业职场 (Harvard Business Review)', colorText: 'text-amber-600', colorBar: 'bg-amber-500' },
      { name: '社会文化与健康', label: '🏥 社会文化与健康 (NPR / BBC Future)', colorText: 'text-rose-600', colorBar: 'bg-rose-500' },
    ]
    catBox.innerHTML = categories
      .map((cat) => {
        const finInCat = finishedArticles.filter((a) => a.category === cat.name).length
        const pct = Math.min(100, finInCat * 25)
        return `
            <div>
              <div class="flex justify-between font-semibold mb-1">
                <span>${cat.label}</span>
                <span class="${cat.colorText}">${pct}% (${finInCat} 篇)</span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full ${cat.colorBar} rounded-full transition-all" style="width:${pct}%;"></div>
              </div>
            </div>
          `
      })
      .join('')
  }
}

export async function resetAllPersonalStatsToZero() {
  // Server-side reset also clears vocab marks and reverts finished articles
  // (mirrors the legacy resetAllPersonalStatsToZero).
  await useStatsStore().resetAll()
  await Promise.all([useArticlesStore().load(), useVocabStore().load()])
  updateTopBadgesAndStats()
  renderSidebarArticleList()
  renderCurrentArticle()
  renderStatsAndHeatmap()
}

export function initStatsView() {
  hooks.renderStatsAndHeatmap = renderStatsAndHeatmap
  const s = S()

  document.querySelectorAll('.hm-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      s.heatmapMode = (btn.getAttribute('data-hmtype') || 'all') as 'all' | 'words' | 'vocab'
      document.querySelectorAll('.hm-mode-btn').forEach((b) => {
        b.className =
          b === btn
            ? 'hm-mode-btn px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white'
            : 'hm-mode-btn px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200'
      })
      renderStatsAndHeatmap()
    })
  })

  document.getElementById('githubHeatmapGrid')?.addEventListener('mouseover', (e) => {
    const cell = (e.target as HTMLElement).closest('.hm-cell') as HTMLElement | null
    if (!cell) return
    const idx = parseInt(cell.getAttribute('data-hmidx') || '0', 10)
    const item = useStatsStore().heatmapData[idx]
    const inspEl = document.getElementById('heatmapInspectorText')
    if (item && inspEl) {
      inspEl.textContent = `📅 ${item.date}：精读 ${item.mins} 分钟 · 阅读 ${item.words} 词 · 新增标注生词 ${item.vocab} 个 (活跃度 Lv.${item.lv})`
    }
  })

  document.getElementById('btnLogStudySession')?.addEventListener('click', async () => {
    await recordTodayStudyDelta(15, 350, null)
    showToast('🔥 今日打卡记录成功！已增加 15 分钟精读时长与 350 阅读词数')
  })

  document.getElementById('btnResetAllStats')?.addEventListener('click', async () => {
    await resetAllPersonalStatsToZero()
    showToast('🗑️ 个人时间统计与阅读数据已全部清空归零')
  })

  renderStatsAndHeatmap()
}
