function renderArticleMarkedWordsList() {
      const container = document.getElementById("listArticleMarkedWords");
      const art = AppState.articles.find(a => a.id === AppState.currentArticleId);
      if (!art) return;

      const fullTextLower = art.paragraphs.map(p => p.en.toLowerCase()).join(" ");
      const relevantMarks = Object.values(AppState.wordMarks).filter(m => fullTextLower.includes(m.lemma));

      document.getElementById("countArticleMarked").textContent = relevantMarks.length;

      if (relevantMarks.length === 0) {
        container.innerHTML = `<div class="text-slate-400 py-3 text-center">点击文中任意单词并选择颜色按钮，即可在此生成本文核心词汇清单。</div>`;
        return;
      }

      container.innerHTML = relevantMarks.map(m => {
        const dot = m.status === "unknown" ? "🔴" : m.status === "core" ? "🟡" : "🟢";
        return `
          <div data-lemma="${m.lemma}" class="marked-word-chip p-2 rounded-lg border border-slate-200/80 hover:border-indigo-400 cursor-pointer flex items-center justify-between gap-2 transition">
            <div class="truncate">
              <span class="font-bold text-indigo-700">${dot} ${m.word}</span>
              <span class="opacity-75 ml-1">${m.customNote || m.cn}</span>
            </div>
            <span class="text-[10px] opacity-60 shrink-0">${m.phonetic}</span>
          </div>
        `;
      }).join("");
    }
