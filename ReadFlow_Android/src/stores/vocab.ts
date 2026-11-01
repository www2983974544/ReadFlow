import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { WordMark } from '../types'

// 桌面版走 /api/vocab*；移动版 localStorage，map 以 lemma 为键（shape 一致）。
const KEY = 'readflow_wordmarks_v8'

function readStorage(): Record<string, WordMark> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStorage(marks: Record<string, WordMark>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(marks))
  } catch {
    /* ignore */
  }
}

export const useVocabStore = defineStore('vocab', () => {
  const marks = ref<Record<string, WordMark>>({})
  const loaded = ref(false)

  async function load() {
    marks.value = readStorage()
    loaded.value = true
  }

  async function mark(mark: WordMark) {
    marks.value = { ...marks.value, [mark.lemma]: { ...mark } }
    writeStorage(marks.value)
  }

  async function unmark(lemma: string) {
    const next = { ...marks.value }
    delete next[lemma]
    marks.value = next
    writeStorage(marks.value)
  }

  // stats.resetAll 的跨实体清除入口
  async function clearAll() {
    marks.value = {}
    writeStorage(marks.value)
  }

  return { marks, loaded, load, mark, unmark, clearAll }
})
