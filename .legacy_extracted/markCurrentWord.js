function markCurrentWord(statusType) {
      const lemma = AppState.activeWordLemma;
      if (!lemma) return;
      const art = AppState.articles.find(a => a.id === AppState.currentArticleId) || AppState.articles[0];
      const info = lookupWordDefinitionSync(AppState.activeWord);
      const customNote = document.getElementById("inputCustomWordNote").value.trim();

      AppState.wordMarks[lemma] = {
        word: AppState.activeWord,
        lemma: lemma,
        status: statusType,
        customNote: customNote,
        cn: info.cn,
        phonetic: info.phonetic,
        level: info.level,
        derivatives: info.derivatives,
        synonyms: info.synonyms,
        context: AppState.activeContextSentence,
        articleTitle: art ? art.title : "CET Reading Passage"
      };

      recordTodayStudyDelta(0, 0, Object.keys(AppState.wordMarks).length);
      updateTopBadgesAndStats();
      updateWordTokensInPlace(lemma);
      renderArticleMarkedWordsList();
      selectWordForInspection(AppState.activeWord, AppState.activeContextSentence, currentActiveWordSpan);

      const labelMap = { unknown: "🔴 陌生生词", core: "🟡 四六级核心词", mastered: "🟢 已掌握词汇" };
      showToast(`已将「${AppState.activeWord}」标注为 ${labelMap[statusType]}`);
    }
