// Home launchpad: cosmos canvas, countdown display & exam config
// （复制自桌面 frontend/src/legacy/home.ts@v2.1；移动版增加重复绑定守卫
//   与 v1.1 每日学习提醒设置行）
import { initCosmosStarfieldCanvas, updateSmoothOrbitalRing60FPS } from './cosmos'
import { S } from './state'
import { showToast } from './ui-fns'
import { useSettingsStore } from '../stores/settings'
import { useUiStore } from '../stores/ui'
import { applyDailyReminder } from '../native/reminder'

let countdownTimerId = 0

export function updateHomeCountdownDisplay() {
  const s = S()
  const targetMs = new Date(s.examTargetDate).getTime()
  const nowMs = Date.now()
  let diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000))

  const days = Math.floor(diffSec / 86400)
  diffSec %= 86400
  const hours = Math.floor(diffSec / 3600)
  diffSec %= 3600
  const minutes = Math.floor(diffSec / 60)
  const seconds = diffSec % 60

  const elD = document.getElementById('cdDays')
  const elH = document.getElementById('cdHours')
  const elM = document.getElementById('cdMinutes')
  const elS = document.getElementById('cdSeconds')
  const elSub = document.getElementById('cdSubtitleLine')
  const elBadge = document.getElementById('clockInnerExamBadge')

  if (elD) elD.textContent = String(days).padStart(2, '0')
  if (elH) elH.textContent = String(hours).padStart(2, '0')
  if (elM) elM.textContent = String(minutes).padStart(2, '0')
  if (elS) elS.textContent = String(seconds).padStart(2, '0')
  if (elBadge) elBadge.textContent = `T-MINUS · ${s.examName}`

  if (elSub) {
    elSub.innerHTML = `距离 <span class="text-cyan-300 font-bold">${s.examName}</span> 考试还有 <span class="text-white font-bold">${days}</span> 天 <span class="text-white font-bold">${hours}</span> 小时 <span class="text-white font-bold">${minutes}</span> 分钟 <span class="text-cyan-300 font-bold">${seconds}</span> 秒`
  }

  // Update Primary Luminous Countdown Ring (r=182, C=1143.54) & Leading Starburst Photon Node
  const daysRatio = Math.min(1, Math.max(0.06, days / 180))
  const ringD = document.getElementById('clockRingDays')
  const daysPhoton = document.getElementById('daysPhotonGroup')
  if (ringD) {
    ringD.style.strokeDashoffset = (1143.54 * (1 - daysRatio)).toFixed(2)
  }
  if (daysPhoton) {
    daysPhoton.setAttribute('transform', `rotate(${(daysRatio * 360).toFixed(2)} 230 230)`)
  }
}

export function initHomeView() {
  initCosmosStarfieldCanvas()

  const dateInput = document.getElementById('homeExamDateInput') as HTMLInputElement | null
  if (dateInput) dateInput.value = S().examTargetDate
  updateHomeCountdownDisplay()
  if (!countdownTimerId) {
    // v1.2 静态化：秒环/180 刻度波从 60FPS 循环改为随倒计时 1Hz 刷新（仅首页活跃时）
    countdownTimerId = window.setInterval(() => {
      updateHomeCountdownDisplay()
      if (useUiStore().activeView === 'home') updateSmoothOrbitalRing60FPS()
    }, 1000)
  }

  // 事件绑定守卫：App.vue 的 immediate watch 会在 DOM 就绪前调用本函数，
  // 此时 heroCountdownTrigger 为 null，不能置位标记；onMounted 的那次调用完成绑定。
  const trigger = document.getElementById('heroCountdownTrigger')
  if (!trigger || trigger.dataset.homeBound === '1') return
  trigger.dataset.homeBound = '1'

  const ui = useUiStore()

  // 点击星环进入精读页
  document.getElementById('heroCountdownTrigger')?.addEventListener('click', () => {
    ui.switchView('reader')
    showToast('📖 已进入外刊精读工作台')
  })

  // CTA pill（沿桌面的 data 属性绑定）
  document.querySelector('[data-home-cta]')?.addEventListener('click', () => {
    document.getElementById('heroCountdownTrigger')?.click()
  })

  // 考试类型与目标时间配置
  document.getElementById('homeExamTypeSelect')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value
    const customInp = document.getElementById('homeExamCustomInput') as HTMLInputElement | null
    if (val === 'custom') {
      customInp?.classList.remove('hidden')
      customInp?.focus()
    } else {
      customInp?.classList.add('hidden')
      S().examName = val
      updateHomeCountdownDisplay()
      showToast(`🎯 目标考试已切换为：${val}`)
    }
  })

  document.getElementById('homeExamCustomInput')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value.trim() || '英语六级'
    S().examName = val
    updateHomeCountdownDisplay()
  })

  document.getElementById('homeExamDateInput')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLInputElement).value
    if (val) {
      S().examTargetDate = val
      updateHomeCountdownDisplay()
      showToast('📅 考试目标日期已更新')
    }
  })

  // ---- v1.1 每日学习提醒（设置持久化 + 本地通知注册） ----
  const settingsStore = useSettingsStore()
  const reminderToggle = document.getElementById('homeReminderToggle') as HTMLInputElement | null
  const reminderTime = document.getElementById('homeReminderTime') as HTMLInputElement | null
  if (reminderToggle) reminderToggle.checked = settingsStore.settings.reminder_enabled === true
  if (reminderTime) reminderTime.value = String(settingsStore.settings.reminder_time || '20:00')

  const applyReminder = async () => {
    const enabled = reminderToggle?.checked === true
    const time = reminderTime?.value || '20:00'
    await settingsStore.set('reminder_enabled', enabled)
    await settingsStore.set('reminder_time', time)
    const result = await applyDailyReminder(enabled, time)
    if (result === 'denied') {
      showToast('⚠️ 通知权限被拒绝，请到系统设置开启通知')
    } else if (enabled) {
      showToast(result === 'native' ? `🔔 每日提醒已开启：每天 ${time} 通知你精读打卡` : '🔔 提醒设置已保存（真机上生效）')
    } else {
      showToast('🔕 每日提醒已关闭')
    }
  }
  reminderToggle?.addEventListener('change', () => void applyReminder())
  reminderTime?.addEventListener('change', () => {
    if (reminderToggle?.checked) void applyReminder()
  })
}
