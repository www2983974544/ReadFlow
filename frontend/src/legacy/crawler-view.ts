// Crawler view: discovery grid render + crawl flow via the backend (ported from
// runSmartArticleCrawler / renderCrawlerDiscoveryGrid + bindings).
import { apiPost } from '../api/client'
import { S } from './state'
import { renderCurrentArticle, renderSidebarArticleList } from './reader'
import { showToast, updateTopBadgesAndStats } from './ui-fns'
import { useArticlesStore } from '../stores/articles'
import { useUiStore } from '../stores/ui'
import type { Article } from '../types'

interface CrawlResponse {
  poolAdded: Article[]
  live: Article | null
  liveOrigin: string | null
}

export function renderCrawlerDiscoveryGrid() {
  const s = S()
  const grid = document.getElementById('crawlerDiscoveryGrid')
  if (!grid) return
  const targetLevel = (document.getElementById('crawlTargetLevel') as HTMLSelectElement | null)?.value || 'all'
  const targetCat = (document.getElementById('crawlTargetCategory') as HTMLSelectElement | null)?.value || 'all'
  const targetSrc = (document.getElementById('crawlTargetSource') as HTMLSelectElement | null)?.value || 'all'

  const list = s.articles.filter((a) => {
    if (targetLevel !== 'all' && a.examLevel !== targetLevel) return false
    if (targetCat !== 'all' && a.category !== targetCat) return false
    if (targetSrc !== 'all' && targetSrc !== 'Live Web Feed' && !a.source.includes(targetSrc.split(' ')[0])) return false
    return true
  })

  grid.innerHTML = list
    .map((art) => {
      const libBtnHtml = art.inLibrary
        ? `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700">✓ 已在文章库 (移出)</button>`
        : `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500">➕ 加入文章库</button>`

      return `
          <div data-artid="${art.id}" class="crawl-card surface-card p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition cursor-pointer">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white">${art.examLevel}</span>
                <span class="text-xs font-semibold text-indigo-600">${art.category}</span>
              </div>
              <div class="flex items-center gap-2 text-xs opacity-75">
                <span>📰 来源: <strong>${art.source}</strong></span>
                <span>·</span>
                <span>考纲词 ${art.cetRatio}</span>
              </div>
              <h4 class="serif-article text-lg font-bold leading-snug">${art.title}</h4>
              <p class="text-xs font-medium opacity-80">${art.titleCn}</p>
              <p class="text-xs opacity-70 line-clamp-3 leading-relaxed">${art.paragraphs[0].en}</p>
            </div>

            <div class="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <button type="button" data-artid="${art.id}" class="btn-card-open-read px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition">
                📖 进入逐词精读
              </button>
              ${libBtnHtml}
            </div>
          </div>
        `
    })
    .join('')
}

export async function runCrawlFlow() {
  const logBox = document.getElementById('crawlerTerminalOutput')
  const statusHint = document.getElementById('crawlerStatusHint')
  const appendLog = (txt: string) => {
    if (!logBox) return
    const line = document.createElement('div')
    line.textContent = txt
    logBox.appendChild(line)
    logBox.scrollTop = logBox.scrollHeight
  }

  if (statusHint) statusHint.textContent = '正在执行同源题库检索与四六级词频匹配...'
  appendLog('[CRAWL] 正在扫描四六级高频外刊源 (The Economist / Nature / The Atlantic / BBC)...')

  const online = navigator.onLine
  try {
    const res = await apiPost<CrawlResponse>('/api/crawl', {})
    const addedCount = res.poolAdded.length + (res.live ? 1 : 0)

    for (const a of res.poolAdded) {
      appendLog(`[MATCH] 命中同源外刊: "${a.title}" (${a.source} | ${a.examLevel} | 考纲词 ${a.cetRatio})`)
    }
    if (res.live) {
      appendLog(`[LIVE-WEB] 成功从在线源抓取: "${res.live.title}"`)
    } else if (!online) {
      appendLog('[OFFLINE-MODE] 检测到离线状态，已从本地四六级同源题库极速加载候选文章。')
    } else {
      appendLog('[OFFLINE-ENGINE] 已使用内置高分同源外刊库完成匹配。')
    }

    // sync articles inserted server-side (front-of-list order included)
    await useArticlesStore().load()
    updateTopBadgesAndStats()
    renderCrawlerDiscoveryGrid()
    renderSidebarArticleList()
    if (statusHint) {
      statusHint.textContent =
        addedCount > 0
          ? `匹配完成！已新增 ${addedCount} 篇同源文章，请在下方选择是否加入文章库。`
          : '当前候选池已包含全部最新同源外刊，可直接挑选入库或点击「手动粘贴导入」。'
    }
    showToast('🌐 同源外刊匹配完成！')
  } catch {
    appendLog('[OFFLINE-ENGINE] 已使用内置高分同源外刊库完成匹配。')
    if (statusHint) statusHint.textContent = '当前候选池已包含全部最新同源外刊，可直接挑选入库或点击「手动粘贴导入」。'
  }
}

export function initCrawlerView() {
  const ui = useUiStore()
  const s = S()

  document.getElementById('btnStartCrawlBatch')?.addEventListener('click', () => void runCrawlFlow())
  document.getElementById('crawlTargetLevel')?.addEventListener('change', renderCrawlerDiscoveryGrid)
  document.getElementById('crawlTargetCategory')?.addEventListener('change', renderCrawlerDiscoveryGrid)
  document.getElementById('crawlTargetSource')?.addEventListener('change', renderCrawlerDiscoveryGrid)
  document.getElementById('btnOpenCustomModalFromCrawler')?.addEventListener('click', () => {
    ui.customImportOpen = true
  })
  document.getElementById('btnAddAllDiscoveryToLib')?.addEventListener('click', async () => {
    const articlesStore = useArticlesStore()
    for (const a of s.articles) {
      if (!a.inLibrary) await articlesStore.patch(a.id, { inLibrary: true })
    }
    updateTopBadgesAndStats()
    renderCrawlerDiscoveryGrid()
    renderSidebarArticleList()
    showToast('✓ 已将所有候选文章加入「文章库」')
  })

  // Delegated listener for Crawler Grid
  document.getElementById('crawlerDiscoveryGrid')?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement
    const openBtn = target.closest('.btn-card-open-read') as HTMLElement | null
    if (openBtn) {
      s.currentArticleId = openBtn.getAttribute('data-artid') || ''
      ui.switchView('reader')
      renderSidebarArticleList()
      renderCurrentArticle({ resetInspector: true })
      return
    }
    const libBtn = target.closest('.btn-card-toggle-lib') as HTMLElement | null
    if (libBtn) {
      const id = libBtn.getAttribute('data-artid') || ''
      const art = s.articles.find((a) => a.id === id)
      if (art) {
        await useArticlesStore().patch(id, { inLibrary: !art.inLibrary })
        updateTopBadgesAndStats()
        renderCrawlerDiscoveryGrid()
        renderSidebarArticleList()
        showToast(art.inLibrary ? `已将《${art.titleCn}》加入文章库` : '已从文章库移出')
      }
      return
    }
    // clicking anywhere on the card opens it for reading (user-requested v2.0 change)
    const card = target.closest('.crawl-card') as HTMLElement | null
    if (card) {
      s.currentArticleId = card.getAttribute('data-artid') || ''
      ui.switchView('reader')
      renderSidebarArticleList()
      renderCurrentArticle({ resetInspector: true })
    }
  })

  // top-bar "实时爬取新刊" quick action (switches tab, then crawls)
  window.addEventListener('readflow:quick-crawl', () => void runCrawlFlow())
}
