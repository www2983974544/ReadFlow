<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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
import { toastVisible, toastText, toastAction, applyThemeMode, setThemeMode, applySidebarCollapseLayout, updateTopBadgesAndStats, showToast, dismissToast, runToastAction, currentThemeMode } from './legacy/ui-fns'
import { S, hydrateExamSettings } from './legacy/state'
import {
  clearActiveWordSelection,
  clearWordMark,
  markCurrentWord,
  renderCurrentArticle,
  renderSidebarArticleList,
  selectWordForInspection,
} from './legacy/reader'
import { initTimerDisplay } from './legacy/timer'
import { translateSentenceOfflineOrOnline } from './legacy/translate'
import { initVoices, speakSingleWord } from './core/tts'
import { APP_VERSION } from './version'
import { isNative, nativePlugin } from './native/bridge'
import { readClipboardText } from './native/clipboard'
import { applyDailyReminder } from './native/reminder'
import type { Article } from './types'

const ui = useUiStore()
const bootError = ref('')
const launchDirect = ref(false)

// ---- v1.2 聚合设置弹窗：打开时把分散在各页的当前值同步进来 ----
function syncSettingsControls() {
  const s = S()
  const settingsStore = useSettingsStore()
  launchDirect.value = settingsStore.settings.launch_direct_reader === true
  const accentSel = document.getElementById('selectVoiceAccent') as HTMLSelectElement | null
  const accentSet = document.getElementById('setVoiceAccent') as HTMLSelectElement | null
  if (accentSet && accentSel) accentSet.value = accentSel.value
  const speedSel = document.getElementById('selectVoiceSpeed') as HTMLSelectElement | null
  const speedSet = document.getElementById('setVoiceSpeed') as HTMLSelectElement | null
  if (speedSet && speedSel) speedSet.value = speedSel.value
  const fontRange = document.getElementById('setFontSize') as HTMLInputElement | null
  if (fontRange) fontRange.value = String(s.fontSizeRem)
  const homeToggle = document.getElementById('homeReminderToggle') as HTMLInputElement | null
  const homeTime = document.getElementById('homeReminderTime') as HTMLInputElement | null
  const setToggle = document.getElementById('setReminderToggle') as HTMLInputElement | null
  const setTime = document.getElementById('setReminderTime') as HTMLInputElement | null
  if (setToggle && homeToggle) setToggle.checked = homeToggle.checked
  if (setTime && homeTime) setTime.value = homeTime.value
}

watch(ui.settingsOpen, (open) => {
  if (open) syncSettingsControls()
})

function onSetLaunchDirect(e: Event) {
  const on = (e.target as HTMLInputElement).checked
  void useSettingsStore().set('launch_direct_reader', on)
  showToast(on ? '🚀 已开启：启动直达外刊精读' : '已关闭：启动停留在星空首页')
}

function onSetVoiceAccent(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  S().voiceAccent = v
  const readerSel = document.getElementById('selectVoiceAccent') as HTMLSelectElement | null
  if (readerSel) readerSel.value = v
  showToast(v === 'UK' ? '🇬🇧 已切换为英式发音' : '🇺🇸 已切换为美式发音')
}

function onSetVoiceSpeed(e: Event) {
  const v = parseFloat((e.target as HTMLSelectElement).value) || 1.0
  S().voiceSpeed = v
  const readerSel = document.getElementById('selectVoiceSpeed') as HTMLSelectElement | null
  if (readerSel) readerSel.value = String(v)
  showToast(`🎙️ 朗读语速已设为 ${v}x`)
}

function onSetFontSize(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  if (!isFinite(v)) return
  S().fontSizeRem = v
  const container = document.getElementById('readerParagraphsContainer')
  if (container) container.style.fontSize = v + 'rem'
}

async function onSetReminder() {
  const toggle = document.getElementById('setReminderToggle') as HTMLInputElement | null
  const time = document.getElementById('setReminderTime') as HTMLInputElement | null
  const homeToggle = document.getElementById('homeReminderToggle') as HTMLInputElement | null
  const homeTime = document.getElementById('homeReminderTime') as HTMLInputElement | null
  const enabled = toggle?.checked ?? false
  const t = time?.value || '20:00'
  await useSettingsStore().set('reminder_enabled', enabled)
  await useSettingsStore().set('reminder_time', t)
  if (homeToggle) homeToggle.checked = enabled
  if (homeTime) homeTime.value = t
  const result = await applyDailyReminder(enabled, t)
  if (result === 'denied') showToast('⚠️ 通知权限被拒绝，请到系统设置开启')
  else if (enabled) showToast(result === 'native' ? `🔔 每日提醒已开启：每天 ${t}` : '🔔 提醒设置已保存（真机上生效）')
  else showToast('🔕 每日提醒已关闭')
}

