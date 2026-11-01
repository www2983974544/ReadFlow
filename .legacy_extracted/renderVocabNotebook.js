function renderVocabNotebook() {
      const grid = document.getElementById("vocabNotebookGrid");
      const allMarks = Object.values(AppState.wordMarks);
      const filtered = allMarks.filter(m => {
        if (AppState.vocabFilter === "all") return true;
        return m.status === AppState.vocabFilter;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full surface-card border border-dashed p-10 text-center space-y-2">
            <div class="text-3xl">🔖</div>
            <h3 class="text-base font-bold">暂无该类别的已标注单词</h3>
            <p class="text-xs opacity-70">在「外刊精读」阅读文章时，点击任意英文单词并在右侧点击「陌生生词 / 四六级核心 / 已熟记」即可收录至此。</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(m => {
        const dictInfo = lookupWordDefinitionSync(m.lemma || m.word);
        const derivativesText = m.derivatives || dictInfo.derivatives;
        const synonymsText = m.synonyms || dictInfo.synonyms;

        const badgeMap = {
          unknown: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">🔴 陌生生词</span>`,
          core: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">🟡 四六级核心</span>`,
          mastered: `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">🟢 已掌握</span>`
        };
        const maskClass = AppState.flashcardMasked ? "blur-sm hover:blur-none transition cursor-pointer select-none" : "";

        return `
          <div class="surface-card p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-bold text-indigo-600">${m.word}</h4>
                  <span class="text-xs font-mono opacity-70">${m.phonetic || ""}</span>
                </div>
                ${badgeMap[m.status] || ""}
              </div>
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs ${maskClass} space-y-1.5">
                <div class="font-bold text-indigo-950">${m.cn}</div>
                ${m.customNote ? `<div class="text-indigo-600 font-medium">✏️ 个人批注: ${m.customNote}</div>` : ""}
                <div class="pt-1.5 border-t border-slate-200/70 text-[11px] leading-relaxed">
                  <div><strong class="text-amber-800">🧬 派生/不同词性：</strong>${derivativesText}</div>
                  <div class="mt-0.5"><strong class="text-emerald-800">🔄 同义替换词：</strong>${synonymsText}</div>
                </div>
              </div>
              ${m.context ? `<p class="text-[11px] italic opacity-75">“${m.context}”</p>` : ""}
            </div>
            <div class="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] opacity-75">
              <span class="truncate max-w-[180px]">出自: ${m.articleTitle || "外刊精读"}</span>
              <div class="flex items-center gap-2">
                <button type="button" data-word="${m.word}" class="btn-vocab-speak text-indigo-600 font-semibold hover:underline">🔊 发音</button>
                <button type="button" data-lemma="${m.lemma}" class="btn-vocab-del text-rose-600 hover:underline">删除</button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
