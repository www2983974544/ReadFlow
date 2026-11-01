// Crawler view: discovery grid render + client-side crawl flow
// （复制自桌面 frontend/src/legacy/crawler-view.ts@v2.1；
//   /api/crawl 调用替换为移动端客户端引擎 native/crawler.ts，响应形状一致）
import { S } from './state'
import { openArticleForReading, renderSidebarArticleList } from './reader'
import { showToast, updateTopBadgesAndStats } from './ui-fns'
import { useArticlesStore } from '../stores/articles'
import { useUiStore } from '../stores/ui'
import { pickExtraPool, runClientCrawl, fetchRssFromSource, getLastSourceHealth, getSourceNames } from '../native/crawler'
import type { Article } from '../types'

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

  if (list.length === 0) {
    grid.innerHTML = `
          <div class="surface-card border border-dashed p-10 text-center space-y-2">
            <div class="text-3xl">🗞️</div>
            <h3 class="text-base font-bold">没有符合当前筛选条件的文章</h3>
            <p class="text-xs opacity-70 max-w-md mx-auto">试试切换难度、题型或刊物源筛选，或点击上方「🚀 立即抓取同源外刊」扩充候选池。</p>
          </div>
        `
    return
  }

  grid.innerHTML = list
    .map((art) => {
      const libBtnHtml = art.inLibrary
        ? `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition whitespace-nowrap">✓ 已入库 (移出)</button>`
        : `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition whitespace-nowrap">➕ 加入文章库</button>`

      return `
          <div data-artid="${art.id}" class="crawl-card surface-card p-4 shadow-sm flex flex-col justify-between space-y-2.5 cursor-pointer">
            <div class="space-y-1.5 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-[11px] font-bold tracking-wider uppercase text-indigo-600 truncate">${art.source}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shrink-0">${art.examLevel}</span>
                </div>
                <span class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0 truncate max-w-[45%]">${art.category}</span>
              </div>
              <h4 class="serif-article text-base font-bold leading-snug line-clamp-2">${art.title}</h4>
              <p class="text-xs opacity-75 line-clamp-1">${art.titleCn}</p>
              <p class="text-xs opacity-60 line-clamp-2 leading-relaxed">${art.paragraphs[0].en}</p>
            </div>

            <div class="pt-2.5 flex items-center justify-between gap-2" style="border-top: 1px solid var(--border-col)">
              <span class="text-[11px] opacity-60 truncate">考纲词 ${art.cetRatio} · ${art.lexile}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" data-artid="${art.id}" class="btn-card-open-read px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition whitespace-nowrap">📖 精读</button>
                ${libBtnHtml}
              </div>
            </div>
          </div>
        `
    })
    .join('')
}

let crawlRunning = false

// Status pill: ready (emerald) / busy (amber) / fail (rose, online fetch failed)
function setCrawlerPulse(state: 'ready' | 'busy' | 'fail') {
  const dot = document.getElementById('crawlerPulseDot')
  if (!dot) return
  const inner = {
    ready: '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>READY',
    busy: '<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>CRAWLING',
    fail: '<span class="w-2 h-2 rounded-full bg-rose-400"></span>OFFLINE',
  }[state]
  const color = state === 'ready' ? 'text-emerald-400' : state === 'busy' ? 'text-amber-400' : 'text-rose-400'
  dot.className = 'inline-flex items-center gap-1 shrink-0 ' + color
  dot.innerHTML = inner
}

function openLogDrawer() {
  const drawer = document.querySelector('#viewCrawler .crawl-log-drawer') as HTMLDetailsElement | null
  if (drawer) drawer.open = true
}

