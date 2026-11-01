// Dual-engine TTS (ported from cet_reading_master.html L4397-4686):
// online Youdao human audio, offline Web Speech API with expressive prosody.
import { S } from '../legacy/state'
import { showToast } from '../legacy/ui-fns'

const wordAudioCache: Record<string, HTMLAudioElement> = {}
let currentPlayingAudio: HTMLAudioElement | null = null
let broadcastSessionId = 0
let isSpeakingFull = false

// Circuit breaker: on a dead network each Youdao preload hangs for tens of
// seconds and the pending requests pile up. After 5 consecutive failures we
// stop preloading entirely for the session (playback still works via its own
// fallback chain, and any successful playback resets the breaker).
let preloadFailures = 0
const PRELOAD_FAILURE_LIMIT = 5

export function getBestNativeEnglishVoice(accent = 'US'): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (voices.length === 0) return null

  const englishVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase()
    const name = (v.name || '').toLowerCase()
    if (
      lang.includes('zh') ||
      name.includes('chinese') ||
      name.includes('huihui') ||
      name.includes('kangkang') ||
      name.includes('yaoyao') ||
      name.includes('xiaoxiao') ||
      name.includes('yunxi')
    ) {
      return false
    }
    return /^en([-_][a-z]+)?$/i.test(lang) || name.includes('english')
  })

  if (englishVoices.length === 0) return null

  const wantUK = accent === 'UK'
  const scored = englishVoices.map((v) => {
    let score = 0
    const name = v.name || ''
    const lang = v.lang || ''

    if (wantUK && (/en[-_]GB/i.test(lang) || /United Kingdom|British|UK|Sonia|Ryan|Libby|Hazel|George|Daniel/i.test(name))) {
      score += 50
    } else if (
      !wantUK &&
      (/en[-_]US/i.test(lang) ||
        /United States|US|Aria|Jenny|Guy|Steffan|Christopher|Eric|Michelle|Roger|Zira|David|Mark|Samantha|Alex/i.test(name))
    ) {
      score += 50
    }

    if (/Natural|Neural|Online/i.test(name)) score += 60
    if (/Aria|Jenny|Guy|Sonia|Ryan|Google US English|Google UK English|Samantha|Alex|Daniel/i.test(name)) score += 35
    if (/Zira|David|Mark|Hazel|George/i.test(name)) score += 10

    return { voice: v, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].voice
}

export function initVoices() {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.getVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      const best = getBestNativeEnglishVoice(S().voiceAccent)
      const lbl = document.getElementById('voiceEngineStatusLabel')
      if (lbl && best) {
        lbl.textContent = '🎙️ ' + (best.name.includes('Natural') ? '母语神经语音' : '真人词典+情感播音')
      }
    }
  }
}

