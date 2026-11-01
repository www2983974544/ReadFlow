function stopSpeechPlayback() {
      broadcastSessionId++;
      if (currentPlayingAudio) {
        try {
          currentPlayingAudio.pause();
          currentPlayingAudio.currentTime = 0;
        } catch (e) {}
        currentPlayingAudio = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      AppState.isSpeakingFull = false;
      const btnFull = document.getElementById("btnReadFullArticle");
      if (btnFull) btnFull.textContent = "🔊 全文朗读";
      document.querySelectorAll(".speaking-para-highlight").forEach(el => el.classList.remove("speaking-para-highlight"));
    }
