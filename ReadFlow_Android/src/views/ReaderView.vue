<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { S } from '../legacy/state'
import { applySidebarCollapseLayout, renderStatsIfVisible, showToast, updateTopBadgesAndStats } from '../legacy/ui-fns'
import {
  clearActiveWordSelection,
  clearWordMark,
  enterFocusReading,
  goNextArticle,
  markCurrentWord,
  openArticleForReading,
  recordQuizAnswered,
  renderCurrentArticle,
  renderSidebarArticleList,
  saveWordNote,
  selectWordForInspection,
  toggleArticleFinished,
  toggleArticleLibraryStatus,
  updateWordTokensInPlace,
} from '../legacy/reader'
import { initInspectorTabs, switchInspectorTab } from '../legacy/inspector-tabs'
import { applyCustomTimerMinutes, resetExamTimer, toggleExamTimer } from '../legacy/timer'
import { translateSentenceOfflineOrOnline } from '../legacy/translate'
import { speakPassageBroadcast, speakSingleWord } from '../core/tts'
import { useStatsStore } from '../stores/stats'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()

// 每次进入精读页 = 专注阅读模式（抽屉/查词台自动收起，切换文章同样收起）
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'reader') enterFocusReading()
  },
)

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

function setPoolBtnStyle(activeId: string) {
  ;['filterPoolAll', 'filterPoolLibrary', 'filterPoolDiscovery'].forEach((id) => {
    const elBtn = document.getElementById(id)
    if (!elBtn) return
    elBtn.className =
      id === activeId
        ? 'pool-filter-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm font-semibold'
        : 'pool-filter-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900'
  })
}

