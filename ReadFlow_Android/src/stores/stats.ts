import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { StatsState } from '../types'
import { useVocabStore } from './vocab'
import { useArticlesStore } from './articles'

export interface HeatmapDay {
  date: string
  mins: number
  words: number
  vocab: number
  lv: number
}

// 桌面版走 /api/stats*；移动版 localStorage，聚合算法逐行保留（来自 stores/stats.ts@v2.1）。
const KEY = 'readflow_stats_v8'

function readStorage(): StatsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && parsed.dailyStatsMap) {
        return parsed as StatsState
      }
    }
  } catch {
    /* fallthrough */
  }
  return {
    examName: '英语六级',
    examTargetDate: '2026-12-19T15:00',
    dailyStatsMap: {},
    quizAnswered: 0,
    quizCorrect: 0,
  }
}

function writeStorage(stats: StatsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats))
  } catch {
    /* ignore */
  }
}

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<StatsState>(readStorage())
  const loaded = ref(false)

  // Derived heatmap state (legacy rebuildHeatmapFromDailyMap outputs)
  const heatmapData = ref<HeatmapDay[]>([])
  const totalStudyMinutes = ref(0)
  const todayStudyMinutes = ref(0)
  const totalReadWords = ref(0)
  const streakDays = ref(0)
  const longestStreakDays = ref(0)

  async function load() {
    stats.value = readStorage()
    rebuildHeatmapFromDailyMap()
    loaded.value = true
  }

  async function studyDelta(mins: number, words = 0, vocab = 0) {
    const dateStr = getTodayDateString()
    const map = { ...stats.value.dailyStatsMap }
    const rec = { ...(map[dateStr] || { mins: 0, words: 0, vocab: 0 }) }
    rec.mins = Math.max(0, (rec.mins || 0) + mins)
    rec.words = Math.max(0, (rec.words || 0) + words)
    rec.vocab = Math.max(0, (rec.vocab || 0) + vocab)
    map[dateStr] = rec
    stats.value = { ...stats.value, dailyStatsMap: map }
    writeStorage(stats.value)
    rebuildHeatmapFromDailyMap()
  }

  async function answerQuiz(
    _articleId: string,
    _questionIndex: number,
    _chosen: number,
    correct: boolean,
  ) {
    // quiz 计数器桌面版存在 settings 表（quiz_* 键，不含在 GET /api/settings 里）；
    // 移动版直接并入 stats 持久化。
    stats.value = {
      ...stats.value,
      quizAnswered: stats.value.quizAnswered + 1,
      quizCorrect: stats.value.quizCorrect + (correct ? 1 : 0),
    }
    writeStorage(stats.value)
  }

  async function resetAll() {
    // 复刻桌面 POST /api/stats/reset 的跨实体清除：
    // 清空每日统计与 quiz 计数 + 清空全部生词标注 + 回退已完读文章
    stats.value = {
      ...stats.value,
      dailyStatsMap: {},
      quizAnswered: 0,
      quizCorrect: 0,
    }
    writeStorage(stats.value)
    useVocabStore().clearAll()
    useArticlesStore().revertFinishedForReset()
    rebuildHeatmapFromDailyMap()
  }

  // ---- Legacy stats aggregation (verbatim logic from cet_reading_master.html) ----

  function getTodayDateString() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function computeLevelFromEntry(mins: number, words: number, vocab: number): number {
    const score = mins * 2 + Math.floor(words / 25) + vocab * 4
    if (score <= 0) return 0
    if (score < 20) return 1
    if (score < 45) return 2
    if (score < 80) return 3
    return 4
  }

  function rebuildHeatmapFromDailyMap() {
    const days: HeatmapDay[] = []
    const now = new Date()
    let maxStreak = 0
    let runningStreak = 0
    let sumMins = 0
    let sumWords = 0

    for (let i = 363; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400 * 1000)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      const rec = stats.value.dailyStatsMap[dateStr] || { mins: 0, words: 0, vocab: 0 }
      const mins = Math.max(0, rec.mins || 0)
      const words = Math.max(0, rec.words || 0)
      const vocab = Math.max(0, rec.vocab || 0)
      const lv = computeLevelFromEntry(mins, words, vocab)

      sumMins += mins
      sumWords += words

      if (mins > 0 || words > 0 || vocab > 0) {
        runningStreak += 1
        if (runningStreak > maxStreak) maxStreak = runningStreak
      } else {
        if (i > 0) runningStreak = 0
      }

      days.push({ date: dateStr, mins, words, vocab, lv })
    }

    // Current streak ending today or yesterday
    let curStreak = 0
    for (let idx = days.length - 1; idx >= 0; idx--) {
      const item = days[idx]
      if (item.mins > 0 || item.words > 0 || item.vocab > 0) {
        curStreak++
      } else {
        if (idx === days.length - 1) continue
        break
      }
    }

    heatmapData.value = days
    const todayKey = getTodayDateString()
    const todayRec = stats.value.dailyStatsMap[todayKey] || { mins: 0, words: 0, vocab: 0 }
    todayStudyMinutes.value = todayRec.mins || 0
    totalStudyMinutes.value = sumMins
    totalReadWords.value = sumWords
    streakDays.value = curStreak
    longestStreakDays.value = Math.max(maxStreak, curStreak)
  }

  return {
    stats,
    loaded,
    heatmapData,
    totalStudyMinutes,
    todayStudyMinutes,
    totalReadWords,
    streakDays,
    longestStreakDays,
    load,
    studyDelta,
    answerQuiz,
    resetAll,
    getTodayDateString,
    rebuildHeatmapFromDailyMap,
  }
})
