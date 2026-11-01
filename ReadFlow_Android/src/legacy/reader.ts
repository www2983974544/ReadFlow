// Reader core (ported from cet_reading_master.html L3690-3990): tokenized
// paragraph rendering, word inspection, three-color marking. The paragraph /
// quiz / sentence containers are imperatively managed exactly like the legacy
// code, with Pinia stores replacing AppState.
// 移动版差异：① 段落 🔊/译 按钮由悬停浮现改为常显；② 专注模式提示文案移动化。
import { lookupWordDefinitionSync, lemmatizeWord, CET_DICT } from '../core/dictionary'
import { preloadWordHumanAudio, stopSpeechPlayback } from '../core/tts'
import { showInspectorWordTab } from './inspector-tabs'
import { S } from './state'
import { applySidebarCollapseLayout, recordTodayStudyDelta, showToast, updateTopBadgesAndStats } from './ui-fns'
import { useArticlesStore } from '../stores/articles'
import { useVocabStore } from '../stores/vocab'
import type { WordMark } from '../types'

export let currentActiveWordSpan: HTMLSpanElement | null = null

export function setCurrentActiveWordSpan(el: HTMLSpanElement | null) {
  currentActiveWordSpan = el
}

function buildWordSpanInnerAndClass(coreWord: string, lemma: string, isCurrentActive: boolean) {
  const s = S()
  const mark = s.wordMarks[lemma]
  const dictEntry = CET_DICT[lemma]
  const isCetCore = Boolean(dictEntry && dictEntry.level.includes('CET'))

  let cls = 'word-token'
  if (isCurrentActive) cls += ' active-word'
  if (mark) {
    if (mark.status === 'unknown') cls += ' word-mark-unknown'
    else if (mark.status === 'core') cls += ' word-mark-core'
    else if (mark.status === 'mastered') cls += ' word-mark-mastered'
  } else if (s.cetHintsOpen && isCetCore) {
    cls += ' word-cet-hint'
  }

  let inlineBadgeHtml = ''
  if (s.inlineNotesOpen && mark) {
    const rawShort =
      mark.customNote || (mark.cn ? mark.cn.replace(/^[a-z./]+\s*/i, '').split(/[；;，,]/)[0] : '')
    if (rawShort) {
      const badgeColor =
        mark.status === 'unknown'
          ? 'bg-rose-100 text-rose-800 border border-rose-300'
          : mark.status === 'core'
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      inlineBadgeHtml = `<span class="ruby-note ${badgeColor}">${rawShort}</span>`
    }
  }
  return { cls, html: `${coreWord}${inlineBadgeHtml}` }
}

function renderTokenizedParagraph(enText: string, pIndex: number): string {
  const tokens = enText.split(/(\s+)/)
  return tokens
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok
      const match = tok.match(/^([^a-zA-Z]*)([a-zA-Z-]+)([^a-zA-Z]*)$/)
      if (!match) return tok
      const [, prefix, coreWord, suffix] = match
      const lemma = lemmatizeWord(coreWord)
      const isCurrentActive = false
      const { cls, html } = buildWordSpanInnerAndClass(coreWord, lemma, isCurrentActive)
      return `${prefix}<span class="${cls}" data-word="${coreWord}" data-lemma="${lemma}" data-pidx="${pIndex}">${html}</span>${suffix}`
    })
    .join('')
}

export function updateWordTokensInPlace(lemma: string) {
  const pContainer = document.getElementById('readerParagraphsContainer')
  if (!pContainer) return
  pContainer.querySelectorAll(`.word-token[data-lemma="${lemma}"]`).forEach((span) => {
    const coreWord = span.getAttribute('data-word') || ''
    const isCurrentActive = span === currentActiveWordSpan
    const { cls, html } = buildWordSpanInnerAndClass(coreWord, lemma, isCurrentActive)
    span.className = cls
    span.innerHTML = html
  })
}

