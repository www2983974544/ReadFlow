// Data shapes 1:1 with the legacy AppState (camelCase JSON from the backend).

export interface Paragraph {
  en: string
  cn: string
}

export interface ComplexSentence {
  sentence: string
  structure: string
  tip: string
}

export interface QuizItem {
  q: string
  options: string[]
  answer: number
  explanation: string
}

export interface Article {
  id: string
  title: string
  titleCn: string
  source: string
  sourceUrl: string
  category: string
  examLevel: string
  lexile: string
  cetRatio: string
  examFreqTag: string
  inLibrary: boolean
  readStatus: string
  paragraphs: Paragraph[]
  complexSentence?: ComplexSentence
  quiz: QuizItem[]
}

export type MarkStatus = 'unknown' | 'core' | 'mastered'

export interface WordMark {
  word: string
  lemma: string
  status: MarkStatus
  customNote: string
  cn: string
  phonetic: string
  level: string
  derivatives: string
  synonyms: string
  context: string
  articleTitle: string
}

export interface DayStat {
  mins: number
  words: number
  vocab: number
}

export interface StatsState {
  examName: string
  examTargetDate: string
  dailyStatsMap: Record<string, DayStat>
  quizAnswered: number
  quizCorrect: number
}

export type SettingsMap = Record<string, unknown>
