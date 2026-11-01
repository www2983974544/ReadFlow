// 移动版 ui-fns：复制自桌面 frontend/src/legacy/ui-fns.ts@v2.1 并按移动布局适配。
// showToast / applyThemeMode / updateTopBadgesAndStats / recordTodayStudyDelta 语义一致；
// applySidebarCollapseLayout 在移动端映射为：文章目录抽屉 + 查词台底部弹层的显隐与遮罩。
import { ref } from 'vue'
import { S } from './state'
import { useStatsStore } from '../stores/stats'
import { useSettingsStore } from '../stores/settings'
import { useUiStore } from '../stores/ui'

// Stats view renderers register themselves here so reader functions can call
// them before the stats view is implemented.
export const hooks: {
  renderStatsAndHeatmap: () => void
} = {
  renderStatsAndHeatmap: () => {},
}

// Rendering the 364-cell heatmap on a hidden page is wasted work — the stats
// view re-renders anyway when its tab is opened.
export function renderStatsIfVisible() {
  if (useUiStore().activeView === 'stats') hooks.renderStatsAndHeatmap()
}

// ---- Toast（移动端：底部居中，位于标签栏上方；可点击提前关闭；可带撤销动作） ----
export const toastVisible = ref(false)
export const toastText = ref('')
export const toastAction = ref<{ label: string; run: () => void } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(
  msg: string,
  opts?: { action?: { label: string; run: () => void }; durationMs?: number },
) {
  toastText.value = msg
  toastAction.value = opts?.action ?? null
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(
    () => {
      toastVisible.value = false
    },
    opts?.action ? Math.max(6000, opts.durationMs ?? 6000) : (opts?.durationMs ?? 2400),
  )
}

export function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer)
  toastVisible.value = false
}

export function runToastAction() {
  const action = toastAction.value
  dismissToast()
  if (action) action.run()
}

// ---- 主题（明亮/护眼/夜间/跟随系统；沿桌面 body class 方案 + 持久化） ----
const prefersDarkQuery =
  typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
let activeThemeMode = 'light'

function resolveSystemTheme(): 'light' | 'dark' {
  return prefersDarkQuery?.matches ? 'dark' : 'light'
}

export function applyThemeMode(mode: string) {
  activeThemeMode = mode
  const body = document.body
  body.classList.remove('theme-sepia', 'theme-dark')
  if (mode === 'sepia') {
    body.classList.add('theme-sepia')
  } else if (mode === 'dark') {
    body.classList.add('theme-dark')
  } else if (mode === 'system') {
    if (resolveSystemTheme() === 'dark') body.classList.add('theme-dark')
  }
  // 持久化（桌面为已批准的行为差异：主题重启保留）
  void useSettingsStore().set('themeMode', mode)
  void S()
}

export function setThemeMode(mode: string) {
  applyThemeMode(mode)
}

// 跟随系统档：系统深浅色切换时实时重应用（监听器只注册一次）
if (prefersDarkQuery && typeof prefersDarkQuery.addEventListener === 'function') {
  prefersDarkQuery.addEventListener('change', () => {
    if (activeThemeMode === 'system') applyThemeMode('system')
  })
}

// 供头部按钮高亮判断用
export function currentThemeMode() {
  return activeThemeMode
}

// ---- 头部/统计条数字（移动端角标由 BottomTabBar 的 computed 自动同步，
// 这里只负责精读页抽屉底部的统计条） ----
export function updateTopBadgesAndStats() {
  const s = S()
  const libArticles = s.articles.filter((a) => a.inLibrary)
  const finishedArticles = s.articles.filter((a) => a.readStatus === 'finished')
  const markedCount = Object.keys(s.wordMarks).length

  const el = (id: string) => document.getElementById(id)
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

// ---- 抽屉/弹层布局（移动版核心） ----
// leftCollapsed=false → 文章目录抽屉展开；rightCollapsed=false → 查词台弹层展开。
// 显隐机制与桌面完全一致（.hidden 类切换），遮罩随抽屉状态联动。
export function applySidebarCollapseLayout() {
  const s = S()
  const leftPane = document.getElementById('leftSidebarPane')
  const rightPane = document.getElementById('rightInspectorPane')
  const mask = document.getElementById('readerDrawerMask')

  if (leftPane) leftPane.classList.toggle('hidden', s.leftCollapsed)
  if (rightPane) rightPane.classList.toggle('hidden', s.rightCollapsed)
  if (mask) mask.classList.toggle('hidden', s.leftCollapsed)

  // 专注语义与桌面一致：两侧全收时进入沉浸（移动端正文本身单栏，类保留以对齐桌面样式约定）
  document.body.classList.toggle('reader-immersive', s.leftCollapsed && s.rightCollapsed)
}

// Legacy recordTodayStudyDelta: syncVocabTotal sets today's vocab as an absolute
// total (converted to a delta against the stored daily entry).
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
  renderStatsIfVisible()
}