export function updateFinishedButtonState(art: { readStatus: string }) {
  const btnFin = document.getElementById('btnMarkArticleFinished')
  const pill = document.getElementById('articleReadStatusPill')
  if (!btnFin || !art) return

  // "读下一篇" surfaces only for finished articles (and when another exists)
  const btnNext = document.getElementById('btnNextArticle')
  if (btnNext) {
    btnNext.classList.toggle('hidden', !(art.readStatus === 'finished' && S().articles.length > 1))
  }

  if (art.readStatus === 'finished') {
    btnFin.textContent = '↩ 已精读完成 (点击取消)'
    btnFin.className =
      'px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition shadow-sm'
    if (pill) {
      pill.textContent = '✅ 已精读完成'
      pill.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800'
    }
  } else {
    btnFin.textContent = '✓ 标记本文已精读完成'
    btnFin.className =
      'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm'
    if (pill) {
      pill.textContent = art.readStatus === 'reading' ? '📖 精读中' : '⏳ 待精读'
      pill.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700'
    }
  }
}

// Session-local per-article quiz answers (drives the summary counter/dot).
const quizSessionAnswers = new Map<string, Set<number>>()

function updateQuizSummaryMeta(art: { id: string; quiz: { q: string }[] } | null | undefined) {
  const meta = document.getElementById('quizSummaryMeta')
  const dot = document.getElementById('quizUnansweredDot')
  if (!meta) return
  if (!art) return
  const total = (art.quiz || []).length
  const answered = quizSessionAnswers.get(art.id)?.size || 0
  meta.textContent = total === 0 ? '（本篇暂无自测题）' : `（${total} 题 · 已答 ${answered}）`
  if (dot) dot.classList.toggle('hidden', total === 0 || answered >= total)
}

export function recordQuizAnswered(articleId: string, questionIndex: number) {
  let set = quizSessionAnswers.get(articleId)
  if (!set) {
    set = new Set<number>()
    quizSessionAnswers.set(articleId, set)
  }
  set.add(questionIndex)
  const art = S().articles.find((a) => a.id === articleId)
  updateQuizSummaryMeta(art)
}

export function resetWordInspector() {
  const s = S()
  clearActiveWordSelection()
  s.activeWord = ''
  s.activeWordLemma = ''
  s.activeContextSentence = ''

  const el = (id: string) => document.getElementById(id)
  const setText = (id: string, text: string) => {
    const node = el(id)
    if (node) node.textContent = text
  }
  setText('inspectWordText', '—')
  setText('inspectWordPhonetic', '')
  setText('inspectWordLemma', '原型: —')
  setText('inspectWordExamTag', '待选择')
  setText('inspectWordMeaning', '点击正文任意单词，0ms 查询释义、派生词与同义词')
  setText('inspectWordEnglishDef', 'Offline instant lookup ready.')
  setText('inspectWordDerivatives', '—')
  setText('inspectWordSynonyms', '—')
  setText('inspectWordEtymology', '—')
  setText('inspectWordContext', 'Selected from current reading passage.')
  const noteInput = el('inputCustomWordNote') as HTMLInputElement | null
  if (noteInput) noteInput.value = ''
  setText('wordInspectorBadge', '未选中 · 点击任意词')
}

