// Customizable exam timer (ported from cet_reading_master.html L4677-4740).
// 移动版增强：计时运行期间保持屏幕常亮（@capacitor-community/keep-awake，
// Android 走原生，浏览器走 Screen Wake Lock API，均包 try/catch 静默降级）。
import { KeepAwake } from '@capacitor-community/keep-awake'
import { S } from './state'
import { recordTodayStudyDelta, showToast } from './ui-fns'

async function setKeepAwake(on: boolean) {
  try {
    if (on) await KeepAwake.keepAwake()
    else await KeepAwake.allowSleep()
  } catch {
    /* 插件不可用/权限缺失时静默降级 */
  }
}

const state = {
  timerSeconds: 8 * 60,
  timerElapsedSeconds: 0,
  timerRunning: false,
  timerInterval: 0,
}

export function formatTime(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function initTimerDisplay() {
  const s = S()
  state.timerSeconds = s.customTimerMinutes * 60
  const display = document.getElementById('txtTimerDisplay')
  if (display) display.textContent = formatTime(state.timerSeconds) + ' 限时读'
}

export function applyCustomTimerMinutes() {
  const s = S()
  const inputEl = document.getElementById('inputCustomTimerMins') as HTMLInputElement | null
  if (!inputEl) return
  let mins = parseInt(inputEl.value, 10)
  if (isNaN(mins) || mins < 1) mins = 1
  if (mins > 120) mins = 120
  inputEl.value = String(mins)
  s.customTimerMinutes = mins
  clearInterval(state.timerInterval)
  state.timerRunning = false
  state.timerSeconds = mins * 60
  const display = document.getElementById('txtTimerDisplay')
  if (display) display.textContent = formatTime(state.timerSeconds) + ' 限时读'
  showToast(`⏱️ 阅读限时已设定为 ${mins} 分钟 (${formatTime(state.timerSeconds)})`)
}

export function toggleExamTimer() {
  const display = document.getElementById('txtTimerDisplay')
  if (!display) return
  if (state.timerRunning) {
    clearInterval(state.timerInterval)
    state.timerRunning = false
    void setKeepAwake(false)
    display.textContent = '已暂停 (' + formatTime(state.timerSeconds) + ')'
    return
  }
  state.timerRunning = true
  void setKeepAwake(true)
  display.textContent = formatTime(state.timerSeconds) + ' 计时中'
  state.timerInterval = window.setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--
      state.timerElapsedSeconds = (state.timerElapsedSeconds || 0) + 1
      if (state.timerElapsedSeconds % 60 === 0) {
        void recordTodayStudyDelta(1, 0, null)
      }
      display.textContent = formatTime(state.timerSeconds) + ' 计时中'
    } else {
      clearInterval(state.timerInterval)
      state.timerRunning = false
      void setKeepAwake(false)
      display.textContent = '⏰ 时间到！'
      showToast(`⏰ 自定义 ${S().customTimerMinutes} 分钟阅读限时已到！`)
    }
  }, 1000)
}

export function resetExamTimer() {
  const inputEl = document.getElementById('inputCustomTimerMins') as HTMLInputElement | null
  let mins = parseInt(inputEl ? inputEl.value : String(S().customTimerMinutes), 10)
  if (isNaN(mins) || mins < 1) mins = 8
  if (mins > 120) mins = 120
  S().customTimerMinutes = mins
  clearInterval(state.timerInterval)
  state.timerRunning = false
  void setKeepAwake(false)
  state.timerSeconds = mins * 60
  const display = document.getElementById('txtTimerDisplay')
  if (display) display.textContent = formatTime(state.timerSeconds) + ' 限时读'
  showToast(`⏱️ 计时器已重置为 ${formatTime(state.timerSeconds)}`)
}
