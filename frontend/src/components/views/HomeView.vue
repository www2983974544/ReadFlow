<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useUiStore } from '../../stores/ui'
import { initHomeView } from '../../legacy/home'

const ui = useUiStore()

onMounted(() => {
  initHomeView()
})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {
    if (v === 'home') {
      initHomeView()
    }
  },
)
</script>

<template>
<section id="viewHome" class="single-view-scroll-pane">
      <!-- Photorealistic Deep-Space Milky Way, Aurora Curtains & Gravitational Halo Container -->
      <div id="cosmosHeroWrapper" class="cosmos-hero-card px-4 py-4 sm:px-8 sm:py-5">
        <!-- 60FPS Multi-Layer Milky Way Nebula, Aurora Ribbons, Starburst Stars & Interactive Stardust Wake Canvas -->
        <canvas id="cosmosStarfieldCanvas"></canvas>
        <div class="cosmos-vignette-overlay"></div>

        <!-- Top Minimalist Haute-Horlogerie Header -->
        <div class="relative z-10 text-center space-y-1">
          <div class="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.26em] uppercase bg-slate-950/50 text-sky-200/90 border border-sky-300/20 backdrop-blur-md shadow-sm">
            <span class="text-cyan-300">✦</span>
            <span>CELESTIAL HORIZON · 沉浸式外刊精读系统</span>
            <span class="text-cyan-300">✦</span>
          </div>
          <h2 class="readflow-neon-title" style="margin:0;">READFLOW</h2>
        </div>

        <!-- CENTERPIECE: HAUTE-HORLOGERIE SAPPHIRE ORBITAL RING COUNTDOWN (3D Perspective + 180 Gaussian Wave Ticks) -->
        <div id="heroCountdownTrigger" title="点击中央蓝宝石星环立即进入外刊精读" class="relative z-10 luxury-orbital-ring-trigger">
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

            <!-- Outer Celestial Equatorial Gimbal Rings (r=222 & r=215) -->
            <circle cx="230" cy="230" r="222" fill="none" stroke="rgba(186, 230, 253, 0.10)" stroke-width="0.6" />
            <circle cx="230" cy="230" r="222" fill="none" stroke="url(#gradGoldFiligree)" stroke-width="1.2" stroke-dasharray="36 196 8 108" class="orbit-spin-cw" />
            <circle cx="230" cy="230" r="214" fill="none" stroke="rgba(165, 180, 252, 0.20)" stroke-width="0.75" stroke-dasharray="3 15" class="orbit-spin-ccw" />

            <!-- 4 Cardinal Diamond Reticles (N / E / S / W) -->
            <polygon points="230,3 233,8 230,13 227,8" fill="#7dd3fc" opacity="0.8" />
            <polygon points="457,230 452,233 447,230 452,227" fill="#7dd3fc" opacity="0.6" />
            <polygon points="230,457 233,452 230,447 227,452" fill="#7dd3fc" opacity="0.8" />
            <polygon points="3,230 8,233 13,230 8,227" fill="#7dd3fc" opacity="0.6" />

            <!-- 180 Laser-Etched Vernier Scale Segments with 60FPS Gaussian Light Wave (r=196..208) -->
            <g>
              <line id="ringTick-0" x1="230.00" y1="34.00" x2="230.00" y2="21.50" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.6" stroke-linecap="round" />
                <line id="ringTick-1" x1="237.00" y1="29.62" x2="237.14" y2="25.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-2" x1="243.99" y1="29.99" x2="244.27" y2="26.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-3" x1="250.96" y1="30.60" x2="251.38" y2="26.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-4" x1="257.90" y1="31.45" x2="258.46" y2="27.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-5" x1="264.82" y1="32.55" x2="265.51" y2="28.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-6" x1="271.69" y1="33.88" x2="272.52" y2="29.97" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-7" x1="278.51" y1="35.46" x2="279.47" y2="31.57" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-8" x1="285.27" y1="37.27" x2="286.37" y2="33.42" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-9" x1="291.96" y1="39.31" x2="293.19" y2="35.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-10" x1="298.58" y1="41.59" x2="299.94" y2="37.83" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-11" x1="305.11" y1="44.10" x2="306.61" y2="40.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-12" x1="311.55" y1="46.83" x2="313.18" y2="43.18" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-13" x1="317.89" y1="49.79" x2="319.65" y2="46.20" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-14" x1="324.13" y1="52.97" x2="326.01" y2="49.44" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-15" x1="329.25" y1="58.09" x2="333.00" y2="51.60" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-16" x1="336.25" y1="59.97" x2="338.37" y2="56.57" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-17" x1="342.12" y1="63.78" x2="344.35" y2="60.46" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-18" x1="347.85" y1="67.79" x2="350.20" y2="64.56" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-19" x1="353.44" y1="72.00" x2="355.90" y2="68.85" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-20" x1="358.88" y1="76.41" x2="361.45" y2="73.34" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-21" x1="364.16" y1="81.00" x2="366.84" y2="78.03" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-22" x1="369.28" y1="85.77" x2="372.06" y2="82.90" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-23" x1="374.23" y1="90.72" x2="377.10" y2="87.94" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-24" x1="379.00" y1="95.84" x2="381.97" y2="93.16" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-25" x1="383.59" y1="101.12" x2="386.66" y2="98.55" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-26" x1="388.00" y1="106.56" x2="391.15" y2="104.10" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-27" x1="392.21" y1="112.15" x2="395.44" y2="109.80" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-28" x1="396.22" y1="117.88" x2="399.54" y2="115.65" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-29" x1="400.03" y1="123.75" x2="403.43" y2="121.63" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-30" x1="401.91" y1="130.75" x2="408.40" y2="127.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-31" x1="407.03" y1="135.87" x2="410.56" y2="133.99" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-32" x1="410.21" y1="142.11" x2="413.80" y2="140.35" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-33" x1="413.17" y1="148.45" x2="416.82" y2="146.82" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-34" x1="415.90" y1="154.89" x2="419.61" y2="153.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-35" x1="418.41" y1="161.42" x2="422.17" y2="160.06" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-36" x1="420.69" y1="168.04" x2="424.49" y2="166.81" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-37" x1="422.73" y1="174.73" x2="426.58" y2="173.63" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-38" x1="424.54" y1="181.49" x2="428.43" y2="180.53" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-39" x1="426.12" y1="188.31" x2="430.03" y2="187.48" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-40" x1="427.45" y1="195.18" x2="431.39" y2="194.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-41" x1="428.55" y1="202.10" x2="432.51" y2="201.54" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-42" x1="429.40" y1="209.04" x2="433.38" y2="208.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-43" x1="430.01" y1="216.01" x2="434.00" y2="215.73" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-44" x1="430.38" y1="223.00" x2="434.38" y2="222.86" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-45" x1="426.00" y1="230.00" x2="438.50" y2="230.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.6" stroke-linecap="round" />
                <line id="ringTick-46" x1="430.38" y1="237.00" x2="434.38" y2="237.14" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-47" x1="430.01" y1="243.99" x2="434.00" y2="244.27" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-48" x1="429.40" y1="250.96" x2="433.38" y2="251.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-49" x1="428.55" y1="257.90" x2="432.51" y2="258.46" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-50" x1="427.45" y1="264.82" x2="431.39" y2="265.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-51" x1="426.12" y1="271.69" x2="430.03" y2="272.52" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-52" x1="424.54" y1="278.51" x2="428.43" y2="279.47" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-53" x1="422.73" y1="285.27" x2="426.58" y2="286.37" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-54" x1="420.69" y1="291.96" x2="424.49" y2="293.19" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-55" x1="418.41" y1="298.58" x2="422.17" y2="299.94" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-56" x1="415.90" y1="305.11" x2="419.61" y2="306.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-57" x1="413.17" y1="311.55" x2="416.82" y2="313.18" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-58" x1="410.21" y1="317.89" x2="413.80" y2="319.65" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-59" x1="407.03" y1="324.13" x2="410.56" y2="326.01" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-60" x1="401.91" y1="329.25" x2="408.40" y2="333.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-61" x1="400.03" y1="336.25" x2="403.43" y2="338.37" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-62" x1="396.22" y1="342.12" x2="399.54" y2="344.35" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-63" x1="392.21" y1="347.85" x2="395.44" y2="350.20" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-64" x1="388.00" y1="353.44" x2="391.15" y2="355.90" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-65" x1="383.59" y1="358.88" x2="386.66" y2="361.45" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-66" x1="379.00" y1="364.16" x2="381.97" y2="366.84" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-67" x1="374.23" y1="369.28" x2="377.10" y2="372.06" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-68" x1="369.28" y1="374.23" x2="372.06" y2="377.10" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-69" x1="364.16" y1="379.00" x2="366.84" y2="381.97" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-70" x1="358.88" y1="383.59" x2="361.45" y2="386.66" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-71" x1="353.44" y1="388.00" x2="355.90" y2="391.15" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-72" x1="347.85" y1="392.21" x2="350.20" y2="395.44" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-73" x1="342.12" y1="396.22" x2="344.35" y2="399.54" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-74" x1="336.25" y1="400.03" x2="338.37" y2="403.43" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-75" x1="329.25" y1="401.91" x2="333.00" y2="408.40" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-76" x1="324.13" y1="407.03" x2="326.01" y2="410.56" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-77" x1="317.89" y1="410.21" x2="319.65" y2="413.80" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-78" x1="311.55" y1="413.17" x2="313.18" y2="416.82" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-79" x1="305.11" y1="415.90" x2="306.61" y2="419.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-80" x1="298.58" y1="418.41" x2="299.94" y2="422.17" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-81" x1="291.96" y1="420.69" x2="293.19" y2="424.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-82" x1="285.27" y1="422.73" x2="286.37" y2="426.58" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-83" x1="278.51" y1="424.54" x2="279.47" y2="428.43" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-84" x1="271.69" y1="426.12" x2="272.52" y2="430.03" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-85" x1="264.82" y1="427.45" x2="265.51" y2="431.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-86" x1="257.90" y1="428.55" x2="258.46" y2="432.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-87" x1="250.96" y1="429.40" x2="251.38" y2="433.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-88" x1="243.99" y1="430.01" x2="244.27" y2="434.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-89" x1="237.00" y1="430.38" x2="237.14" y2="434.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-90" x1="230.00" y1="426.00" x2="230.00" y2="438.50" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.6" stroke-linecap="round" />
                <line id="ringTick-91" x1="223.00" y1="430.38" x2="222.86" y2="434.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-92" x1="216.01" y1="430.01" x2="215.73" y2="434.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-93" x1="209.04" y1="429.40" x2="208.62" y2="433.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-94" x1="202.10" y1="428.55" x2="201.54" y2="432.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-95" x1="195.18" y1="427.45" x2="194.49" y2="431.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-96" x1="188.31" y1="426.12" x2="187.48" y2="430.03" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-97" x1="181.49" y1="424.54" x2="180.53" y2="428.43" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-98" x1="174.73" y1="422.73" x2="173.63" y2="426.58" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-99" x1="168.04" y1="420.69" x2="166.81" y2="424.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-100" x1="161.42" y1="418.41" x2="160.06" y2="422.17" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-101" x1="154.89" y1="415.90" x2="153.39" y2="419.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-102" x1="148.45" y1="413.17" x2="146.82" y2="416.82" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-103" x1="142.11" y1="410.21" x2="140.35" y2="413.80" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-104" x1="135.87" y1="407.03" x2="133.99" y2="410.56" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-105" x1="130.75" y1="401.91" x2="127.00" y2="408.40" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-106" x1="123.75" y1="400.03" x2="121.63" y2="403.43" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-107" x1="117.88" y1="396.22" x2="115.65" y2="399.54" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-108" x1="112.15" y1="392.21" x2="109.80" y2="395.44" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-109" x1="106.56" y1="388.00" x2="104.10" y2="391.15" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-110" x1="101.12" y1="383.59" x2="98.55" y2="386.66" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-111" x1="95.84" y1="379.00" x2="93.16" y2="381.97" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-112" x1="90.72" y1="374.23" x2="87.94" y2="377.10" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-113" x1="85.77" y1="369.28" x2="82.90" y2="372.06" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-114" x1="81.00" y1="364.16" x2="78.03" y2="366.84" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-115" x1="76.41" y1="358.88" x2="73.34" y2="361.45" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-116" x1="72.00" y1="353.44" x2="68.85" y2="355.90" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-117" x1="67.79" y1="347.85" x2="64.56" y2="350.20" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-118" x1="63.78" y1="342.12" x2="60.46" y2="344.35" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-119" x1="59.97" y1="336.25" x2="56.57" y2="338.37" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-120" x1="58.09" y1="329.25" x2="51.60" y2="333.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-121" x1="52.97" y1="324.13" x2="49.44" y2="326.01" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-122" x1="49.79" y1="317.89" x2="46.20" y2="319.65" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-123" x1="46.83" y1="311.55" x2="43.18" y2="313.18" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-124" x1="44.10" y1="305.11" x2="40.39" y2="306.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-125" x1="41.59" y1="298.58" x2="37.83" y2="299.94" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-126" x1="39.31" y1="291.96" x2="35.51" y2="293.19" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-127" x1="37.27" y1="285.27" x2="33.42" y2="286.37" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-128" x1="35.46" y1="278.51" x2="31.57" y2="279.47" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-129" x1="33.88" y1="271.69" x2="29.97" y2="272.52" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-130" x1="32.55" y1="264.82" x2="28.61" y2="265.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-131" x1="31.45" y1="257.90" x2="27.49" y2="258.46" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-132" x1="30.60" y1="250.96" x2="26.62" y2="251.38" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-133" x1="29.99" y1="243.99" x2="26.00" y2="244.27" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-134" x1="29.62" y1="237.00" x2="25.62" y2="237.14" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-135" x1="34.00" y1="230.00" x2="21.50" y2="230.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.6" stroke-linecap="round" />
                <line id="ringTick-136" x1="29.62" y1="223.00" x2="25.62" y2="222.86" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-137" x1="29.99" y1="216.01" x2="26.00" y2="215.73" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-138" x1="30.60" y1="209.04" x2="26.62" y2="208.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-139" x1="31.45" y1="202.10" x2="27.49" y2="201.54" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-140" x1="32.55" y1="195.18" x2="28.61" y2="194.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-141" x1="33.88" y1="188.31" x2="29.97" y2="187.48" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-142" x1="35.46" y1="181.49" x2="31.57" y2="180.53" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-143" x1="37.27" y1="174.73" x2="33.42" y2="173.63" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-144" x1="39.31" y1="168.04" x2="35.51" y2="166.81" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-145" x1="41.59" y1="161.42" x2="37.83" y2="160.06" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-146" x1="44.10" y1="154.89" x2="40.39" y2="153.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-147" x1="46.83" y1="148.45" x2="43.18" y2="146.82" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-148" x1="49.79" y1="142.11" x2="46.20" y2="140.35" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-149" x1="52.97" y1="135.87" x2="49.44" y2="133.99" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-150" x1="58.09" y1="130.75" x2="51.60" y2="127.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-151" x1="59.97" y1="123.75" x2="56.57" y2="121.63" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-152" x1="63.78" y1="117.88" x2="60.46" y2="115.65" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-153" x1="67.79" y1="112.15" x2="64.56" y2="109.80" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-154" x1="72.00" y1="106.56" x2="68.85" y2="104.10" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-155" x1="76.41" y1="101.12" x2="73.34" y2="98.55" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-156" x1="81.00" y1="95.84" x2="78.03" y2="93.16" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-157" x1="85.77" y1="90.72" x2="82.90" y2="87.94" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-158" x1="90.72" y1="85.77" x2="87.94" y2="82.90" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-159" x1="95.84" y1="81.00" x2="93.16" y2="78.03" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-160" x1="101.12" y1="76.41" x2="98.55" y2="73.34" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-161" x1="106.56" y1="72.00" x2="104.10" y2="68.85" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-162" x1="112.15" y1="67.79" x2="109.80" y2="64.56" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-163" x1="117.88" y1="63.78" x2="115.65" y2="60.46" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-164" x1="123.75" y1="59.97" x2="121.63" y2="56.57" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-165" x1="130.75" y1="58.09" x2="127.00" y2="51.60" stroke="rgba(226, 232, 240, 0.15)" stroke-width="1.1" stroke-linecap="round" />
                <line id="ringTick-166" x1="135.87" y1="52.97" x2="133.99" y2="49.44" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-167" x1="142.11" y1="49.79" x2="140.35" y2="46.20" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-168" x1="148.45" y1="46.83" x2="146.82" y2="43.18" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-169" x1="154.89" y1="44.10" x2="153.39" y2="40.39" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-170" x1="161.42" y1="41.59" x2="160.06" y2="37.83" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-171" x1="168.04" y1="39.31" x2="166.81" y2="35.51" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-172" x1="174.73" y1="37.27" x2="173.63" y2="33.42" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-173" x1="181.49" y1="35.46" x2="180.53" y2="31.57" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-174" x1="188.31" y1="33.88" x2="187.48" y2="29.97" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-175" x1="195.18" y1="32.55" x2="194.49" y2="28.61" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-176" x1="202.10" y1="31.45" x2="201.54" y2="27.49" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-177" x1="209.04" y1="30.60" x2="208.62" y2="26.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-178" x1="216.01" y1="29.99" x2="215.73" y2="26.00" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
                <line id="ringTick-179" x1="223.00" y1="29.62" x2="222.86" y2="25.62" stroke="rgba(226, 232, 240, 0.15)" stroke-width="0.75" stroke-linecap="round" />
            </g>

            <!-- Recessed Sapphire Track + Dual Specular Hairlines for Primary Ring (r=182, C = 1143.54) -->
            <circle cx="230" cy="230" r="185.5" fill="none" stroke="rgba(186, 230, 253, 0.14)" stroke-width="0.6" />
            <circle cx="230" cy="230" r="182" fill="none" stroke="rgba(15, 23, 42, 0.65)" stroke-width="5" />
            <circle cx="230" cy="230" r="178.5" fill="none" stroke="rgba(186, 230, 253, 0.12)" stroke-width="0.6" />

            <!-- Primary Luminous Countdown Progress Ring (r=182, Circumference = 1143.54) -->
            <circle id="clockRingDays" cx="230" cy="230" r="182" fill="none" stroke="url(#gradPrimaryRing)" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="1143.54" stroke-dashoffset="280" transform="rotate(-90 230 230)" filter="url(#ringNeonGlow)" />

            <!-- Leading 4-Point Starburst Photon Node on Primary Ring (at y = 230 - 182 = 48) -->
            <g id="daysPhotonGroup" transform="rotate(0 230 230)">
              <circle cx="230" cy="48" r="7" fill="rgba(125, 211, 252, 0.4)" filter="url(#ringNeonGlow)" />
              <line x1="220" y1="48" x2="240" y2="48" stroke="#ffffff" stroke-width="1.1" opacity="0.9" />
              <line x1="230" y1="38" x2="230" y2="58" stroke="#ffffff" stroke-width="1.1" opacity="0.9" />
              <circle cx="230" cy="48" r="2.8" fill="#ffffff" />
            </g>

            <!-- Inner 60FPS Silky-Smooth Seconds Orbital Ring (r=162, Circumference = 1017.88) -->
            <circle cx="230" cy="230" r="162" fill="none" stroke="rgba(148, 163, 184, 0.10)" stroke-width="1.4" />
            <circle id="clockRingSeconds" cx="230" cy="230" r="162" fill="none" stroke="url(#gradSecondsPulse)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1017.88" stroke-dashoffset="320" transform="rotate(-90 230 230)" />

            <!-- Leading Starburst Comet Node on Inner 60s Ring (at y = 230 - 162 = 68) -->
            <g id="secsPhotonGroup" transform="rotate(0 230 230)">
              <circle cx="230" cy="68" r="5.5" fill="rgba(165, 243, 252, 0.55)" filter="url(#ringNeonGlow)" />
              <line x1="222" y1="68" x2="238" y2="68" stroke="#e0f2fe" stroke-width="0.95" />
              <line x1="230" y1="60" x2="230" y2="76" stroke="#e0f2fe" stroke-width="0.95" />
              <circle cx="230" cy="68" r="2.3" fill="#ffffff" />
            </g>

            <!-- Inner Sacred Astrolabe Filigree & Specular Rim (r=146) -->
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

          <!-- Pure, Museum-Grade Countdown Typography Inside the Sapphire Ring -->
          <div class="ring-center-hud space-y-2.5">
            <div class="px-3 py-0.5 rounded-full bg-white/5 border border-sky-300/20 text-[9.5px] font-bold tracking-[0.28em] text-sky-200/90 uppercase shadow-sm">
              <span id="clockInnerExamBadge">T-MINUS · 英语六级</span>
            </div>

            <!-- Monumental Platinum-Ice Days Numeral -->
            <div class="flex flex-col items-center">
              <div id="cdDays" class="hero-days-number">49</div>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="w-5 h-[1px] bg-gradient-to-r from-transparent to-sky-400/60"></span>
                <span class="text-[9.5px] font-bold tracking-[0.38em] text-sky-200/80 uppercase">DAYS REMAINING</span>
                <span class="w-5 h-[1px] bg-gradient-to-l from-transparent to-sky-400/60"></span>
              </div>
            </div>

            <!-- Floating Sapphire Glass Capsule for HRS / MIN / SEC -->
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

        <!-- Bottom Subtitle, Shimmer CTA Pill & Vision-Pro Glass Command Dock -->
        <div class="relative z-10 text-center space-y-2.5">
          <div class="space-y-1.5">
            <p id="cdSubtitleLine" class="text-xs sm:text-sm font-medium text-slate-200/95 tracking-wider" style="margin:0;">
              距离 <span class="text-cyan-300 font-bold">英语六级</span> 考试还有 <span class="text-white font-bold">49</span> 天 <span class="text-white font-bold">08</span> 小时 <span class="text-white font-bold">37</span> 分钟 <span class="text-cyan-300 font-bold">42</span> 秒
            </p>
            <div>
              <button type="button" class="enter-reader-cta-pill" data-home-cta>
                <span>✦</span>
                <span>点击星环 · 开启今日外刊精读</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <!-- Exam Type & Target Date Customizer Bar -->
          <div id="heroConfigBar" class="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1.5 rounded-full bg-slate-950/65 backdrop-blur-xl border border-sky-300/15 text-xs text-slate-300 shadow-2xl">
            <div class="flex items-center gap-1.5">
              <span class="text-sky-300/90 font-medium">目标考试</span>
              <select id="homeExamTypeSelect" class="rounded-full bg-slate-900/90 text-white border border-slate-700/80 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:border-cyan-400" style="background:#090d16;color:#fff;">
                <option value="英语六级" selected>英语六级 (CET-6)</option>
                <option value="英语四级">英语四级 (CET-4)</option>
                <option value="安徽专升本英语">安徽专升本英语</option>
                <option value="考研英语">考研英语 (NETEM)</option>
                <option value="雅思阅读">雅思阅读 (IELTS)</option>
                <option value="托福阅读">托福阅读 (TOEFL)</option>
                <option value="custom">✏️ 自定义考试名称...</option>
              </select>
              <input id="homeExamCustomInput" type="text" placeholder="输入考试名称..." class="hidden rounded-full bg-slate-900 text-white border border-slate-700 px-2.5 py-0.5 text-xs w-28" style="background:#090d16;color:#fff;" />
            </div>

            <span class="text-slate-700">|</span>

            <div class="flex items-center gap-1.5">
              <span class="text-sky-300/90 font-medium">目标时间</span>
              <input id="homeExamDateInput" type="datetime-local" value="2026-12-19T15:00" class="rounded-full bg-slate-900/90 text-white border border-slate-700/80 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:border-cyan-400" style="background:#090d16;color:#fff;" />
            </div>
          </div>
        </div>
      </div>
    </section>
</template>