// v1.1 抓取源健康度 chips：✓成功 / ✗失败(可点重试) / –未尝试
function renderSourceHealth() {
  const strip = document.getElementById('crawlerSourceHealth')
  if (!strip) return
  const health = getLastSourceHealth()
  const names = getSourceNames()
  if (health.length === 0) {
    strip.innerHTML = names
      .map((n) => `<span class="src-chip src-idle" title="尚未尝试">– ${n}</span>`)
      .join('')
    return
  }
  strip.innerHTML = names
    .map((n) => {
      const h = health.find((x) => x.name === n)
      if (!h) return `<span class="src-chip src-idle" title="本次未尝试">– ${n}</span>`
      if (h.ok) return `<span class="src-chip src-ok" title="${h.detail} (${(h.ms / 1000).toFixed(1)}s)">✓ ${n}</span>`
      return `<button type="button" data-src="${n}" class="src-chip src-fail src-retry" title="${h.detail} · 点击重试此源">✗ ${n}</button>`
    })
    .join('')
}

// 单源重试（只抓该源，成功即入库）
async function retrySingleSource(name: string, chip: HTMLElement) {
  const s = S()
  if ((document.getElementById('btnStartCrawlBatch') as HTMLButtonElement | null)?.disabled) return
  const crawlBtn = document.getElementById('btnStartCrawlBatch') as HTMLButtonElement | null
  if (crawlBtn) crawlBtn.disabled = true
  chip.textContent = '⏳ ' + name
  appendCrawlerLog(`[RETRY] 正在单独重试外刊源: ${name} ...`)

  const targetLevel = (document.getElementById('crawlTargetLevel') as HTMLSelectElement | null)?.value || 'all'
  const art = await fetchRssFromSource(name, targetLevel === 'all' ? '' : targetLevel)
  if (crawlBtn) crawlBtn.disabled = false

  if (art) {
    await useArticlesStore().add(art)
    updateTopBadgesAndStats()
    renderCrawlerDiscoveryGrid()
    renderSidebarArticleList()
    appendCrawlerLog(`[LIVE-WEB] 单源重试成功: "${art.title}"`)
    showToast(`🌐 ${name} 重试成功，已抓到 1 篇新文章`)
  } else {
    appendCrawlerLog(`[RETRY] ${name} 重试仍失败。`)
    showToast(`⚠️ ${name} 重试失败，稍后再试`)
  }
  renderSourceHealth()
}

function appendCrawlerLog(txt: string) {
  const logBox = document.getElementById('crawlerTerminalOutput')
  if (!logBox) return
  const line = document.createElement('div')
  line.textContent = txt
  logBox.appendChild(line)
  logBox.scrollTop = logBox.scrollHeight
}

