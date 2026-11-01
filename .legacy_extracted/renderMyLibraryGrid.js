function renderMyLibraryGrid() {
      const grid = document.getElementById("myLibraryGrid");
      const query = document.getElementById("inputSearchLibrary").value.trim().toLowerCase();
      const statusFilter = document.getElementById("selectLibraryStatusFilter").value;

      const list = AppState.articles.filter(a => {
        if (!a.inLibrary) return false;
        if (statusFilter !== "all" && a.readStatus !== statusFilter) return false;
        if (query && !(a.title.toLowerCase().includes(query) || a.titleCn.includes(query) || a.source.toLowerCase().includes(query) || a.category.includes(query))) {
          return false;
        }
        return true;
      });

      if (list.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full surface-card border border-dashed p-10 text-center space-y-3">
            <div class="text-3xl">📚</div>
            <h3 class="text-base font-bold">你的文章库中还没有符合条件的文章</h3>
            <p class="text-xs opacity-70 max-w-md mx-auto">前往「文章获取」频道，点击「立即启动全网爬取」并选择感兴趣的四六级同源外刊加入文章库吧！</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = list.map(art => {
        const statusMap = {
          unread: `<span class="px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 font-semibold">⏳ 待精读</span>`,
          reading: `<span class="px-2 py-0.5 rounded text-[11px] bg-indigo-100 text-indigo-800 font-semibold">📖 精读中</span>`,
          finished: `<span class="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 font-semibold">✅ 已精读完成</span>`
        };

        const toggleFinBtn = art.readStatus === "finished"
          ? `<button type="button" data-artid="${art.id}" class="btn-lib-toggle-fin px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition">↩ 取消已完成</button>`
          : `<button type="button" data-artid="${art.id}" class="btn-lib-toggle-fin px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">✓ 标记读完</button>`;

        return `
          <div class="surface-card p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white">${art.examLevel} · ${art.category}</span>
                ${statusMap[art.readStatus] || statusMap.unread}
              </div>
              <div class="text-xs opacity-70">来源刊物: <strong>${art.source}</strong> · 蓝思值 ${art.lexile}</div>
              <h4 class="serif-article text-lg font-bold leading-snug">${art.title}</h4>
              <p class="text-xs opacity-80">${art.titleCn}</p>
            </div>

            <div class="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
              <button type="button" data-artid="${art.id}" class="btn-lib-open px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition">
                📖 打开精读与笔记
              </button>
              <div class="flex items-center gap-1.5">
                ${toggleFinBtn}
                <button type="button" data-artid="${art.id}" class="btn-lib-remove px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition">
                  移出文章库
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
