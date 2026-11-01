function renderUniverseFrame() {
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
