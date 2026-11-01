<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore, type ViewName } from '../stores/ui'
import { useArticlesStore } from '../stores/articles'
import { useVocabStore } from '../stores/vocab'

// 底部 6 键标签栏：与桌面顶部导航一一对应，角标实时同步。
const ui = useUiStore()
const articles = useArticlesStore()
const vocab = useVocabStore()

interface TabDef {
  view: ViewName
  icon: string
  label: string
}

const TABS: TabDef[] = [
  { view: 'home', icon: '🚀', label: '首页' },
  { view: 'reader', icon: '📖', label: '精读' },
  { view: 'crawler', icon: '🌐', label: '获取' },
  { view: 'library', icon: '📚', label: '文章库' },
  { view: 'vocab', icon: '🔖', label: '单词库' },
  { view: 'stats', icon: '📊', label: '统计' },
]

const badges = computed<Record<string, number>>(() => ({
  crawler: articles.articles.filter((a) => !a.inLibrary).length,
  library: articles.articles.filter((a) => a.inLibrary).length,
  vocab: Object.keys(vocab.marks).length,
}))
</script>

<template>
  <nav class="bottom-tab-bar" aria-label="移动端主导航">
    <button
      v-for="t in TABS"
      :key="t.view"
      type="button"
      class="tab-btn"
      :class="{ 'tab-active': ui.activeView === t.view }"
      :data-tab="t.view"
      @click="ui.switchView(t.view)"
    >
      <span class="tab-icon">{{ t.icon }}</span>
      <span class="tab-label">{{ t.label }}</span>
      <span
        v-if="badges[t.view] > 0"
        class="tab-badge"
      >{{ badges[t.view] }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-tab-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-col);
  padding: 4px 2px calc(4px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 18px rgba(15, 23, 42, 0.1);
  z-index: 40;
}
.tab-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  flex: 1 1 0;
  min-width: 0;
  padding: 3px 2px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: var(--text-muted);
  cursor: pointer;
}
.tab-btn.tab-active {
  color: var(--accent);
  background-color: var(--accent-soft);
}
.tab-icon {
  font-size: 18px;
  line-height: 1.25;
}
.tab-label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.tab-badge {
  position: absolute;
  top: 0;
  right: 14%;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background-color: var(--accent);
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
}
</style>
