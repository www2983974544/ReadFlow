function updateHomeCountdownDisplay() {
      const targetMs = new Date(AppState.examTargetDate).getTime();
      const nowMs = Date.now();
      let diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));

      const days = Math.floor(diffSec / 86400);
      diffSec %= 86400;
      const hours = Math.floor(diffSec / 3600);
      diffSec %= 3600;
      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;

      const elD = document.getElementById("cdDays");
      const elH = document.getElementById("cdHours");
      const elM = document.getElementById("cdMinutes");
      const elS = document.getElementById("cdSeconds");
      const elSub = document.getElementById("cdSubtitleLine");
      const elBadge = document.getElementById("clockInnerExamBadge");

      if (elD) elD.textContent = String(days).padStart(2, "0");
      if (elH) elH.textContent = String(hours).padStart(2, "0");
      if (elM) elM.textContent = String(minutes).padStart(2, "0");
      if (elS) elS.textContent = String(seconds).padStart(2, "0");
      if (elBadge) elBadge.textContent = `T-MINUS · ${AppState.examName}`;

      if (elSub) {
        elSub.innerHTML = `距离 <span class="text-cyan-300 font-bold">${AppState.examName}</span> 考试还有 <span class="text-white font-bold">${days}</span> 天 <span class="text-white font-bold">${hours}</span> 小时 <span class="text-white font-bold">${minutes}</span> 分钟 <span class="text-cyan-300 font-bold">${seconds}</span> 秒`;
      }

      // Update Primary Luminous Countdown Ring (r=182, C=1143.54) & Leading Starburst Photon Node
      const daysRatio = Math.min(1, Math.max(0.06, days / 180));
      const ringD = document.getElementById("clockRingDays");
      const daysPhoton = document.getElementById("daysPhotonGroup");
      if (ringD) {
        ringD.style.strokeDashoffset = (1143.54 * (1 - daysRatio)).toFixed(2);
      }
      if (daysPhoton) {
        daysPhoton.setAttribute("transform", `rotate(${(daysRatio * 360).toFixed(2)} 230 230)`);
      }
    }
