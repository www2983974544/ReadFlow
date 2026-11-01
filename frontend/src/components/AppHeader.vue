<script setup lang="ts">
import { APP_VERSION } from '../version'
import { S } from '../legacy/state'
import { applyThemeMode, showToast } from '../legacy/ui-fns'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()

const tabs = [
  { key: 'home', id: 'navTabHome', icon: '🚀', label: '首页' },
  { key: 'reader', id: 'navTabReader', icon: '📖', label: '外刊精读' },
  { key: 'crawler', id: 'navTabCrawler', icon: '🌐', label: '文章获取' },
  { key: 'library', id: 'navTabLibrary', icon: '📚', label: '文章库' },
  { key: 'vocab', id: 'navTabVocab', icon: '🔖', label: '单词库' },
  { key: 'stats', id: 'navTabStats', icon: '📊', label: '时间统计' },
] as const

function goHome() {
  ui.switchView('home')
  showToast('🚀 已回到 ReadFlow 科技倒计时首页')
}

function setTheme(mode: string) {
  applyThemeMode(mode)
  S().themeMode = mode
}

function onQuickCrawl() {
  ui.switchView('crawler')
  window.dispatchEvent(new CustomEvent('readflow:quick-crawl'))
}
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <!-- Clickable Brand Logo & Text Area -> Automatically returns to Home Launchpad -->
      <div
        id="brandHomeLink"
        title="点击返回 ReadFlow 科技倒计时首页"
        class="flex items-center gap-2.5 min-w-0 shrink cursor-pointer hover:opacity-85 transition select-none"
        @click="goHome"
      >
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0"
          style="background: #4f46e5; color: #fff; width: 36px; height: 36px; border-radius: 10px"
        >
          <svg class="w-5 h-5" style="width: 20px; height: 20px" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <div class="truncate">
          <div class="flex items-center gap-1.5">
            <h1 class="font-bold text-base sm:text-lg tracking-tight truncate" style="margin: 0">ReadFlow</h1>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{{ APP_VERSION }}</span>
            <span
              id="networkModeBadge"
              class="hidden 2xl:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
              >🎙️ 情感播音流+词族同义词库已就绪</span
            >
          </div>
          <p class="brand-subtitle text-[11px] opacity-70 truncate" style="margin: 0">点击图标返回首页 · 四六级外刊智能精读与词汇系统</p>
        </div>
      </div>

      <!-- Navigation Tabs: 首页 | 外刊精读 | 文章获取 | 文章库 | 单词库 | 时间统计 -->
      <nav class="top-nav-bar" aria-label="主导航">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :id="tab.id"
          type="button"
          class="nav-tab-btn"
          :class="{ 'nav-active': ui.activeView === tab.key }"
          @click="ui.switchView(tab.key)"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.key === 'crawler'"
            id="badgeDiscoveryCount"
            class="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-500/20 text-amber-700 font-bold"
            >6</span
          >
          <span
            v-if="tab.key === 'library'"
            id="badgeLibraryCount"
            class="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-500/20 text-emerald-700 font-bold"
            >3</span
          >
          <span
            v-if="tab.key === 'vocab'"
            id="badgeVocabCount"
            class="px-1.5 py-0.2 rounded-full text-[11px] bg-rose-500/20 text-rose-700 font-bold"
            >0</span
          >
        </button>
      </nav>

      <!-- Quick Utility Controls -->
      <div class="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
        <button
          id="btnQuickCrawlTop"
          type="button"
          class="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition whitespace-nowrap"
          style="background: #4f46e5; color: #fff"
          @click="onQuickCrawl"
        >
          <span>实时爬取新刊</span>
        </button>

        <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden text-xs whitespace-nowrap">
          <button id="btnThemeLight" type="button" title="明亮模式" class="px-2 py-1 bg-indigo-600 text-white font-semibold transition" @click="setTheme('light')">☀️ 明亮</button>
          <button id="btnThemeSepia" type="button" title="羊皮纸护眼" class="px-2 py-1 hover:bg-amber-100 text-slate-600 font-medium transition" @click="setTheme('sepia')">📜 护眼</button>
          <button id="btnThemeDark" type="button" title="夜间专注" class="px-2 py-1 hover:bg-slate-800 hover:text-white text-slate-600 font-medium transition" @click="setTheme('dark')">🌙 夜间</button>
        </div>

        <button
          id="btnWindowsGuide"
          type="button"
          title="ReadFlow 版本更新记录 (v0.1-v1.1) 与上手指南"
          class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          @click="ui.guideOpen = true"
        >
          ❓
        </button>
      </div>
    </div>
  </header>
</template>
