// Bridge exposing legacy AppState field names onto the Pinia stores, so the
// ported render functions read like the original code (AppState.x -> S.x).
// Persisted prefs come from the settings store with the original default values.
import { useArticlesStore } from '../stores/articles'
import { useStatsStore } from '../stores/stats'
import { useSettingsStore } from '../stores/settings'
import { useUiStore } from '../stores/ui'
import { useVocabStore } from '../stores/vocab'

export const PREF_DEFAULTS = {
  themeMode: 'light',
  voiceAccent: 'US',
  voiceSpeed: 1.0,
  customTimerMinutes: 8,
  fontSizeRem: 1.125,
  bilingualOpen: false,
  inlineNotesOpen: true,
  cetHintsOpen: true,
} as const

class LegacyBridge {
  private articlesStore = useArticlesStore()
  private vocabStore = useVocabStore()
  private statsStore = useStatsStore()
  private settingsStore = useSettingsStore()
  private uiStore = useUiStore()

  // ---- data stores ----
  get articles() {
    return this.articlesStore.articles
  }
  get wordMarks() {
    return this.vocabStore.marks
  }
  get quizAnswered() {
    return this.statsStore.stats.quizAnswered
  }
  get quizCorrect() {
    return this.statsStore.stats.quizCorrect
  }
  get heatmapData() {
    return this.statsStore.heatmapData
  }

  // ---- session UI state ----
  get currentArticleId() {
    return this.uiStore.currentArticleId
  }
  set currentArticleId(v: string) {
    this.uiStore.currentArticleId = v
  }
  get activeWord() {
    return this.uiStore.activeWord
  }
  set activeWord(v: string) {
    this.uiStore.activeWord = v
  }
  get activeWordLemma() {
    return this.uiStore.activeWordLemma
  }
  set activeWordLemma(v: string) {
    this.uiStore.activeWordLemma = v
  }
  get activeContextSentence() {
    return this.uiStore.activeContextSentence
  }
  set activeContextSentence(v: string) {
    this.uiStore.activeContextSentence = v
  }
  get poolFilter() {
    return this.uiStore.poolFilter
  }
  set poolFilter(v: 'all' | 'library' | 'discovery') {
    this.uiStore.poolFilter = v
  }
  get levelFilter() {
    return this.uiStore.levelFilter
  }
  set levelFilter(v: string) {
    this.uiStore.levelFilter = v
  }
  get categoryFilter() {
    return this.uiStore.categoryFilter
  }
  set categoryFilter(v: string) {
    this.uiStore.categoryFilter = v
  }
  get leftCollapsed() {
    return this.uiStore.leftCollapsed
  }
  set leftCollapsed(v: boolean) {
    this.uiStore.leftCollapsed = v
  }
  get rightCollapsed() {
    return this.uiStore.rightCollapsed
  }
  set rightCollapsed(v: boolean) {
    this.uiStore.rightCollapsed = v
  }
  get vocabFilter() {
    return this.uiStore.vocabFilter
  }
  set vocabFilter(v: string) {
    this.uiStore.vocabFilter = v
  }
  get flashcardMasked() {
    return this.uiStore.flashcardMasked
  }
  set flashcardMasked(v: boolean) {
    this.uiStore.flashcardMasked = v
  }
  get heatmapMode() {
    return this.uiStore.heatmapMode
  }
  set heatmapMode(v: 'all' | 'words' | 'vocab') {
    this.uiStore.heatmapMode = v
  }

  // ---- persisted prefs (settings table) ----
  private pref<K extends keyof typeof PREF_DEFAULTS>(key: K): (typeof PREF_DEFAULTS)[K] {
    const v = this.settingsStore.settings[key]
    return (v === undefined || v === null ? PREF_DEFAULTS[key] : v) as (typeof PREF_DEFAULTS)[K]
  }
  private setPref(key: string, value: unknown) {
    void this.settingsStore.set(key, value)
  }

  get themeMode() {
    return this.pref('themeMode')
  }
  set themeMode(v: string) {
    this.setPref('themeMode', v)
  }
  get voiceAccent() {
    return this.pref('voiceAccent')
  }
  set voiceAccent(v: string) {
    this.setPref('voiceAccent', v)
  }
  get voiceSpeed() {
    return this.pref('voiceSpeed')
  }
  set voiceSpeed(v: number) {
    this.setPref('voiceSpeed', v)
  }
  get customTimerMinutes() {
    return this.pref('customTimerMinutes')
  }
  set customTimerMinutes(v: number) {
    this.setPref('customTimerMinutes', v)
  }
  get fontSizeRem() {
    return this.pref('fontSizeRem')
  }
  set fontSizeRem(v: number) {
    this.setPref('fontSizeRem', v)
  }
  get bilingualOpen() {
    return this.pref('bilingualOpen')
  }
  set bilingualOpen(v: boolean) {
    this.setPref('bilingualOpen', v)
  }
  get inlineNotesOpen() {
    return this.pref('inlineNotesOpen')
  }
  set inlineNotesOpen(v: boolean) {
    this.setPref('inlineNotesOpen', v)
  }
  get cetHintsOpen() {
    return this.pref('cetHintsOpen')
  }
  set cetHintsOpen(v: boolean) {
    this.setPref('cetHintsOpen', v)
  }

  get examName() {
    return this.statsStore.stats.examName
  }
  set examName(v: string) {
    this.statsStore.stats.examName = v
    void this.settingsStore.set('exam_name', v)
  }
  get examTargetDate() {
    return this.statsStore.stats.examTargetDate
  }
  set examTargetDate(v: string) {
    this.statsStore.stats.examTargetDate = v
    void this.settingsStore.set('exam_target_date', v)
  }
}

let _bridge: LegacyBridge | null = null

export function S(): LegacyBridge {
  if (!_bridge) _bridge = new LegacyBridge()
  return _bridge
}

// Load exam name/date persisted under the legacy stats payload keys.
export async function hydrateExamSettings() {
  const settingsStore = useSettingsStore()
  const statsStore = useStatsStore()
  if (typeof settingsStore.settings.exam_name === 'string') {
    statsStore.stats.examName = settingsStore.settings.exam_name as string
  }
  if (typeof settingsStore.settings.exam_target_date === 'string') {
    statsStore.stats.examTargetDate = settingsStore.settings.exam_target_date as string
  }
}
