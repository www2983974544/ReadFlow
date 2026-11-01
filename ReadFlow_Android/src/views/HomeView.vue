<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui'
import { initHomeView } from '../legacy/home'
import { setCosmosPaused } from '../legacy/cosmos'

const ui = useUiStore()

onMounted(() => {
  initHomeView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened;
// 移动版同时驱动星空暂停（离开首页省 CPU，沿桌面 v2.0 行为）
watch(
  () => ui.activeView,
  (v) => {
    setCosmosPaused(v !== 'home')
    if (v === 'home') {
      initHomeView()
    }
  },
  { immediate: true },
)

// ---- 180 格激光微雕刻度（程序化生成，几何与桌面静态 SVG 一致）----
// 主刻度 i%15==0（r 196→208.5，宽 1.6），中刻度 i%5==0（r 196.5→206，宽 1.1），其余小刻度（r 196→204.2，宽 0.75）
interface Tick {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  w: number
}

const ringTicks = computed<Tick[]>(() => {
  const ticks: Tick[] = []
  for (let i = 0; i < 180; i++) {
    const theta = (i * 2 * Math.PI) / 180
    const sin = Math.sin(theta)
    const cos = Math.cos(theta)
    let r1 = 196
    let r2 = 204.2
    let w = 0.75
    if (i % 15 === 0) {
      r2 = 208.5
      w = 1.6
    } else if (i % 5 === 0) {
      r1 = 196.5
      r2 = 206
      w = 1.1
    }
    ticks.push({
      id: i,
      x1: +(230 + r1 * sin).toFixed(2),
      y1: +(230 - r1 * cos).toFixed(2),
      x2: +(230 + r2 * sin).toFixed(2),
      y2: +(230 - r2 * cos).toFixed(2),
      w,
    })
  }
  return ticks
})
</script>

<template>
  <section id="viewHome" class="view-scroll home-shell">
    <!-- Deep-Space Milky Way / Aurora / Gravitational Halo Container -->
    <div id="cosmosHeroWrapper" class="cosmos-hero-card home-hero-pad">
      <canvas id="cosmosStarfieldCanvas"></canvas>
      <div class="cosmos-vignette-overlay"></div>

      <!-- Top Minimalist Header -->
      <div class="relative z-10 text-center space-y-1">
        <div class="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.26em] uppercase bg-slate-950/50 text-sky-200/90 border border-sky-300/20 backdrop-blur-md shadow-sm">
          <span class="text-cyan-300">✦</span>
          <span>CELESTIAL HORIZON</span>
          <span class="text-cyan-300">✦</span>
        </div>
        <h2 class="readflow-neon-title home-neon-title" style="margin:0">READFLOW</h2>
      </div>

      <!-- Sapphire Orbital Ring Countdown -->
      <div
        id="heroCountdownTrigger"
        title="点击中央蓝宝石星环立即进入外刊精读"
        class="relative z-10 luxury-orbital-ring-trigger"
      >
        <svg viewBox="0 0 460 460" class="w-full h-full overflow-visible relative z-10">
          <defs>
            <filter id="ringNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur1" />
              <feGaussianBlur stdDeviation="9.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gradPrimaryRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="28%" stop-color="#7dd3fc" />
              <stop offset="65%" stop-color="#818cf8" />
              <stop offset="100%" stop-color="#f0abfc" />
            </linearGradient>
            <linearGradient id="gradSecondsPulse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(56, 189, 248, 0.04)" />
              <stop offset="55%" stop-color="rgba(56, 189, 248, 0.62)" />
              <stop offset="88%" stop-color="#a5f3fc" />
              <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <linearGradient id="gradGoldFiligree" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(253, 230, 138, 0.38)" />
              <stop offset="50%" stop-color="rgba(125, 211, 252, 0.25)" />
              <stop offset="100%" stop-color="rgba(196, 181, 253, 0.38)" />
            </linearGradient>
          </defs>

          <!-- Outer Gimbal Rings -->
          <circle cx="230" cy="230" r="222" fill="none" stroke="rgba(186, 230, 253, 0.10)" stroke-width="0.6" />
          <circle cx="230" cy="230" r="222" fill="none" stroke="url(#gradGoldFiligree)" stroke-width="1.2" stroke-dasharray="36 196 8 108" class="orbit-spin-cw" />
          <circle cx="230" cy="230" r="214" fill="none" stroke="rgba(165, 180, 252, 0.20)" stroke-width="0.75" stroke-dasharray="3 15" class="orbit-spin-ccw" />

          <!-- 4 Cardinal Diamond Reticles -->
          <polygon points="230,3 233,8 230,13 227,8" fill="#7dd3fc" opacity="0.8" />
          <polygon points="457,230 452,233 447,230 452,227" fill="#7dd3fc" opacity="0.6" />
          <polygon points="230,457 233,452 230,447 227,452" fill="#7dd3fc" opacity="0.8" />
          <polygon points="3,230 8,233 13,230 8,227" fill="#7dd3fc" opacity="0.6" />

          <!-- 180 Laser-Etched Vernier Ticks with 60FPS Gaussian Light Wave -->
          <g>
            <line
              v-for="t in ringTicks"
              :id="`ringTick-${t.id}`"
              :key="t.id"
              :x1="t.x1"
              :y1="t.y1"
              :x2="t.x2"
              :y2="t.y2"
              stroke="rgba(226, 232, 240, 0.15)"
              :stroke-width="t.w"
              stroke-linecap="round"
            />
          </g>

          <!-- Recessed Sapphire Track + Primary Luminous Ring (r=182) -->
          <circle cx="230" cy="230" r="185.5" fill="none" stroke="rgba(186, 230, 253, 0.14)" stroke-width="0.6" />
          <circle cx="230" cy="230" r="182" fill="none" stroke="rgba(15, 23, 42, 0.65)" stroke-width="5" />
          <circle cx="230" cy="230" r="178.5" fill="none" stroke="rgba(186, 230, 253, 0.12)" stroke-width="0.6" />
          <circle id="clockRingDays" cx="230" cy="230" r="182" fill="none" stroke="url(#gradPrimaryRing)" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="1143.54" stroke-dashoffset="280" transform="rotate(-90 230 230)" filter="url(#ringNeonGlow)" />

          <!-- Leading Starburst Photon Node on Primary Ring -->
          <g id="daysPhotonGroup" transform="rotate(0 230 230)">
            <circle cx="230" cy="48" r="7" fill="rgba(125, 211, 252, 0.4)" filter="url(#ringNeonGlow)" />
            <line x1="220" y1="48" x2="240" y2="48" stroke="#ffffff" stroke-width="1.1" opacity="0.9" />
            <line x1="230" y1="38" x2="230" y2="58" stroke="#ffffff" stroke-width="1.1" opacity="0.9" />
            <circle cx="230" cy="48" r="2.8" fill="#ffffff" />
          </g>

          <!-- Inner 60FPS Seconds Orbital Ring (r=162) -->
          <circle cx="230" cy="230" r="162" fill="none" stroke="rgba(148, 163, 184, 0.10)" stroke-width="1.4" />
          <circle id="clockRingSeconds" cx="230" cy="230" r="162" fill="none" stroke="url(#gradSecondsPulse)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1017.88" stroke-dashoffset="320" transform="rotate(-90 230 230)" />

          <!-- Leading Comet Node on Inner 60s Ring -->
          <g id="secsPhotonGroup" transform="rotate(0 230 230)">
            <circle cx="230" cy="68" r="5.5" fill="rgba(165, 243, 252, 0.55)" filter="url(#ringNeonGlow)" />
            <line x1="222" y1="68" x2="238" y2="68" stroke="#e0f2fe" stroke-width="0.95" />
            <line x1="230" y1="60" x2="230" y2="76" stroke="#e0f2fe" stroke-width="0.95" />
            <circle cx="230" cy="68" r="2.3" fill="#ffffff" />
          </g>

          <!-- Inner Astrolabe Filigree & Specular Rim -->
          <g>
            <line x1="368.0" y1="230.0" x2="92.0" y2="230.0" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="357.5" y1="282.8" x2="102.5" y2="177.2" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="327.6" y1="327.6" x2="132.4" y2="132.4" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="282.8" y1="357.5" x2="177.2" y2="102.5" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="230.0" y1="368.0" x2="230.0" y2="92.0" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="177.2" y1="357.5" x2="282.8" y2="102.5" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="132.4" y1="327.6" x2="327.6" y2="132.4" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
            <line x1="102.5" y1="282.8" x2="357.5" y2="177.2" stroke="rgba(125, 211, 252, 0.06)" stroke-width="0.6" />
          </g>
          <circle cx="230" cy="230" r="146" fill="none" stroke="url(#gradGoldFiligree)" stroke-width="0.85" />
          <circle cx="230" cy="230" r="138" fill="none" stroke="rgba(186, 230, 253, 0.10)" stroke-width="0.6" stroke-dasharray="2 6" />
        </svg>

        <!-- Countdown Typography Inside the Ring -->
        <div class="ring-center-hud space-y-2.5">
          <div class="px-3 py-0.5 rounded-full bg-white/5 border border-sky-300/20 text-[9.5px] font-bold tracking-[0.28em] text-sky-200/90 uppercase shadow-sm">
            <span id="clockInnerExamBadge">T-MINUS · 英语六级</span>
          </div>

          <div class="flex flex-col items-center">
            <div id="cdDays" class="hero-days-number home-days-num">49</div>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="w-5 h-[1px] bg-gradient-to-r from-transparent to-sky-400/60"></span>
              <span class="text-[9.5px] font-bold tracking-[0.38em] text-sky-200/80 uppercase">DAYS REMAINING</span>
              <span class="w-5 h-[1px] bg-gradient-to-l from-transparent to-sky-400/60"></span>
            </div>
          </div>

          <div class="sapphire-hms-capsule">
            <div class="sub-hms-unit">
              <span id="cdHours" class="sub-hms-val">08</span>
              <span class="sub-hms-lbl">HRS</span>
            </div>
            <span class="sub-hms-sep">·</span>
            <div class="sub-hms-unit">
              <span id="cdMinutes" class="sub-hms-val">37</span>
              <span class="sub-hms-lbl">MIN</span>
            </div>
            <span class="sub-hms-sep">·</span>
            <div class="sub-hms-unit">
              <span id="cdSeconds" class="sub-hms-val text-cyan-300">42</span>
              <span class="sub-hms-lbl">SEC</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subtitle, CTA & Exam Config Dock（移动端纵向居中排列） -->
      <div class="relative z-10 text-center space-y-2.5 w-full max-w-md mx-auto px-2">
        <div class="space-y-1.5">
          <p id="cdSubtitleLine" class="text-xs font-medium text-slate-200/95 tracking-wider leading-relaxed" style="margin: 0"></p>
          <div>
            <button type="button" class="enter-reader-cta-pill" data-home-cta>
              <span>✦</span>
              <span>点击星环 · 开启今日外刊精读</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- Exam Type & Target Date Config（移动：两行卡片式，控件居中） -->
        <div id="heroConfigBar" class="home-config-bar">
          <div class="home-config-row">
            <span class="text-sky-300/90 font-medium text-xs shrink-0">目标考试</span>
            <select id="homeExamTypeSelect" class="home-config-select">
              <option value="英语六级" selected>英语六级 (CET-6)</option>
              <option value="英语四级">英语四级 (CET-4)</option>
              <option value="安徽专升本英语">安徽专升本英语</option>
              <option value="考研英语">考研英语 (NETEM)</option>
              <option value="雅思阅读">雅思阅读 (IELTS)</option>
              <option value="托福阅读">托福阅读 (TOEFL)</option>
              <option value="custom">✏️ 自定义考试名称...</option>
            </select>
          </div>
          <input id="homeExamCustomInput" type="text" placeholder="输入考试名称..." class="hidden home-config-input w-full" />
          <div class="home-config-row">
            <span class="text-sky-300/90 font-medium text-xs shrink-0">目标时间</span>
            <input id="homeExamDateInput" type="datetime-local" value="2026-12-19T15:00" class="home-config-input flex-1" />
          </div>
          <!-- 每日学习提醒（v1.1）：本地每日定时通知 -->
          <div class="home-config-row">
            <label class="flex items-center gap-1.5 text-xs text-sky-300/90 font-medium shrink-0 cursor-pointer select-none">
              <input id="homeReminderToggle" type="checkbox" class="reminder-toggle" />
              <span>🔔 每日提醒</span>
            </label>
            <input id="homeReminderTime" type="time" value="20:00" class="home-config-input flex-1" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-shell {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 8px;
}
.home-hero-pad {
  padding: 14px 10px 16px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}
.home-neon-title {
  font-size: clamp(1.7rem, 8vw, 2.6rem);
}
.home-days-num {
  font-size: clamp(3.4rem, 17vw, 4.8rem);
}
.home-config-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(2, 6, 23, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(125, 211, 252, 0.15);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
.home-config-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.home-config-select,
.home-config-input {
  border-radius: 999px;
  background: rgba(9, 13, 22, 0.9);
  color: #ffffff;
  border: 1px solid rgba(51, 65, 85, 0.8);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  outline: none;
  min-width: 0;
}
.home-config-select {
  max-width: 230px;
}
.home-config-select:focus,
.home-config-input:focus {
  border-color: #22d3ee;
}
.reminder-toggle {
  width: 16px;
  height: 16px;
  accent-color: #22d3ee;
}
</style>
