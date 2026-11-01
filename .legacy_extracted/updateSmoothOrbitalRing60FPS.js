function updateSmoothOrbitalRing60FPS() {
      const targetMs = new Date(AppState.examTargetDate).getTime();
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