onMounted(() => {
  const s = S()
  initInspectorTabs()

  // 抽屉 / 查词台开关（移动版：目录抽屉 + 底部弹层）
  el('btnToggleLeftPane')?.addEventListener('click', () => {
    s.leftCollapsed = !s.leftCollapsed
    applySidebarCollapseLayout()
  })
  el('btnCollapseLeftInner')?.addEventListener('click', () => {
    s.leftCollapsed = true
    applySidebarCollapseLayout()
  })
  el('readerDrawerMask')?.addEventListener('click', () => {
    s.leftCollapsed = true
    applySidebarCollapseLayout()
  })
  el('btnToggleRightPane')?.addEventListener('click', () => {
    s.rightCollapsed = !s.rightCollapsed
    applySidebarCollapseLayout()
  })
  el('btnCollapseRightInner')?.addEventListener('click', () => {
    s.rightCollapsed = true
    applySidebarCollapseLayout()
  })
  el('btnImmersiveBothPanes')?.addEventListener('click', () => {
    const bothClosed = s.leftCollapsed && s.rightCollapsed
    s.leftCollapsed = !bothClosed
    s.rightCollapsed = !bothClosed
    applySidebarCollapseLayout()
    showToast(s.leftCollapsed ? '🔭 已进入专注阅读模式' : '🔲 已展开目录与查词台')
  })

  // Custom Timer Input Change
  el('inputCustomTimerMins')?.addEventListener('change', applyCustomTimerMinutes)

  // Voice Accent & Speed Selectors
  el('selectVoiceAccent')?.addEventListener('change', (e) => {
    s.voiceAccent = (e.target as HTMLSelectElement).value
    showToast(s.voiceAccent === 'UK' ? '🇬🇧 已切换为英式发音' : '🇺🇸 已切换为美式发音')
  })
  el('selectVoiceSpeed')?.addEventListener('change', (e) => {
    s.voiceSpeed = parseFloat((e.target as HTMLSelectElement).value) || 1.0
    showToast(`🎙️ 朗读语速已设为 ${s.voiceSpeed}x`)
  })

  // Drawer Article List Delegation
  el('sidebarArticleList')?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.sidebar-art-card') as HTMLElement | null
    if (!card) return
    openArticleForReading(card.getAttribute('data-artid') || '')
  })

  // Selection → instant translate (drag-select ≥2 words fills the translator tab)
  el('centerReaderPane')?.addEventListener('mouseup', () => {
    setTimeout(() => {
      const text = (window.getSelection()?.toString() || '').trim()
      const words = text.split(/\s+/).filter(Boolean)
      if (words.length < 2 || text.length > 600) return
      const ta = el<HTMLTextAreaElement>('inputFreeTranslate')
      if (ta) ta.value = text
      if (s.rightCollapsed) {
        s.rightCollapsed = false
        applySidebarCollapseLayout()
      }
      switchInspectorTab('trans')
      void translateSentenceOfflineOrOnline(text)
    }, 0)
  })

  // Delegated Click: words, paragraph controls, blank-space deselection
  el('centerReaderPane')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const wordSpan = target.closest('.word-token') as HTMLElement | null
    if (wordSpan) {
      const word = wordSpan.getAttribute('data-word') || ''
      const pIdx = parseInt(wordSpan.getAttribute('data-pidx') || '0', 10)
      const art = s.articles.find((a) => a.id === s.currentArticleId)
      const paraText = art && art.paragraphs[pIdx] ? art.paragraphs[pIdx].en : ''
      selectWordForInspection(word, paraText, wordSpan as HTMLSpanElement)
      return
    }

    const speakBtn = target.closest('.btn-speak-para') as HTMLElement | null
    if (speakBtn) {
      const pIdx = parseInt(speakBtn.getAttribute('data-pidx') || '0', 10)
      const art = s.articles.find((a) => a.id === s.currentArticleId)
      if (art && art.paragraphs[pIdx]) {
        speakPassageBroadcast(art.paragraphs[pIdx].en, false, pIdx)
      }
      return
    }

    const transBtn = target.closest('.btn-toggle-para-cn') as HTMLElement | null
    if (transBtn) {
      const pIdx = parseInt(transBtn.getAttribute('data-pidx') || '0', 10)
      const box = document.getElementById('paraCnBox-' + pIdx)
      if (box) box.classList.toggle('hidden')
      return
    }

    if (!target.closest('button, select, input, a')) {
      clearActiveWordSelection()
    }
  })

  // Delegated listener for Quiz Options
  el('readerQuizContainer')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('.quiz-opt-btn') as HTMLElement | null
    if (!btn) return
    const s2 = S()
    const art = s2.articles.find((a) => a.id === s2.currentArticleId)
    if (!art) return
    const qIdx = parseInt(btn.getAttribute('data-qidx') || '0', 10)
    const oIdx = parseInt(btn.getAttribute('data-oidx') || '0', 10)
    const qItem = art.quiz[qIdx]
    const expBox = document.getElementById('quizExp-' + qIdx)
    await useStatsStore().answerQuiz(art.id, qIdx, oIdx, oIdx === qItem.answer)
    recordQuizAnswered(art.id, qIdx)

    if (oIdx === qItem.answer) {
      btn.className =
        'quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold text-xs flex items-center justify-between'
      if (expBox) {
        expBox.className = 'p-3 rounded-xl text-xs leading-relaxed bg-emerald-50 border border-emerald-200 text-emerald-900'
        expBox.innerHTML = `<strong>✅ 回答正确！</strong> ${qItem.explanation}`
      }
    } else {
      btn.className =
        'quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-rose-500 bg-rose-50 text-rose-900 font-semibold text-xs flex items-center justify-between'
      if (expBox) {
        expBox.className = 'p-3 rounded-xl text-xs leading-relaxed bg-rose-50 border border-rose-200 text-rose-900'
        expBox.innerHTML = `<strong>❌ 再想想看：</strong> 正确答案为 <strong>${['A', 'B', 'C', 'D'][qItem.answer]}</strong>。${qItem.explanation}`
      }
    }
    updateTopBadgesAndStats()
    renderStatsIfVisible()
  })

  // Delegated listener for Marked Words in Current Article
  el('listArticleMarkedWords')?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('.marked-word-chip') as HTMLElement | null
    if (!chip) return
    const lem = chip.getAttribute('data-lemma') || ''
    const foundEl = document.querySelector(
      `#readerParagraphsContainer .word-token[data-lemma="${lem}"]`,
    ) as HTMLSpanElement | null
    selectWordForInspection(lem, '', foundEl)
    speakSingleWord(lem)
  })

  // Pool / Level / Category Filters
  el('filterPoolAll')?.addEventListener('click', () => {
    s.poolFilter = 'all'
    setPoolBtnStyle('filterPoolAll')
    renderSidebarArticleList()
  })
  el('filterPoolLibrary')?.addEventListener('click', () => {
    s.poolFilter = 'library'
    setPoolBtnStyle('filterPoolLibrary')
    renderSidebarArticleList()
  })
  el('filterPoolDiscovery')?.addEventListener('click', () => {
    s.poolFilter = 'discovery'
    setPoolBtnStyle('filterPoolDiscovery')
    renderSidebarArticleList()
  })

  document.querySelectorAll('#viewReader .level-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      s.levelFilter = chip.getAttribute('data-level') || 'all'
      document.querySelectorAll('#viewReader .level-chip').forEach((c) => {
        c.className =
          c === chip
            ? 'level-chip px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white'
            : 'level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200'
      })
      renderSidebarArticleList()
    })
  })

  el('selectCategoryFilter')?.addEventListener('change', (e) => {
    s.categoryFilter = (e.target as HTMLSelectElement).value
    renderSidebarArticleList()
  })

  // Toolbar toggles
  el('btnToggleBilingual')?.addEventListener('click', () => {
    s.bilingualOpen = !s.bilingualOpen
    const txt = document.getElementById('txtToggleBilingual')
    if (txt) txt.textContent = s.bilingualOpen ? '藏译文' : '译文'
    document.querySelectorAll("[id^='paraCnBox-']").forEach((box) => {
      box.classList.toggle('hidden', !s.bilingualOpen)
    })
  })

  el('btnToggleInlineNotes')?.addEventListener('click', () => {
    s.inlineNotesOpen = !s.inlineNotesOpen
    const txt = document.getElementById('txtToggleInlineNotes')
    if (txt) txt.textContent = '行内: ' + (s.inlineNotesOpen ? '开' : '关')
    Object.keys(s.wordMarks).forEach((lem) => updateWordTokensInPlace(lem))
  })

  el('btnToggleCetHints')?.addEventListener('click', () => {
    s.cetHintsOpen = !s.cetHintsOpen
    const txt = document.getElementById('txtToggleCetHints')
    if (txt) txt.textContent = '考纲: ' + (s.cetHintsOpen ? '开' : '关')
    renderCurrentArticle()
  })

  el('btnFontDec')?.addEventListener('click', () => {
    s.fontSizeRem = Math.max(0.95, s.fontSizeRem - 0.08)
    const c = el('readerParagraphsContainer')
    if (c) c.style.fontSize = s.fontSizeRem + 'rem'
  })

  el('btnFontInc')?.addEventListener('click', () => {
    s.fontSizeRem = Math.min(1.45, s.fontSizeRem + 0.08)
    const c = el('readerParagraphsContainer')
    if (c) c.style.fontSize = s.fontSizeRem + 'rem'
  })

  el('btnExamTimer')?.addEventListener('click', toggleExamTimer)
  el('btnResetTimer')?.addEventListener('click', resetExamTimer)

  el('btnToggleLibraryStatus')?.addEventListener('click', toggleArticleLibraryStatus)

  el('btnReadFullArticle')?.addEventListener('click', () => {
    const art = s.articles.find((a) => a.id === s.currentArticleId)
    if (!art) return
    speakPassageBroadcast(art.title + '. ' + art.paragraphs.map((p) => p.en).join(' '), true, null)
  })

  el('btnMarkArticleFinished')?.addEventListener('click', toggleArticleFinished)
  el('btnNextArticle')?.addEventListener('click', () => void goNextArticle())

  el('btnSpeakWord')?.addEventListener('click', () => speakSingleWord(s.activeWord))
  el('btnSpeakWordUS')?.addEventListener('click', () => speakSingleWord(s.activeWord, 'US'))
  el('btnSpeakWordUK')?.addEventListener('click', () => speakSingleWord(s.activeWord, 'UK'))

  el('btnMarkUnknown')?.addEventListener('click', () => void markCurrentWord('unknown'))
  el('btnMarkCore')?.addEventListener('click', () => void markCurrentWord('core'))
  el('btnMarkMastered')?.addEventListener('click', () => void markCurrentWord('mastered'))
  el('btnClearWordMark')?.addEventListener('click', () => void clearWordMark())
  el('btnSaveWordNote')?.addEventListener('click', () => void saveWordNote())

  el('btnRunFreeTranslate')?.addEventListener('click', () => {
    const text = (el('inputFreeTranslate') as HTMLTextAreaElement | null)?.value || ''
    void translateSentenceOfflineOrOnline(text)
  })

  el('btnJumpToVocabTab')?.addEventListener('click', () => ui.switchView('vocab'))
  el('btnOpenCustomImport')?.addEventListener('click', () => {
    ui.customImportOpen = true
  })

  // Restore persisted prefs into static controls
  const accentSel = el('selectVoiceAccent') as HTMLSelectElement | null
  if (accentSel) accentSel.value = String(s.voiceAccent)
  const speedSel = el('selectVoiceSpeed') as HTMLSelectElement | null
  if (speedSel) speedSel.value = String(s.voiceSpeed)
  const timerInput = el('inputCustomTimerMins') as HTMLInputElement | null
  if (timerInput) timerInput.value = String(s.customTimerMinutes)
  const txtBilingual = document.getElementById('txtToggleBilingual')
  if (txtBilingual) txtBilingual.textContent = s.bilingualOpen ? '藏译文' : '译文'
  const txtInline = document.getElementById('txtToggleInlineNotes')
  if (txtInline) txtInline.textContent = '行内: ' + (s.inlineNotesOpen ? '开' : '关')
  const txtHints = document.getElementById('txtToggleCetHints')
  if (txtHints) txtHints.textContent = '考纲: ' + (s.cetHintsOpen ? '开' : '关')
})
</script>

