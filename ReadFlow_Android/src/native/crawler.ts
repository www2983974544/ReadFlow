// 客户端爬虫引擎：逐行复刻桌面 backend/app/news.py + crawl.py@v2.1 的行为。
// 桌面用 httpx + feedparser + trafilatura；移动端等价实现：
//   CapacitorHttp（原生网络栈，绕过 CORS）→ fast-xml-parser 解析 RSS
//   → @mozilla/readability 正文提取 → 相同的段落切分 / 分类 / 分级 / 模板。
// 浏览器环境无 CapacitorHttp 时回退原生 fetch（受 CORS 限制，多走 Wikipedia 兜底）。
import { Readability } from '@mozilla/readability'
import { XMLParser } from 'fast-xml-parser'
import { isNative, nativePlugin } from './bridge'
import type { Article, Paragraph } from '../types'
import seedData from '../data/seed_articles.json'

export interface CrawlResult {
  poolAdded: Article[]
  live: Article | null
  liveOrigin: 'rss' | 'wikipedia' | null
}

// v1.1 抓取源健康度：一次抓取流程中每个 RSS 源的尝试结果
export interface SourceHealth {
  name: string
  ok: boolean
  detail: string
  ms: number
}

let lastSourceHealth: SourceHealth[] = []

export function getLastSourceHealth(): SourceHealth[] {
  return lastSourceHealth
}

export function getSourceNames(): string[] {
  return SOURCES.map((s) => s.name)
}

interface RssSource {
  name: string
  rssUrl: string
  category: string
}

// news.py DEFAULT_SOURCES
const SOURCES: RssSource[] = [
  { name: 'The Guardian', rssUrl: 'https://www.theguardian.com/world/rss', category: '社会文化与健康' },
  { name: 'NPR', rssUrl: 'https://feeds.npr.org/1001/rss.xml', category: '社会文化与健康' },
  { name: 'Scientific American', rssUrl: 'http://rss.sciam.com/sciam/basic-science', category: '生态与气候环境' },
  { name: 'The Atlantic', rssUrl: 'https://www.theatlantic.com/feed/all/', category: '心理与教育认知' },
  { name: 'Nature', rssUrl: 'https://www.nature.com/nature.rss', category: '科技与人工智能' },
  { name: 'BBC Future', rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml', category: '科技与人工智能' },
]

// news.py LIVE_TOPICS
const LIVE_TOPICS = [
  { topic: 'Renewable_energy', category: '生态与气候环境', level: 'CET-4', source: 'Live Science Encyclopedia' },
  { topic: 'Artificial_neural_network', category: '科技与人工智能', level: 'CET-6', source: 'Live Tech Feed' },
  { topic: 'Educational_psychology', category: '心理与教育认知', level: 'CET-6', source: 'Live Academic Digest' },
]

// news.py CATEGORY_KEYWORDS
const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  ['科技与人工智能', ['ai', 'artificial intelligence', 'tech', 'robot', 'algorithm', 'software', 'computer', 'digital', 'cyber']],
  ['生态与气候环境', ['climate', 'energy', 'carbon', 'environment', 'wildlife', 'ocean', 'emission', 'solar']],
  ['心理与教育认知', ['education', 'school', 'student', 'psycholog', 'brain', 'learning', 'memory', 'health']],
  ['经济与商业职场', ['econom', 'market', 'business', 'job', 'work', 'trade', 'inflation', 'company']],
  ['社会文化与健康', ['society', 'culture', 'city', 'community', 'public', 'family', 'food']],
]

function classifyCategory(title: string, summary: string): string {
  const text = (title + ' ' + summary).toLowerCase()
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return category
  }
  return '科技与人工智能'
}

// news.py _split_into_paragraphs（逐行移植）
function splitIntoParagraphs(text: string, targetWords = 380): string[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const paragraphs: string[] = []
  let total = 0
  for (const block of blocks) {
    const words = block.split(/\s+/)
    if (words.length > 120) {
      const sentences = block.split(/(?<=[.!?])\s+/)
      let current: string[] = []
      let count = 0
      for (const sent of sentences) {
        current.push(sent)
        count += sent.split(/\s+/).length
        if (count >= 90) {
          paragraphs.push(current.join(' '))
          total += count
          current = []
          count = 0
        }
      }
      if (current.length) {
        paragraphs.push(current.join(' '))
        total += count
      }
    } else {
      paragraphs.push(block)
      total += words.length
    }
    if (total >= targetWords || paragraphs.length >= 6) break
  }
  return paragraphs
}

function quizTemplate(title: string) {
  return [
    {
      q: '1. What is the primary focus of this newly crawled passage?',
      options: [
        'A) Introducing core concepts and research significance of ' + title + '.',
        'B) Criticizing traditional agricultural irrigation methods.',
        'C) Promoting luxury consumer goods during inflation.',
        'D) Describing ancient architectural monuments.',
      ],
      answer: 0,
      explanation: '本文围绕 ' + title + ' 的核心概念与研究价值展开。',
    },
  ]
}