onMounted(async () => {
  try {
    const articles = useArticlesStore()
    const vocab = useVocabStore()
    const stats = useStatsStore()
    const settings = useSettingsStore()
    await Promise.all([articles.load(), vocab.load(), stats.load(), settings.load()])
    await hydrateExamSettings()

    applyThemeMode(S().themeMode)
    initVoices()
    updateTopBadgesAndStats()
    applySidebarCollapseLayout()
    renderSidebarArticleList()
    renderCurrentArticle()
    const firstArticle = useArticlesStore().articles[0]
    selectWordForInspection(
      'artificial',
      firstArticle?.paragraphs[0]?.en ?? 'Artificial intelligence is beginning to transform the modern workplace.',
      null,
    )
    initTimerDisplay()

    // v1.2 启动直达精读（设置开关）
    if (useSettingsStore().settings.launch_direct_reader === true) {
      ui.switchView('reader')
    }

    const defaultSampleSent = 'Artificial intelligence is beginning to transform the modern workplace.'
    const freeInput = document.getElementById('inputFreeTranslate') as HTMLTextAreaElement | null
    if (freeInput) freeInput.value = defaultSampleSent
    void translateSentenceOfflineOrOnline(defaultSampleSent)

    setupKeyboardShortcuts()
    setupBackButton()
  } catch (e) {
    bootError.value = String(e)
  }
})

// 快捷键（桌面同款：Esc/1/2/3/0/S/B，触屏环境无副作用）
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName
    if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
    if (e.key === 'Escape') clearActiveWordSelection()
    else if (e.key === '1') void markCurrentWord('unknown')
    else if (e.key === '2') void markCurrentWord('core')
    else if (e.key === '3') void markCurrentWord('mastered')
    else if (e.key === '0') void clearWordMark()
    else if (e.key.toLowerCase() === 's') speakSingleWord(S().activeWord)
    else if (e.key.toLowerCase() === 'b') document.getElementById('btnToggleBilingual')?.click()
  })
}

// 安卓返回键：弹窗 → 抽屉/查词台 → 首页；浏览器环境自动跳过
function setupBackButton() {
  if (!isNative()) return
  const appPlugin = nativePlugin<{ addListener: (ev: string, cb: () => void) => void }>('App')
  if (!appPlugin) return
  appPlugin.addListener('backButton', () => {
    if (ui.settingsOpen) {
      ui.settingsOpen = false
      return
    }
    if (ui.guideOpen) {
      ui.guideOpen = false
      return
    }
    if (ui.customImportOpen) {
      ui.customImportOpen = false
      return
    }
    if (ui.activeView === 'reader') {
      const s = S()
      const leftOpen = !document.getElementById('leftSidebarPane')?.classList.contains('hidden')
      const rightOpen = !document.getElementById('rightInspectorPane')?.classList.contains('hidden')
      if (rightOpen) {
        s.rightCollapsed = true
        applySidebarCollapseLayout()
        return
      }
      if (leftOpen) {
        s.leftCollapsed = true
        applySidebarCollapseLayout()
        return
      }
    }
    if (ui.activeView !== 'home') {
      ui.switchView('home')
    }
    // 在首页再按返回：交由系统默认（退出应用）
  })
}

// 剪贴板一键导入（v1.2）：把剪贴板文本填入正文编辑区
async function pasteFromClipboard() {
  const text = await readClipboardText()
  const body = document.getElementById('customInputBody') as HTMLTextAreaElement | null
  if (!body) return
  if (!text.trim()) {
    showToast('剪贴板为空或无权读取，请手动粘贴')
    return
  }
  body.value = text.trim()
  // 标题为空时用第一行兜底
  const title = document.getElementById('customInputTitle') as HTMLInputElement | null
  if (title && !title.value.trim()) {
    const firstLine = text.trim().split(/\n/)[0] || ''
    if (firstLine.length <= 80) title.value = firstLine
  }
  showToast('📋 已从剪贴板填入正文')
}

