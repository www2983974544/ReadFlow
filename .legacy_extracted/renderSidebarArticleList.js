function renderSidebarArticleList() {
      const container = document.getElementById("sidebarArticleList");
      const filtered = AppState.articles.filter(art => {
        if (AppState.poolFilter === "library" && !art.inLibrary) return false;
        if (AppState.poolFilter === "discovery" && art.inLibrary) return false;
        if (AppState.levelFilter !== "all" && art.examLevel !== AppState.levelFilter) return false;
        if (AppState.categoryFilter !== "all" && art.category !== AppState.categoryFilter) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs opacity-60 border border-dashed rounded-xl">当前筛选条件下暂无文章，可切换筛选条件或点击顶部「实时爬取新刊」。</div>`;
        return;
      }

      container.innerHTML = filtered.map(art => {
        const isActive = art.id === AppState.currentArticleId;
        const borderClass = isActive
          ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600"
          : "border-slate-200/80 hover:border-indigo-300";
        const libBadge = art.inLibrary
          ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">已入库</span>`
          : `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">待筛选</span>`;
        const finBadge = art.readStatus === "finished"
          ? `<span class="text-[10px] text-emerald-600 font-bold">✅ 已读完</span>`
          : `<span>考纲词 ${art.cetRatio}</span>`;

        return `
          <div data-artid="${art.id}" class="sidebar-art-card p-3 rounded-xl border ${borderClass} cursor-pointer transition space-y-1">
            <div class="flex items-center justify-between gap-1">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">${art.examLevel}</span>
                <span class="text-[11px] font-medium opacity-75 truncate">${art.source}</span>
              </div>
              ${libBadge}
            </div>
            <h4 class="text-xs font-bold leading-snug line-clamp-2">${art.title}</h4>
            <p class="text-[11px] opacity-70 truncate">${art.titleCn}</p>
            <div class="flex items-center justify-between text-[10px] opacity-65 pt-0.5">
              <span>${art.category}</span>
              ${finBadge}
            </div>
          </div>
        `;
      }).join("");
    }
