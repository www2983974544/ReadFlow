// Right inspector tab drawer (v1.1 UI refactor): 查词详情 | 词句翻译 | 本文生词.
// Pure UI glue — no business logic lives here. Default tab: 查词详情;
// selectWordForInspection() calls showInspectorWordTab() on every word click.

export type InspectorTab = 'word' | 'trans' | 'marked'

let currentTab: InspectorTab = 'word'

const TAB_BUTTONS: Record<InspectorTab, string> = {
  word: 'tabBtnInspectorWord',
  trans: 'tabBtnInspectorTrans',
  marked: 'tabBtnInspectorMarked',
}

const TAB_PANELS: Record<InspectorTab, string> = {
  word: 'inspectorTabPanelWord',
  trans: 'inspectorTabPanelTrans',
  marked: 'inspectorTabPanelMarked',
}

export function getInspectorTab(): InspectorTab {
  return currentTab
}

export function switchInspectorTab(tab: InspectorTab) {
  currentTab = tab
  ;(Object.keys(TAB_BUTTONS) as InspectorTab[]).forEach((key) => {
    const btn = document.getElementById(TAB_BUTTONS[key])
    if (btn) btn.classList.toggle('inspector-tab-active', key === tab)
    const panel = document.getElementById(TAB_PANELS[key])
    if (panel) panel.classList.toggle('hidden', key !== tab)
  })
}

export function showInspectorWordTab() {
  if (currentTab !== 'word') switchInspectorTab('word')
}

export function initInspectorTabs() {
  ;(Object.keys(TAB_BUTTONS) as InspectorTab[]).forEach((key) => {
    document.getElementById(TAB_BUTTONS[key])?.addEventListener('click', () => switchInspectorTab(key))
  })
  switchInspectorTab('word')
}