export function preloadWordHumanAudio(word: string) {
  if (!navigator.onLine || !word) return
  if (preloadFailures >= PRELOAD_FAILURE_LIMIT) return
  const clean = word.toLowerCase().replace(/[^a-z-]/g, '')
  if (!clean) return
  // Only preload the CURRENT accent — the other one is created on demand at
  // play time, halving background requests while reading.
  const acc = S().voiceAccent || 'US'
  const key = clean + '_' + acc
  if (!wordAudioCache[key]) {
    const typeNum = acc === 'UK' ? 1 : 2
    const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=${typeNum}`)
    audio.preload = 'auto'
    audio.addEventListener(
      'error',
      () => {
        preloadFailures++
        delete wordAudioCache[key]
      },
      { once: true },
    )
    wordAudioCache[key] = audio
  }
}

export function stopSpeechPlayback() {
  broadcastSessionId++
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause()
      currentPlayingAudio.currentTime = 0
    } catch {
      // ignore
    }
    currentPlayingAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeakingFull = false
  const btnFull = document.getElementById('btnReadFullArticle')
  if (btnFull) btnFull.textContent = '🔊 全文朗读'
  document.querySelectorAll('.speaking-para-highlight').forEach((el) => el.classList.remove('speaking-para-highlight'))
}

export function speakSingleWord(word: string, forceAccent?: string) {
  if (!word) return
  stopSpeechPlayback()
  const clean = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
  if (!clean) return

  const accent = forceAccent || S().voiceAccent || 'US'
  const typeNum = accent === 'UK' ? 1 : 2
  const cacheKey = clean.toLowerCase() + '_' + accent

  const playViaNativeTTS = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(clean)
    const bestVoice = getBestNativeEnglishVoice(accent)
    if (bestVoice) utter.voice = bestVoice
    utter.lang = accent === 'UK' ? 'en-GB' : 'en-US'
    utter.rate = 0.96
    utter.pitch = 1.0
    window.speechSynthesis.speak(utter)
  }

  if (navigator.onLine) {
    let audio = wordAudioCache[cacheKey]
    if (!audio) {
      audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=${typeNum}`)
      wordAudioCache[cacheKey] = audio
    }
    currentPlayingAudio = audio
    audio.currentTime = 0

    // Fast-fail watchdog: if the audio hasn't actually started within 3s
    // (dead/slow network), cancel it and speak via speechSynthesis instead of
    // hanging silently for tens of seconds.
    let fellBack = false
    const fallbackOnce = () => {
      if (fellBack) return
      fellBack = true
      clearTimeout(watchdog)
      try {
        audio.pause()
      } catch {
        // ignore
      }
      playViaNativeTTS()
    }
    const watchdog = setTimeout(fallbackOnce, 3000)
    audio.addEventListener('playing', () => {
      clearTimeout(watchdog)
      preloadFailures = 0 // network is alive again — re-enable preloads
    }, { once: true })
    audio.addEventListener('error', fallbackOnce, { once: true })

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(fallbackOnce)
    }
  } else {
    playViaNativeTTS()
  }
}

export function splitIntoExpressiveSentences(rawText: string): string[] {
  const cleaned = rawText
    .replace(/\[P\d+\]/g, '')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
  const rawSentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z“])/)
  const chunks: string[] = []
  rawSentences.forEach((s) => {
    const trimmed = s.trim()
    if (!trimmed) return
    if (trimmed.length > 165 && trimmed.includes(', ')) {
      const subParts = trimmed.split(
        /(?<=,)\s+(?=(?:while|whereas|because|although|yet|so that|consequently|however|posing|leaving)\b)/i,
      )
      if (subParts.length > 1) {
        subParts.forEach((sp) => chunks.push(sp.trim()))
        return
      }
    }
    chunks.push(trimmed)
  })
  return chunks
}

export function playExpressiveOfflineProsodyTTS(
  sentences: string[],
  sessionId: number,
  accent: string,
  baseRate: number,
) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const bestVoice = getBestNativeEnglishVoice(accent)

  const total = sentences.length
  sentences.forEach((sent, idx) => {
    const utter = new SpeechSynthesisUtterance(sent)
    if (bestVoice) utter.voice = bestVoice
    utter.lang = accent === 'UK' ? 'en-GB' : 'en-US'

    const isContrast = /^(However|Yet|Paradoxically|Instead|Consequently|In response|Beyond|While)\b/i.test(sent)
    if (isContrast) {
      utter.pitch = 1.06
      utter.rate = Math.max(0.75, baseRate * 0.96)
    } else if (idx === 0) {
      utter.pitch = 1.03
      utter.rate = baseRate
    } else if (idx === total - 1 && total > 1) {
      utter.pitch = 0.96
      utter.rate = Math.max(0.75, baseRate * 0.95)
    } else {
      utter.pitch = idx % 2 === 1 ? 1.02 : 0.99
      utter.rate = baseRate
    }
    utter.volume = 1.0

    if (idx === total - 1) {
      utter.onend = () => {
        if (broadcastSessionId !== sessionId) return
        isSpeakingFull = false
        const btnFull = document.getElementById('btnReadFullArticle')
        if (btnFull) btnFull.textContent = '🔊 全文朗读'
        document.querySelectorAll('.speaking-para-highlight').forEach((el) => el.classList.remove('speaking-para-highlight'))
      }
    }
    window.speechSynthesis.speak(utter)
  })
}

