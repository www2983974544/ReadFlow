// Ported UI helper functions (toast, badges, theme, sidebar collapse, stats delta).
import { S } from './state'
import { useStatsStore } from '../stores/stats'

// P4 view renderers register themselves here so P2 functions can call them
// before the stats/crawler/library views are ported.
export const hooks: {
  renderStatsAndHeatmap: () => void
} = {
  renderStatsAndHeatmap: () => {},
}

export function showToast(msg: string) {
  const toast = document.getElementById('toastNotification')
  const text = document.getElementById('toastText')
  if (!toast || !text) return
  text.textContent = msg
  toast.classList.remove('hidden')
  const w = window as unknown as { __toastTimer?: number }
  clearTimeout(w.__toastTimer)
  w.__toastTimer = setTimeout(() => {
    toast.classList.add('hidden')
  }, 2400)
}

export function updateTopBadgesAndStats() {
  const s = S()
  const libArticles = s.articles.filter((a) => a.inLibrary)
  const discArticles = s.articles.filter((a) => !a.inLibrary)
  const finishedArticles = s.articles.filter((a) => a.readStatus === 'finished')
  const markedCount = Object.keys(s.wordMarks).length

  const el = (id: string) => document.getElementById(id)
  const badgeDiscovery = el('badgeDiscoveryCount')
  const badgeLibrary = el('badgeLibraryCount')
  const badgeVocab = el('badgeVocabCount')
  if (badgeDiscovery) badgeDiscovery.textContent = String(discArticles.length)
  if (badgeLibrary) badgeLibrary.textContent = String(libArticles.length)
  if (badgeVocab) badgeVocab.textContent = String(markedCount)

  const statLibraryTotal = el('statLibraryTotal')
  const statMarkedWords = el('statMarkedWords')
  const statFinishedArticles = el('statFinishedArticles')
  const statQuizAccuracy = el('statQuizAccuracy')
  if (statLibraryTotal) statLibraryTotal.textContent = String(libArticles.length)
  if (statMarkedWords) statMarkedWords.textContent = String(markedCount)
  if (statFinishedArticles) statFinishedArticles.textContent = String(finishedArticles.length)
  const acc =
    s.quizAnswered > 0 ? Math.round((s.quizCorrect / s.quizAnswered) * 100) + '%' : '0%'
  if (statQuizAccuracy) statQuizAccuracy.textContent = acc
}

export function applyThemeMode(mode: string) {
  document.body.classList.remove('theme-sepia', 'theme-dark')
  if (mode === 'sepia') document.body.classList.add('theme-sepia')
  if (mode === 'dark') document.body.classList.add('theme-dark')

  const btnLight = document.getElementById('btnThemeLight')
  const btnSepia = document.getElementById('btnThemeSepia')
  const btnDark = document.getElementById('btnThemeDark')

  if (btnLight) {
    btnLight.className =
      mode === 'light'
        ? 'px-2 py-1 bg-indigo-600 text-white font-semibold transition'
        : 'px-2 py-1 hover:bg-slate-100 text-slate-600 font-medium transition'
  }
  if (btnSepia) {
    btnSepia.className =
      mode === 'sepia'
        ? 'px-2 py-1 bg-amber-700 text-white font-semibold transition'
        : 'px-2 py-1 hover:bg-amber-100 text-slate-600 font-medium transition'
  }
  if (btnDark) {
    btnDark.className =
      mode === 'dark'
        ? 'px-2 py-1 bg-indigo-500 text-white font-semibold transition'
        : 'px-2 py-1 hover:bg-slate-800 hover:text-white text-slate-600 font-medium transition'
  }
}

export function applySidebarCollapseLayout() {
  const s = S()
  const leftPane = document.getElementById('leftSidebarPane')
  const rightPane = document.getElementById('rightInspectorPane')
  const btnLeft = document.getElementById('btnToggleLeftPane')
  const btnRight = document.getElementById('btnToggleRightPane')
  const leftGutter = document.getElementById('leftGutterDivider')
  const rightGutter = document.getElementById('rightGutterDivider')
  const leftIcon = document.getElementById('leftGutterIcon')
  const rightIcon = document.getElementById('rightGutterIcon')
  const btnImmersive = document.getElementById('btnImmersiveBothPanes')

  // In Flexbox layout, toggling .hidden on leftPane/rightPane lets centerReaderPane (flex: 1 1 0%)
  // smoothly expand to fill 100% of the remaining width without EVER disappearing!
  if (leftPane) leftPane.classList.toggle('hidden', s.leftCollapsed)
  if (rightPane) rightPane.classList.toggle('hidden', s.rightCollapsed)

  if (btnLeft) {
    btnLeft.textContent = s.leftCollapsed ? '▶ 展开左栏' : '◀ 收起左栏'
    btnLeft.className = s.leftCollapsed
      ? 'toolbar-pill-btn bg-indigo-600 text-white shadow-sm'
      : 'toolbar-pill-btn bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
  }
  if (btnRight) {
    btnRight.textContent = s.rightCollapsed ? '◀ 展开右栏' : '收起右栏 ▶'
    btnRight.className = s.rightCollapsed
      ? 'toolbar-pill-btn bg-indigo-600 text-white shadow-sm'
      : 'toolbar-pill-btn bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
  }
  if (btnImmersive) {
    const bothClosed = s.leftCollapsed && s.rightCollapsed
    btnImmersive.textContent = bothClosed ? '🔲 恢复三栏标准视图' : '🔭 宽屏沉浸阅读模式'
  }

  if (leftIcon) leftIcon.textContent = s.leftCollapsed ? '▶' : '◀'
  if (rightIcon) rightIcon.textContent = s.rightCollapsed ? '◀' : '▶'
  if (leftGutter) leftGutter.classList.toggle('gutter-collapsed-state', s.leftCollapsed)
  if (rightGutter) rightGutter.classList.toggle('gutter-collapsed-state', s.rightCollapsed)
}

// Legacy recordTodayStudyDelta: syncVocabTotal sets today's vocab as an absolute
// total (converted to a delta against the server-side daily entry).
export async function recordTodayStudyDelta(
  deltaMins: number,
  deltaWords: number,
  syncVocabTotal: number | null = null,
) {
  const statsStore = useStatsStore()
  const todayKey = statsStore.getTodayDateString()
  const today = statsStore.stats.dailyStatsMap[todayKey] || { mins: 0, words: 0, vocab: 0 }
  const vocabDelta = syncVocabTotal === null ? 0 : Math.max(0, syncVocabTotal) - (today.vocab || 0)
  await statsStore.studyDelta(
    Math.max(0, (today.mins || 0) + deltaMins) - (today.mins || 0),
    Math.max(0, (today.words || 0) + deltaWords) - (today.words || 0),
    syncVocabTotal === null ? 0 : vocabDelta,
  )
  hooks.renderStatsAndHeatmap()
}
