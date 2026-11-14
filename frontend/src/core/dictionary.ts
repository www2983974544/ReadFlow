// 1:1 port of the legacy offline dictionary + morphological lookup chain
// (cet_reading_master.html L2086-2298). Function names and behavior preserved.
import dictRaw from '../data/cet_dictionary.json?raw'

export interface DictEntry {
  pos: string
  cn: string
  rawCn: string
  phonetic: string
  level: string
  root: string
  derivatives: string
  synonyms: string
}

export interface WordInfo {
  word: string
  lemma: string
  phonetic: string
  pos: string
  cn: string
  shortCn: string
  enDef: string
  level: string
  root: string
  derivatives: string
  synonyms: string
  isOfflineHit: boolean
}

export const CET_DICT: Record<string, DictEntry> = {}

const RAW = JSON.parse(dictRaw) as Record<string, string[]>
Object.keys(RAW).forEach((k) => {
  const arr = RAW[k]
  CET_DICT[k.toLowerCase()] = {
    pos: arr[0],
    cn: arr[0] + ' ' + arr[1],
    rawCn: arr[1],
    phonetic: arr[2],
    level: arr[3].includes('CET-6')
      ? 'CET-6 核心'
      : arr[3].includes('CET-4')
        ? 'CET-4 高频'
        : '外刊高频词',
    root: arr[3],
    derivatives: arr[4] || '暂无词形变化数据',
    synonyms: arr[5] || '暂无同义词数据',
  }
})

export const PREFIX_HINTS: [string, string][] = [
  ['un', '否定前缀 (不/未/非)'],
  ['in', '向内 / 否定前缀 (不/非)'],
  ['im', '否定前缀 (不/非) 或 向内'],
  ['ir', '否定前缀 (不/非)'],
  ['non-', '否定前缀 (非/不)'],
  ['re', '反复前缀 (重新/再次/向后)'],
  ['pre', '时间前缀 (预先/在…之前)'],
  ['post', '时间前缀 (在…之后)'],
  ['inter', '空间/关系前缀 (在…之间/相互)'],
  ['trans', '转换前缀 (跨越/转变)'],
  ['super', '程度前缀 (超级/在…之上)'],
  ['sub', '位置前缀 (在…下面/次级)'],
  ['over', '程度前缀 (过度/超过)'],
  ['under', '程度前缀 (不足/在…之下)'],
  ['out', '程度前缀 (超过/胜过)'],
  ['co', '协同前缀 (共同/一起)'],
  ['de', '方向/移除前缀 (向下/去掉/减少)'],
  ['dis', '否定/分开前缀 (不/分开/取消)'],
  ['mis', '错误前缀 (错误地/不当)'],
  ['micro', '规模前缀 (微小的/微观的)'],
  ['bio', '学科前缀 (生命/生物的)'],
  ['eco', '学科前缀 (生态/环境的)'],
  ['neuro', '学科前缀 (神经系统的)'],
  ['auto', '方式前缀 (自动/自己的)'],
]

export const SUFFIX_HINTS: [string, string, string][] = [
  ['tion', 'n.', '名词后缀（表示动作、过程或状态）'],
  ['sion', 'n.', '名词后缀（表示结果或状态）'],
  ['ment', 'n.', '名词后缀（表示行为结果或组织手段）'],
  ['ness', 'n.', '抽象名词后缀（表示性质或状态）'],
  ['ity', 'n.', '抽象名词后缀（表示品质、程度或状态）'],
  ['ance', 'n.', '名词后缀（表示状态或性质）'],
  ['ence', 'n.', '名词后缀（表示状态或性质）'],
  ['able', 'adj.', '形容词后缀（可…的，能够被…的）'],
  ['ible', 'adj.', '形容词后缀（可…的，具备…性质的）'],
  ['ive', 'adj.', '形容词后缀（有…倾向的，有…属性的）'],
  ['ous', 'adj.', '形容词后缀（充满…的，具有…特征的）'],
  ['ful', 'adj.', '形容词后缀（富有…的）'],
  ['less', 'adj.', '否定形容词后缀（无…的，缺乏…的）'],
  ['al', 'adj.', '形容词后缀（…的，与…相关的）'],
  ['ic', 'adj.', '形容词后缀（…学的，具有…性质的）'],
  ['ize', 'v.', '动词后缀（使…化，变成…）'],
  ['ify', 'v.', '动词后缀（使成为…，使…化）'],
  ['ate', 'v./adj.', '动词/形容词后缀（使…，具有…特征的）'],
  ['ly', 'adv.', '副词后缀（…地）'],
  ['er', 'n./adj.', '施动者名词后缀 或 形容词比较级'],
  ['ist', 'n.', '专业人员/学者名词后缀'],
  ['ism', 'n.', '主义/学说/现象名词后缀'],
]

const lemmaCache: Record<string, string> = {}

