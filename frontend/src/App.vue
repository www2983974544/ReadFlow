<script setup lang="ts">
import { onMounted, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ReaderView from './components/ReaderView.vue'
import HomeView from './components/views/HomeView.vue'
import CrawlerView from './components/views/CrawlerView.vue'
import LibraryView from './components/views/LibraryView.vue'
import VocabView from './components/views/VocabView.vue'
import StatsView from './components/views/StatsView.vue'
import { setCosmosPaused } from './legacy/cosmos'
import { S, hydrateExamSettings } from './legacy/state'
import { applySidebarCollapseLayout, applyThemeMode, showToast, updateTopBadgesAndStats } from './legacy/ui-fns'
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
import { useArticlesStore } from './stores/articles'
import { useSettingsStore } from './stores/settings'
import { useStatsStore } from './stores/stats'
import { useUiStore } from './stores/ui'
import { useVocabStore } from './stores/vocab'
import type { Article } from './types'

const ui = useUiStore()

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
  const examLevel =
    levelInput && levelInput.value !== 'auto' ? levelInput.value : autoLevel

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
      cn: '（点击右侧离线词句解析台或正文中任意单词即可0延迟查看详细中文释义、派生词与同义词）',
    })),
    complexSentence: {
      sentence: rawParas[0],
      structure: '【自定义文章首句】点击句中任意生词即可0延迟查询内置牛津词典音标、派生词与同义词。',
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
  showToast('✓ 新文章已成功解析并开启0延迟逐词点按标注！')
}

onMounted(async () => {
  await Promise.all([
    useArticlesStore().load(),
    useVocabStore().load(),
    useStatsStore().load(),
    useSettingsStore().load(),
  ])
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

  const defaultSampleSent = 'Artificial intelligence is beginning to transform the modern workplace.'
  const freeInput = document.getElementById('inputFreeTranslate') as HTMLTextAreaElement | null
  if (freeInput) freeInput.value = defaultSampleSent
  void translateSentenceOfflineOrOnline(defaultSampleSent)

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

  // Pause the home cosmos canvas while other views are shown (CPU/battery).
  setCosmosPaused(ui.activeView !== 'home')
  watch(
    () => ui.activeView,
    (view) => {
      setCosmosPaused(view !== 'home')
    },
  )
})
</script>

