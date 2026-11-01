// Vocab notebook view (ported from renderVocabNotebook + bindings + CSV export).
// 移动版差异：CSV 导出经 native/exporter 桥（Android 分享面板）。
import { lookupWordDefinitionSync } from '../core/dictionary'
import { speakSingleWord } from '../core/tts'
import { S } from './state'
import { renderArticleMarkedWordsList, updateWordTokensInPlace } from './reader'
import { showToast, updateTopBadgesAndStats } from './ui-fns'
import { exportTextFile } from '../native/exporter'
import { useVocabStore } from '../stores/vocab'

export function renderVocabNotebook() {
  const s = S()
  const grid = document.getElementById('vocabNotebookGrid')
  if (!grid) return
  const allMarks = Object.values(s.wordMarks)
  // v1.2 搜索：匹配单词/原型/释义/批注/来源文章
  const query = ((document.getElementById('inputSearchVocab') as HTMLInputElement | null)?.value || '')
    .trim()
    .toLowerCase()
  const filtered = allMarks.filter((m) => {
    if (s.vocabFilter !== 'all' && m.status !== s.vocabFilter) return false
    if (query) {
      const haystack = `${m.word} ${m.lemma} ${m.cn} ${m.customNote || ''} ${m.articleTitle || ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })

  if (filtered.length === 0) {
    const emptyText = query
      ? '没有匹配搜索词的生词，换个关键词试试。'
      : '在「外刊精读」阅读文章时，点击任意英文单词并在查词台点击「陌生生词 / 四六级核心 / 已熟记」即可收录至此。'
    grid.innerHTML = `
          <div class="surface-card border border-dashed p-10 text-center space-y-2">
            <div class="text-3xl">🔖</div>
            <h3 class="text-base font-bold">${query ? '未找到匹配的生词' : '暂无该类别的已标注单词'}</h3>
            <p class="text-xs opacity-70">${emptyText}</p>
          </div>
        `
    return
  }

  grid.innerHTML = filtered
    .map((m) => {
      const dictInfo = lookupWordDefinitionSync(m.lemma || m.word)
      const derivativesText = m.derivatives || dictInfo.derivatives
      const synonymsText = m.synonyms || dictInfo.synonyms

      const badgeMap: Record<string, string> = {
        unknown: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 shrink-0">🔴 生词</span>`,
        core: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 shrink-0">🟡 核心</span>`,
        mastered: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">🟢 已掌握</span>`,
      }
      const maskClass = s.flashcardMasked ? 'blur-sm hover:blur-none transition cursor-pointer select-none' : ''

      return `
          <div class="surface-card p-4 shadow-sm flex flex-col justify-between space-y-2.5">
            <div class="space-y-2 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <h4 class="text-xl font-bold tracking-tight text-indigo-600 truncate">${m.word}</h4>
                  <span class="text-xs font-mono opacity-60 shrink-0">${m.phonetic || ''}</span>
                  <button type="button" data-word="${m.word}" class="btn-vocab-speak p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition shrink-0" title="播放发音">🔊</button>
                </div>
                ${badgeMap[m.status] || ''}
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs ${maskClass} space-y-1">
                <div class="font-bold text-indigo-950">${m.cn}</div>
                ${m.customNote ? `<div class="text-indigo-600 font-medium">✏️ ${m.customNote}</div>` : ''}
              </div>
              <details class="text-xs">
                <summary class="cursor-pointer select-none text-[11px] font-medium opacity-65 hover:opacity-100 flex items-center justify-between py-1">
                  <span>🧬 派生词 · 同义替换 · 原句语境</span><span>▾</span>
                </summary>
                <div class="space-y-1 pt-1.5 leading-relaxed" style="border-top: 1px dashed var(--border-col)">
                  <div><strong class="text-amber-800">🧬 派生：</strong>${derivativesText}</div>
                  <div><strong class="text-emerald-800">🔄 同义：</strong>${synonymsText}</div>
                  ${m.context ? `<div class="italic opacity-75">📌 “${m.context}”</div>` : ''}
                </div>
              </details>
            </div>
            <div class="pt-2 flex items-center justify-between text-[11px] opacity-60" style="border-top: 1px solid var(--border-col)">
              <span class="truncate max-w-[200px]">出自: ${m.articleTitle || '外刊精读'}</span>
              <button type="button" data-lemma="${m.lemma}" class="btn-vocab-del text-[11px] text-slate-400 hover:text-rose-600 transition shrink-0">删除</button>
            </div>
          </div>
        `
    })
    .join('')
}