export function renderCurrentArticle(options?: { resetInspector?: boolean }) {
  const s = S()
  const art = s.articles.find((a) => a.id === s.currentArticleId) || s.articles[0]
  if (!art) return

  stopSpeechPlayback()

  const el = (id: string) => document.getElementById(id)
  const badgeLevel = el('readerBadgeLevel')
  const badgeCategory = el('readerBadgeCategory')
  const badgeSource = el('readerBadgeSource')
  const badgeFreq = el('readerBadgeFreq')
  if (badgeLevel) badgeLevel.textContent = art.examLevel + (art.examLevel === 'CET-6' ? ' 六级核心' : ' 四级核心')
  if (badgeCategory) badgeCategory.textContent = art.category
  if (badgeSource) badgeSource.textContent = art.source
  if (badgeFreq) badgeFreq.textContent = art.examFreqTag

  const titleEl = el('readerArticleTitle')
  const titleCnEl = el('readerArticleTitleCn')
  if (titleEl) titleEl.textContent = art.title
  if (titleCnEl) titleCnEl.textContent = art.titleCn

  const fullText = art.paragraphs.map((p) => p.en).join(' ')
  const wordCount = fullText.split(/\s+/).filter(Boolean).length
  const metaWordCount = el('metaWordCount')
  const metaCetRatio = el('metaCetRatio')
  const metaLexile = el('metaLexile')
  if (metaWordCount) metaWordCount.textContent = wordCount + ' 词 (约 ' + Math.max(3, Math.round(wordCount / 45)) + ' 分钟)'
  if (metaCetRatio) metaCetRatio.textContent = art.cetRatio
  if (metaLexile) metaLexile.textContent = art.lexile

  const btnLib = el('btnToggleLibraryStatus')
  const iconLib = el('iconLibraryBtn')
  const txtLib = el('txtLibraryBtn')
  const metaLib = el('metaLibStatusBadge')

  if (btnLib && iconLib && txtLib && metaLib) {
    if (art.inLibrary) {
      btnLib.className =
        'px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
      iconLib.textContent = '✓'
      txtLib.textContent = '已入库 (点击移出)'
      metaLib.textContent = '✓ 已加入文章库'
      metaLib.className = 'font-semibold text-emerald-600'
    } else {
      btnLib.className =
        'px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
      iconLib.textContent = '➕'
      txtLib.textContent = '加入文章库'
      metaLib.textContent = '未入库'
      metaLib.className = 'font-semibold text-amber-600'
    }
  }

  updateFinishedButtonState(art)

  const pContainer = el('readerParagraphsContainer')
  if (!pContainer) return
  pContainer.style.fontSize = s.fontSizeRem + 'rem'

  pContainer.innerHTML = art.paragraphs
    .map((p, idx) => {
      const cnHiddenClass = s.bilingualOpen ? '' : 'hidden'
      return `
          <div id="paraRow-${idx}" class="group relative rounded-lg p-2.5 -mx-2 hover:bg-slate-100/40 transition">
            <div class="flex items-start justify-between gap-3">
              <p class="flex-1 leading-[1.98] tracking-normal" style="margin:0;">
                <span class="inline-block text-[10px] font-mono opacity-30 mr-1.5 select-none">[P${idx + 1}]</span>
                ${renderTokenizedParagraph(p.en, idx)}
              </p>
              <div class="flex flex-col gap-1 shrink-0 font-sans opacity-90 transition">
                <button type="button" data-pidx="${idx}" class="btn-speak-para px-1.5 py-1 rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-600" title="朗读本段">🔊</button>
                <button type="button" data-pidx="${idx}" class="btn-toggle-para-cn px-1.5 py-1 rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-600" title="展开/收起本段译文">译</button>
              </div>
            </div>
            <div id="paraCnBox-${idx}" class="${cnHiddenClass} mt-2.5 pl-3 border-l-2 border-indigo-200/70 font-sans text-sm opacity-85 leading-relaxed">
              ${p.cn}
            </div>
          </div>
        `
    })
    .join('')

  setCurrentActiveWordSpan(null)

  const sentBox = el('readerSentenceAnalysis')
  if (sentBox) {
    if (art.complexSentence) {
      sentBox.innerHTML = `
          <div class="font-serif italic font-medium text-indigo-950">“${art.complexSentence.sentence}”</div>
          <div class="text-xs leading-relaxed"><strong class="text-violet-700">🔍 结构拆解：</strong>${art.complexSentence.structure}</div>
          <div class="text-xs leading-relaxed"><strong class="text-amber-700">🎯 考场技巧：</strong>${art.complexSentence.tip}</div>
        `
    }
  }

  const quizContainer = el('readerQuizContainer')
  if (quizContainer) {
    quizContainer.innerHTML = (art.quiz || [])
      .map((qItem, qIdx) => {
        const optsHtml = qItem.options
          .map(
            (opt, oIdx) => `
          <button type="button" data-qidx="${qIdx}" data-oidx="${oIdx}" class="quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 text-xs sm:text-sm transition flex items-center justify-between">
            <span>${opt}</span>
          </button>
        `,
          )
          .join('')

        return `
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <div class="text-xs sm:text-sm font-bold">${qItem.q}</div>
            <div class="space-y-1.5">${optsHtml}</div>
            <div id="quizExp-${qIdx}" class="hidden p-3 rounded-xl text-xs leading-relaxed"></div>
          </div>
        `
      })
      .join('')
  }

  renderArticleMarkedWordsList()

  if (options?.resetInspector) {
    resetWordInspector()
  }
  updateQuizSummaryMeta(art)
}

