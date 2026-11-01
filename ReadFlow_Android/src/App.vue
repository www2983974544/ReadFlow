<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import BottomTabBar from './components/BottomTabBar.vue'
import HomeView from './views/HomeView.vue'
import ReaderView from './views/ReaderView.vue'
import CrawlerView from './views/CrawlerView.vue'
import LibraryView from './views/LibraryView.vue'
import VocabView from './views/VocabView.vue'
import StatsView from './views/StatsView.vue'
import { useArticlesStore } from './stores/articles'
import { useVocabStore } from './stores/vocab'
import { useStatsStore } from './stores/stats'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'
import { toastVisible, toastText, applyThemeMode } from './legacy/ui-fns'
import { S, hydrateExamSettings } from './legacy/state'
import { APP_VERSION } from './version'
import { isNative, nativePlugin } from './native/bridge'

const ui = useUiStore()
const bootError = ref('')

onMounted(async () => {
  try {
    const articles = useArticlesStore()
    const vocab = useVocabStore()
    const stats = useStatsStore()
    const settings = useSettingsStore()
    await Promise.all([articles.load(), vocab.load(), stats.load(), settings.load()])
    await hydrateExamSettings()
    applyThemeMode(S().themeMode)
    setupBackButton()
  } catch (e) {
    bootError.value = String(e)
  }
})

// 安卓返回键：弹窗 → 首页；浏览器环境无此插件自动跳过
function setupBackButton() {
  if (!isNative()) return
  const appPlugin = nativePlugin<{ addListener: (ev: string, cb: () => void) => void }>('App')
  if (!appPlugin) return
  appPlugin.addListener('backButton', () => {
    if (ui.guideOpen) {
      ui.guideOpen = false
      return
    }
    if (ui.customImportOpen) {
      ui.customImportOpen = false
      return
    }
    if (ui.activeView !== 'home') {
      ui.switchView('home')
    }
    // 在首页再按返回：交由系统默认（退出应用）
  })
}
</script>

<template>
  <AppHeader />

  <main class="app-main">
    <div v-if="bootError" class="boot-error">启动失败：{{ bootError }}</div>

    <HomeView v-show="ui.activeView === 'home'" />
    <ReaderView v-show="ui.activeView === 'reader'" />
    <CrawlerView v-show="ui.activeView === 'crawler'" />
    <LibraryView v-show="ui.activeView === 'library'" />
    <VocabView v-show="ui.activeView === 'vocab'" />
    <StatsView v-show="ui.activeView === 'stats'" />
  </main>

  <BottomTabBar />

  <!-- Toast（移动端：底部居中，位于标签栏上方） -->
  <div class="toast" :class="{ 'toast-show': toastVisible }">
    <span>{{ toastText }}</span>
  </div>

  <!-- ❓ 上手指南与版本记录弹窗（内容对齐桌面 V2.1 分层精简格式） -->
  <div v-if="ui.guideOpen" class="modal-mask" @click.self="ui.guideOpen = false">
    <div class="modal-card guide-card">
      <div class="modal-head">
        <h3 class="modal-title">🚀 ReadFlow {{ APP_VERSION }} · Android 版</h3>
        <button type="button" class="modal-close" @click="ui.guideOpen = false">✕</button>
      </div>
      <div class="guide-body">
        <div class="guide-box guide-usage">
          <strong>📱 上手指南</strong>
          <ul>
            <li>底部标签栏切换六个页面；点左上角品牌随时回首页。</li>
            <li>精读页：点「目录」滑出文章抽屉；点击文中任意单词自动弹出底部查词台（三 Tab：查词详情 / 词句翻译 / 本文生词）。</li>
            <li>数据永久保存在本机应用私有空间；重要数据请定期「导出备份」。</li>
            <li>联网时单词真人原声走有道词典；离线自动切换系统语音引擎。</li>
            <li>导出的 CSV / JSON 通过系统分享面板保存或发送。</li>
          </ul>
        </div>
        <div class="guide-box">
          <strong>📜 版本迭代历史</strong>
          <ul>
            <li><strong>v2.1（当前）：</strong>版本标识与更新记录弹窗单一来源同步。</li>
            <li><strong>v2.0：</strong>精读页杂志化改版（三 Tab 查词台、筛选抽屉、专注阅读模式）；获取页命令栏重构与三态诚实反馈；提速专项（预取+看门狗）；安徽专升本全链路；文章库三联筛选；单词库闪卡；统计页去花哨化。</li>
            <li><strong>v1.x：</strong>四六级同源外刊获取、逐词点查三色标注、牛津离线词典、文章库/单词库/时间统计全模块。</li>
          </ul>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="primary-btn" @click="ui.guideOpen = false">我知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-main {
  flex: 1 1 0%;
  min-height: 0;
  position: relative;
}
.app-main > section {
  position: absolute;
  inset: 0;
}
.boot-error {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #dc2626;
  font-size: 13px;
  background-color: var(--bg-main);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 14px);
  transform: translateX(-50%) translateY(8px);
  max-width: 86vw;
  padding: 10px 16px;
  border-radius: 12px;
  background-color: rgba(15, 23, 42, 0.92);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 600;
  text-align: center;
  z-index: 70;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast.toast-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  background-color: rgba(2, 6, 23, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-card {
  width: 100%;
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px 18px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.guide-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-col);
  margin: 0 8px calc(8px + env(safe-area-inset-bottom));
  border-radius: 18px;
  max-width: 560px;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-col);
}
.modal-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
}
.modal-close {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 15px;
  cursor: pointer;
}
.guide-body {
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.75;
}
.guide-box {
  border-radius: 12px;
  padding: 10px 12px;
  background-color: var(--bg-subcard);
  border: 1px solid var(--border-col);
}
.guide-box ul {
  margin: 6px 0 0;
  padding-left: 18px;
}
.guide-usage {
  background-color: var(--accent-soft);
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
}
</style>
