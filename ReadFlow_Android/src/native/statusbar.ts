// 状态栏主题联动（v1.2）：深色主题用浅色图标，浅色/护眼用深色图标；
// 背景色尽量匹配主题底色（Android 15+ edge-to-edge 下 setBackgroundColor 可能被
// 系统忽略，静默降级——图标反色在所有版本都生效）。
import { isNative, nativePlugin } from './bridge'

interface StatusBarPlugin {
  setStyle: (o: { style: string }) => Promise<void>
  setBackgroundColor: (o: { color: string }) => Promise<void>
}

export async function applyStatusBarTheme(mode: string) {
  if (!isNative()) return
  const sb = nativePlugin<StatusBarPlugin>('StatusBar')
  if (!sb) return
  try {
    const resolved =
      mode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : mode
    // Dark style = 深色背景配浅色图标；Light style = 浅色背景配深色图标
    await sb.setStyle({ style: resolved === 'dark' ? 'Dark' : 'Light' })
    const bg = resolved === 'dark' ? '#090d16' : resolved === 'sepia' ? '#e6dbc6' : '#ffffff'
    try {
      await sb.setBackgroundColor({ color: bg })
    } catch {
      /* Android 15+ edge-to-edge 下忽略 */
    }
  } catch {
    /* ignore */
  }
}
