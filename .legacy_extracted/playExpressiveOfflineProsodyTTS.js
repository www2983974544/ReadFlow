function playExpressiveOfflineProsodyTTS(sentences, sessionId, accent, baseRate) {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const bestVoice = getBestNativeEnglishVoice(accent);

      const total = sentences.length;
      sentences.forEach((sent, idx) => {
        const utter = new SpeechSynthesisUtterance(sent);
        if (bestVoice) utter.voice = bestVoice;
        utter.lang = accent === "UK" ? "en-GB" : "en-US";

        const isContrast = /^(However|Yet|Paradoxically|Instead|Consequently|In response|Beyond|While)\b/i.test(sent);
        if (isContrast) {
          utter.pitch = 1.06;
          utter.rate = Math.max(0.75, baseRate * 0.96);
        } else if (idx === 0) {
          utter.pitch = 1.03;
          utter.rate = baseRate;
        } else if (idx === total - 1 && total > 1) {
          utter.pitch = 0.96;
          utter.rate = Math.max(0.75, baseRate * 0.95);
        } else {
          utter.pitch = (idx % 2 === 1) ? 1.02 : 0.99;
          utter.rate = baseRate;
        }
        utter.volume = 1.0;

        if (idx === total - 1) {
          utter.onend = () => {
            if (broadcastSessionId !== sessionId) return;
            AppState.isSpeakingFull = false;
            const btnFull = document.getElementById("btnReadFullArticle");
            if (btnFull) btnFull.textContent = "🔊 全文朗读";
            document.querySelectorAll(".speaking-para-highlight").forEach(el => el.classList.remove("speaking-para-highlight"));
          };
        }
        window.speechSynthesis.speak(utter);
      });
    }