export function exportVocabCsv() {
  const s = S()
  const rows: string[][] = [
    ['单词', '原型', '音标', '标注类型', '考纲释义', '派生词(不同词性)', '同义替换词', '个人批注', '来源文章'],
  ]
  Object.values(s.wordMarks).forEach((m) => {
    const info = lookupWordDefinitionSync(m.lemma || m.word)
    rows.push([
      m.word,
      m.lemma,
      m.phonetic,
      m.status,
      m.cn,
      m.derivatives || info.derivatives,
      m.synonyms || info.synonyms,
      m.customNote || '',
      m.articleTitle || '',
    ])
  })
  const csvContent =
    '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  // 移动版：经导出桥（Android=文档目录+分享面板 / 浏览器=blob 下载）
  void exportTextFile(
    'ReadFlow_Vocabulary_Export.csv',
    csvContent,
    'text/csv;charset=utf-8;',
    '📥 单词库(含派生词与同义词)已导出为 CSV',
  )
}

export function initVocabView() {
  const s = S()

  // Segmented-slot active state (new in v1.1: the legacy buttons had no
  // visible active indicator — clicking only filtered the data)
  const setVocabFilterStyle = (activeId: string) => {
    ;['btnFilterVocabAll', 'btnFilterVocabUnknown', 'btnFilterVocabCore', 'btnFilterVocabMastered'].forEach((id) => {
      const btn = document.getElementById(id)
      if (!btn) return
      btn.className =
        id === activeId
          ? 'vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 shadow-sm'
          : 'vocab-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600'
    })
  }
  setVocabFilterStyle('btnFilterVocabAll')

  document.querySelectorAll('.vocab-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      s.vocabFilter = btn.getAttribute('data-vfilter') || 'all'
      setVocabFilterStyle(btn.id)
      renderVocabNotebook()
    })
  })

  document.getElementById('btnToggleFlashcardMask')?.addEventListener('click', () => {
    s.flashcardMasked = !s.flashcardMasked
    const btn = document.getElementById('btnToggleFlashcardMask')
    if (btn) btn.textContent = s.flashcardMasked ? '👀 显示中文释义' : '🙈 遮盖中文释义自测'
    renderVocabNotebook()
  })

  document.getElementById('btnExportVocabCsv')?.addEventListener('click', exportVocabCsv)

  // v1.2 搜索
  document.getElementById('inputSearchVocab')?.addEventListener('input', renderVocabNotebook)

  // Delegated listener for Vocab Grid
  document.getElementById('vocabNotebookGrid')?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement
    const speakBtn = target.closest('.btn-vocab-speak') as HTMLElement | null
    if (speakBtn) {
      speakSingleWord(speakBtn.getAttribute('data-word') || '')
      return
    }
    const delBtn = target.closest('.btn-vocab-del') as HTMLElement | null
    if (delBtn) {
      const lem = delBtn.getAttribute('data-lemma') || ''
      const removed = s.wordMarks[lem]
      await useVocabStore().unmark(lem)
      updateTopBadgesAndStats()
      renderVocabNotebook()
      updateWordTokensInPlace(lem)
      renderArticleMarkedWordsList()
      showToast(`已删除「${removed?.word || lem}」`, {
        action: {
          label: '撤销',
          run: () => {
            if (!removed) return
            void useVocabStore().mark(removed).then(() => {
              updateTopBadgesAndStats()
              renderVocabNotebook()
              updateWordTokensInPlace(lem)
              renderArticleMarkedWordsList()
            })
          },
        },
      })
    }
  })
}