// 自定义文章导入（与桌面 App.vue submitCustomArticle 同逻辑）
async function submitCustomArticle() {
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null
  const titleInput = get<HTMLInputElement>('customInputTitle')
  const sourceInput = get<HTMLInputElement>('customInputSource')
  const categoryInput = get<HTMLSelectElement>('customInputCategory')
  const bodyInput = get<HTMLTextAreaElement>('customInputBody')
  const addLibInput = get<HTMLInputElement>('customCheckAddLib')
  const levelInput = get<HTMLSelectElement>('customInputLevel')
  if (!titleInput || !sourceInput || !categoryInput || !bodyInput || !addLibInput) return

  const title = titleInput.value.trim() || 'Custom English Reading Passage'
  const source = sourceInput.value.trim() || 'Custom Web Source'
  const category = categoryInput.value
  const body = bodyInput.value.trim()
  const addLib = addLibInput.checked

  if (!body) {
    showToast('请粘贴英文文章正文内容')
    return
  }

  const autoLevel = body.split(/\s+/).length > 330 ? 'CET-6' : 'CET-4'
  const examLevel = levelInput && levelInput.value !== 'auto' ? levelInput.value : autoLevel

  const rawParas = body
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
  const newArt: Article = {
    id: 'art-custom-' + Date.now(),
    title: title,
    titleCn: title + ' (自定义导入精读)',
    source: source,
    sourceUrl: '',
    category: category,
    examLevel: examLevel,
    lexile: '1050L',
    cetRatio: '17.5%',
    examFreqTag: '✨ 自定义导入外刊 · 离线逐词秒查',
    inLibrary: addLib,
    readStatus: 'reading',
    paragraphs: rawParas.map((p) => ({
      en: p,
      cn: '（点击查词台翻译 Tab 或正文中任意单词即可查看详细中文释义、派生词与同义词）',
    })),
    complexSentence: {
      sentence: rawParas[0],
      structure: '【自定义文章首句】点击句中任意生词即可查询内置牛津词典音标、派生词与同义词。',
      tip: '阅读时建议先盲读一遍，再用红黄绿三色标注核心生词。',
    },
    quiz: [],
  }

  const saved = await useArticlesStore().add(newArt)
  S().currentArticleId = saved.id
  updateTopBadgesAndStats()
  ui.customImportOpen = false
  ui.switchView('reader')
  renderSidebarArticleList()
  renderCurrentArticle()
  showToast('✓ 新文章已成功解析并开启逐词标注！')
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

  <!-- Toast（移动端：底部居中，位于标签栏上方；点按关闭；可带撤销动作） -->
  <div class="toast" :class="{ 'toast-show': toastVisible }" @click="dismissToast">
    <span class="toast-msg">{{ toastText }}</span>
    <button
      v-if="toastAction"
      type="button"
      class="toast-action"
      @click.stop="runToastAction"
    >{{ toastAction.label }}</button>
  </div>

  <!-- 自定义文章导入弹窗 -->
  <div v-if="ui.customImportOpen" class="modal-mask" @click.self="ui.customImportOpen = false">
    <div class="modal-card import-card">
      <div class="modal-head">
        <h3 class="modal-title">📋 导入自定义英文文章</h3>
        <button type="button" class="modal-close" @click="ui.customImportOpen = false">✕</button>
      </div>
      <div class="import-body">
        <button type="button" class="clipboard-btn" @click="pasteFromClipboard">📋 读取剪贴板填入正文</button>
        <div class="grid grid-cols-1 gap-2.5 text-xs">
          <div>
            <label class="block font-semibold mb-1">文章标题：</label>
            <input id="customInputTitle" type="text" placeholder="例如：How AI Reshapes University Education" class="import-input" />
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block font-semibold mb-1">来源刊物：</label>
              <input id="customInputSource" type="text" placeholder="例如：The Economist" class="import-input" />
            </div>
            <div>
              <label class="block font-semibold mb-1">难度：</label>
              <select id="customInputLevel" class="import-input">
                <option value="auto">自动判定 (词数>330 = 六级)</option>
                <option value="CET-4">四级 CET-4</option>
                <option value="CET-6">六级 CET-6</option>
                <option value="安徽专升本">安徽专升本</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-semibold mb-1">四六级文章类型：</label>
            <select id="customInputCategory" class="import-input">
              <option value="科技与人工智能">科技与人工智能</option>
              <option value="生态与气候环境">生态与气候环境</option>
              <option value="心理与教育认知">心理与教育认知</option>
              <option value="经济与商业职场">经济与商业职场</option>
              <option value="社会文化与健康">社会文化与健康</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold mb-1">英文正文 (按回车分段，离线支持逐词秒查)：</label>
            <textarea id="customInputBody" rows="7" placeholder="粘贴任意英文外刊段落或真题阅读原文..." class="import-input"></textarea>
          </div>
        </div>
      </div>
      <div class="import-foot">
        <label class="inline-flex items-center gap-2 text-xs font-medium cursor-pointer mr-auto">
          <input id="customCheckAddLib" type="checkbox" checked class="rounded text-indigo-600" />
          <span>解析后直接加入「文章库」</span>
        </label>
        <button type="button" class="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200" @click="ui.customImportOpen = false">取消</button>
        <button type="button" class="primary-btn" @click="submitCustomArticle">解析并开始精读</button>
      </div>
    </div>
  </div>

  <!-- ⚙️ 聚合设置弹窗（v1.2：主题/启动/提醒/朗读 一站式） -->
  <div v-if="ui.settingsOpen" class="modal-mask" @click.self="ui.settingsOpen = false">
    <div class="modal-card settings-card">
      <div class="modal-head">
        <h3 class="modal-title">⚙️ 设置</h3>
        <button type="button" class="modal-close" @click="ui.settingsOpen = false">✕</button>
      </div>
      <div class="settings-body">
        <div class="set-group">
          <div class="set-group-title">🎨 外观</div>
          <div class="set-theme-row">
            <button type="button" class="chip-btn" :class="{ 'chip-active': currentThemeMode() === 'light' }" @click="setThemeMode('light')">☀️ 明亮</button>
            <button type="button" class="chip-btn" :class="{ 'chip-active': currentThemeMode() === 'sepia' }" @click="setThemeMode('sepia')">📜 护眼</button>
            <button type="button" class="chip-btn" :class="{ 'chip-active': currentThemeMode() === 'dark' }" @click="setThemeMode('dark')">🌙 夜间</button>
            <button type="button" class="chip-btn" :class="{ 'chip-active': currentThemeMode() === 'system' }" @click="setThemeMode('system')">🌗 跟随系统</button>
          </div>
        </div>

        <div class="set-group">
          <div class="set-group-title">🚀 启动</div>
          <label class="set-row">
            <span class="set-label">启动直达外刊精读<span class="set-sub">打开 App 直接进入精读页，跳过星空首页</span></span>
            <input type="checkbox" id="setLaunchDirect" class="set-switch" :checked="launchDirect" @change="onSetLaunchDirect" />
          </label>
        </div>

        <div class="set-group">
          <div class="set-group-title">🔔 学习提醒</div>
          <label class="set-row">
            <span class="set-label">每日提醒<span class="set-sub">到点本地通知催你打卡（真机生效）</span></span>
            <input type="checkbox" id="setReminderToggle" class="set-switch" @change="onSetReminder" />
          </label>
          <label class="set-row">
            <span class="set-label">提醒时间</span>
            <input type="time" id="setReminderTime" class="set-input" @change="onSetReminder" />
          </label>
        </div>

        <div class="set-group">
          <div class="set-group-title">🎙️ 朗读与字号</div>
          <label class="set-row">
            <span class="set-label">单词发音口音</span>
            <select id="setVoiceAccent" class="set-input" @change="onSetVoiceAccent">
              <option value="US">🇺🇸 美音</option>
              <option value="UK">🇬🇧 英音</option>
            </select>
          </label>
          <label class="set-row">
            <span class="set-label">文章朗读语速</span>
            <select id="setVoiceSpeed" class="set-input" @change="onSetVoiceSpeed">
              <option value="1.0">1.0x 标准</option>
              <option value="0.88">0.88x 慢读</option>
              <option value="0.78">0.78x 跟读</option>
              <option value="1.12">1.12x 进阶</option>
            </select>
          </label>
          <label class="set-row">
            <span class="set-label">正文字号</span>
            <input type="range" id="setFontSize" min="0.95" max="1.45" step="0.05" class="set-range flex-1" @change="onSetFontSize" />
          </label>
        </div>
        <p class="set-hint">与精读工具栏 / 首页配置栏中的同名设置实时同步。</p>
      </div>
      <div class="modal-foot">
        <button type="button" class="primary-btn" @click="ui.settingsOpen = false">完成</button>
      </div>
    </div>
  </div>

  <!-- ❓ 上手指南与版本记录弹窗 -->
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
            <li>精读页：点「📂 目录」滑出文章抽屉；点击文中任意单词自动弹出底部查词台（三 Tab：查词详情 / 词句翻译 / 本文生词）。</li>
            <li>数据永久保存在本机应用私有空间；重要数据请定期「导出备份」。</li>
            <li>联网时单词真人原声走有道词典；离线自动切换系统语音引擎。</li>
            <li>导出的 CSV / JSON 通过系统分享面板保存或发送。</li>
          </ul>
        </div>
        <div class="guide-box">
          <strong>📜 Android 版更新记录 (CHANGELOG)</strong>
          <ul>
            <li><strong>v1.2（当前）：</strong>十二项简洁易用专项——静态星空首页（去 60FPS 循环）、查词台下拉关闭/点空白收起、删除可撤销与清零二次确认、状态栏跟随主题、⚙️ 聚合设置弹窗、启动直达精读、工具栏横滑提示、阅读进度条与位置记忆、单词库搜索、剪贴板一键导入、段落朗读悬浮球、Toast 可交互。</li>
            <li><strong>v1.1：</strong>六项体验提升——计时防锁屏、深色跟随系统（🌗 档）、查词台快捷标注条、划词翻译气泡、抓取源健康度与单源重试、每日学习提醒。</li>
            <li><strong>v1.0（首发）：</strong>以桌面 V2.1 功能集为基准的移动版——底部标签栏六视图；精读页目录抽屉 + 三 Tab 查词台弹层 + 专注阅读模式；客户端真 RSS 爬虫（Readability 提取、Wikipedia 兜底、12 秒时限）；有道真人朗读 + 系统 TTS 兜底；导出走系统分享面板；返回键逐级导航；三主题与设置持久化；安徽专升本全链路；文章库三联筛选；单词库闪卡；统计热力图与跨实体清零守卫。</li>
            <li><strong>功能基线：</strong>桌面版 v2.x 迭代史见桌面端《ReadFlow_版本更新日志(CHANGELOG)》。</li>
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
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast.toast-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.toast .toast-msg {
  min-width: 0;
}
.toast .toast-action {
  margin-left: 10px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
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
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-card);
  border: 1px solid var(--border-col);
  border-radius: 18px;
  margin: 0 8px calc(8px + env(safe-area-inset-bottom));
  max-width: 560px;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-col);
  flex: 0 0 auto;
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
.guide-body,
.import-body {
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.75;
}
.import-body {
  line-height: 1.5;
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
.import-input {
  width: 100%;
  border: 1px solid var(--border-col);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12.5px;
  background-color: var(--bg-input);
  color: var(--text-main);
  outline: none;
}
.import-input:focus {
  border-color: var(--accent);
}
.clipboard-btn {
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed var(--accent);
  background-color: var(--accent-soft);
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}
.import-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-col);
  flex: 0 0 auto;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
}
.settings-body {
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.set-group {
  border: 1px solid var(--border-col);
  border-radius: 12px;
  padding: 10px 12px;
  background-color: var(--bg-subcard);
}
.set-group-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}
.set-theme-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  cursor: pointer;
}
.set-row + .set-row {
  border-top: 1px dashed var(--border-col);
}
.set-label {
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.set-sub {
  font-size: 10.5px;
  font-weight: 400;
  opacity: 0.65;
  margin-top: 1px;
}
.set-switch {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  flex: 0 0 auto;
}
.set-input {
  border: 1px solid var(--border-col);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  background-color: var(--bg-input);
  color: var(--text-main);
  outline: none;
}
.set-range {
  accent-color: var(--accent);
}
.set-hint {
  margin: 0;
  font-size: 10.5px;
  opacity: 0.6;
  text-align: center;
}
</style>
