import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiDelete, apiGet, apiPut } from '../api/client'
import type { WordMark } from '../types'

// Replaces the legacy readflow_wordmarks_v8 key (map keyed by lemma).
export const useVocabStore = defineStore('vocab', () => {
  const marks = ref<Record<string, WordMark>>({})
  const loaded = ref(false)

  async function load() {
    marks.value = await apiGet<Record<string, WordMark>>('/api/vocab')
    loaded.value = true
  }

  async function mark(mark: WordMark) {
    const saved = await apiPut<WordMark>(
      `/api/vocab/${encodeURIComponent(mark.lemma)}`,
      mark,
    )
    marks.value = { ...marks.value, [saved.lemma]: saved }
  }

  async function unmark(lemma: string) {
    await apiDelete(`/api/vocab/${encodeURIComponent(lemma)}`)
    const next = { ...marks.value }
    delete next[lemma]
    marks.value = next
  }

  return { marks, loaded, load, mark, unmark }
})