export function selectWordForInspection(rawWord: string, paraText: string, clickedSpanEl: HTMLSpanElement | null) {
  const s = S()
  const clean = rawWord.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
  if (!clean) return
  const lemma = lemmatizeWord(clean)
  s.activeWord = clean
  s.activeWordLemma = lemma

  if (s.rightCollapsed) {
    s.rightCollapsed = false
    applySidebarCollapseLayout()
  }
  showInspectorWordTab()

  preloadWordHumanAudio(clean)

  if (currentActiveWordSpan && currentActiveWordSpan !== clickedSpanEl) {
    currentActiveWordSpan.classList.remove('active-word')
  }
  if (clickedSpanEl) {
    clickedSpanEl.classList.add('active-word')
    setCurrentActiveWordSpan(clickedSpanEl)
  }

  let contextSent = paraText || ''
  if (paraText) {
    const sentences = paraText.match(/[^.!?]+[.!?]+/g) || [paraText]
    const lowerClean = clean.toLowerCase()
    const found = sentences.find((x) => x.toLowerCase().includes(lowerClean))
    if (found) contextSent = found.trim()
  }
  s.activeContextSentence = contextSent

  const info = lookupWordDefinitionSync(clean)
  const existingMark = s.wordMarks[lemma]

  const el = (id: string) => document.getElementById(id)
  const inspectWordText = el('inspectWordText')
  const inspectWordPhonetic = el('inspectWordPhonetic')
  const inspectWordLemma = el('inspectWordLemma')
  const inspectWordExamTag = el('inspectWordExamTag')
  const inspectWordMeaning = el('inspectWordMeaning')
  const inspectWordEnglishDef = el('inspectWordEnglishDef')
  const inspectWordDerivatives = el('inspectWordDerivatives')
  const inspectWordSynonyms = el('inspectWordSynonyms')
  const inspectWordEtymology = el('inspectWordEtymology')
  const inspectWordContext = el('inspectWordContext')
  const inputCustomWordNote = el('inputCustomWordNote') as HTMLInputElement | null
  const statusBadge = el('wordInspectorBadge')

  if (inspectWordText) inspectWordText.textContent = info.word
  if (inspectWordPhonetic) inspectWordPhonetic.textContent = info.phonetic
  if (inspectWordLemma) inspectWordLemma.textContent = '原型: ' + info.lemma
  if (inspectWordExamTag) inspectWordExamTag.textContent = info.level
  if (inspectWordMeaning)
    inspectWordMeaning.textContent =
      existingMark && existingMark.customNote ? `${info.cn} (个人批注: ${existingMark.customNote})` : info.cn
  if (inspectWordEnglishDef) inspectWordEnglishDef.textContent = info.enDef

  if (inspectWordDerivatives) inspectWordDerivatives.textContent = info.derivatives
  if (inspectWordSynonyms) inspectWordSynonyms.textContent = info.synonyms

  if (inspectWordEtymology) inspectWordEtymology.textContent = info.root
  if (inspectWordContext)
    inspectWordContext.textContent = contextSent || 'Selected from current reading passage.'
  if (inputCustomWordNote) inputCustomWordNote.value = existingMark ? existingMark.customNote || '' : ''

  if (statusBadge) {
    if (existingMark) {
      const mapLabel: Record<string, string> = {
        unknown: '🔴 已标为生词',
        core: '🟡 已标为核心词',
        mastered: '🟢 已掌握',
      }
      statusBadge.textContent = mapLabel[existingMark.status] || '已标注'
    } else {
      statusBadge.textContent = '⚡ 已选中 · 点击空白处取消'
    }
  }
}

