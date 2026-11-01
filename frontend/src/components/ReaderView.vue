<script setup lang="ts">
import { onMounted } from 'vue'
import { S } from '../legacy/state'
import {
  applySidebarCollapseLayout,
  hooks,
  showToast,
  updateTopBadgesAndStats,
} from '../legacy/ui-fns'
import {
  clearActiveWordSelection,
  clearWordMark,
  markCurrentWord,
  renderCurrentArticle,
  renderSidebarArticleList,
  saveWordNote,
  selectWordForInspection,
  toggleArticleFinished,
  toggleArticleLibraryStatus,
  updateWordTokensInPlace,
} from '../legacy/reader'
import { applyCustomTimerMinutes, resetExamTimer, toggleExamTimer } from '../legacy/timer'
import { translateSentenceOfflineOrOnline } from '../legacy/translate'
import { speakPassageBroadcast, speakSingleWord } from '../core/tts'
import { useStatsStore } from '../stores/stats'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()

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

  // Sidebar Collapse / Expand Buttons + Interactive Gutter Dividers
  const toggleLeftSidebar = () => {
    s.leftCollapsed = !s.leftCollapsed
    applySidebarCollapseLayout()
  }
  const toggleRightSidebar = () => {
    s.rightCollapsed = !s.rightCollapsed
    applySidebarCollapseLayout()
  }
  el('btnToggleLeftPane')?.addEventListener('click', toggleLeftSidebar)
  el('btnCollapseLeftInner')?.addEventListener('click', () => {
    s.leftCollapsed = true
    applySidebarCollapseLayout()
  })
  el('leftGutterDivider')?.addEventListener('click', toggleLeftSidebar)
  el('btnToggleRightPane')?.addEventListener('click', toggleRightSidebar)
  el('btnCollapseRightInner')?.addEventListener('click', () => {
    s.rightCollapsed = true
    applySidebarCollapseLayout()
  })
  el('rightGutterDivider')?.addEventListener('click', toggleRightSidebar)
  el('btnImmersiveBothPanes')?.addEventListener('click', () => {
    const bothClosed = s.leftCollapsed && s.rightCollapsed
    s.leftCollapsed = !bothClosed
    s.rightCollapsed = !bothClosed
    applySidebarCollapseLayout()
    showToast(s.leftCollapsed ? '🔭 已进入宽屏沉浸阅读模式（两侧栏已收起）' : '🔲 已恢复三栏标准视图')
  })

  // Custom Timer Input Change
  el('inputCustomTimerMins')?.addEventListener('change', applyCustomTimerMinutes)

  // Voice Accent & Speed Selectors
  el('selectVoiceAccent')?.addEventListener('change', (e) => {
    s.voiceAccent = (e.target as HTMLSelectElement).value
    showToast(s.voiceAccent === 'UK' ? '🇬🇧 已切换为英式标准发音 (UK Standard)' : '🇺🇸 已切换为美式标准发音 (US Standard)')
  })
  el('selectVoiceSpeed')?.addEventListener('change', (e) => {
    s.voiceSpeed = parseFloat((e.target as HTMLSelectElement).value) || 1.0
    showToast(`🎙️ 文章朗读语速已设为 ${s.voiceSpeed}x`)
  })

  // Left Sidebar Article List Delegation
  el('sidebarArticleList')?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.sidebar-art-card') as HTMLElement | null
    if (!card) return
    s.currentArticleId = card.getAttribute('data-artid') || ''
    renderSidebarArticleList()
    renderCurrentArticle()
    el('centerReaderPane')!.scrollTop = 0
  })

  // Delegated Click Listener for Article Words, Paragraph Controls & Blank Space Deselection
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

    if (oIdx === qItem.answer) {
      btn.className =
        'quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold text-xs sm:text-sm flex items-center justify-between'
      if (expBox) {
        expBox.className = 'p-3 rounded-xl text-xs leading-relaxed bg-emerald-50 border border-emerald-200 text-emerald-900'
        expBox.innerHTML = `<strong>✅ 回答正确！</strong> ${qItem.explanation}`
      }
    } else {
      btn.className =
        'quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-rose-500 bg-rose-50 text-rose-900 font-semibold text-xs sm:text-sm flex items-center justify-between'
      if (expBox) {
        expBox.className = 'p-3 rounded-xl text-xs leading-relaxed bg-rose-50 border border-rose-200 text-rose-900'
        expBox.innerHTML = `<strong>❌ 再想想看：</strong> 正确答案为 <strong>${['A', 'B', 'C', 'D'][qItem.answer]}</strong>。${qItem.explanation}`
      }
    }
    updateTopBadgesAndStats()
    hooks.renderStatsAndHeatmap()
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

  document.querySelectorAll('.level-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      s.levelFilter = chip.getAttribute('data-level') || 'all'
      document.querySelectorAll('.level-chip').forEach((c) => {
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
    if (txt) txt.textContent = s.bilingualOpen ? '隐藏全文译文' : '显示全文译文'
    document.querySelectorAll("[id^='paraCnBox-']").forEach((box) => {
      box.classList.toggle('hidden', !s.bilingualOpen)
    })
  })

  el('btnToggleInlineNotes')?.addEventListener('click', () => {
    s.inlineNotesOpen = !s.inlineNotesOpen
    const txt = document.getElementById('txtToggleInlineNotes')
    if (txt) txt.textContent = '行内标注释义: ' + (s.inlineNotesOpen ? '开启' : '关闭')
    Object.keys(s.wordMarks).forEach((lem) => updateWordTokensInPlace(lem))
  })

  el('btnToggleCetHints')?.addEventListener('click', () => {
    s.cetHintsOpen = !s.cetHintsOpen
    const txt = document.getElementById('txtToggleCetHints')
    if (txt) txt.textContent = '考纲词下划线: ' + (s.cetHintsOpen ? '开启' : '关闭')
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
  if (txtBilingual) txtBilingual.textContent = s.bilingualOpen ? '隐藏全文译文' : '显示全文译文'
  const txtInline = document.getElementById('txtToggleInlineNotes')
  if (txtInline) txtInline.textContent = '行内标注释义: ' + (s.inlineNotesOpen ? '开启' : '关闭')
  const txtHints = document.getElementById('txtToggleCetHints')
  if (txtHints) txtHints.textContent = '考纲词下划线: ' + (s.cetHintsOpen ? '开启' : '关闭')
})
</script>

<template>
  <section id="viewReader" class="reader-three-col-flex">

    <!-- Left Pane: Article Directory -->
    <aside id="leftSidebarPane" class="left-sidebar-box independent-scroll-pane space-y-3.5 pr-1">
      <div class="surface-card p-3.5 shadow-sm">
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">文章目录</span>
          <div class="flex items-center gap-1.5">
            <button id="btnOpenCustomImport" type="button" class="text-xs font-semibold text-indigo-600 hover:underline">
              + 粘贴/导入外刊
            </button>
            <button id="btnCollapseLeftInner" type="button" title="收起左侧文章目录栏" class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
              ◀ 收起
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl text-xs font-medium mb-2.5">
          <button id="filterPoolAll" type="button" class="pool-filter-btn py-1.5 rounded-lg bg-white text-indigo-700 shadow-sm font-semibold">全部文章</button>
          <button id="filterPoolLibrary" type="button" class="pool-filter-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900">已入库</button>
          <button id="filterPoolDiscovery" type="button" class="pool-filter-btn py-1.5 rounded-lg text-slate-600 hover:text-slate-900">待筛选</button>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-2.5">
          <button data-level="all" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white">全部难度</button>
          <button data-level="CET-4" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">四级 CET-4</button>
          <button data-level="CET-6" type="button" class="level-chip px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">六级 CET-6</button>
        </div>

        <div class="mb-3">
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

        <div id="sidebarArticleList" class="space-y-2"></div>
      </div>

      <div class="surface-card p-3.5 shadow-sm">
        <h3 class="text-xs font-bold uppercase tracking-wider opacity-70 mb-2.5">📊 ReadFlow 能力成长看板</h3>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <div id="statLibraryTotal" class="text-base font-bold text-indigo-700">3</div>
            <div class="text-[11px] text-slate-600">文章库藏量</div>
          </div>
          <div class="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
            <div id="statMarkedWords" class="text-base font-bold text-rose-600">0</div>
            <div class="text-[11px] text-slate-600">单词库收录</div>
          </div>
          <div class="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div id="statFinishedArticles" class="text-base font-bold text-emerald-700">0</div>
            <div class="text-[11px] text-slate-600">已完成精读</div>
          </div>
          <div class="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
            <div id="statQuizAccuracy" class="text-base font-bold text-amber-700">0%</div>
            <div class="text-[11px] text-slate-600">模考训练正确率</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Left Interactive Gutter Gap -->
    <div id="leftGutterDivider" class="pane-gutter-divider" title="点击空隙收起/展开左侧栏">
      <span id="leftGutterIcon" class="gutter-pill-icon">◀</span>
    </div>

    <!-- Center Pane: Interactive Article Reader -->
    <div id="centerReaderPane" class="center-reader-box independent-scroll-pane space-y-3.5 px-0.5">
      <div class="surface-card reader-toolbar-card shadow-sm sticky top-0 z-10 backdrop-blur-md bg-opacity-95">
        <div class="toolbar-row-top">
          <button id="btnToggleLeftPane" type="button" title="展开/收起左侧文章目录栏" class="toolbar-pill-btn bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
            ◀ 左栏
          </button>

          <div class="flex items-center gap-2 text-xs">
            <button id="btnImmersiveBothPanes" type="button" title="一键同时收起/展开两侧边栏，进入宽屏沉浸阅读" class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 transition">
              🔭 宽屏沉浸阅读模式
            </button>
          </div>

          <button id="btnToggleRightPane" type="button" title="展开/收起右侧查词标注栏" class="toolbar-pill-btn bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
            右栏 ▶
          </button>
        </div>

        <div class="toolbar-row-controls">
          <div class="flex flex-wrap items-center gap-1.5">
            <button id="btnToggleBilingual" type="button" class="toolbar-pill-btn border border-slate-200 hover:border-indigo-400 bg-white">
              <span>🀄</span>
              <span id="txtToggleBilingual">显示全文译文</span>
            </button>

            <button id="btnToggleInlineNotes" type="button" class="toolbar-pill-btn bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>🏷️</span>
              <span id="txtToggleInlineNotes">行内标注释义: 开启</span>
            </button>

            <button id="btnToggleCetHints" type="button" class="toolbar-pill-btn bg-violet-50 text-violet-700 border border-violet-200">
              <span>✨</span>
              <span id="txtToggleCetHints">考纲词下划线: 开启</span>
            </button>

            <div class="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden text-xs h-[30px] bg-white">
              <button id="btnFontDec" type="button" title="缩小字号" class="px-2.5 h-full hover:bg-slate-100 font-bold">A-</button>
              <button id="btnFontInc" type="button" title="放大字号" class="px-2.5 h-full hover:bg-slate-100 font-bold border-l border-slate-200">A+</button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <select id="selectVoiceAccent" title="切换美式/英式纯正发音" class="text-xs rounded-lg border border-slate-200 px-2 h-[30px] bg-white font-medium">
              <option value="US">🇺🇸 美式标准音</option>
              <option value="UK">🇬🇧 英式标准音</option>
            </select>

            <select id="selectVoiceSpeed" title="调节文章朗读标准语速" class="text-xs rounded-lg border border-slate-200 px-2 h-[30px] bg-white font-medium">
              <option value="1.0" selected>语速 1.0x 标准</option>
              <option value="0.88">语速 0.88x 慢读</option>
              <option value="0.78">语速 0.78x 跟读</option>
              <option value="1.12">语速 1.12x 进阶</option>
            </select>

            <div class="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 overflow-hidden text-xs h-[30px]">
              <div class="flex items-center px-1.5 h-full border-r border-amber-200 bg-amber-100/60 text-amber-900 font-medium" title="自定义限时阅读分钟数 (1-120分钟)">
                <input id="inputCustomTimerMins" type="number" min="1" max="120" value="8" class="w-8 text-center font-bold bg-white/80 rounded border border-amber-300 px-0.5 py-0 text-xs focus:outline-none" />
                <span class="ml-0.5 text-[11px]">分</span>
              </div>
              <button id="btnExamTimer" type="button" class="px-2.5 h-full text-xs font-semibold text-amber-800 hover:bg-amber-100 flex items-center gap-1 transition">
                <span>⏱️</span>
                <span id="txtTimerDisplay">08:00 限时读</span>
              </button>
              <button id="btnResetTimer" type="button" title="重置为自定义时长" class="px-2 h-full text-xs font-bold text-amber-700 border-l border-amber-200 hover:bg-amber-200/70 transition">
                ↺ 重置
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Article Canvas -->
      <article id="mainArticleSurface" class="reader-surface p-5 sm:p-7 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80">
          <div class="flex flex-wrap items-center gap-1.5">
            <span id="readerBadgeLevel" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white">CET-6 六级核心</span>
            <span id="readerBadgeCategory" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">科技与人工智能</span>
            <span id="readerBadgeSource" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">来源: The Economist</span>
            <span id="readerBadgeFreq" class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">🔥 仔细阅读高频同源</span>
          </div>

          <div class="flex items-center gap-2">
            <button id="btnToggleLibraryStatus" type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1">
              <span id="iconLibraryBtn">➕</span>
              <span id="txtLibraryBtn">加入我的文章库</span>
            </button>
          </div>
        </div>

        <h2 id="readerArticleTitle" class="serif-article text-2xl sm:text-3xl font-bold leading-snug mb-1.5"></h2>
        <p id="readerArticleTitleCn" class="text-sm font-medium opacity-75 mb-4"></p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs mb-4">
          <div>
            <span class="opacity-60 block">词数统计</span>
            <strong id="metaWordCount" class="font-semibold">340 词</strong>
          </div>
          <div>
            <span class="opacity-60 block">考纲核心词密度</span>
            <strong id="metaCetRatio" class="font-semibold text-indigo-600">19.4% (高含金量)</strong>
          </div>
          <div>
            <span class="opacity-60 block">蓝思难度/分级</span>
            <strong id="metaLexile" class="font-semibold">1120L · CET-6 标准</strong>
          </div>
          <div>
            <span class="opacity-60 block">文章入库状态</span>
            <strong id="metaLibStatusBadge" class="font-semibold text-emerald-600">已加入文章库</strong>
          </div>
        </div>

        <div class="mb-5 px-3.5 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200/70 flex items-center justify-between gap-2 text-xs text-indigo-900">
          <div>
            <span>💡 <strong>操作提示：</strong>点击任意单词自动展示<strong>派生词与同义词</strong>，点击<strong>页面空白处取消选中</strong>；两侧栏支持通过顶部按钮或<strong>栏间空隙</strong>随时收起。</span>
          </div>
          <button id="btnReadFullArticle" type="button" class="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition">🔊 全文朗读</button>
        </div>

        <div id="readerParagraphsContainer" class="serif-article space-y-5 text-lg leading-relaxed"></div>

        <div class="mt-7 pt-5 border-t border-slate-200/80">
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="text-sm font-bold flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-xs">长难句攻克</span>
              <span>本篇核心长难句语法拆解</span>
            </h3>
            <span class="text-xs opacity-60">搞定从句与非谓语结构，提升定位速度</span>
          </div>
          <div id="readerSentenceAnalysis" class="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/70 space-y-1.5 text-xs sm:text-sm"></div>
        </div>

        <div class="mt-7 pt-5 border-t border-slate-200/80">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div>
              <h3 class="text-base font-bold">🎯 四六级仿真阅读理解自测 (仔细阅读专项)</h3>
              <p class="text-xs opacity-70">读完文章后立即完成同源题型训练，检验真实理解度与定位技巧</p>
            </div>
            <div class="flex items-center gap-2">
              <span id="articleReadStatusPill" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">📖 精读中</span>
              <button id="btnMarkArticleFinished" type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm">
                ✓ 标记本文已精读完成
              </button>
            </div>
          </div>
          <div id="readerQuizContainer" class="space-y-3.5"></div>
        </div>
      </article>
    </div>

    <!-- Right Interactive Gutter Gap -->
    <div id="rightGutterDivider" class="pane-gutter-divider" title="点击空隙收起/展开右侧栏">
      <span id="rightGutterIcon" class="gutter-pill-icon">▶</span>
    </div>

    <!-- Right Pane: Word Inspector, Derivatives, Synonyms & Sentence Translator -->
    <aside id="rightInspectorPane" class="right-sidebar-box independent-scroll-pane space-y-3.5 pl-1">
      <div class="surface-card p-4 shadow-sm">
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600" style="width: 8px; height: 8px; background: #4f46e5; border-radius: 99px; display: inline-block"></span>
            <h3 class="text-xs font-bold uppercase tracking-wider">查词 · 派生词 · 同义词台</h3>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="wordInspectorBadge" class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">⚡ 0ms 秒查</span>
            <button id="btnCollapseRightInner" type="button" title="收起右侧栏 (点击文中单词会自动弹出)" class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
              收起 ▶
            </button>
          </div>
        </div>

        <div id="wordInspectorContent" class="space-y-3">
          <div class="flex items-baseline justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 id="inspectWordText" class="text-2xl font-bold text-indigo-600 tracking-tight" style="margin: 0">artificial</h4>
                <button id="btnSpeakWord" type="button" title="播放真人标准发音 (快捷键 S)" class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                  🔊
                </button>
                <button id="btnSpeakWordUS" type="button" title="美式真人发音" class="px-2 py-1 rounded-lg bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold transition">
                  🇺🇸 美音
                </button>
                <button id="btnSpeakWordUK" type="button" title="英式真人发音" class="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold transition">
                  🇬🇧 英音
                </button>
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs opacity-75">
                <span id="inspectWordPhonetic" class="font-mono">/ˌɑːtɪˈfɪʃl/</span>
                <span>·</span>
                <span id="inspectWordLemma">原型: artificial</span>
              </div>
            </div>
            <span id="inspectWordExamTag" class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 shrink-0">CET-4 高频</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="flex items-center justify-between text-[11px] font-semibold opacity-65 mb-1">
              <span>📖 内置英汉牛津/考纲精准释义</span>
              <span id="voiceEngineStatusLabel" class="text-indigo-600">🎙️ 真人原声已就绪</span>
            </div>
            <p id="inspectWordMeaning" class="text-sm font-bold leading-snug text-indigo-950" style="margin: 0">adj. 人工的；人造的；人为的；矫揉造作的</p>
            <p id="inspectWordEnglishDef" class="text-xs opacity-75 mt-1 leading-relaxed" style="margin-bottom: 0">Oxford Core & CET Exam Standard Entry.</p>
          </div>

          <div class="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-2">
            <div>
              <div class="font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                <span>🧬 派生词 & 不同词性拓展 (Word Family)：</span>
              </div>
              <div id="inspectWordDerivatives" class="leading-relaxed text-slate-800">adv. artificially (人工地) | n. artifice (技巧) | n. artifact (人工制品)</div>
            </div>
            <div class="pt-1.5 border-t border-amber-200/60">
              <div class="font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                <span>🔄 四六级高频同义替换词 (Synonyms)：</span>
              </div>
              <div id="inspectWordSynonyms" class="leading-relaxed text-slate-800">synthetic (合成的), man-made (人造的), simulated (模拟的)</div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1.5">
            <div><strong class="text-indigo-700">💡 词根与考点解析：</strong><span id="inspectWordEtymology">art(技艺) + fic(做) + ial → 人工制造的</span></div>
            <div><strong class="text-indigo-700">📌 文中所在原句：</strong><span id="inspectWordContext" class="italic opacity-80">Click any word in the article to capture its context sentence automatically.</span></div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1.5">🖍️ 一键在文中标注该单词 (快捷键 1 / 2 / 3)：</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              <button id="btnMarkUnknown" type="button" class="py-2 px-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition flex flex-col items-center gap-0.5">
                <span>🔴 陌生生词</span>
                <span class="text-[10px] opacity-75">重点攻克</span>
              </button>
              <button id="btnMarkCore" type="button" class="py-2 px-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex flex-col items-center gap-0.5">
                <span>🟡 四六级核心</span>
                <span class="text-[10px] opacity-75">高频考点</span>
              </button>
              <button id="btnMarkMastered" type="button" class="py-2 px-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex flex-col items-center gap-0.5">
                <span>🟢 已熟记</span>
                <span class="text-[10px] opacity-75">归档掌握</span>
              </button>
            </div>
            <button id="btnClearWordMark" type="button" class="w-full mt-1.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition">
              清除该词标注状态
            </button>
          </div>

          <div class="pt-2 border-t border-slate-200/70">
            <label for="inputCustomWordNote" class="block text-xs font-semibold mb-1">✏️ 添加个人助记/搭配批注 (显示在文章行内)：</label>
            <div class="flex gap-1.5">
              <input id="inputCustomWordNote" type="text" placeholder="输入自定义简短释义或笔记..." class="flex-1 text-xs rounded-xl border border-slate-200 px-2.5 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button id="btnSaveWordNote" type="button" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">保存</button>
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-3.5 shadow-sm">
        <h3 class="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>🌐 词句离线解析与翻译台</span>
          <span class="text-[10px] text-emerald-600 font-medium">整句中译 + 逐词词义详解</span>
        </h3>
        <textarea id="inputFreeTranslate" rows="2" placeholder="输入或粘贴任意英文单词、短语或长句，立即显示整句译文与每个词的详细词义..." class="w-full text-xs rounded-xl border border-slate-200 p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"></textarea>
        <div class="flex items-center justify-between gap-2">
          <button id="btnRunFreeTranslate" type="button" class="w-full py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">
            立即翻译并解析词汇
          </button>
        </div>
        <div id="outputFreeTranslate" class="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-2"></div>
      </div>

      <div class="surface-card p-3.5 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider">📌 本文已标注词汇 (<span id="countArticleMarked">0</span>)</h3>
          <button id="btnJumpToVocabTab" type="button" class="text-xs text-indigo-600 hover:underline font-medium">打开单词库 →</button>
        </div>
        <div id="listArticleMarkedWords" class="space-y-1.5 max-h-44 overflow-y-auto text-xs"></div>
      </div>
    </aside>
  </section>
</template>
