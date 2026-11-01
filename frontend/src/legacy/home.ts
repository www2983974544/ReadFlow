// Home launchpad: cosmos canvas, countdown display & exam config (ported from
// cet_reading_master.html L3398-3442 + init bindings L4810-4860).
import { initCosmosStarfieldCanvas } from './cosmos'
import { S } from './state'
import { showToast } from './ui-fns'
import { useUiStore } from '../stores/ui'

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
    countdownTimerId = window.setInterval(updateHomeCountdownDisplay, 1000)
  }

  const ui = useUiStore()

  // Clicking the Countdown Matrix on the Home Page enters Article Reading Page!
  document.getElementById('heroCountdownTrigger')?.addEventListener('click', () => {
    ui.switchView('reader')
    showToast('📖 已进入外刊精读工作台')
  })

  // CTA pill under the countdown (legacy inline onclick, ported to a binding)
  document.querySelector('[data-home-cta]')?.addEventListener('click', () => {
    document.getElementById('heroCountdownTrigger')?.click()
  })

  // Home Page Exam Type & Date Config Controls
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
}