<template>
  <section id="viewReader" class="reader-mobile-root">
    <!-- 抽屉遮罩（点按关闭抽屉） -->
    <div id="readerDrawerMask" class="reader-drawer-mask hidden"></div>

    <!-- 中央正文滚动列 -->
    <div id="centerReaderPane" class="center-reader-pane">
      <!-- 单行横滑工具栏（sticky，绝不遮挡正文以外区域） -->
      <div class="surface-card reader-toolbar-card sticky top-0 z-10">
        <div class="toolbar-scroll">
          <button id="btnToggleLeftPane" type="button" class="toolbar-pill-btn bg-indigo-50 text-indigo-700 border border-indigo-200">📂 目录</button>
          <button id="btnReadFullArticle" type="button" class="toolbar-pill-btn bg-indigo-50 text-indigo-700 border border-indigo-200">🔊 朗读</button>
          <span class="tool-divider"></span>
          <button id="btnToggleBilingual" type="button" class="ghost-btn toolbar-pill-btn"><span>🀄</span><span id="txtToggleBilingual">译文</span></button>
          <button id="btnToggleInlineNotes" type="button" class="ghost-btn toolbar-pill-btn"><span>🏷️</span><span id="txtToggleInlineNotes">行内: 开</span></button>
          <button id="btnToggleCetHints" type="button" class="ghost-btn toolbar-pill-btn"><span>✨</span><span id="txtToggleCetHints">考纲: 开</span></button>
          <span class="tool-divider"></span>
          <button id="btnFontDec" type="button" title="缩小字号" class="ghost-btn font-bold px-2.5 h-[30px]">A-</button>
          <button id="btnFontInc" type="button" title="放大字号" class="ghost-btn font-bold px-2.5 h-[30px]">A+</button>
          <span class="tool-divider"></span>
          <select id="selectVoiceAccent" title="切换美式/英式发音" class="ghost-select">
            <option value="US">🇺🇸 美音</option>
            <option value="UK">🇬🇧 英音</option>
          </select>
          <select id="selectVoiceSpeed" title="朗读语速" class="ghost-select">
            <option value="1.0" selected>1.0x</option>
            <option value="0.88">0.88x</option>
            <option value="0.78">0.78x</option>
            <option value="1.12">1.12x</option>
          </select>
          <span class="tool-divider"></span>
          <div class="inline-flex items-center h-[30px] timer-cluster">
            <input id="inputCustomTimerMins" type="number" min="1" max="120" value="8" title="自定义限时阅读分钟数 (1-120分钟)" class="w-8 text-center font-bold bg-transparent rounded border border-amber-300/70 px-0.5 py-0 text-xs focus:outline-none focus:border-amber-500" />
            <span class="ml-0.5 text-[11px] opacity-70">分</span>
            <button id="btnExamTimer" type="button" class="px-2 h-full text-xs font-semibold text-amber-700 flex items-center gap-1 transition">
              <span>⏱️</span>
              <span id="txtTimerDisplay">08:00</span>
            </button>
            <button id="btnResetTimer" type="button" title="重置为自定义时长" class="px-1.5 h-full text-xs font-bold opacity-70 hover:opacity-100 transition">↺</button>
          </div>
          <span class="tool-divider"></span>
          <button id="btnImmersiveBothPanes" type="button" class="toolbar-pill-btn bg-indigo-50 text-indigo-700 border border-indigo-200">🔭 专注</button>
          <button id="btnToggleRightPane" type="button" class="toolbar-pill-btn bg-indigo-50 text-indigo-700 border border-indigo-200">🔍 查词台</button>
        </div>
      </div>

      <!-- 文章正文（杂志头 + 分词正文 + 完读自测） -->
      <article id="mainArticleSurface" class="reader-surface mt-2.5 p-4 shadow-sm">
        <div class="reader-body-inner">
          <div class="reader-masthead pb-3.5 mb-4">
            <div class="flex flex-col gap-2 mb-3">
              <div class="reader-eyebrow flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]" style="color: var(--text-muted)">
                <span id="readerBadgeSource"></span>
                <span class="opacity-40">·</span>
                <span id="readerBadgeLevel"></span>
                <span class="opacity-40">·</span>
                <span id="readerBadgeCategory"></span>
              </div>
              <span id="readerBadgeFreq" class="text-[11px] font-semibold self-start px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200"></span>
            </div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <button id="btnToggleLibraryStatus" type="button" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition">
                  <span id="iconLibraryBtn">➕</span>
                  <span id="txtLibraryBtn">加入文章库</span>
                </button>
              </div>
            </div>

            <h2 id="readerArticleTitle" class="serif-article text-xl font-bold leading-[1.32] mb-1"></h2>
            <p id="readerArticleTitleCn" class="text-[13px] mb-0.5" style="color: var(--text-muted)"></p>

            <div class="reader-meta-line mt-3 pt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]" style="border-top: 1px solid var(--border-col)">
              <span id="metaWordCount" class="font-medium"></span>
              <span class="opacity-40">·</span>
              <span>考纲词 <span id="metaCetRatio" class="font-medium"></span></span>
              <span class="opacity-40">·</span>
              <span>蓝思 <span id="metaLexile" class="font-medium"></span></span>
              <span class="opacity-40">·</span>
              <span id="metaLibStatusBadge" class="font-medium"></span>
            </div>
          </div>

          <div id="readerParagraphsContainer" class="serif-article reader-body space-y-4 text-[1.05rem] leading-relaxed"></div>

          <div class="mt-7 pt-4" style="border-top: 1px solid var(--border-col)">
            <div class="flex flex-col gap-2 mb-3">
              <h3 class="text-sm font-bold text-center">✅ 精读完成与自测</h3>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <span id="articleReadStatusPill" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">📖 精读中</span>
                <button id="btnMarkArticleFinished" type="button" class="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white transition shadow-sm">
                  ✓ 标记本文已精读完成
                </button>
                <button id="btnNextArticle" type="button" class="hidden px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white transition shadow-sm">
                  读下一篇 →
                </button>
              </div>
            </div>

            <details id="sentenceDetails" class="reader-details mb-2.5">
              <summary>🔍 本篇核心长难句语法拆解</summary>
              <div class="details-body">
                <div id="readerSentenceAnalysis" class="space-y-1.5 text-xs"></div>
              </div>
            </details>

            <details id="quizDetails" class="reader-details">
              <summary>
                <span id="quizUnansweredDot" class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                🎯 四六级仿真自测
                <span id="quizSummaryMeta" class="font-normal opacity-60 ml-1 text-[11px]"></span>
              </summary>
              <div class="details-body">
                <div id="readerQuizContainer" class="space-y-3"></div>
              </div>
            </details>
          </div>
        </div>
      </article>

      <div class="h-6"></div>
    </div>

    <!-- 文章目录抽屉（左侧滑出） -->
    <aside id="leftSidebarPane" class="reader-drawer">
      <div class="drawer-head">
        <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">文章目录</span>
        <div class="flex items-center gap-1.5">
          <button id="btnOpenCustomImport" type="button" class="text-xs font-semibold text-indigo-600 hover:underline">+ 导入</button>
          <button id="btnCollapseLeftInner" type="button" title="收起目录" class="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">◀</button>
        </div>
      </div>

      <div class="drawer-body">
        <div class="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl text-xs font-medium mb-2">
          <button id="filterPoolAll" type="button" class="pool-filter-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm font-semibold">全部文章</button>
          <button id="filterPoolLibrary" type="button" class="pool-filter-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900">已入库</button>
          <button id="filterPoolDiscovery" type="button" class="pool-filter-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900">待筛选</button>
        </div>

        <details class="reader-filter-drawer">
          <summary>⚙️ 筛选难度与题型</summary>
          <div class="pt-2.5 pb-1 space-y-2.5">
            <div class="flex flex-wrap gap-1.5">
              <button data-level="all" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white">全部难度</button>
              <button data-level="CET-4" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">四级 CET-4</button>
              <button data-level="CET-6" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">六级 CET-6</button>
              <button data-level="安徽专升本" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">安徽专升本</button>
            </div>
            <div>
              <label for="selectCategoryFilter" class="block text-[11px] font-medium opacity-70 mb-1">四六级高频题型分类：</label>
              <select id="selectCategoryFilter" class="w-full text-xs rounded-xl border border-slate-200 px-2.5 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">🔥 全部高频考题类型 (5大类)</option>
                <option value="科技与人工智能">🤖 科技与人工智能 (真题占比 30%)</option>
                <option value="生态与气候环境">🌱 生态与气候环境 (真题占比 22%)</option>
                <option value="心理与教育认知">🧠 心理与教育认知 (真题占比 20%)</option>
                <option value="经济与商业职场">💼 经济与商业职场 (真题占比 16%)</option>
                <option value="社会文化与健康">🏥 社会文化与健康 (公共议题 12%)</option>
              </select>
            </div>
          </div>
        </details>

        <div id="sidebarArticleList" class="space-y-1 mt-2.5"></div>
      </div>

      <!-- 底部固定统计条 -->
      <div class="reader-stat-strip surface-card mx-2 mb-2 px-3 flex items-center justify-between text-[11px]" style="min-height: 34px">
        <span title="文章库藏量">📚 <span id="statLibraryTotal" class="font-bold text-indigo-600">0</span><span class="opacity-60 ml-0.5">篇</span></span>
        <span title="单词库收录">🔖 <span id="statMarkedWords" class="font-bold text-rose-500">0</span><span class="opacity-60 ml-0.5">词</span></span>
        <span title="已完成精读">✅ <span id="statFinishedArticles" class="font-bold text-emerald-600">0</span><span class="opacity-60 ml-0.5">篇</span></span>
        <span title="模考训练正确率">🎯 <span id="statQuizAccuracy" class="font-bold text-amber-600">0%</span></span>
      </div>
    </aside>

    <!-- 查词台底部弹层（三 Tab，点词自动弹出） -->
    <aside id="rightInspectorPane" class="inspector-sheet">
      <div class="sheet-handle"><span class="sheet-handle-bar"></span></div>
      <div class="surface-card sheet-card">
        <div class="inspector-tab-bar flex items-stretch" style="border-bottom: 1px solid var(--border-col)">
          <button id="tabBtnInspectorWord" type="button" class="inspector-tab-btn inspector-tab-active flex-1">🔍 查词</button>
          <button id="tabBtnInspectorTrans" type="button" class="inspector-tab-btn flex-1">🌐 翻译</button>
          <button id="tabBtnInspectorMarked" type="button" class="inspector-tab-btn flex-1">📌 生词 (<span id="countArticleMarked">0</span>)</button>
          <button id="btnCollapseRightInner" type="button" title="收起查词台 (点击文中单词会自动弹出)" class="inspector-tab-btn px-3" style="font-size: 12px">▼</button>
        </div>

        <div class="sheet-body">
          <!-- Tab 1: Word Inspector -->
          <div id="inspectorTabPanelWord" class="p-3.5">
            <div id="wordInspectorContent" class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 id="inspectWordText" class="text-2xl font-bold text-indigo-600 tracking-tight" style="margin: 0">artificial</h4>
                    <button id="btnSpeakWord" type="button" title="播放真人发音" class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">🔊</button>
                    <button id="btnSpeakWordUS" type="button" title="美式发音" class="px-2 py-1 rounded-lg bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold transition">🇺🇸</button>
                    <button id="btnSpeakWordUK" type="button" title="英式发音" class="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold transition">🇬🇧</button>
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-xs opacity-75 flex-wrap">
                    <span id="inspectWordPhonetic" class="font-mono">/ˌɑːtɪˈfɪʃl/</span>
                    <span>·</span>
                    <span id="inspectWordLemma">原型: artificial</span>
                  </div>
                </div>
                <span id="inspectWordExamTag" class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 shrink-0">CET-4 高频</span>
              </div>

              <div class="p-3 rounded-xl" style="background: var(--bg-subcard)">
                <div class="flex items-center justify-between text-[11px] font-semibold opacity-65 mb-1">
                  <span>📖 牛津/考纲精准释义</span>
                  <span id="voiceEngineStatusLabel" class="text-indigo-600">🎙️ 真人原声已就绪</span>
                </div>
                <p id="inspectWordMeaning" class="text-sm font-bold leading-snug text-indigo-950" style="margin: 0"></p>
                <p id="inspectWordEnglishDef" class="text-xs opacity-60 mt-1 leading-relaxed" style="margin-bottom: 0"></p>
              </div>

              <div>
                <label class="block text-xs font-bold mb-1.5">🖍️ 标注该单词 (快捷键 1 / 2 / 3)：</label>
                <div class="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  <button id="btnMarkUnknown" type="button" class="py-2.5 px-1.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 transition flex flex-col items-center gap-0.5">
                    <span>🔴 陌生生词</span>
                    <span class="text-[10px] opacity-75">重点攻克</span>
                  </button>
                  <button id="btnMarkCore" type="button" class="py-2.5 px-1.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 transition flex flex-col items-center gap-0.5">
                    <span>🟡 四六级核心</span>
                    <span class="text-[10px] opacity-75">高频考点</span>
                  </button>
                  <button id="btnMarkMastered" type="button" class="py-2.5 px-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 transition flex flex-col items-center gap-0.5">
                    <span>🟢 已熟记</span>
                    <span class="text-[10px] opacity-75">归档掌握</span>
                  </button>
                </div>
                <button id="btnClearWordMark" type="button" class="w-full mt-1.5 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition">
                  清除该词标注状态 (快捷键 0)
                </button>
              </div>

              <div class="pt-2.5" style="border-top: 1px dashed var(--border-col)">
                <label for="inputCustomWordNote" class="block text-xs font-semibold mb-1">✏️ 个人助记/搭配批注 (显示在文章行内)：</label>
                <div class="flex gap-1.5">
                  <input id="inputCustomWordNote" type="text" placeholder="输入自定义简短释义或笔记..." class="flex-1 min-w-0 text-xs rounded-xl border border-slate-200 px-2.5 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button id="btnSaveWordNote" type="button" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">保存</button>
                </div>
              </div>

              <dl class="reader-word-facts text-xs">
                <div class="fact-row">
                  <dt>🧬 派生词 & 词性拓展</dt>
                  <dd id="inspectWordDerivatives"></dd>
                </div>
                <div class="fact-row">
                  <dt>🔄 四六级高频同义替换</dt>
                  <dd id="inspectWordSynonyms"></dd>
                </div>
                <div class="fact-row">
                  <dt>💡 词根与考点解析</dt>
                  <dd id="inspectWordEtymology"></dd>
                </div>
                <div class="fact-row">
                  <dt>📌 文中所在原句</dt>
                  <dd id="inspectWordContext" class="italic"></dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Tab 2: Free Translator -->
          <div id="inspectorTabPanelTrans" class="p-3.5 hidden">
            <div class="text-[11px] font-semibold opacity-65 mb-2">整句中译 + 逐词词义详解（离线优先）</div>
            <textarea id="inputFreeTranslate" rows="2" placeholder="输入或粘贴任意英文单词、短语或长句..." class="w-full text-xs rounded-xl border border-slate-200 p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"></textarea>
            <button id="btnRunFreeTranslate" type="button" class="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">
              立即翻译并解析词汇
            </button>
            <div id="outputFreeTranslate" class="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-2"></div>
          </div>

          <!-- Tab 3: Marked Words in Current Article -->
          <div id="inspectorTabPanelMarked" class="p-3.5 hidden">
            <div class="flex items-center justify-end mb-2">
              <button id="btnJumpToVocabTab" type="button" class="text-xs text-indigo-600 hover:underline font-medium">打开单词库 →</button>
            </div>
            <div id="listArticleMarkedWords" class="space-y-1.5 text-xs"></div>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.reader-mobile-root {
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-main);
}

