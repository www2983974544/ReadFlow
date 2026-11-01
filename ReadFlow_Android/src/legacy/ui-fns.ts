// 移动版 ui-fns：从桌面 frontend/src/legacy/ui-fns.ts@v2.1 精简适配。
// showToast / applyThemeMode 语义保持一致；侧栏折叠逻辑由移动端抽屉/弹层组件替代。
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { S } from './state'

// ---- Toast（移动端：底部居中，位于标签栏上方） ----
export const toastVisible = ref(false)
export const toastText = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(msg: string) {
  toastText.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2400)
}

// ---- 三主题（沿桌面 applyThemeMode：body class + 持久化） ----
export function applyThemeMode(mode: string) {
  const body = document.body
  body.classList.remove('theme-sepia', 'theme-dark')
  if (mode === 'sepia') body.classList.add('theme-sepia')
  if (mode === 'dark') body.classList.add('theme-dark')
  // 持久化（桌面为已批准的行为差异：主题重启保留）
  const settingsStore = useSettingsStore()
  void settingsStore.set('themeMode', mode)
  // 同步 S() 桥缓存读取（settings store 已乐观更新，S().themeMode 即为最新值）
  void S()
}

export function setThemeMode(mode: string) {
  applyThemeMode(mode)
}
