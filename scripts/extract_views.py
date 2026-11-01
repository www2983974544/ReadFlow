"""Generate the five view components from the legacy single-file HTML.

Extracts each <section id="viewX"> verbatim into
frontend/src/components/views/XxxView.vue with a standard script block that
binds the corresponding legacy module. Also assembles src/legacy/cosmos.js
from the two extracted canvas functions.

Usage: .venv/Scripts/python scripts/extract_views.py
"""
import re
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY = Path(r"d:\Users\wzc\Desktop\ReadFlow_windows\cet_reading_master.html")
EXTRACTED = ROOT / ".legacy_extracted"
VIEWS_DIR = ROOT / "frontend" / "src" / "components" / "views"
LEGACY_DIR = ROOT / "frontend" / "src" / "legacy"

VIEWS = [
    ("viewHome", "HomeView", "home", "initHomeView"),
    ("viewCrawler", "CrawlerView", "crawler", "initCrawlerView, renderCrawlerDiscoveryGrid"),
    ("viewLibrary", "LibraryView", "library", "initLibraryView, renderMyLibraryGrid"),
    ("viewVocab", "VocabView", "vocab", "initVocabView, renderVocabNotebook"),
    ("viewStats", "StatsView", "stats", "initStatsView, renderStatsAndHeatmap"),
]

SCRIPT_TEMPLATE = """<script setup lang="ts">
import {{ onMounted, watch }} from 'vue'
import {{ useUiStore }} from '../../stores/ui'
import {{ {import_names} }} from '../../legacy/{module}'

const ui = useUiStore()

onMounted(() => {{
  {init_fn}()
}})

// legacy switchNavigationTab: re-render the grid when the tab is opened
watch(
  () => ui.activeView,
  (v) => {{
    if (v === '{view}') {{
      {render_fn}()
    }}
  }},
)
</script>

<template>
{body}
</template>
"""


def extract_section(text: str, section_id: str) -> str:
    start = text.index(f'<section id="{section_id}"')
    end = text.index("</section>", start) + len("</section>")
    html = text[start:end]
    # Visibility is handled by v-show on the component root (App.vue); the
    # legacy static `hidden` class would keep the section permanently hidden.
    html = re.sub(rf'(<section id="{section_id}" class=")hidden ', r"\1", html)
    # Vue-ify: replace the inline onclick CTA with a data attribute bound in home.ts
    html = html.replace(' onclick="document.getElementById(\'heroCountdownTrigger\').click()"', ' data-home-cta')
    return html


def main() -> None:
    text = LEGACY.read_text(encoding="utf-8")
    VIEWS_DIR.mkdir(parents=True, exist_ok=True)

    for section_id, comp, view, init_fns in VIEWS:
        parts = [p.strip() for p in init_fns.split(",")]
        init_fn = parts[0]
        render_fn = parts[1] if len(parts) > 1 else init_fn
        import_names = init_fn if init_fn == render_fn else f"{init_fn}, {render_fn}"
        module = {
            "HomeView": "home",
            "CrawlerView": "crawler-view",
            "LibraryView": "library",
            "VocabView": "vocab-view",
            "StatsView": "stats-view",
        }[comp]
        body = extract_section(text, section_id)
        sfc = SCRIPT_TEMPLATE.format(import_names=import_names, init_fn=init_fn, module=module, view=view, render_fn=render_fn, body=body)
        out = VIEWS_DIR / f"{comp}.vue"
        out.write_text(sfc, encoding="utf-8")
        print(f"{comp}.vue: {body.count(chr(10))} template lines")

    # cosmos.js: verbatim canvas engine + adapted seconds-ring updater
    init_fn = (EXTRACTED / "initCosmosStarfieldCanvas.js").read_text(encoding="utf-8")
    ring_fn = (EXTRACTED / "updateSmoothOrbitalRing60FPS.js").read_text(encoding="utf-8")
    assert "AppState" not in init_fn, "cosmos init unexpectedly references AppState"
    ring_fn = ring_fn.replace("AppState.examTargetDate", "S().examTargetDate")
    assert "AppState" not in ring_fn, "unhandled AppState reference in ring updater"
    cosmos = (
        "// Verbatim port of the legacy cosmos canvas engine (cet_reading_master.html\n"
        "// L2957-3355 + L3356-3397). Plain .js on purpose: excluded from type checking.\n"
        "import { S } from './state'\n\n"
        f"{init_fn}\n\n{ring_fn}\n\nexport {{ initCosmosStarfieldCanvas }}\n"
    )
    (LEGACY_DIR / "cosmos.js").write_text(cosmos, encoding="utf-8")
    (LEGACY_DIR / "cosmos.d.ts").write_text(
        "export function initCosmosStarfieldCanvas(): void\n", encoding="utf-8"
    )
    print("cosmos.js assembled")


if __name__ == "__main__":
    main()
