import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ViewName = 'home' | 'reader' | 'crawler' | 'library' | 'vocab' | 'stats'

// Session-only UI state (legacy AppState fields that the original never persisted).
export const useUiStore = defineStore('ui', () => {
  const activeView = ref<ViewName>('home')

  const poolFilter = ref<'all' | 'library' | 'discovery'>('all')
  const levelFilter = ref('all')
  const categoryFilter = ref('all')

  const leftCollapsed = ref(false)
  const rightCollapsed = ref(false)

  const currentArticleId = ref('art-econ-ai-work')
  const vocabFilter = ref('all')
  const flashcardMasked = ref(false)
  const heatmapMode = ref<'all' | 'words' | 'vocab'>('all')

  // Reader ephemeral word-inspection state
  const activeWord = ref('artificial')
  const activeWordLemma = ref('artificial')
  const activeContextSentence = ref('')

  // Modals
  const customImportOpen = ref(false)
  const guideOpen = ref(false)

  function switchView(view: ViewName) {
    activeView.value = view
  }

  return {
    activeView,
    poolFilter,
    levelFilter,
    categoryFilter,
    leftCollapsed,
    rightCollapsed,
    currentArticleId,
    vocabFilter,
    flashcardMasked,
    heatmapMode,
    activeWord,
    activeWordLemma,
    activeContextSentence,
    customImportOpen,
    guideOpen,
    switchView,
  }
})
