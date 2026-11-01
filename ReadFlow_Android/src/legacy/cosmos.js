// Verbatim port of the legacy cosmos canvas engine (cet_reading_master.html
// L2957-3355 + L3356-3397). Plain .js on purpose: excluded from type checking.
import { S } from './state'

function initCosmosStarfieldCanvas() {
      const canvas = document.getElementById("cosmosStarfieldCanvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let width = 0;
      let height = 0;

      const nebulaCanvas = document.createElement("canvas");
      const nebCtx = nebulaCanvas.getContext("2d");

      const fieldStars = [];
      const brightSpikeStars = [];
      const orbitDust = [];
      const shootingStars = [];
      const cursorParticles = [];

      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const heroWrap = document.getElementById("cosmosHeroWrapper");
      const ringEl = document.getElementById("heroCountdownTrigger");

      if (heroWrap) {
        heroWrap.addEventListener("mousemove", (e) => {
          const rect = heroWrap.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
          const normY = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
          targetMouseX = normX * 32;
          targetMouseY = normY * 32;

          // Subtle 3D Haute-Horlogerie perspective tilt on the Sapphire Orbital Ring
          if (ringEl) {
            const rotY = (normX * 11).toFixed(2);
            const rotX = (-normY * 11).toFixed(2);
            ringEl.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.015)`;
          }

          // Spawn delicate interactive stardust wake along cursor path
          if (cursorParticles.length < 45 && Math.random() < 0.65) {
            cursorParticles.push({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6 - 0.2,
              r: 0.8 + Math.random() * 1.4,
              alpha: 0.75,
              color: Math.random() < 0.5 ? "#7dd3fc" : "#e0f2fe"
            });
          }
        });

        heroWrap.addEventListener("mouseleave", () => {
          targetMouseX = 0;
          targetMouseY = 0;
          if (ringEl) {
            ringEl.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
          }
        });
      }

      let rngSeed = 42197;
      function nextRand() {
        rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
        return rngSeed / 4294967296;
      }

      function buildNebulaOffscreenBuffer(w, h) {
        nebulaCanvas.width = w;
        nebulaCanvas.height = h;
        rngSeed = 42197;

        // 1. Deep Intergalactic Obsidian Void Base
        const bgGrad = nebCtx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, "#010206");
        bgGrad.addColorStop(0.42, "#030716");
        bgGrad.addColorStop(0.68, "#050b20");
        bgGrad.addColorStop(1, "#010207");
        nebCtx.fillStyle = bgGrad;
        nebCtx.fillRect(0, 0, w, h);

        // 2. Diagonal Milky Way Galactic Core & Multi-Spectral Volumetric Nebula
        nebCtx.save();
        nebCtx.globalCompositeOperation = "screen";

        const nebulaPalette = [
          [14, 165, 233, 0.058],   // Orion Sapphire Cyan
          [56, 189, 248, 0.048],   // Ice Diamond Blue
          [79, 70, 229, 0.065],    // Deep Royal Indigo
          [139, 92, 246, 0.052],   // Carina Amethyst Violet
          [217, 70, 239, 0.036],   // Rosette Nebula Magenta
          [251, 191, 36, 0.028],   // Warm Galactic Core Gold
          [45, 212, 191, 0.032]    // Celestial Teal
        ];

        for (let i = 0; i < 72; i++) {
          const t = nextRand();
          const spread = (nextRand() - 0.5) * 0.52;
          const cx = w * (0.08 + t * 0.84 + spread * 0.38);
          const cy = h * (0.90 - t * 0.80 + spread * 0.48);
          const radius = Math.max(w, h) * (0.11 + nextRand() * 0.26);
          const col = nebulaPalette[Math.floor(nextRand() * nebulaPalette.length)];

          const g = nebCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          g.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${col[3]})`);
          g.addColorStop(0.45, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${col[3] * 0.45})`);
          g.addColorStop(1, "rgba(0, 0, 0, 0)");
          nebCtx.fillStyle = g;
          nebCtx.beginPath();
          nebCtx.arc(cx, cy, radius, 0, Math.PI * 2);
          nebCtx.fill();
        }

        // 3. Dark Cosmic Dust Rifts along the Galactic Plane
        nebCtx.globalCompositeOperation = "multiply";
        for (let i = 0; i < 20; i++) {
          const t = 0.12 + nextRand() * 0.76;
          const cx = w * (t + (nextRand() - 0.5) * 0.14);
          const cy = h * (1 - t + (nextRand() - 0.5) * 0.14);
          const r = Math.max(w, h) * (0.06 + nextRand() * 0.12);
          const dg = nebCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
          dg.addColorStop(0, "rgba(1, 3, 10, 0.58)");
          dg.addColorStop(1, "rgba(255, 255, 255, 1)");
          nebCtx.fillStyle = dg;
          nebCtx.beginPath();
          nebCtx.arc(cx, cy, r, 0, Math.PI * 2);
          nebCtx.fill();
        }

        // 4. 1,450 Dense Milky Way Starlight Dust Grains
        nebCtx.globalCompositeOperation = "screen";
        const dustColors = ["#ffffff", "#e0f2fe", "#bae6fd", "#c7d2fe", "#fde68a", "#f5d0fe"];
        for (let i = 0; i < 1450; i++) {
          const alongBand = i < 950;
          let sx, sy;
          if (alongBand) {
            const t = nextRand();
            const gauss = (nextRand() + nextRand() + nextRand() - 1.5) * 0.21;
            sx = w * (t + gauss * 0.42);
            sy = h * (0.92 - t * 0.84 + gauss * 0.52);
          } else {
            sx = nextRand() * w;
            sy = nextRand() * h;
          }
          const sr = 0.22 + nextRand() * 0.65;
          nebCtx.fillStyle = dustColors[Math.floor(nextRand() * dustColors.length)];
          nebCtx.globalAlpha = 0.12 + nextRand() * 0.50;
          nebCtx.beginPath();
          nebCtx.arc(sx, sy, sr, 0, Math.PI * 2);
          nebCtx.fill();
        }

        // 5. Distant Andromeda-Style Spiral Galaxy in Upper-Left & Star Cluster in Lower-Right
        const drawDistantGalaxy = (gx, gy, tilt, scaleX, scaleY, radius) => {
          nebCtx.save();
          nebCtx.translate(gx, gy);
          nebCtx.rotate(tilt);
          nebCtx.scale(scaleX, scaleY);
          const galGrad = nebCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
          galGrad.addColorStop(0, "rgba(255, 255, 255, 0.82)");
          galGrad.addColorStop(0.2, "rgba(224, 242, 254, 0.45)");
          galGrad.addColorStop(0.55, "rgba(129, 140, 248, 0.15)");
          galGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          nebCtx.fillStyle = galGrad;
          nebCtx.globalAlpha = 0.85;
          nebCtx.beginPath();
          nebCtx.arc(0, 0, radius, 0, Math.PI * 2);
          nebCtx.fill();
          nebCtx.restore();
        };
        drawDistantGalaxy(w * 0.15, h * 0.22, -0.42, 2.5, 0.72, 46);
        drawDistantGalaxy(w * 0.84, h * 0.76, 0.35, 1.9, 0.68, 34);

        nebCtx.restore();
      }

      function populateDynamicStars(w, h) {
        fieldStars.length = 0;
        brightSpikeStars.length = 0;
        orbitDust.length = 0;

        const starColors = ["#ffffff", "#e0f2fe", "#7dd3fc", "#c7d2fe", "#fef08a", "#f5d0fe"];
        for (let i = 0; i < 440; i++) {
          const depth = 0.2 + Math.random() * 0.8;
          fieldStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            z: depth,
            r: (0.4 + Math.random() * 1.15) * depth,
            baseAlpha: 0.25 + Math.random() * 0.65,
            speed: 0.012 + Math.random() * 0.035,
            phase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)]
          });
        }

        for (let i = 0; i < 28; i++) {
          brightSpikeStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            z: 0.6 + Math.random() * 0.5,
            r: 1.5 + Math.random() * 1.4,
            spikeLen: 11 + Math.random() * 19,
            phase: Math.random() * Math.PI * 2,
            speed: 0.015 + Math.random() * 0.025,
            color: i % 3 === 0 ? "#7dd3fc" : i % 3 === 1 ? "#ffffff" : "#c4b5fd"
          });
        }

        for (let i = 0; i < 110; i++) {
          orbitDust.push({
            angle: Math.random() * Math.PI * 2,
            radius: 190 + Math.random() * 155,
            angSpeed: (0.0005 + Math.random() * 0.0014) * (i % 2 === 0 ? 1 : -0.75),
            size: 0.5 + Math.random() * 1.25,
            alpha: 0.22 + Math.random() * 0.62,
            color: i % 3 === 0 ? "#7dd3fc" : i % 3 === 1 ? "#c4b5fd" : "#fde68a"
          });
        }
      }

      function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = Math.max(640, rect.width || window.innerWidth);
        height = Math.max(520, rect.height || window.innerHeight);
        canvas.width = width;
        canvas.height = height;
        buildNebulaOffscreenBuffer(width, height);
        populateDynamicStars(width, height);
      }

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      function spawnShootingStar() {
        if (shootingStars.length >= 2) return;
        shootingStars.push({
          x: Math.random() * width * 0.75 + width * 0.15,
          y: Math.random() * height * 0.30,
          len: 105 + Math.random() * 90,
          speed: 9.0 + Math.random() * 5.5,
          angle: Math.PI / 5.2 + (Math.random() - 0.5) * 0.16,
          alpha: 1.0
        });
      }

      let frame = 0;
      function renderUniverseFrame() {
        // v1.1: skip all draw work while the home view is not visible (saves CPU);
        // the loop keeps scheduling so it resumes instantly when unpaused.
        if (window.__cosmosPaused) {
          requestAnimationFrame(renderUniverseFrame);
          return;
        }
        frame++;
        mouseX += (targetMouseX - mouseX) * 0.06;
        mouseY += (targetMouseY - mouseY) * 0.06;

        // 1. Blit pre-rendered Milky Way & Volumetric Nebula buffer
        ctx.drawImage(nebulaCanvas, 0, 0);

        const cx = width * 0.5;
        const cy = height * 0.49;

        // 2. Render Co-Axial Gravitational Lensing Accretion Halo behind the Sapphire Ring
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const ringPulse = 1 + 0.03 * Math.sin(frame * 0.025);
        const haloR = Math.min(width, height) * 0.36 * ringPulse;
        const lensGrad = ctx.createRadialGradient(cx + mouseX * 0.2, cy + mouseY * 0.2, haloR * 0.45, cx + mouseX * 0.2, cy + mouseY * 0.2, haloR * 1.25);
        lensGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        lensGrad.addColorStop(0.52, "rgba(56, 189, 248, 0.11)");
        lensGrad.addColorStop(0.72, "rgba(129, 140, 248, 0.08)");
        lensGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(cx + mouseX * 0.2, cy + mouseY * 0.2, haloR * 1.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Render 440 Multi-Depth Twinkling Field Stars with 3D Parallax
        for (let i = 0; i < fieldStars.length; i++) {
          const st = fieldStars[i];
          const px = (st.x + mouseX * st.z + width) % width;
          const py = (st.y + mouseY * st.z + height) % height;
          const alpha = Math.max(0.08, Math.min(1, st.baseAlpha + Math.sin(frame * st.speed + st.phase) * 0.32));

          ctx.globalAlpha = alpha;
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.arc(px, py, st.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Render 110 Orbital Starlight Dust Particles revolving around the Sapphire Ring
        for (let i = 0; i < orbitDust.length; i++) {
          const od = orbitDust[i];
          od.angle += od.angSpeed;
          const ox = cx + Math.cos(od.angle) * od.radius + mouseX * 0.32;
          const oy = cy + Math.sin(od.angle) * od.radius * 0.88 + mouseY * 0.32;
          ctx.globalAlpha = od.alpha * (0.65 + 0.35 * Math.sin(frame * 0.02 + i));
          ctx.fillStyle = od.color;
          ctx.beginPath();
          ctx.arc(ox, oy, od.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Render 28 Diffraction-Spike Bright Stars (十字星芒亮星)
        for (let i = 0; i < brightSpikeStars.length; i++) {
          const bs = brightSpikeStars[i];
          const bx = (bs.x + mouseX * bs.z + width) % width;
          const by = (bs.y + mouseY * bs.z + height) % height;
          const pulse = 0.72 + 0.28 * Math.sin(frame * bs.speed + bs.phase);
          const sLen = bs.spikeLen * pulse;

          const halo = ctx.createRadialGradient(bx, by, 0, bx, by, bs.r * 5.8);
          halo.addColorStop(0, bs.color);
          halo.addColorStop(0.35, "rgba(125, 211, 252, 0.28)");
          halo.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.globalAlpha = pulse;
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(bx, by, bs.r * 5.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = bs.color;
          ctx.lineWidth = 0.85;
          ctx.globalAlpha = pulse * 0.78;
          ctx.beginPath();
          ctx.moveTo(bx - sLen, by);
          ctx.lineTo(bx + sLen, by);
          ctx.moveTo(bx, by - sLen);
          ctx.lineTo(bx, by + sLen);
          ctx.stroke();

          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(bx, by, bs.r * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }

        // 6. Render Interactive Cursor Stardust Wake
        for (let i = cursorParticles.length - 1; i >= 0; i--) {
          const cp = cursorParticles[i];
          cp.x += cp.vx;
          cp.y += cp.vy;
          cp.alpha -= 0.018;
          if (cp.alpha <= 0) {
            cursorParticles.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = cp.alpha;
          ctx.fillStyle = cp.color;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, cp.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Render Ionized Shooting Stars / Comets
        ctx.globalAlpha = 1;
        if (frame % 155 === 25) {
          spawnShootingStar();
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ms = shootingStars[i];
          ms.x += Math.cos(ms.angle) * ms.speed;
          ms.y += Math.sin(ms.angle) * ms.speed;
          ms.alpha -= 0.014;

          if (ms.alpha <= 0 || ms.x > width + 120 || ms.y > height + 120) {
            shootingStars.splice(i, 1);
            continue;
          }

          const tailX = ms.x - Math.cos(ms.angle) * ms.len;
          const tailY = ms.y - Math.sin(ms.angle) * ms.len;
          const lin = ctx.createLinearGradient(ms.x, ms.y, tailX, tailY);
          lin.addColorStop(0, `rgba(255, 255, 255, ${ms.alpha})`);
          lin.addColorStop(0.25, `rgba(125, 211, 252, ${ms.alpha * 0.78})`);
          lin.addColorStop(1, "rgba(56, 189, 248, 0)");

          ctx.strokeStyle = lin;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(ms.x, ms.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${ms.alpha})`;
          ctx.beginPath();
          ctx.arc(ms.x, ms.y, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }

        // 8. Smoothly animate 60FPS sub-second orbital ring & 180-tick Gaussian light wave
        updateSmoothOrbitalRing60FPS();

        requestAnimationFrame(renderUniverseFrame);
      }

      requestAnimationFrame(renderUniverseFrame);
    }


function updateSmoothOrbitalRing60FPS() {
      const targetMs = new Date(S().examTargetDate).getTime();
      const nowMs = Date.now();
      const rawDiffMs = Math.max(0, targetMs - nowMs);
      const secWithFrac = (rawDiffMs % 60000) / 1000;
      const secsProgress = 1 - (secWithFrac / 60);

      // Smoothly sweep Inner Seconds Ring (r=162, C=1017.88) and its Starburst Comet Node
      const ringS = document.getElementById("clockRingSeconds");
      const secsPhoton = document.getElementById("secsPhotonGroup");
      if (ringS) {
        ringS.style.strokeDashoffset = (1017.88 * (1 - secsProgress)).toFixed(2);
      }
      if (secsPhoton) {
        secsPhoton.setAttribute("transform", `rotate(${(secsProgress * 360).toFixed(2)} 230 230)`);
      }

      // 180-Tick Gaussian Light Wave (smooth luminous wave crest & glowing wake around the 180 laser ticks)
      const headTickFloat = secsProgress * 180;
      for (let i = 0; i < 180; i++) {
        const tickEl = document.getElementById("ringTick-" + i);
        if (!tickEl) continue;
        // Circular distance behind the moving wave head
        let distBehind = headTickFloat - i;
        if (distBehind < 0) distBehind += 180;

        if (distBehind >= 0 && distBehind <= 28) {
          const waveIntensity = Math.exp(-distBehind / 9.5);
          if (distBehind < 1.8) {
            tickEl.setAttribute("stroke", "#ffffff");
          } else {
            const alpha = (0.22 + 0.72 * waveIntensity).toFixed(2);
            tickEl.setAttribute("stroke", `rgba(125, 211, 252, ${alpha})`);
          }
        } else if (i <= headTickFloat) {
          tickEl.setAttribute("stroke", "rgba(56, 189, 248, 0.34)");
        } else {
          tickEl.setAttribute("stroke", "rgba(226, 232, 240, 0.13)");
        }
      }
    }


// v1.1: pause switch driven by App.vue's active-view watcher.
export function setCosmosPaused(paused) {
  window.__cosmosPaused = paused === true;
}

export { initCosmosStarfieldCanvas }