/* ---- 中央滚动列 ---- */
.center-reader-pane {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 8px 10px 0;
}

/* ---- 工具栏：单行横滑，绝不换行/遮挡 ---- */
.reader-toolbar-card {
  padding: 6px 8px;
}
.toolbar-scroll {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.toolbar-scroll::-webkit-scrollbar {
  display: none;
}
.toolbar-scroll > * {
  flex: 0 0 auto;
}
.tool-divider {
  width: 1px;
  height: 18px;
  background: var(--border-col);
  flex: 0 0 1px;
}
.timer-cluster {
  background: var(--bg-subcard);
  border-radius: 10px;
  padding: 0 2px;
}

/* ---- 文章目录抽屉 ---- */
.reader-drawer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  width: min(84vw, 340px);
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
  border-right: 1px solid var(--border-col);
  box-shadow: 8px 0 30px rgba(15, 23, 42, 0.25);
  animation: drawerIn 0.2s ease;
}
@keyframes drawerIn {
  from { transform: translateX(-24px); opacity: 0.4; }
  to { transform: translateX(0); opacity: 1; }
}
.drawer-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  padding-top: calc(12px + env(safe-area-inset-top));
  border-bottom: 1px solid var(--border-col);
  background-color: var(--bg-card);
}
.drawer-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 10px 12px;
}
.reader-drawer-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  background-color: rgba(2, 6, 23, 0.45);
  animation: maskIn 0.2s ease;
}
@keyframes maskIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ---- 查词台底部弹层 ---- */
.inspector-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  max-height: 62vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px 16px 0 0;
  border: 1px solid var(--border-col);
  border-bottom: none;
  background-color: var(--bg-card);
  box-shadow: 0 -14px 42px rgba(15, 23, 42, 0.28);
  overflow: hidden;
  animation: sheetUp 0.22s ease;
}
@keyframes sheetUp {
  from { transform: translateY(28px); opacity: 0.5; }
  to { transform: translateY(0); opacity: 1; }
}
.sheet-handle {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  padding: 7px 0 3px;
  background-color: var(--bg-card);
}
.sheet-handle-bar {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background-color: var(--border-col);
}
.sheet-card {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}
.inspector-tab-bar {
  flex: 0 0 auto;
}
.sheet-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
