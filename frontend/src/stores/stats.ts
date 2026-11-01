import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPost } from '../api/client'
import type { StatsState } from '../types'

export interface HeatmapDay {
  date: string
  mins: number
  words: number
  vocab: number
  lv: number
}

// Replaces the legacy readflow_stats_v8 key.
export const useStatsStore = defineStore('stats', () => {
  const stats = ref<StatsState>({
    examName: '英语六级',
    examTargetDate: '2026-12-19T15:00',
    dailyStatsMap: {},
    quizAnswered: 0,
    quizCorrect: 0,
  })
  const loaded = ref(false)

  // Derived heatmap state (legacy rebuildHeatmapFromDailyMap outputs)
  const heatmapData = ref<HeatmapDay[]>([])
  const totalStudyMinutes = ref(0)
  const todayStudyMinutes = ref(0)
  const totalReadWords = ref(0)
  const streakDays = ref(0)
  const longestStreakDays = ref(0)

  async function load() {
    stats.value = await apiGet<StatsState>('/api/stats')
    rebuildHeatmapFromDailyMap()
    loaded.value = true
  }

  async function studyDelta(mins: number, words = 0, vocab = 0) {
    stats.value = await apiPost<StatsState>('/api/stats/study-delta', { mins, words, vocab })
    rebuildHeatmapFromDailyMap()
  }

  async function answerQuiz(
    articleId: string,
    questionIndex: number,
    chosen: number,
    correct: boolean,
  ) {
    stats.value = await apiPost<StatsState>('/api/stats/quiz-answer', {
      articleId,
      questionIndex,
      chosen,
      correct,
    })
  }

  async function resetAll() {
    stats.value = await apiPost<StatsState>('/api/stats/reset', {})
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