// Per-sentence expressive parameters for the edge-tts neural narration
// (mirrors the legacy offline prosody rules in playExpressiveOfflineProsodyTTS).
function expressiveParams(sentences: string[], idx: number, baseRate: number): { rate: string; pitch: string } {
  const total = sentences.length
  const sent = sentences[idx] || ''
  const isContrast = /^(However|Yet|Paradoxically|Instead|Consequently|In response|Beyond|While)\b/i.test(sent)
  let effRate = baseRate
  let pitchHz = 0
  if (isContrast) {
    effRate = Math.max(0.75, baseRate * 0.96)
    pitchHz = 8
  } else if (idx === 0) {
    pitchHz = 4
  } else if (idx === total - 1 && total > 1) {
    effRate = Math.max(0.75, baseRate * 0.95)
    pitchHz = -6
  } else {
    pitchHz = idx % 2 === 1 ? 2 : -2
  }
  const ratePct = Math.round((effRate - 1) * 100)
  return {
    rate: `${ratePct >= 0 ? '+' : ''}${ratePct}%`,
    pitch: `${pitchHz >= 0 ? '+' : ''}${pitchHz}Hz`,
  }
}

function edgeVoiceFor(accent: string): string {
  return accent === 'UK' ? 'en-GB-SoniaNeural' : 'en-US-AriaNeural'
}

function edgeTtsUrl(text: string, voice: string, rate: string, pitch: string): string {
  return `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}&pitch=${encodeURIComponent(pitch)}`
}