export function lemmatizeWord(rawWord: string): string {
  if (!rawWord) return ''
  const lower = rawWord.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
  if (!lower) return ''
  if (lemmaCache[lower]) return lemmaCache[lower]

  if (CET_DICT[lower]) {
    lemmaCache[lower] = lower
    return lower
  }

  const rules: [RegExp, string][] = [
    [/ies$/, 'y'],
    [/ied$/, 'y'],
    [/es$/, ''],
    [/es$/, 'e'],
    [/s$/, ''],
    [/ing$/, ''],
    [/ing$/, 'e'],
    [/ed$/, ''],
    [/ed$/, 'e'],
    [/ly$/, ''],
    [/ation$/, 'e'],
    [/tion$/, 'te'],
    [/ers$/, 'er'],
    [/est$/, ''],
    [/er$/, ''],
  ]
  for (let i = 0; i < rules.length; i++) {
    const regex = rules[i][0]
    const rep = rules[i][1]
    if (regex.test(lower)) {
      const cand = lower.replace(regex, rep)
      if (CET_DICT[cand]) {
        lemmaCache[lower] = cand
        return cand
      }
    }
  }

  const dblMatch = lower.match(/^([a-z]+?)([bcdfghjklmnpqrstvwxyz])\2(?:ing|ed|er|est)$/)
  if (dblMatch) {
    const cand = dblMatch[1] + dblMatch[2]
    if (CET_DICT[cand]) {
      lemmaCache[lower] = cand
      return cand
    }
  }

  lemmaCache[lower] = lower
  return lower
}

export function lookupWordDefinitionSync(rawWord: string): WordInfo {
  const clean = rawWord.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
  const lemma = lemmatizeWord(clean)
  const entry = CET_DICT[lemma] || CET_DICT[clean.toLowerCase()]

  if (entry) {
    return {
      word: clean,
      lemma: lemma,
      phonetic: entry.phonetic,
      pos: entry.pos,
      cn: entry.cn,
      shortCn: entry.rawCn ? entry.rawCn.split(/[；;，,]/)[0] : entry.cn,
      enDef: 'Offline English-Chinese dictionary (ECDICT, MIT).',
      level: entry.level,
      root: entry.root,
      derivatives: entry.derivatives,
      synonyms: entry.synonyms,
      isOfflineHit: true,
    }
  }

  if (clean.includes('-')) {
    const parts = clean.split('-').map((p) => {
      const pLem = lemmatizeWord(p)
      return CET_DICT[pLem] ? `${p}(${CET_DICT[pLem].cn.replace(/^[a-z./]+\s*/i, '').split('；')[0]})` : p
    })
    const firstLem = lemmatizeWord(clean.split('-')[0])
    const firstEntry = CET_DICT[firstLem]
    return {
      word: clean,
      lemma: lemma,
      phonetic: '',
      pos: '复合词',
      cn: '复合词组：' + parts.join(' + '),
      shortCn: parts.join('+'),
      enDef: 'Compound word analyzed by offline morphological engine.',
      level: '四六级复合词',
      root: '由连字符构成的复合词：' + parts.join(' + '),
      derivatives: firstEntry ? firstEntry.derivatives : '',
      synonyms: firstEntry ? firstEntry.synonyms : '',
      isOfflineHit: true,
    }
  }

  let detectedPos = 'n./v./adj.'
  const morphNotes: string[] = []
  for (const [pre, note] of PREFIX_HINTS) {
    if (lemma.startsWith(pre) && lemma.length > pre.length + 3) {
      const stemCand = lemmatizeWord(lemma.slice(pre.length))
      if (CET_DICT[stemCand]) {
        return {
          word: clean,
          lemma: lemma,
          phonetic: '/' + lemma + '/',
          pos: CET_DICT[stemCand].pos,
          cn: `${CET_DICT[stemCand].pos} ${CET_DICT[stemCand].rawCn}（派生自 ${stemCand}）`,
          shortCn: CET_DICT[stemCand].rawCn.split('；')[0],
          enDef: `Derived from root "${stemCand}" with prefix "${pre}-".`,
          level: '四六级派生词',
          root: `${pre}- (${note}) + ${stemCand} (${CET_DICT[stemCand].cn})`,
          derivatives: CET_DICT[stemCand].derivatives,
          synonyms: CET_DICT[stemCand].synonyms,
          isOfflineHit: true,
        }
      }
      morphNotes.push(`前缀 ${pre}-：${note}`)
      break
    }
  }
  for (const [suf, posHint, note] of SUFFIX_HINTS) {
    if (lemma.endsWith(suf) && lemma.length > suf.length + 2) {
      detectedPos = posHint
      morphNotes.push(`后缀 -${suf}：${note}`)
      break
    }
  }

  return {
    word: clean,
    lemma: lemma,
    phonetic: '',
    pos: detectedPos,
    cn: '词典未收录（可添加自定义释义）',
    shortCn: clean,
    enDef: '',
    level: '未收录',
    root: morphNotes.length > 0 ? morphNotes.join('；') : '',
    derivatives: '',
    synonyms: '',
    isOfflineHit: false,
  }
}
