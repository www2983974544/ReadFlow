<script setup lang="ts">
import { APP_VERSION } from '../version'
import { useUiStore } from '../stores/ui'
import { showToast, setThemeMode, applyThemeMode } from '../legacy/ui-fns'
import { S } from '../legacy/state'

const ui = useUiStore()

function onBrandClick() {
  ui.switchView('home')
  showToast('🚀 已回到 ReadFlow 倒计时首页')
}

function setTheme(mode: string) {
  setThemeMode(mode)
}

// 初始主题由 App.vue 挂载时应用，这里读取当前模式用于高亮按钮
const currentTheme = () => S().themeMode
void applyThemeMode
</script>

<template>
  <header class="app-header">
    <div class="brand" @click="onBrandClick">
      <div class="brand-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="brand-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <div class="brand-text">
        <div class="brand-line">
          <span class="brand-name">ReadFlow</span>
          <span class="brand-badge">{{ APP_VERSION }}</span>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <div class="theme-group">
        <button
          type="button"
          class="theme-btn"
          title="明亮模式"
          :class="{ 'theme-active': currentTheme() === 'light' }"
          @click="setTheme('light')"
        >☀️</button>
        <button
          type="button"
          class="theme-btn"
          title="护眼模式"
          :class="{ 'theme-active': currentTheme() === 'sepia' }"
          @click="setTheme('sepia')"
        >📜</button>
        <button
          type="button"
          class="theme-btn"
          title="夜间模式"
          :class="{ 'theme-active': currentTheme() === 'dark' }"
          @click="setTheme('dark')"
        >🌙</button>
        <button
          type="button"
          class="theme-btn"
          title="跟随系统深浅色"
          :class="{ 'theme-active': currentTheme() === 'system' }"
          @click="setTheme('system')"
        >🌗</button>
      </div>
      <button type="button" class="guide-btn" title="上手指南与版本记录" @click="ui.guideOpen = true">❓</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: calc(var(--header-h) + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 12px 0 12px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-col);
  z-index: 30;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}
.brand-logo {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-svg {
  width: 18px;
  height: 18px;
}
.brand-text {
  min-width: 0;
}
.brand-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.brand-badge {
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background-color: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border-col);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.theme-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-col);
  border-radius: 10px;
  overflow: hidden;
}
.theme-btn {
  padding: 6px 10px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.theme-btn.theme-active {
  background-color: var(--accent);
  color: #ffffff;
}
.guide-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--border-col);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}
</style>
