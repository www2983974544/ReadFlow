// Android 原生 TTS 兼容层：把 Web Speech API（speechSynthesis /
// SpeechSynthesisUtterance）整体替换为 @capacitor-community/text-to-speech 驱动的
// 等价实现。安卓 WebView 没有可用的 speechSynthesis，桌面 tts.ts 的离线兜底链
// （playViaNativeTTS / playExpressiveOfflineProsodyTTS）经此 shim 无改动地落到原生引擎。
// 语义保证：speak() 队列顺序播放、cancel() 清空、utter.onend 在结束后回调。
import { isNative, nativePlugin } from './bridge'

interface TtsPlugin {
  speak: (o: { text: string; lang: string; rate: number; pitch: number; volume: number }) => Promise<void>
  cancel: () => Promise<void>
}

interface ShimUtterance {
  text: string
  lang: string
  voice: unknown
  rate: number
  pitch: number
  volume: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: unknown) => void) | null
  onmark: unknown
  onboundary: unknown
  onpause: unknown
  onresume: unknown
}

export function installNativeTtsShim() {
  if (!isNative()) return
  const tts = nativePlugin<TtsPlugin>('TextToSpeech')
  if (!tts) return

  const queue: ShimUtterance[] = []
  let busy = false

  const pump = () => {
    if (busy) return
    busy = true
    const step = () => {
      const utter = queue.shift()
      if (!utter) {
        busy = false
        return
      }
      const settle = () => {
        try {
          if (typeof utter.onend === 'function') utter.onend()
        } catch {
          /* ignore */
        }
        step()
      }
      try {
        Promise.resolve(
          tts.speak({
            text: String(utter.text == null ? '' : utter.text),
            lang: utter.lang || 'en-US',
            rate: typeof utter.rate === 'number' && isFinite(utter.rate) && utter.rate > 0 ? utter.rate : 1,
            pitch: typeof utter.pitch === 'number' && isFinite(utter.pitch) ? utter.pitch : 1,
            volume: typeof utter.volume === 'number' ? utter.volume : 1,
          }),
        )
          .then(settle)
          .catch(() => {
            try {
              if (typeof utter.onerror === 'function') utter.onerror({ error: 'synthesis-failed' })
            } catch {
              /* ignore */
            }
            settle()
          })
      } catch {
        settle()
      }
    }
    step()
  }

  const synthShim = {
    getVoices: () => [],
    speaking: false,
    pending: false,
    paused: false,
    cancel: () => {
      queue.length = 0
      try {
        if (tts.cancel) void Promise.resolve(tts.cancel()).catch(() => {})
      } catch {
        /* ignore */
      }
    },
    speak: (utter: ShimUtterance) => {
      queue.push(utter)
      pump()
    },
    pause: () => {},
    resume: () => {},
  }

  const UtteranceShim = function (this: ShimUtterance, text: unknown) {
    this.text = String(text == null ? '' : text)
    this.lang = 'en-US'
    this.voice = null
    this.rate = 1
    this.pitch = 1
    this.volume = 1
    this.onstart = null
    this.onend = null
    this.onerror = null
    this.onmark = null
    this.onboundary = null
    this.onpause = null
    this.onresume = null
  } as unknown as { new (text?: unknown): ShimUtterance }

  try {
    Object.defineProperty(window, 'speechSynthesis', { value: synthShim, configurable: true })
  } catch {
    try {
      ;(window as unknown as Record<string, unknown>).speechSynthesis = synthShim
    } catch {
      /* ignore */
    }
  }
  try {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: UtteranceShim, configurable: true })
  } catch {
    try {
      ;(window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = UtteranceShim
    } catch {
      /* ignore */
    }
  }
}