export function speakPassageBroadcast(text: string, isFullArticleBtn = false, highlightParaIdx: number | null = null) {
  if (isFullArticleBtn && isSpeakingFull) {
    stopSpeechPlayback()
    showToast('⏹ 已停止全文朗读')
    return
  }

  stopSpeechPlayback()
  const mySession = broadcastSessionId

  if (highlightParaIdx !== null) {
    const row = document.getElementById('paraRow-' + highlightParaIdx)
    if (row) row.classList.add('speaking-para-highlight')
  }

  const sentences = splitIntoExpressiveSentences(text)
  if (sentences.length === 0) return

  if (isFullArticleBtn) {
    isSpeakingFull = true
    const btnFull = document.getElementById('btnReadFullArticle')
    if (btnFull) btnFull.textContent = '⏹ 停止朗读'
  }

  const accent = S().voiceAccent || 'US'
  const rate = parseFloat(String(S().voiceSpeed)) || 1.0
  const typeNum = accent === 'UK' ? 1 : 2

  if (navigator.onLine) {
    const finishFull = () => {
      isSpeakingFull = false
      const btnFull = document.getElementById('btnReadFullArticle')
      if (btnFull) btnFull.textContent = '🔊 全文朗读'
      document.querySelectorAll('.speaking-para-highlight').forEach((el) => el.classList.remove('speaking-para-highlight'))
    }

    // Fallback chain level 2: Youdao dictionary audio queue (uniform tone).
    // Each chunk carries a 3s start watchdog so a dead network fails over to
    // the offline prosody engine quickly instead of hanging silently.
    const playYoudaoFrom = (fromIdx: number) => {
      if (broadcastSessionId !== mySession) return
      if (fromIdx >= sentences.length) {
        finishFull()
        return
      }
      const buildAudioForChunk = (chunkText: string) => {
        const a = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(chunkText)}&le=eng&type=${typeNum}`)
        a.preload = 'auto'
        a.playbackRate = rate
        if ('preservesPitch' in a) (a as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true
        return a
      }

      let currentIdx = fromIdx
      let nextPreloadedAudio: HTMLAudioElement | null =
        currentIdx + 1 < sentences.length ? buildAudioForChunk(sentences[currentIdx + 1]) : null

      const playNextChunk = () => {
        if (broadcastSessionId !== mySession) return
        if (currentIdx >= sentences.length) {
          finishFull()
          return
        }

        const audio =
          currentIdx === fromIdx
            ? buildAudioForChunk(sentences[currentIdx])
            : nextPreloadedAudio || buildAudioForChunk(sentences[currentIdx])

        if (currentIdx + 1 < sentences.length) {
          nextPreloadedAudio = buildAudioForChunk(sentences[currentIdx + 1])
        } else {
          nextPreloadedAudio = null
        }

        currentPlayingAudio = audio
        audio.playbackRate = rate

        let advanced = false
        const advance = () => {
          if (advanced) return
          advanced = true
          currentIdx++
          setTimeout(() => {
            if (broadcastSessionId === mySession) playNextChunk()
          }, 180)
        }
        const failOffline = () => {
          if (advanced) return
          advanced = true
          playExpressiveOfflineProsodyTTS(sentences.slice(currentIdx), mySession, accent, rate)
        }

        const watchdog = setTimeout(failOffline, 3000)
        audio.addEventListener('playing', () => clearTimeout(watchdog), { once: true })
        audio.onended = () => {
          clearTimeout(watchdog)
          advance()
        }
        audio.onerror = failOffline

        const playProm = audio.play()
        if (playProm !== undefined) {
          playProm.catch(failOffline)
        }
      }

      playNextChunk()
    }

    // Preferred chain: edge-tts neural narration with per-sentence emotion.
    // The next two sentences are prefetched in parallel while the current one
    // plays, so playback never waits on generation once the network is warm.
    const prefetchController = new AbortController()
    const prefetched = new Map<number, { url: string }>()

    const ensurePrefetch = (idx: number): Promise<string | null> => {
      const existing = prefetched.get(idx)
      if (existing) return Promise.resolve(existing.url)
      if (idx >= sentences.length) return Promise.resolve(null)
      const params = expressiveParams(sentences, idx, rate)
      return fetch(edgeTtsUrl(sentences[idx], edgeVoiceFor(accent), params.rate, params.pitch), {
        signal: prefetchController.signal,
      })
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('tts ' + res.status))))
        .then((blob) => {
          if (broadcastSessionId !== mySession) return null
          const objectUrl = URL.createObjectURL(blob)
          prefetched.set(idx, { url: objectUrl })
          return objectUrl
        })
        .catch(() => null)
    }

    const playEdgeFrom = async (fromIdx: number) => {
      if (broadcastSessionId !== mySession) return
      if (fromIdx >= sentences.length) {
        finishFull()
        return
      }
      void ensurePrefetch(fromIdx + 1)
      void ensurePrefetch(fromIdx + 2)
      const url = await ensurePrefetch(fromIdx)
      if (broadcastSessionId !== mySession) return
      if (!url) {
        playYoudaoFrom(fromIdx)
        return
      }

      const audio = new Audio(url)
      currentPlayingAudio = audio

      audio.onended = () => {
        const entry = prefetched.get(fromIdx)
        if (entry) {
          URL.revokeObjectURL(entry.url)
          prefetched.delete(fromIdx)
        }
        if (broadcastSessionId !== mySession) return
        setTimeout(() => {
          if (broadcastSessionId === mySession) void playEdgeFrom(fromIdx + 1)
        }, 180)
      }

      const failover = () => {
        if (broadcastSessionId !== mySession) return
        playYoudaoFrom(fromIdx)
      }
      audio.onerror = failover
      const playProm = audio.play()
      if (playProm !== undefined) {
        playProm.catch(failover)
      }
    }

    playEdgeFrom(0)
  } else {
    playExpressiveOfflineProsodyTTS(sentences, mySession, accent, rate)
  }
}
