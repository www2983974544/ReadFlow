"""Dev-only self-check page (WebView2 capability probe), embedded as a constant
so it survives PyInstaller bundling without --add-data entries."""

SELFTEST_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>ReadFlow Self-Test</title>
  <style>
    body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; padding: 32px; background: #f1f5f9; color: #0f172a; }
    h2 { margin-top: 0; }
    li { margin: 6px 0; }
    .ok { color: #16a34a; font-weight: 600; }
    .bad { color: #dc2626; font-weight: 600; }
    code { background: #e2e8f0; padding: 1px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h2>ReadFlow P0 环境自检（WebView2）</h2>
  <ul id="results"></ul>
  <script>
    const ul = document.getElementById("results");
    const add = (label, ok, detail) => {
      const li = document.createElement("li");
      li.innerHTML = `${label}: <span class="${ok ? "ok" : "bad"}">${ok ? "OK" : "FAIL"}</span> <code>${detail ?? ""}</code>`;
      ul.appendChild(li);
    };

    add("UserAgent", true, navigator.userAgent);

    fetch("/api/ping").then(r => r.json())
      .then(j => add("API /api/ping", j.ok === true, JSON.stringify(j)))
      .catch(e => add("API /api/ping", false, String(e)));

    // Web Speech API availability (offline TTS fallback engine)
    if ("speechSynthesis" in window) {
      let voices = speechSynthesis.getVoices();
      add("speechSynthesis 存在", true, `当前 voices=${voices.length}`);
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        add("speechSynthesis voices 变化", voices.length > 0, `voices=${voices.length}`);
      };
      setTimeout(() => {
        if (speechSynthesis.getVoices().length === 0 && !ul.innerHTML.includes("voices 变化")) {
          add("speechSynthesis voices (3s 后)", false, "voices 仍为 0 —— WebView2 已知兼容性问题");
        }
      }, 3000);
    } else {
      add("speechSynthesis 存在", false, "不支持");
    }

    // Youdao online pronunciation audio loading (primary pronunciation engine)
    const audio = new Audio("https://dict.youdao.com/dictvoice?audio=reading&type=2");
    audio.addEventListener("canplaythrough", () => add("有道发音音频加载", true, "canplaythrough"));
    audio.addEventListener("error", () => add("有道发音音频加载", false, "加载失败（离线或被拦截）"));
    setTimeout(() => {
      if (audio.readyState < 3 && !ul.innerHTML.includes("有道发音音频加载")) {
        add("有道发音音频加载", false, `超时 readyState=${audio.readyState}`);
      }
    }, 6000);
  </script>
</body>
</html>
"""
