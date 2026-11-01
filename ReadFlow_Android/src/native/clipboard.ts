// 剪贴板读取（v1.2）：Android 用原生 Clipboard 插件（前台读取无浏览器限制），
// 浏览器回退 navigator.clipboard。失败返回空串。
import { isNative, nativePlugin } from './bridge'

interface ClipboardPlugin {
  read: () => Promise<{ value?: string }>
}

export async function readClipboardText(): Promise<string> {
  if (isNative()) {
    const clip = nativePlugin<ClipboardPlugin>('Clipboard')
    if (clip) {
      try {
        const res = await clip.read()
        return res?.value || ''
      } catch {
        return ''
      }
    }
  }
  try {
    return await navigator.clipboard.readText()
  } catch {
    return ''
  }
}
