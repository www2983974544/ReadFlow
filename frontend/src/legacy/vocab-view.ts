// Vocab notebook view (ported from renderVocabNotebook + bindings + CSV export).
import { lookupWordDefinitionSync } from '../core/dictionary'
import { speakSingleWord } from '../core/tts'
import { S } from './state'
import { renderArticleMarkedWordsList, updateWordTokensInPlace } from './reader'
import { showToast, updateTopBadgesAndStats } from './ui-fns'
import { useVocabStore } from '../stores/vocab'

export function renderVocabNotebook() {
  const s = S()
  const grid = document.getElementById('vocabNotebookGrid')
  if (!grid) return
  const allMarks = Object.values(s.wordMarks)
  const filtered = allMarks.filter((m) => {
    if (s.vocabFilter === 'all') return true
    return m.status === s.vocabFilter
  })

  if (filtered.length === 0) {
    grid.innerHTML = `
          <div class="col-span-full surface-card border border-dashed p-10 text-center space-y-2">
            <div class="text-3xl">🔖</div>
            <h3 class="text-base font-bold">暂无该类别的已标注单词</h3>
            <p class="text-xs opacity-70">在「外刊精读」阅读文章时，点击任意英文单词并在右侧点击「陌生生词 / 四六级核心 / 已熟记」即可收录至此。</p>
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
        unknown: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">🔴 陌生生词</span>`,
        core: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">🟡 四六级核心</span>`,
        mastered: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">🟢 已掌握</span>`,
      }
      const maskClass = s.flashcardMasked ? 'blur-sm hover:blur-none transition cursor-pointer select-none' : ''

      return `
          <div class="surface-card p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-bold text-indigo-600">${m.word}</h4>
                  <span class="text-xs font-mono opacity-70">${m.phonetic || ''}</span>
                </div>
                ${badgeMap[m.status] || ''}
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs ${maskClass} space-y-1.5">
                <div class="font-bold text-indigo-950">${m.cn}</div>
                ${m.customNote ? `<div class="text-indigo-600 font-medium">✏️ 个人批注: ${m.customNote}</div>` : ''}
                <div class="pt-1.5 border-t border-slate-200/70 text-[11px] leading-relaxed">
                  <div><strong class="text-amber-800">🧬 派生/不同词性：</strong>${derivativesText}</div>
                  <div class="mt-0.5"><strong class="text-emerald-800">🔄 同义替换词：</strong>${synonymsText}</div>
                </div>
              </div>
              ${m.context ? `<p class="text-[11px] italic opacity-75">“${m.context}”</p>` : ''}
            </div>
            <div class="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] opacity-75">
              <span class="truncate max-w-[180px]">出自: ${m.articleTitle || '外刊精读'}</span>
              <div class="flex items-center gap-2">
                <button type="button" data-word="${m.word}" class="btn-vocab-speak text-indigo-600 font-semibold hover:underline">🔊 发音</button>
                <button type="button" data-lemma="${m.lemma}" class="btn-vocab-del text-rose-600 hover:underline">删除</button>
              </div>
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
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ReadFlow_Vocabulary_Export.csv'
  a.click()
  URL.revokeObjectURL(url)
  showToast('📥 单词库(含派生词与同义词)已导出为 CSV')
}

export function initVocabView() {
  const s = S()

  document.querySelectorAll('.vocab-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      s.vocabFilter = btn.getAttribute('data-vfilter') || 'all'
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
      await useVocabStore().unmark(lem)
      updateTopBadgesAndStats()
      renderVocabNotebook()
      updateWordTokensInPlace(lem)
      renderArticleMarkedWordsList()
      showToast('已从单词库移除')
    }
  })
}
