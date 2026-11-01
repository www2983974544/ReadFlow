function selectWordForInspection(rawWord, paraText, clickedSpanEl) {
      const clean = rawWord.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
      if (!clean) return;
      const lemma = lemmatizeWord(clean);
      AppState.activeWord = clean;
      AppState.activeWordLemma = lemma;

      if (AppState.rightCollapsed) {
        AppState.rightCollapsed = false;
        applySidebarCollapseLayout();
      }

      preloadWordHumanAudio(clean);

      if (currentActiveWordSpan && currentActiveWordSpan !== clickedSpanEl) {
        currentActiveWordSpan.classList.remove("active-word");
      }
      if (clickedSpanEl) {
        clickedSpanEl.classList.add("active-word");
        currentActiveWordSpan = clickedSpanEl;
      }

      let contextSent = paraText || "";
      if (paraText) {
        const sentences = paraText.match(/[^.!?]+[.!?]+/g) || [paraText];
        const lowerClean = clean.toLowerCase();
        const found = sentences.find(s => s.toLowerCase().includes(lowerClean));
        if (found) contextSent = found.trim();
      }
      AppState.activeContextSentence = contextSent;

      const info = lookupWordDefinitionSync(clean);
      const existingMark = AppState.wordMarks[lemma];

      document.getElementById("inspectWordText").textContent = info.word;
      document.getElementById("inspectWordPhonetic").textContent = info.phonetic;
      document.getElementById("inspectWordLemma").textContent = "原型: " + info.lemma;
      document.getElementById("inspectWordExamTag").textContent = info.level;
      document.getElementById("inspectWordMeaning").textContent = existingMark && existingMark.customNote
        ? `${info.cn} (个人批注: ${existingMark.customNote})`
        : info.cn;
      document.getElementById("inspectWordEnglishDef").textContent = info.enDef;

      document.getElementById("inspectWordDerivatives").textContent = info.derivatives;
      document.getElementById("inspectWordSynonyms").textContent = info.synonyms;

      document.getElementById("inspectWordEtymology").textContent = info.root;
      document.getElementById("inspectWordContext").textContent = contextSent || "Selected from current reading passage.";
      document.getElementById("inputCustomWordNote").value = existingMark ? (existingMark.customNote || "") : "";

      const statusBadge = document.getElementById("wordInspectorBadge");
      if (existingMark) {
        const mapLabel = { unknown: "🔴 已标为生词", core: "🟡 已标为核心词", mastered: "🟢 已掌握" };
        statusBadge.textContent = mapLabel[existingMark.status] || "已标注";
      } else {
        statusBadge.textContent = "⚡ 已选中 · 点击空白处取消";
      }
    }
