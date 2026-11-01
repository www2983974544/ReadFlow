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
    examLevel: body.split(/\s+/).length > 330 ? 'CET-6' : 'CET-4',
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
    <div class="surface-card max-w-2xl w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold">📋 导入或解析自定义英文文章 (支持纯离线分词 & 牛津词库打标)</h3>
        <button id="btnCloseCustomModal" type="button" class="text-slate-400 hover:text-slate-700 text-lg font-bold" @click="ui.customImportOpen = false">✕</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
        <h3 class="text-base font-bold">🚀 ReadFlow 版本更新记录 (v0.1 – v1.1) & Windows 上手指南</h3>
        <button id="btnCloseWindowsGuide" type="button" class="text-slate-400 hover:text-slate-700 text-lg font-bold" @click="ui.guideOpen = false">✕</button>
      </div>
      <div class="space-y-3 text-xs leading-relaxed">
        <div class="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2">
          <strong>📜 ReadFlow 版本迭代历史 (CHANGELOG)：</strong>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><strong>v1.1（当前版本 · 蓝宝石光学星环 + 180格高斯光波刻度 + 3D倾角交互 + 极光星云宇宙）：</strong>中央圆环升级为高定蓝宝石水晶透镜质感，支持鼠标 3D 空间透视倾角、180 格激光刻度连续高斯光波拖尾、十字星芒光子节点与悬浮胶囊读数；宇宙背景新增引力透镜同轴吸积光晕、动态呼吸极光星云丝带与鼠标流光星尘涟漪。</li>
            <li><strong>v1.0（深空星云银河背景 + 极简高定流光圆环倒计时）：</strong>移除传统手表指针与冗余当前时间显示，升级为高定通透玻璃拟态「流光圆环倒计时」（含 120 段激光微雕动态点亮刻度环、光学辉光进度环与 60FPS 丝滑秒级脉冲光子）；底层重构为离屏高精银河尘埃带、多层船底座体积星云、1200+ 微星尘、24 颗十字衍射星芒亮星与 3D 鼠标视差深空宇宙。</li>
            <li><strong>v0.9（浩瀚星空背景 + 单一全息时钟倒计时）：</strong>将首页重构为唯美震撼的 60FPS「浩瀚星空（含闪烁恒星、深空星云与动态流星）」背景，摒弃“1大+4小”分散表盘，将天/时/分/秒全部浓缩汇总进中央唯一一个 120 刻度巨型全息星际时钟表盘内。</li>
            <li><strong>v0.8（时钟倒计时首页重构 + 个人统计数据清零初始化）：</strong>移除首页底部冗余子模块（AI智能精读任务舱、高频词速刷舱、实时备考战力矩阵），将主页倒计时升级为「60刻度全息三环指针机械时钟 + 天/时/分/秒四联圆形时钟进度表盘」；将「时间统计」模块内所有个人历史统计数据、热力图、趋势图与题型覆盖率全部清空归零，实现100%从零真实记录，并新增一键清空重置按钮。</li>
            <li><strong>v0.7（科技感倒计时首页 + GitHub热力图时间统计 + 布局修复）：</strong>新增炫酷科技感「首页」（默认显示英语六级倒计时，支持自定义考试类型与日期，点击倒计时直达外刊精读，含 AI 每日任务舱与高频词速刷舱）；新增「个人时间统计页」（含 52周×7天仿 GitHub 学习贡献热力图、6 大统计指标与 14 天趋势图）；修复功能栏右侧遮挡问题（左右收起按钮独立同行 + 功能栏自适应排列）；修复两侧栏同时收起后中间文章消失的 Bug。</li>
            <li><strong>v0.6（全量主题适配与零抖动交互升级）：</strong>深度重构明亮/护眼/夜间三大模式全子模块配色；修复「词句离线解析与翻译台」支持整句译文与逐词详细词义；支持点击正文空白处取消单词选中；消除点击不同单词时的正文“乱动”抖动；新增两栏中间空隙悬浮图标直点收起功能。</li>
            <li><strong>v0.5（品牌定名与工程化升级）：</strong>正式定名为 <strong>ReadFlow</strong>；新增点击左上角品牌图标/文字一键返回首页；导航精简；新增版本演进档案 <code>ReadFlow_CHANGELOG.md</code>；升级专业工程级 <code>.bat</code> 启动脚本注释。</li>
            <li><strong>v0.4（深度精读与交互进阶）：</strong>阅读计时器支持自定义分钟数；文章朗读升级为在线真人级神经播音流预加载队列 + 离线意群语调模型；「标记精读完成」支持一键取消；查词栏与单词库新增「派生词(不同词性)」与「同义替换词」；左右侧栏支持手动收缩且点词自动唤醒右栏。</li>
            <li><strong>v0.3（真人原声校准与 EXE 引导）：</strong>单词接入牛津/有道真人美音/英音录音；文章朗读引入英语母语白名单；压缩包新增原生 <code>.exe</code> 启动器与《开始上手指南》。</li>
            <li><strong>v0.2（离线极速版与独立视口改造）：</strong>导航栏单行自适应；左中右三栏独立滚动互不干扰；内置英汉牛津/四六级离线词典（0ms 秒查，100% 断网可用）。</li>
            <li><strong>v0.1（初始版本）：</strong>构建四六级同源外刊获取、五大高频题型标注、逐词翻译与三色行内标注、文章库自主筛选、长难句拆解与自测题核心框架。</li>
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
