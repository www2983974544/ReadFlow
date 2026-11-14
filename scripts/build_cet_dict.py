"""Build the bundled CET dictionary from ECDICT.

Source: https://github.com/skywind3000/ECDICT (ecdict.csv, MIT License).
The CSV is not committed. Download it and run:

    python scripts/build_cet_dict.py --csv /path/to/ecdict.csv

Writes the same compact JSON to the desktop and Android data files.
Output shape stays compatible with core/dictionary.ts: word -> [pos, cn,
phonetic, labels, wordForms, synonyms].
"""

import argparse
import csv
import io
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "frontend/src/data/cet_dictionary.json",
    ROOT / "ReadFlow_Android/src/data/cet_dictionary.json",
]
EXAM_TAGS = {"cet4", "cet6", "ky", "gk", "zk", "ielts", "toefl", "gre"}
LABELS = [
    ("cet6", "CET-6 核心"),
    ("cet4", "CET-4 高频"),
    ("ky", "考研"),
    ("gk", "高考"),
    ("zk", "中考"),
    ("ielts", "雅思"),
    ("toefl", "托福"),
    ("gre", "GRE"),
]
FORMS = {
    "p": "过去式",
    "d": "过去分词",
    "i": "现在分词",
    "3": "第三人称单数",
    "r": "比较级",
    "t": "最高级",
    "s": "复数",
    "0": "原型",
    "1": "原型变体",
}


def selected(row):
    word = (row.get("word") or "").strip().lower()
    translation = row.get("translation") or ""
    if not word or not translation:
        return False
    tag = set((row.get("tag") or "").split())
    frq = row.get("frq") or ""
    collins = row.get("collins") or ""
    freq = int(frq) if frq.isdigit() else 10**9
    star = int(collins) if collins.isdigit() else 0
    return bool(
        tag & EXAM_TAGS
        or (row.get("oxford") or "") == "1"
        or 0 < freq <= 20000
        or star >= 3
    )


def entry(row):
    lines = [s.strip() for s in (row.get("translation") or "").split("\\n") if s.strip()][:2]
    pos = ""
    meanings = []
    for line in lines:
        match = re.match(r"^([A-Za-z]{1,5})\.\s*", line)
        if match:
            if not pos:
                pos = match.group(1).lower() + "."
            line = line[match.end():]
        if line.strip():
            meanings.append(line.strip())
    cn = "；".join(meanings)[:100]
    if not cn:
        return None

    phonetic = (row.get("phonetic") or "").strip()
    tag = set((row.get("tag") or "").split())
    labels = [label for key, label in LABELS if key in tag]
    if (row.get("oxford") or "") == "1":
        labels.append("牛津3000")
    collins = row.get("collins") or ""
    if collins.isdigit() and int(collins) >= 3:
        labels.append("柯林斯" + collins + "星")
    frq = row.get("frq") or ""
    if frq.isdigit() and 0 < int(frq) <= 20000:
        labels.append("词频" + frq)

    forms = []
    for item in (row.get("exchange") or "").split("/"):
        if ":" in item:
            key, value = item.split(":", 1)
            if key in FORMS and value:
                forms.append(FORMS[key] + " " + value)

    return [
        pos,
        cn,
        "/" + phonetic + "/" if phonetic else "",
        " | ".join(labels) or "外刊高频词",
        "；".join(forms[:6]),
        "",
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to ECDICT ecdict.csv")
    args = parser.parse_args()

    csv.field_size_limit(10**8)
    result = {}
    with io.open(args.csv, encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if not selected(row):
                continue
            word = (row.get("word") or "").strip().lower()
            if word in result:
                continue
            built = entry(row)
            if built:
                result[word] = built

    payload = json.dumps(result, ensure_ascii=False, separators=(",", ":"))
    for output in OUTPUTS:
        output.write_text(payload, encoding="utf-8")
        print("wrote", output.relative_to(ROOT), len(payload), "bytes")
    print("entries:", len(result))
    print("congress:", result.get("congress"))


if __name__ == "__main__":
    main()