export async function runCrawlFlow() {
  if (crawlRunning) return // real crawls take up to ~14s; block double-fires
  crawlRunning = true
  const crawlBtn = document.getElementById('btnStartCrawlBatch') as HTMLButtonElement | null
  const setCrawlBtn = (text: string, disabled: boolean) => {
    if (crawlBtn) {
      crawlBtn.disabled = disabled
      crawlBtn.textContent = text
    }
  }
  setCrawlBtn('⏳ 抓取中…', true)
  setCrawlerPulse('busy')

  const logBox = document.getElementById('crawlerTerminalOutput')
  const statusHint = document.getElementById('crawlerStatusHint')
  const appendLog = (txt: string) => {
    if (!logBox) return
    const line = document.createElement('div')
    line.textContent = txt
    logBox.appendChild(line)
    logBox.scrollTop = logBox.scrollHeight
  }

  const articlesStore = useArticlesStore()
  const s = S()

  try {
    if (statusHint) statusHint.textContent = '正在执行同源题库检索与四六级词频匹配...'
    appendLog('[CRAWL] 正在扫描四六级高频外刊源 (Guardian / NPR / Nature / SciAm / Atlantic / BBC)...')

    const online = navigator.onLine
    const targetLevel = (document.getElementById('crawlTargetLevel') as HTMLSelectElement | null)?.value || 'all'

    // 内置候选池注入（桌面 crawl.py inject_extra_pool 等价：按 id 去重）
    const existingIds = new Set(s.articles.map((a) => a.id))
    const poolAdded = pickExtraPool(existingIds)
    const addedCount = poolAdded.length

    // 在线抓取（客户端引擎：RSS → Readability → Wikipedia 兜底 → 12s 时限）
    const res = await runClientCrawl(targetLevel)

    for (const a of poolAdded) {
      await articlesStore.add(a)
      appendLog(`[MATCH] 命中同源外刊: "${a.title}" (${a.source} | ${a.examLevel} | 考纲词 ${a.cetRatio})`)
    }
    if (res.live) {
      await articlesStore.add(res.live)
      appendLog(`[LIVE-WEB] 成功从在线源抓取: "${res.live.title}"`)
    } else if (!online) {
      appendLog('[OFFLINE-MODE] 检测到离线状态，已从本地四六级同源题库极速加载候选文章。')
    } else {
      appendLog('[OFFLINE-ENGINE] 在线外刊源全部超时/失败（网络异常），已使用内置题库兜底。')
    }

    updateTopBadgesAndStats()
    renderCrawlerDiscoveryGrid()
    renderSidebarArticleList()
    renderSourceHealth()

    if (res.live) {
      setCrawlerPulse('ready')
      if (statusHint) {
        statusHint.textContent =
          addedCount > 0
            ? `匹配完成！已新增 ${addedCount} 篇同源文章，请在下方选择是否加入文章库。`
            : '当前候选池已包含全部最新同源外刊，可直接挑选入库或点击「手动粘贴导入」。'
      }
      showToast('🌐 同源外刊匹配完成！')
    } else if (!online) {
      setCrawlerPulse('ready')
      if (statusHint) statusHint.textContent = '📴 当前处于离线状态，已从本地四六级同源题库加载候选文章；联网后可抓取实时外刊。'
      showToast('📴 离线模式：已加载内置题库')
    } else {
      // navigator.onLine says online but every source failed — say so honestly.
      setCrawlerPulse('fail')
      openLogDrawer()
      if (statusHint) statusHint.textContent = '⚠️ 在线外刊源抓取失败（网络异常），已使用内置题库兜底；请检查网络后重试。'
      showToast('⚠️ 在线源抓取失败（网络异常），已用内置题库兜底')
    }
  } catch {
    setCrawlerPulse('fail')
    openLogDrawer()
    appendLog('[OFFLINE-ENGINE] 抓取请求失败，已使用内置高分同源外刊库完成匹配。')
    if (statusHint) statusHint.textContent = '⚠️ 抓取请求失败（服务异常），已使用内置题库兜底；请重试。'
    showToast('⚠️ 抓取请求失败，已用内置题库兜底')
  } finally {
    crawlRunning = false
    setCrawlBtn('🚀 立即抓取同源外刊', false)
  }
}

let crawlerBound = false

export function initCrawlerView() {
  if (crawlerBound) return // 移动版：v-show 常驻挂载，绑定守卫防止重复
  crawlerBound = true

  const ui = useUiStore()
  const s = S()

  document.getElementById('btnStartCrawlBatch')?.addEventListener('click', () => void runCrawlFlow())
  document.getElementById('crawlTargetLevel')?.addEventListener('change', renderCrawlerDiscoveryGrid)
  document.getElementById('crawlTargetCategory')?.addEventListener('change', renderCrawlerDiscoveryGrid)
  document.getElementById('crawlTargetSource')?.addEventListener('change', renderCrawlerDiscoveryGrid)

  // 抓取源健康度：失败源 chip 点击 = 单源重试
  document.getElementById('crawlerSourceHealth')?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('.src-retry') as HTMLElement | null
    if (!chip) return
    const name = chip.getAttribute('data-src') || ''
    if (name) void retrySingleSource(name, chip)
  })
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
      ui.switchView('reader')
      openArticleForReading(openBtn.getAttribute('data-artid') || '')
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
      ui.switchView('reader')
      openArticleForReading(card.getAttribute('data-artid') || '')
    }
  })

  // top-bar "实时爬取新刊" quick action (switches tab, then crawls)
  window.addEventListener('readflow:quick-crawl', () => void runCrawlFlow())

  // 初始渲染源健康度（空闲态）
  renderSourceHealth()
}
