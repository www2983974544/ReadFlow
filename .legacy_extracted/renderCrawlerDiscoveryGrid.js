function renderCrawlerDiscoveryGrid() {
      const grid = document.getElementById("crawlerDiscoveryGrid");
      const targetLevel = document.getElementById("crawlTargetLevel").value;
      const targetCat = document.getElementById("crawlTargetCategory").value;
      const targetSrc = document.getElementById("crawlTargetSource").value;

      const list = AppState.articles.filter(a => {
        if (targetLevel !== "all" && a.examLevel !== targetLevel) return false;
        if (targetCat !== "all" && a.category !== targetCat) return false;
        if (targetSrc !== "all" && targetSrc !== "Live Web Feed" && !a.source.includes(targetSrc.split(" ")[0])) return false;
        return true;
      });

      grid.innerHTML = list.map(art => {
        const libBtnHtml = art.inLibrary
          ? `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700">✓ 已在文章库 (移出)</button>`
          : `<button type="button" data-artid="${art.id}" class="btn-card-toggle-lib px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500">➕ 加入文章库</button>`;

        return `
          <div class="surface-card p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white">${art.examLevel}</span>
                <span class="text-xs font-semibold text-indigo-600">${art.category}</span>
              </div>
              <div class="flex items-center gap-2 text-xs opacity-75">
                <span>📰 来源: <strong>${art.source}</strong></span>
                <span>·</span>
                <span>考纲词 ${art.cetRatio}</span>
              </div>
              <h4 class="serif-article text-lg font-bold leading-snug">${art.title}</h4>
              <p class="text-xs font-medium opacity-80">${art.titleCn}</p>
              <p class="text-xs opacity-70 line-clamp-3 leading-relaxed">${art.paragraphs[0].en}</p>
            </div>

            <div class="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <button type="button" data-artid="${art.id}" class="btn-card-open-read px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 transition">
                📖 进入逐词精读
              </button>
              ${libBtnHtml}
            </div>
          </div>
        `;
      }).join("");
    }
