function speakSingleWord(word, forceAccent) {
      if (!word) return;
      stopSpeechPlayback();
      const clean = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
      if (!clean) return;

      const accent = forceAccent || AppState.voiceAccent || "US";
      const typeNum = accent === "UK" ? 1 : 2;
      const cacheKey = clean.toLowerCase() + "_" + accent;

      const playViaNativeTTS = () => {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        const bestVoice = getBestNativeEnglishVoice(accent);
        if (bestVoice) utter.voice = bestVoice;
        utter.lang = accent === "UK" ? "en-GB" : "en-US";
        utter.rate = 0.96;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
      };

      if (navigator.onLine) {
        let audio = wordAudioCache[cacheKey];
        if (!audio) {
          audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=${typeNum}`);
          wordAudioCache[cacheKey] = audio;
        }
        currentPlayingAudio = audio;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            playViaNativeTTS();
          });
        }
      } else {
        playViaNativeTTS();
      }
    }
