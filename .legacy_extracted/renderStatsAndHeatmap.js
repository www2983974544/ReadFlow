function renderStatsAndHeatmap() {
      rebuildHeatmapFromDailyMap();

      const totalHours = (AppState.totalStudyMinutes / 60).toFixed(1);
      const markedCount = Object.keys(AppState.wordMarks).length;
      const finishedArticles = AppState.articles.filter(a => a.readStatus === "finished");
      const finishedCount = finishedArticles.length;
      const avgWpm = (AppState.totalStudyMinutes > 0 && AppState.totalReadWords > 0)
        ? Math.min(260, Math.max(80, Math.round(AppState.totalReadWords / AppState.totalStudyMinutes)))
        : 0;
      const quizRate = AppState.quizAnswered > 0
        ? Math.round((AppState.quizCorrect / AppState.quizAnswered) * 100)
        : 0;

      document.getElementById("statPageTotalHours").textContent = totalHours + " 小时";
      document.getElementById("statPageTodayMins").textContent = `今日已读 ${AppState.todayStudyMinutes} 分钟`;
      document.getElementById("statPageTotalWords").textContent = AppState.totalReadWords.toLocaleString() + " 词";
      document.getElementById("statPageTotalPassages").textContent = `已精读 ${finishedCount} 篇同源外刊`;
      document.getElementById("statPageVocabCount").textContent = markedCount + " 词";
      document.getElementById("statPageVocabSub").textContent = markedCount > 0 ? `已收录 ${markedCount} 个核心词族` : "标注单词后自动累计";
      document.getElementById("statPageStreak").textContent = AppState.streakDays + " 天";
      document.getElementById("statPageLongestStreak").textContent = `历史最长 ${AppState.longestStreakDays} 天`;
      document.getElementById("statPageAvgWpm").textContent = avgWpm + " WPM";
      document.getElementById("statPageWpmSub").textContent = avgWpm > 0 ? "基于已精读词数与用时测算" : "开始精读后自动测算";
      document.getElementById("statPageQuizRate").textContent = quizRate + "%";
      document.getElementById("statPageQuizSub").textContent = `已答 ${AppState.quizAnswered} 题 · 正确 ${AppState.quizCorrect} 题`;

      // Build 52 weeks x 7 days GitHub Heatmap Grid (All 0 unless studied!)
      const hmGrid = document.getElementById("githubHeatmapGrid");
      if (hmGrid) {
        const weeksHtml = [];
        for (let w = 0; w < 52; w++) {
          const colCells = [];
          for (let d = 0; d < 7; d++) {
            const idx = w * 7 + d;
            const item = AppState.heatmapData[idx] || { date: getTodayDateString(), mins: 0, words: 0, vocab: 0, lv: 0 };
            let lv = item.lv;
            if (AppState.heatmapMode === "words") {
              lv = item.words > 900 ? 4 : item.words > 600 ? 3 : item.words > 300 ? 2 : item.words > 0 ? 1 : 0;
            } else if (AppState.heatmapMode === "vocab") {
              lv = item.vocab >= 8 ? 4 : item.vocab >= 5 ? 3 : item.vocab >= 2 ? 2 : item.vocab > 0 ? 1 : 0;
            }
            colCells.push(`<div data-hmidx="${idx}" class="hm-cell hm-lv-${lv}" title="${item.date}: 精读 ${item.mins} 分钟 | 阅读 ${item.words} 词 | 生词 ${item.vocab} 个"></div>`);
          }
          weeksHtml.push(`<div class="flex flex-col gap-[3px]">${colCells.join("")}</div>`);
        }
        hmGrid.innerHTML = weeksHtml.join("");
      }

      // Update Heatmap Inspector Text for Today
      const todayItem = AppState.heatmapData[AppState.heatmapData.length - 1] || { date: getTodayDateString(), mins: 0, words: 0, vocab: 0, lv: 0 };
      const inspEl = document.getElementById("heatmapInspectorText");
      if (inspEl) {
        if (todayItem.mins === 0 && todayItem.words === 0 && todayItem.vocab === 0) {
          inspEl.textContent = `📅 ${todayItem.date} (今日)：已精读 0 分钟 · 阅读 0 词 · 新增标注生词 0 个 (尚无学习记录，开始精读后自动点亮热力图)`;
        } else {
          inspEl.textContent = `📅 ${todayItem.date} (今日)：已精读 ${todayItem.mins} 分钟 · 阅读 ${todayItem.words} 词 · 新增标注生词 ${todayItem.vocab} 个 (活跃度 Lv.${todayItem.lv})`;
        }
      }

      // Render 14-Day Reading Duration Bar Chart
      const barsBox = document.getElementById("chart14DaysBars");
      const avg14El = document.getElementById("stat14DayAvgLabel");
      if (barsBox) {
        const last14 = AppState.heatmapData.slice(-14);
        const sum14 = last14.reduce((acc, x) => acc + x.mins, 0);
        const avg14 = Math.round(sum14 / 14);
        if (avg14El) avg14El.textContent = `日均 ${avg14} 分钟`;

        const maxMins = Math.max(45, ...last14.map(x => x.mins));
        barsBox.innerHTML = last14.map((item, i) => {
          const hPct = item.mins > 0 ? Math.max(12, Math.round((item.mins / maxMins) * 100)) : 4;
          const shortDate = item.date.slice(5);
          const isToday = i === last14.length - 1;
          const barCol = item.mins > 0
            ? (isToday ? "bg-indigo-600" : "bg-indigo-500/80")
            : "bg-slate-200";
          return `
            <div class="flex-1 flex flex-col items-center justify-end h-full group">
              <div class="text-[10px] font-bold opacity-75 mb-1">${item.mins}m</div>
              <div class="w-full max-w-[26px] rounded-t-lg transition-all ${barCol}" style="height:${hPct}%;"></div>
              <div class="text-[10px] opacity-65 mt-1.5 truncate">${isToday ? "今日" : shortDate}</div>
            </div>
          `;
        }).join("");
      }

      // Render 5 High-Frequency CET Exam Categories Mastery Breakdown (0% initially, dynamically computed!)
      const catBox = document.getElementById("categoryMasteryContainer");
      if (catBox) {
        const categories = [
          { name: "科技与人工智能", label: "🤖 科技与人工智能 (The Economist / Wired)", colorText: "text-indigo-600", colorBar: "bg-indigo-600" },
          { name: "生态与气候环境", label: "🌱 生态与气候环境 (Scientific American / Nature)", colorText: "text-emerald-600", colorBar: "bg-emerald-500" },
          { name: "心理与教育认知", label: "🧠 心理与教育认知 (The Guardian / The Atlantic)", colorText: "text-violet-600", colorBar: "bg-violet-500" },
          { name: "经济与商业职场", label: "💼 经济与商业职场 (Harvard Business Review)", colorText: "text-amber-600", colorBar: "bg-amber-500" },
          { name: "社会文化与健康", label: "🏥 社会文化与健康 (NPR / BBC Future)", colorText: "text-rose-600", colorBar: "bg-rose-500" }
        ];
        catBox.innerHTML = categories.map(cat => {
          const finInCat = finishedArticles.filter(a => a.category === cat.name).length;
          const pct = Math.min(100, finInCat * 25);
          return `
            <div>
              <div class="flex justify-between font-semibold mb-1">
                <span>${cat.label}</span>
                <span class="${cat.colorText}">${pct}% (${finInCat} 篇)</span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full ${cat.colorBar} rounded-full transition-all" style="width:${pct}%;"></div>
              </div>
            </div>
          `;
        }).join("");
      }
    }
