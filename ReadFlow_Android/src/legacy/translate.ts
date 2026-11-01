// Free word/sentence offline analyzer (ported from translateSentenceOfflineOrOnline).
import { lookupWordDefinitionSync } from '../core/dictionary'
import { S } from './state'

export async function translateSentenceOfflineOrOnline(inputText: string) {
  const out = document.getElementById('outputFreeTranslate')
  if (!out) return
  const text = (inputText || '').trim()
  if (!text) {
    out.classList.remove('hidden')
    out.innerHTML = `<div class="opacity-75">请在上方输入框中输入或粘贴需要查询的英文单词、短语或长句。</div>`
    return
  }
  out.classList.remove('hidden')

  const rawWords = text.match(/[a-zA-Z-]+/g) || []

  if (rawWords.length <= 1) {
    const targetW = rawWords[0] || text
    const info = lookupWordDefinitionSync(targetW)
    out.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
            <div>
              <strong class="text-sm text-indigo-600">${info.word}</strong>
              <span class="font-mono opacity-75 ml-1.5">${info.phonetic}</span>
            </div>
            <span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">${info.level}</span>
          </div>
          <div class="font-bold text-indigo-950 text-xs mt-1">📖 词典释义：${info.cn}</div>
          <div class="text-[11px] opacity-85 mt-1"><strong>💡 词根助记：</strong>${info.root}</div>
          <div class="text-[11px] opacity-85 mt-0.5"><strong>🧬 派生词：</strong>${info.derivatives}</div>
          <div class="text-[11px] opacity-85 mt-0.5"><strong>🔄 同义词：</strong>${info.synonyms}</div>
        `
    return
  }

  const lowerInput = text.toLowerCase()
  let matchedSentenceCn = ''
  for (const art of S().articles) {
    for (const p of art.paragraphs) {
      const enSentences = p.en.match(/[^.!?]+[.!?]*/g) || [p.en]
      const cnSentences = p.cn.match(/[^。！？]+[。！？]*/g) || [p.cn]
      for (let i = 0; i < enSentences.length; i++) {
        const sEn = enSentences[i].trim().toLowerCase()
        if (sEn && (sEn.includes(lowerInput) || lowerInput.includes(sEn.slice(0, 28)))) {
          matchedSentenceCn = (cnSentences[i] || p.cn).trim()
          break
        }
      }
      if (matchedSentenceCn) break
    }
    if (matchedSentenceCn) break
  }

  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'and', 'or',
    'is', 'are', 'was', 'were', 'be', 'been', 'that', 'this', 'these', 'those', 'it', 'its', 'as',
  ])
  const seenLemmas = new Set<string>()
  const wordCardsHtml: string[] = []
  const seqMeanings: string[] = []

  rawWords.forEach((w) => {
    const cleanW = w.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
    if (!cleanW) return
    const info = lookupWordDefinitionSync(cleanW)
    if (info && info.shortCn) {
      seqMeanings.push(info.shortCn)
    }
    if (!STOP_WORDS.has(cleanW.toLowerCase()) && !seenLemmas.has(info.lemma)) {
      seenLemmas.add(info.lemma)
      wordCardsHtml.push(`
            <div class="p-1.5 rounded-lg bg-white border border-slate-200/80 flex flex-col gap-0.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-indigo-600">${info.word} ${info.lemma !== info.word.toLowerCase() ? `<span class="text-[10px] font-normal opacity-65">(原型: ${info.lemma})</span>` : ''}</span>
                <span class="font-mono text-[10px] opacity-65">${info.phonetic}</span>
              </div>
              <div class="text-[11px] font-semibold text-slate-800">${info.cn}</div>
            </div>
          `)
    }
  })

  if (wordCardsHtml.length === 0) {
    rawWords.forEach((w) => {
      const info = lookupWordDefinitionSync(w)
      wordCardsHtml.push(`
            <div class="p-1.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
              <span class="font-bold text-indigo-600">${info.word}</span>
              <span class="text-[11px] font-semibold">${info.cn}</span>
            </div>
          `)
    })
  }

  const synthesizedOfflineCn = matchedSentenceCn || '（离线逐词连译）' + seqMeanings.join(' · ')

  out.innerHTML = `
        <div class="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/80">
          <div class="font-bold text-indigo-700 text-[11px] mb-0.5">🀄 整句中文译文：</div>
          <div id="freeTransSentenceLine" class="font-semibold text-xs">${synthesizedOfflineCn}</div>
        </div>
        <div>
          <div class="font-bold text-[11px] opacity-75 mb-1">📖 句中词汇逐词词义详解（共 ${wordCardsHtml.length} 个核心词）：</div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">${wordCardsHtml.join('')}</div>
        </div>
      `

  if (!matchedSentenceCn && navigator.onLine) {
    try {
      const ctrl = new AbortController()
      const tId = setTimeout(() => ctrl.abort(), 2000)
      const res = await fetch(
        'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.slice(0, 350)) + '&langpair=en|zh-CN',
        { signal: ctrl.signal },
      )
      clearTimeout(tId)
      if (res.ok) {
        const data = (await res.json()) as { responseData?: { translatedText?: string } }
        const lineEl = document.getElementById('freeTransSentenceLine')
        if (lineEl && data.responseData && data.responseData.translatedText) {
          lineEl.textContent = data.responseData.translatedText
        }
      }
    } catch {
      // offline fallback: keep the synthesized translation
    }
  }
}