function complexSentenceTemplate(firstSentence: string) {
  return {
    sentence: firstSentence,
    structure: '【实时爬取首句主干分析】点击句中任意单词即可在查词台查看牛津词典释义、派生词与同义词。',
    tip: '首段首句往往是四六级说明文的中心议题所在。',
  }
}

function liveParagraphs(paragraphs: string[]): Paragraph[] {
  return paragraphs.map((p) => ({
    en: p,
    cn: '（实时在线抓取段落）点击正文中任意单词即可查看内置牛津词典释义、派生词与同义词。',
  }))
}

// ---- 网络层：CapacitorHttp（原生）优先，浏览器回退 fetch ----
interface HttpPlugin {
  get: (o: { url: string; headers?: Record<string, string> }) => Promise<{ status: number; data?: string; body?: string }>
}

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

async function httpGetText(url: string, timeoutMs: number): Promise<string | null> {
  if (isNative()) {
    const http = nativePlugin<HttpPlugin>('CapacitorHttp')
    if (http) {
      try {
        const res = await Promise.race([
          http.get({ url, headers: { 'User-Agent': 'Mozilla/5.0 ReadFlow/2.1' } }),
          timeoutPromise(timeoutMs),
        ])
        if (!res || res.status !== 200) return null
        return res.data ?? res.body ?? null
      } catch {
        return null
      }
    }
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// ---- RSS 解析（feedparser 等价：Atom/RSS 2.0 兼容） ----
interface FeedEntry {
  title: string
  link: string
  summary: string
  publishedAt: Date | null
}

function parseFeed(xml: string): FeedEntry[] {
  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const doc = parser.parse(xml)
    const items: FeedEntry[] = []
    const push = (e: unknown) => {
      if (!e || typeof e !== 'object') return
      const entry = e as Record<string, unknown>
      const link = typeof entry.link === 'string' ? entry.link : ((entry.link as Record<string, unknown>)?.['href'] as string) || ''
      const title = typeof entry.title === 'string' ? entry.title : ''
      if (!link || !title) return
      const summary =
        (typeof entry.summary === 'string' && entry.summary) ||
        (typeof entry.description === 'string' && entry.description) ||
        (typeof entry.content === 'string' && entry.content) ||
        ''
      const publishedRaw = (entry.pubDate || entry.published || entry.updated) as string | undefined
      const publishedAt = publishedRaw ? new Date(publishedRaw) : null
      items.push({ title, link, summary: String(summary), publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null })
    }
    const rssItems = doc?.rss?.channel?.item
    if (Array.isArray(rssItems)) rssItems.forEach(push)
    else if (rssItems) push(rssItems)
    const atomEntries = doc?.feed?.entry
    if (Array.isArray(atomEntries)) atomEntries.forEach(push)
    else if (atomEntries) push(atomEntries)
    const rdfItems = doc?.['rdf:RDF']?.item
    if (Array.isArray(rdfItems)) rdfItems.forEach(push)
    return items
  } catch {
    return []
  }
}

// ---- Readability 正文提取（trafilatura 等价） ----
function extractParagraphBlocks(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const parsed = new Readability(doc).parse()
    if (!parsed || !parsed.content) return null
    const contentDoc = new DOMParser().parseFromString(parsed.content, 'text/html')
    const blocks = Array.from(contentDoc.querySelectorAll('p'))
      .map((p) => (p.textContent || '').trim())
      .filter((t) => t.split(/\s+/).length > 8)
    return blocks.join('\n\n')
  } catch {
    return null
  }
}

function nowId(): string {
  return 'art-live-' + String(Date.now())
}

// ---- RSS 抓取主流程（news.py fetch_rss_article 逐行移植，12s 总时限；逐源健康度记录） ----
async function attemptSource(src: RssSource, levelTag: string, deadline: number, health: SourceHealth[]): Promise<Article | null> {
  const started = Date.now()
  const record = (ok: boolean, detail: string) => {
    health.push({ name: src.name, ok, detail, ms: Date.now() - started })
  }
  try {
    if (Date.now() > deadline) {
      record(false, '总时限已到')
      return null
    }
    const xml = await httpGetText(src.rssUrl, 10000)
    if (!xml) {
      record(false, '订阅源超时/不可达')
      return null
    }
    const entries = parseFeed(xml).filter((e) => e.link && e.title)
    if (entries.length === 0) {
      record(false, '订阅源为空')
      return null
    }

    const entry = entries[0]
    if (Date.now() > deadline) {
      record(false, '总时限已到')
      return null
    }

    if (entry.publishedAt) {
      const ageDays = (Date.now() - entry.publishedAt.getTime()) / 86400000
      if (ageDays > 60) {
        record(false, '最新条目超 60 天（陈旧）')
        return null
      }
    }

    const page = await httpGetText(entry.link, 8000)
    const bodyText = page ? extractParagraphBlocks(page) : null
    const paragraphs = splitIntoParagraphs(bodyText || '')

    if (paragraphs.length < 2 || paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0) < 120) {
      record(false, '正文过短（<2 段或 <120 词）')
      return null
    }

    const category = classifyCategory(entry.title, entry.summary)
    const bodyWords = paragraphs.join(' ').split(/\s+/).length
    const examLevel = bodyWords > 330 ? 'CET-6' : 'CET-4'
    const firstSentence = paragraphs[0].split(/(?<=[.!?])\s+/)[0]

    record(true, '抓取成功')
    return {
      id: nowId(),
      title: entry.title,
      titleCn: entry.title + '（实时在线爬取）',
      source: src.name,
      sourceUrl: entry.link,
      category,
      examLevel: levelTag || examLevel,
      lexile: '1090L',
      cetRatio: '18.0%',
      examFreqTag: levelTag ? '⚡ 实时网络爬取 · ' + levelTag : '⚡ 实时网络爬取 · 四六级同源科普',
      inLibrary: false,
      readStatus: 'unread',
      paragraphs: liveParagraphs(paragraphs),
      complexSentence: complexSentenceTemplate(firstSentence),
      quiz: quizTemplate(entry.title),
    }
  } catch (e) {
    record(false, '异常: ' + ((e as Error)?.message || 'unknown'))
    return null
  }
}

