import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SettingsMap } from '../types'

// 桌面版把偏好存 SQLite settings 表；移动版存 localStorage。
// 保持乐观更新语义：S() 桥在 set 之后会同步读取（桌面 settings.ts 同款注释）。
const KEY = 'readflow_settings_v8'

function readStorage(): SettingsMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<SettingsMap>({})
  const loaded = ref(false)

  async function load() {
    settings.value = readStorage()
    loaded.value = true
  }

  async function set(key: string, value: unknown) {
    // 乐观更新先行（桌面版注释：开关读-改-写时序依赖此顺序）
    settings.value = { ...settings.value, [key]: value }
    try {
      localStorage.setItem(KEY, JSON.stringify(settings.value))
    } catch {
      /* ignore */
    }
  }

  return { settings, loaded, load, set }
})
