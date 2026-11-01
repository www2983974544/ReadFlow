import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Article } from '../types'
import seedArticles from '../data/seed_articles.json'

// 桌面版走 FastAPI+SQLite；移动版用 localStorage 承载完全相同的 JSON shape。
// 沿用旧 v8 键名：老 APK 用户的既有数据可直接延续。
const KEY = 'readflow_articles_v8'

function readStorage(): Article[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStorage(articles: Article[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(articles))
  } catch {
    /* 存储满等异常静默，内存态仍可用 */
  }
}

export const useArticlesStore = defineStore('articles', () => {
  const articles = ref<Article[]>([])
  const currentArticleId = ref<string | null>(null)
  const loaded = ref(false)

  const currentArticle = computed<Article | null>(
    () => articles.value.find((a) => a.id === currentArticleId.value) ?? null,
  )

  async function load() {
    const stored = readStorage()
    if (stored) {
      articles.value = stored
    } else {
      // 首次启动：播种 6 篇内置同源文章（与桌面后端 lifespan 一致）
      articles.value = (seedArticles.initial as Article[]).map((a) => ({ ...a }))
      writeStorage(articles.value)
    }
    loaded.value = true
  }

  function select(id: string | null) {
    currentArticleId.value = id
  }

  async function add(article: Article): Promise<Article> {
    if (!articles.value.some((a) => a.id === article.id)) {
      // 沿桌面语义：新文章 unshift 到最前
      articles.value.unshift({ ...article })
      writeStorage(articles.value)
    }
    return article
  }

  async function patch(
    id: string,
    changes: Partial<Pick<Article, 'inLibrary' | 'readStatus'>>,
  ): Promise<Article> {
    const idx = articles.value.findIndex((a) => a.id === id)
    if (idx >= 0) {
      articles.value[idx] = { ...articles.value[idx], ...changes }
      writeStorage(articles.value)
      return articles.value[idx]
    }
    throw new Error(`article not found: ${id}`)
  }

  // stats.resetAll 的跨实体清除需要把「已精读完成」回退为未读
  function revertFinishedForReset() {
    let changed = false
    articles.value.forEach((a) => {
      if (a.readStatus === 'finished') {
        a.readStatus = 'reading'
        changed = true
      }
    })
    if (changed) writeStorage(articles.value)
  }

  return {
    articles,
    currentArticleId,
    currentArticle,
    loaded,
    load,
    select,
    add,
    patch,
    revertFinishedForReset,
  }
})