export async function markCurrentWord(statusType: WordMark['status']) {
  const s = S()
  const lemma = s.activeWordLemma
  if (!lemma) return
  const art = s.articles.find((a) => a.id === s.currentArticleId) || s.articles[0]
  const info = lookupWordDefinitionSync(s.activeWord)
  const noteInput = document.getElementById('inputCustomWordNote') as HTMLInputElement | null
  const customNote = noteInput ? noteInput.value.trim() : ''

  const mark: WordMark = {
    word: s.activeWord,
    lemma: lemma,
    status: statusType,
    customNote: customNote,
    cn: info.cn,
    phonetic: info.phonetic,
    level: info.level,
    derivatives: info.derivatives,
    synonyms: info.synonyms,
    context: s.activeContextSentence,
    articleTitle: art ? art.title : 'CET Reading Passage',
  }

  // The two local requests are independent (the stats delta uses the post-mark
  // count computed here), so run them in parallel instead of serially.
  const countAfter = Object.keys(s.wordMarks).length + (s.wordMarks[lemma] ? 0 : 1)
  await Promise.all([
    useVocabStore().mark(mark),
    recordTodayStudyDelta(0, 0, countAfter),
  ])
  updateTopBadgesAndStats()
  updateWordTokensInPlace(lemma)
  renderArticleMarkedWordsList()
  selectWordForInspection(s.activeWord, s.activeContextSentence, currentActiveWordSpan)

  const labelMap: Record<string, string> = { unknown: '🔴 陌生生词', core: '🟡 四六级核心词', mastered: '🟢 已掌握词汇' }
  showToast(`已将「${s.activeWord}」标注为 ${labelMap[statusType]}`)
}

export async function clearWordMark() {
  const s = S()
  const lem = s.activeWordLemma
  if (lem && s.wordMarks[lem]) {
    await useVocabStore().unmark(lem)
    updateTopBadgesAndStats()
    updateWordTokensInPlace(lem)
    renderArticleMarkedWordsList()
    selectWordForInspection(s.activeWord, s.activeContextSentence, currentActiveWordSpan)
    showToast('已清除该词标注')
  }
}

export async function saveWordNote() {
  const s = S()
  const existing = s.wordMarks[s.activeWordLemma]
  const status = existing ? existing.status : 'core'
  await markCurrentWord(status)
}

export function renderArticleMarkedWordsList() {
  const s = S()
  const container = document.getElementById('listArticleMarkedWords')
  const art = s.articles.find((a) => a.id === s.currentArticleId)
  if (!container || !art) return

  const fullTextLower = art.paragraphs.map((p) => p.en.toLowerCase()).join(' ')
  const relevantMarks = Object.values(s.wordMarks).filter((m) => fullTextLower.includes(m.lemma))

  const countEl = document.getElementById('countArticleMarked')
  if (countEl) countEl.textContent = String(relevantMarks.length)

  if (relevantMarks.length === 0) {
    container.innerHTML = `<div class="text-slate-400 py-3 text-center">点击文中任意单词并选择颜色按钮，即可在此生成本文核心词汇清单。</div>`
    return
  }

  container.innerHTML = relevantMarks
    .map((m) => {
      const dot = m.status === 'unknown' ? '🔴' : m.status === 'core' ? '🟡' : '🟢'
      return `
          <div data-lemma="${m.lemma}" class="marked-word-chip p-2 rounded-lg border border-slate-200/80 hover:border-indigo-400 cursor-pointer flex items-center justify-between gap-2 transition">
            <div class="truncate">
              <span class="font-bold text-indigo-700">${dot} ${m.word}</span>
              <span class="opacity-75 ml-1">${m.customNote || m.cn}</span>
            </div>
            <span class="text-[10px] opacity-60 shrink-0">${m.phonetic}</span>
          </div>
        `
    })
    .join('')
}

export function clearActiveWordSelection() {
  if (currentActiveWordSpan) {
    currentActiveWordSpan.classList.remove('active-word')
    setCurrentActiveWordSpan(null)
  }
  document.querySelectorAll('#readerParagraphsContainer .word-token.active-word').forEach((el) => {
    el.classList.remove('active-word')
  })
  const statusBadge = document.getElementById('wordInspectorBadge')
  if (statusBadge) {
    statusBadge.textContent = '未选中 · 点击任意词'
  }
}

// Focus mode: both panes collapse so only the article remains. Triggered on
// every reader entry and every article switch; the hint toast fires once per
// session. Word-click auto-expanding the right pane is unaffected.
let focusHintShown = false

export function enterFocusReading() {
  const s = S()
  s.leftCollapsed = true
  s.rightCollapsed = true
  applySidebarCollapseLayout()
  if (!focusHintShown) {
    focusHintShown = true
    showToast('💡 专注阅读：点「📂 目录」看文章列表，点文中单词自动弹出查词台')
  }
}

