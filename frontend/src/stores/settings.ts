import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPut } from '../api/client'
import type { SettingsMap } from '../types'

// Replaces the legacy un-persisted UI prefs; now stored in the settings table
// (approved behavior change: prefs survive restart).
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<SettingsMap>({})
  const loaded = ref(false)

  async function load() {
    settings.value = await apiGet<SettingsMap>('/api/settings')
    loaded.value = true
  }

  async function set(key: string, value: unknown) {
    // Optimistic update: the S() bridge reads prefs synchronously right after
    // setting them (e.g. toggle handlers), so the local map must update first.
    settings.value = { ...settings.value, [key]: value }
    settings.value = await apiPut<SettingsMap>('/api/settings', { [key]: value })
  }

  return { settings, loaded, load, set }
})