async function fetchRssArticle(levelTag: string): Promise<Article | null> {
  const deadline = Date.now() + 12000
  const sources = [...SOURCES]
  // random.shuffle 等价
  for (let i = sources.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[sources[i], sources[j]] = [sources[j], sources[i]]
  }

  for (const src of sources) {
    const art = await attemptSource(src, levelTag, deadline, lastSourceHealth)
    if (art) return art
    if (Date.now() > deadline) break
  }
  return null
}

// v1.1 单源重试：只抓指定源（feed 10s + 正文 8s），并更新该源健康度记录
export async function fetchRssFromSource(name: string, levelTag: string): Promise<Article | null> {
  const src = SOURCES.find((s) => s.name === name)
  if (!src) return null
  const health: SourceHealth[] = []
  const art = await attemptSource(src, levelTag, Date.now() + 18000, health)
  lastSourceHealth = lastSourceHealth.map((h) => (h.name === name ? health[health.length - 1] : h))
  return art
}

// ---- Wikipedia 兜底（news.py fetch_wikipedia_article 逐行移植，2.2s 超时） ----
async function fetchWikipediaArticle(levelTag: string): Promise<Article | null> {
  const randomTopic = LIVE_TOPICS[Math.floor(Math.random() * LIVE_TOPICS.length)]
  try {
    const text = await httpGetText('https://en.wikipedia.org/api/rest_v1/page/summary/' + randomTopic.topic, 2200)
    if (!text) return null
    const data = JSON.parse(text) as { title?: string; extract?: string }
    const extract = data.extract || ''
    if (extract.length <= 150) return null

    const firstSentence = extract.split('. ')[0] + '.'
    return {
      id: nowId(),
      title: (data.title || randomTopic.topic) + ': Contemporary Research Perspectives',
      titleCn: (data.title || randomTopic.topic) + '：当代前沿研究综述 (实时在线爬取)',
      source: randomTopic.source,
      sourceUrl: 'https://en.wikipedia.org/wiki/' + randomTopic.topic,
      category: randomTopic.category,
      examLevel: levelTag || randomTopic.level,
      lexile: '1090L',
      cetRatio: '18.0%',
      examFreqTag: levelTag ? '⚡ 实时网络爬取 · ' + levelTag : '⚡ 实时网络爬取 · 四六级同源科普',
      inLibrary: false,
      readStatus: 'unread',
      paragraphs: [
        { en: extract, cn: '（实时在线抓取段落）点击正文中任意单词即可查看内置牛津词典释义、派生词与同义词。' },
        {
          en: 'Researchers continue to investigate how these significant developments influence long-term productivity, environmental resilience, and modern educational strategy across global institutions.',
          cn: '研究人员继续探讨这些重大进展如何影响全球机构的长期生产率、环境韧性以及现代教育战略。',
        },
      ],
      complexSentence: complexSentenceTemplate(firstSentence),
      quiz: quizTemplate(data.title || randomTopic.topic),
    }
  } catch {
    return null
  }
}

// ---- 内置候选池注入（crawl.py inject_extra_pool：3 篇 extra 种子文章） ----
export function pickExtraPool(existingIds: Set<string>): Article[] {
  const extras = (seedData.extra as Article[]) || []
  return extras.filter((a) => !existingIds.has(a.id)).map((a) => ({ ...a }))
}

// ---- 总入口（crawl.py POST /api/crawl 等价；响应形状一致） ----
export async function runClientCrawl(level: string): Promise<CrawlResult> {
  const levelTag = level && level !== 'all' ? level : ''
  const live = await fetchRssArticle(levelTag)
  if (live) {
    return { poolAdded: [], live, liveOrigin: 'rss' }
  }
  const wiki = await fetchWikipediaArticle(levelTag)
  if (wiki) {
    return { poolAdded: [], live: wiki, liveOrigin: 'wikipedia' }
  }
  return { poolAdded: [], live: null, liveOrigin: null }
}