export function openArticleForReading(articleId: string) {
  const s = S()
  s.currentArticleId = articleId
  renderSidebarArticleList()
  renderCurrentArticle({ resetInspector: true })
  enterFocusReading()
  const pane = document.getElementById('centerReaderPane')
  if (pane) pane.scrollTop = 0
}

export function renderSidebarArticleList() {
  const s = S()
  const container = document.getElementById('sidebarArticleList')
  if (!container) return
  const filtered = s.articles.filter((art) => {
    if (s.poolFilter === 'library' && !art.inLibrary) return false
    if (s.poolFilter === 'discovery' && art.inLibrary) return false
    if (s.levelFilter !== 'all' && art.examLevel !== s.levelFilter) return false
    if (s.categoryFilter !== 'all' && art.category !== s.categoryFilter) return false
    return true
  })

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs opacity-60 border border-dashed rounded-xl">当前筛选条件下暂无文章，可切换筛选条件或点击顶部「实时爬取新刊」。</div>`
    return
  }

  container.innerHTML = filtered
    .map((art) => {
      const isActive = art.id === s.currentArticleId
      const borderClass = isActive
        ? 'border-indigo-600 bg-indigo-50/60'
        : 'border-transparent hover:bg-slate-100/60'
      const line2 =
        art.readStatus === 'finished'
          ? `${art.examLevel} · ${art.source} · ✓已读`
          : `${art.examLevel} · ${art.source} · 考纲词 ${art.cetRatio}`

      return `
          <div data-artid="${art.id}" title="${art.titleCn}" class="sidebar-art-card px-2.5 py-2 rounded-lg border-l-[3px] ${borderClass} cursor-pointer transition space-y-0.5">
            <h4 class="text-xs font-medium leading-snug line-clamp-1">${art.title}</h4>
            <p class="text-[10.5px] opacity-60 truncate">${line2}</p>
          </div>
        `
    })
    .join('')
}

export async function toggleArticleLibraryStatus() {
  const articlesStore = useArticlesStore()
  const s = S()
  const art = s.articles.find((a) => a.id === s.currentArticleId)
  if (!art) return
  await articlesStore.patch(art.id, { inLibrary: !art.inLibrary })
  updateTopBadgesAndStats()
  renderSidebarArticleList()
  renderCurrentArticle()
  showToast(art.inLibrary ? `✓ 已将本文加入「文章库」` : '已将本文从「文章库」移出')
}

export async function toggleArticleFinished() {
  const articlesStore = useArticlesStore()
  const s = S()
  const art = s.articles.find((a) => a.id === s.currentArticleId)
  if (!art) return
  const artWords = art.paragraphs.map((p) => p.en).join(' ').split(/\s+/).filter(Boolean).length
  const estMins = Math.max(5, Math.round(artWords / 45))
  if (art.readStatus === 'finished') {
    await articlesStore.patch(art.id, { readStatus: 'reading' })
    await recordTodayStudyDelta(-estMins, -artWords, null)
    updateTopBadgesAndStats()
    renderSidebarArticleList()
    updateFinishedButtonState(art)
    showToast('↩ 已取消「已精读完成」状态，相应阅读时长与词数已同步回退')
  } else {
    await articlesStore.patch(art.id, { readStatus: 'finished', inLibrary: true })
    await recordTodayStudyDelta(estMins, artWords, null)
    updateTopBadgesAndStats()
    renderSidebarArticleList()
    renderCurrentArticle()
    const quizDetails = document.getElementById('quizDetails') as HTMLDetailsElement | null
    if (quizDetails) quizDetails.open = true
    showToast(`🎉 恭喜完成本篇精读！已自动计入统计 (+${estMins}分钟 / +${artWords}词)`)
  }
}

export async function goNextArticle() {
  const s = S()
  const idx = s.articles.findIndex((a) => a.id === s.currentArticleId)
  if (idx === -1 || s.articles.length <= 1) return
  const next = s.articles[(idx + 1) % s.articles.length]
  openArticleForReading(next.id)
  showToast(`📖 下一篇：${next.titleCn || next.title}`)
}