<template>
  <AppHeader />

  <main class="workspace-main">
    <!-- VIEW 0: 殿堂级蓝宝石星环倒计时首页 -->
    <HomeView v-show="ui.activeView === 'home'" />

    <!-- VIEW 1: 外刊精读 -->
    <ReaderView v-show="ui.activeView === 'reader'" />

    <!-- VIEW 2: 文章获取 -->
    <CrawlerView v-show="ui.activeView === 'crawler'" />

    <!-- VIEW 3: 文章库 -->
    <LibraryView v-show="ui.activeView === 'library'" />

    <!-- VIEW 4: 单词库 -->
    <VocabView v-show="ui.activeView === 'vocab'" />

    <!-- VIEW 5: 时间统计 -->
    <StatsView v-show="ui.activeView === 'stats'" />
  </main>

  <!-- MODAL 1: CUSTOM ARTICLE IMPORT -->
  <div id="modalCustomImport" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" :class="{ hidden: !ui.customImportOpen }">
    <div class="surface-card max-w-xl w-full p-6 rounded-2xl shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold">📋 导入或解析自定义英文文章 (支持纯离线分词 & 牛津词库打标)</h3>
        <button id="btnCloseCustomModal" type="button" class="text-slate-400 hover:text-slate-700 text-lg font-bold" @click="ui.customImportOpen = false">✕</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label class="block font-semibold mb-1">文章标题：</label>
          <input id="customInputTitle" type="text" placeholder="例如：How AI Reshapes University Education" class="w-full rounded-xl border border-slate-200 px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label class="block font-semibold mb-1">标注来源刊物：</label>
          <input id="customInputSource" type="text" placeholder="例如：The Economist / 2026真题源" class="w-full rounded-xl border border-slate-200 px-3 py-2 bg-transparent" />
        </div>
        <div>
          <label class="block font-semibold mb-1">四六级文章类型：</label>
          <select id="customInputCategory" class="w-full rounded-xl border border-slate-200 px-3 py-2 bg-transparent">
            <option value="科技与人工智能">科技与人工智能</option>
            <option value="生态与气候环境">生态与气候环境</option>
            <option value="心理与教育认知">心理与教育认知</option>
            <option value="经济与商业职场">经济与商业职场</option>
            <option value="社会文化与健康">社会文化与健康</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold mb-1">目标考试难度：</label>
          <select id="customInputLevel" class="w-full rounded-xl border border-slate-200 px-3 py-2 bg-transparent">
            <option value="auto">自动按词数判断</option>
            <option value="CET-4">英语四级 CET-4</option>
            <option value="CET-6">英语六级 CET-6</option>
            <option value="安徽专升本">安徽专升本英语</option>
          </select>
        </div>
      </div>
      <div class="text-xs">
        <label class="block font-semibold mb-1">英文文章正文 (按回车分段，离线状态下同样支持逐词秒查与标注)：</label>
        <textarea id="customInputBody" rows="6" placeholder="粘贴任意英文外刊段落或真题阅读原文..." class="w-full rounded-xl border border-slate-200 p-3 bg-transparent"></textarea>
      </div>
      <div class="flex items-center justify-between pt-2">
        <label class="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input id="customCheckAddLib" type="checkbox" checked class="rounded text-indigo-600" />
          <span>解析后直接加入「文章库」</span>
        </label>
        <div class="flex gap-2">
          <button id="btnCancelCustomModal" type="button" class="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200" @click="ui.customImportOpen = false">取消</button>
          <button id="btnSubmitCustomArticle" type="button" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500" @click="submitCustomArticle">立即智能解析并开始精读</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL 2: READFLOW CHANGELOG & GETTING STARTED GUIDE -->
  <div id="modalWindowsGuide" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" :class="{ hidden: !ui.guideOpen }">
    <div class="surface-card max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold">🚀 ReadFlow 版本更新记录 &amp; 上手指南</h3>
        <button id="btnCloseWindowsGuide" type="button" class="text-slate-400 hover:text-slate-700 text-lg font-bold" @click="ui.guideOpen = false">✕</button>
      </div>
      <div class="space-y-3 text-xs leading-relaxed">
        <div class="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2">
          <strong>📜 版本迭代历史（最新在上）：</strong>
          <ul class="space-y-2.5">
            <li>
              <strong>v2.1（当前版本 · 2026-11-01）：</strong>
              <ul class="list-disc pl-5 space-y-0.5 mt-1">
                <li>左上角版本徽章与 ❓ 更新记录弹窗随版本号同步显示</li>
                <li>更新记录弹窗重写为分层无序列表精简版</li>
              </ul>
            </li>
            <li>
              <strong>v2.0（2026-11-01）：</strong>
              <ul class="list-disc pl-5 space-y-0.5 mt-1">
                <li>四个功能页面 UI 精简重构（精读 / 文章获取 / 单词库 / 时间统计）</li>
                <li>专注阅读模式：进入精读页或切换文章自动收起两侧栏</li>
                <li>朗读与阅读提速：边播边预取、快速失败、音频缓存</li>
                <li>新增「安徽专升本英语」全链路支持</li>
                <li>划词翻译、读下一篇闭环、文章库三联筛选、清词快捷键 0</li>
                <li>UI 文字可选中复制；抓取失败明确提示</li>
              </ul>
            </li>
            <li>
              <strong>v1（桌面应用化基线）：</strong>
              <ul class="list-disc pl-5 space-y-0.5 mt-1">
                <li>单文件网页重构为独立 EXE（Vue 3 + FastAPI + SQLite）</li>
                <li>数据迁入本地数据库；接入真 RSS 外刊抓取</li>
                <li>设置持久化；界面与功能完整保留</li>
              </ul>
            </li>
            <li>
              <strong>更早版本（原单文件网页）：</strong>
              <ul class="list-disc pl-5 space-y-0.5 mt-1">
                <li><strong>旧版 v1.1：</strong>首页蓝宝石星环倒计时与星云背景升级</li>
                <li><strong>旧版 v1.0：</strong>流光圆环倒计时重构</li>
                <li><strong>旧版 v0.9：</strong>星空粒子背景；单一巨型刻度时钟</li>
                <li><strong>旧版 v0.8：</strong>首页聚焦倒计时；统计数据一键清零</li>
                <li><strong>旧版 v0.7：</strong>新增首页与时间统计页（热力图 / 趋势图）</li>
                <li><strong>旧版 v0.6：</strong>三主题全量适配；点空白取消选词</li>
                <li><strong>旧版 v0.5：</strong>正式定名 ReadFlow</li>
                <li><strong>旧版 v0.4：</strong>自定义限时；情感朗读；派生词与同义词</li>
                <li><strong>旧版 v0.3：</strong>真人词典原声；EXE 启动器</li>
                <li><strong>旧版 v0.2：</strong>三栏独立滚动；内置离线词典</li>
                <li><strong>旧版 v0.1：</strong>首个版本：外刊获取、逐词翻译、三色标注</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button id="btnOkWindowsGuide" type="button" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white" @click="ui.guideOpen = false">我知道了</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toastNotification" class="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 transition-all hidden">
    <span id="toastText">已更新</span>
  </div>
</template>
