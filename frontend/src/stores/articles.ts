import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPatch, apiPost } from '../api/client'
import type { Article } from '../types'

// Replaces the legacy readflow_articles_v8 key.
export const useArticlesStore = defineStore('articles', () => {
  const articles = ref<Article[]>([])
  const currentArticleId = ref<string | null>(null)
  const loaded = ref(false)

  const currentArticle = computed<Article | null>(
    () => articles.value.find((a) => a.id === currentArticleId.value) ?? null,
  )

  async function load() {
    articles.value = await apiGet<Article[]>('/api/articles')
    loaded.value = true
  }

  function select(id: string | null) {
    currentArticleId.value = id
  }

  async function add(article: Article): Promise<Article> {
    const saved = await apiPost<Article>('/api/articles', article)
    if (!articles.value.some((a) => a.id === saved.id)) {
      // legacy behavior: new articles are unshift()ed to the front
      articles.value.unshift(saved)
    }
    return saved
  }

  async function patch(
    id: string,
    changes: Partial<Pick<Article, 'inLibrary' | 'readStatus'>>,
  ): Promise<Article> {
    const updated = await apiPatch<Article>(`/api/articles/${encodeURIComponent(id)}`, changes)
    const idx = articles.value.findIndex((a) => a.id === id)
    if (idx >= 0) articles.value[idx] = updated
    return updated
  }

  return { articles, currentArticleId, currentArticle, loaded, load, select, add, patch }
})
