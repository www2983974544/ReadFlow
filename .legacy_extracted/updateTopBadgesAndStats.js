function updateTopBadgesAndStats() {
      const libArticles = AppState.articles.filter(a => a.inLibrary);
      const discArticles = AppState.articles.filter(a => !a.inLibrary);
      const finishedArticles = AppState.articles.filter(a => a.readStatus === "finished");
      const markedCount = Object.keys(AppState.wordMarks).length;

      document.getElementById("badgeDiscoveryCount").textContent = discArticles.length;
      document.getElementById("badgeLibraryCount").textContent = libArticles.length;
      document.getElementById("badgeVocabCount").textContent = markedCount;

      document.getElementById("statLibraryTotal").textContent = libArticles.length;
      document.getElementById("statMarkedWords").textContent = markedCount;
      document.getElementById("statFinishedArticles").textContent = finishedArticles.length;
      const acc = AppState.quizAnswered > 0 ? Math.round((AppState.quizCorrect / AppState.quizAnswered) * 100) + "%" : "0%";
      document.getElementById("statQuizAccuracy").textContent = acc;
    }
