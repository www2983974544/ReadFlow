// Capacitor 原生环境检测与桥接入口。
// 浏览器里（npm run dev/preview）所有 isNative 分支自动跳过，走纯 Web 行为。

export function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}

export function nativePlugin<T = unknown>(name: string): T | null {
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, T> } }).Capacitor
  return (cap && cap.Plugins && cap.Plugins[name]) || null
}
