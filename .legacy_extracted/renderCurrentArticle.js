function renderCurrentArticle() {
      const art = AppState.articles.find(a => a.id === AppState.currentArticleId) || AppState.articles[0];
      if (!art) return;

      stopSpeechPlayback();

      document.getElementById("readerBadgeLevel").textContent = art.examLevel + (art.examLevel === "CET-6" ? " 六级核心" : " 四级核心");
      document.getElementById("readerBadgeCategory").textContent = art.category;
      document.getElementById("readerBadgeSource").textContent = "来源: " + art.source;
      document.getElementById("readerBadgeFreq").textContent = art.examFreqTag;

      document.getElementById("readerArticleTitle").textContent = art.title;
      document.getElementById("readerArticleTitleCn").textContent = art.titleCn;

      const fullText = art.paragraphs.map(p => p.en).join(" ");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      document.getElementById("metaWordCount").textContent = wordCount + " 词 (约 " + Math.max(3, Math.round(wordCount / 45)) + " 分钟)";
      document.getElementById("metaCetRatio").textContent = art.cetRatio + " (真题同源密度)";
      document.getElementById("metaLexile").textContent = art.lexile + " · " + art.examLevel + " 标准";

      const btnLib = document.getElementById("btnToggleLibraryStatus");
      const iconLib = document.getElementById("iconLibraryBtn");
      const txtLib = document.getElementById("txtLibraryBtn");
      const metaLib = document.getElementById("metaLibStatusBadge");

      if (art.inLibrary) {
        btnLib.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300";
        iconLib.textContent = "✓";
        txtLib.textContent = "已加入文章库 (点击移出)";
        metaLib.textContent = "✓ 已在个人文章库";
        metaLib.className = "font-semibold text-emerald-600";
      } else {
        btnLib.className = "px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-500";
        iconLib.textContent = "➕";
        txtLib.textContent = "加入我的文章库";
        metaLib.textContent = "待筛选候选 (未入库)";
        metaLib.className = "font-semibold text-amber-600";
      }

      updateFinishedButtonState(art);

      const pContainer = document.getElementById("readerParagraphsContainer");
      pContainer.style.fontSize = AppState.fontSizeRem + "rem";

      pContainer.innerHTML = art.paragraphs.map((p, idx) => {
        const cnHiddenClass = AppState.bilingualOpen ? "" : "hidden";
        return `
          <div id="paraRow-${idx}" class="group relative rounded-xl p-2.5 -mx-2 hover:bg-slate-50/70 transition">
            <div class="flex items-start justify-between gap-3">
              <p class="flex-1 leading-[1.95] tracking-normal" style="margin:0;">
                <span class="inline-block text-xs font-sans font-bold text-indigo-500 mr-1.5 select-none">[P${idx + 1}]</span>
                ${renderTokenizedParagraph(p.en, idx)}
              </p>
              <div class="flex flex-col gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition font-sans">
                <button type="button" data-pidx="${idx}" class="btn-speak-para p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-xs" title="情感播音朗读本段">🔊</button>
                <button type="button" data-pidx="${idx}" class="btn-toggle-para-cn p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-xs" title="展开/收起本段译文">译</button>
              </div>
            </div>
            <div id="paraCnBox-${idx}" class="${cnHiddenClass} mt-2.5 pl-4 border-l-2 border-indigo-400 font-sans text-sm opacity-85 leading-relaxed">
              ${p.cn}
            </div>
          </div>
        `;
      }).join("");

      currentActiveWordSpan = null;

      const sentBox = document.getElementById("readerSentenceAnalysis");
      if (art.complexSentence) {
        sentBox.innerHTML = `
          <div class="font-serif italic font-medium text-indigo-950">“${art.complexSentence.sentence}”</div>
          <div class="text-xs leading-relaxed"><strong class="text-violet-700">🔍 结构拆解：</strong>${art.complexSentence.structure}</div>
          <div class="text-xs leading-relaxed"><strong class="text-amber-700">🎯 考场技巧：</strong>${art.complexSentence.tip}</div>
        `;
      }

      const quizContainer = document.getElementById("readerQuizContainer");
      quizContainer.innerHTML = (art.quiz || []).map((qItem, qIdx) => {
        const optsHtml = qItem.options.map((opt, oIdx) => `
          <button type="button" data-qidx="${qIdx}" data-oidx="${oIdx}" class="quiz-opt-btn w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 text-xs sm:text-sm transition flex items-center justify-between">
            <span>${opt}</span>
          </button>
        `).join("");

        return `
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <div class="text-xs sm:text-sm font-bold">${qItem.q}</div>
            <div class="space-y-1.5">${optsHtml}</div>
            <div id="quizExp-${qIdx}" class="hidden p-3 rounded-xl text-xs leading-relaxed"></div>
          </div>
        `;
      }).join("");

      renderArticleMarkedWordsList();
    }
