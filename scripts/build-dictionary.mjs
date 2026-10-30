import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const inputPath = path.join(rootDir, 'paraphrased.json');
const outputDir = path.join(rootDir, 'src', 'data');
const outputPath = path.join(outputDir, 'enriched-terms.json');

const CHAPTERS = [
  { id: 'ch01', districtId: 'orient', name: '先史時代・古代オリエント', minPage: 1, maxPage: 12 },
  { id: 'ch02', districtId: 'asia_ancient', name: '古代インド・中国・南北アメリカ', minPage: 13, maxPage: 24 },
  { id: 'ch03', districtId: 'east_asia', name: '秦漢帝国〜隋唐と東アジア圏', minPage: 25, maxPage: 42 },
  { id: 'ch04', districtId: 'south_asia', name: '南・東南アジアとイラン文明', minPage: 43, maxPage: 52 },
  { id: 'ch05', districtId: 'mediterranean', name: '古代ギリシア・ローマ世界', minPage: 53, maxPage: 70 },
  { id: 'ch06', districtId: 'islam', name: 'イスラーム世界の形成と発展', minPage: 71, maxPage: 93 },
  { id: 'ch07', districtId: 'europe_medieval', name: '中世ヨーロッパとキリスト教世界', minPage: 94, maxPage: 112 },
  { id: 'ch08', districtId: 'eurasia_mongol', name: '宋・モンゴル帝国・明清と東アジア', minPage: 113, maxPage: 134 },
  { id: 'ch09', districtId: 'renaissance', name: '大航海時代・ルネサンス・三大帝国', minPage: 135, maxPage: 159 },
  { id: 'ch10', districtId: 'absolutism', name: '絶対王政・科学革命・重商主義', minPage: 160, maxPage: 183 },
  { id: 'ch11', districtId: 'revolution', name: '産業革命・市民革命・19世紀欧米', minPage: 184, maxPage: 229 },
  { id: 'ch12', districtId: 'asia_modern', name: '19世紀アジア・イスラームの変革', minPage: 230, maxPage: 249 },
  { id: 'ch13', districtId: 'imperialism', name: '帝国主義・第一次世界大戦・ロシア革命', minPage: 250, maxPage: 279 },
  { id: 'ch14', districtId: 'world_wars', name: '戦間期・民族運動・第二次世界大戦', minPage: 280, maxPage: 312 },
  { id: 'ch15', districtId: 'contemporary', name: '冷戦と現代のグローバル世界', minPage: 313, maxPage: 400 },
];

// Generic words to skip when stripping parentheses so we don't over-link common nouns
const STOP_ALIASES = new Set([
  '人類', '時代', '国家', '都市', '帝国', '王国', '戦争', '革命', '条約', '協定',
  '反乱', '内乱', '運動', '宣言', '憲法', '議会', '政府', '大統領', '皇帝', '国王',
  '教皇', '総督', '宰相', '将軍', '貴族', '市民', '農民', '奴隷', '商人', '騎士',
  '教会', '修道院', '大学', '文化', '芸術', '哲学', '科学', '宗教', '仏教', 'キリスト教',
  'イスラーム', 'イスラーム教', 'ヒンドゥー教', 'ユダヤ教', '共和政', '帝政', '王政',
  '封建制', '植民地', '独立', '講和', '同盟', '会議', '事件', '危機', '改革',
]);

function getChapter(page) {
  const p = page || 1;
  return CHAPTERS.find((c) => p >= c.minPage && p <= c.maxPage) || CHAPTERS[0];
}

function buildDictionary() {
  console.log('Reading paraphrased.json...');
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const terms = rawData.map((item, idx) => {
    const id = idx + 1;
    const page = item.source_page || 1;
    const chapter = getChapter(page);
    return {
      id,
      term: item.term.trim(),
      reading: item.reading ? item.reading.trim() : null,
      english_name: item.english_name ? item.english_name.trim() : null,
      frequency: item.frequency || 1,
      era: item.era ? item.era.trim() : null,
      description: item.description ? item.description.trim() : '',
      raw_related: item.related_terms || [],
      source_page: page,
      chapterId: chapter.id,
      chapterName: chapter.name,
      districtId: chapter.districtId,
    };
  });

  // Build alias -> termId map
  // Prefer higher frequency or earlier exact match when aliases collide
  const aliasMap = new Map();

  function registerAlias(surface, termObj, priority) {
    if (!surface || surface.length < 2) return;
    if (STOP_ALIASES.has(surface)) return;
    // Skip pure numbers or page strings
    if (/^[0-9p.,\s]+$/i.test(surface)) return;

    const existing = aliasMap.get(surface);
    if (
      !existing ||
      priority > existing.priority ||
      (priority === existing.priority && termObj.frequency > existing.frequency)
    ) {
      aliasMap.set(surface, {
        id: termObj.id,
        priority,
        frequency: termObj.frequency,
      });
    }
  }

  for (const t of terms) {
    // 1. Exact term name (highest priority = 3)
    registerAlias(t.term, t, 3);

    // Strip 〈...〉 suffix e.g. "共和政〈イギリス〉" -> don't strip if too generic, handled by STOP_ALIASES
    const withoutAngle = t.term.replace(/〈[^〉]+〉/g, '').trim();
    if (withoutAngle !== t.term && withoutAngle.length >= 3) {
      registerAlias(withoutAngle, t, 2);
    }

    // Strip （...） and also extract inside （...）
    const parenMatch = withoutAngle.match(/^(.+?)（(.+?)）$/);
    if (parenMatch) {
      const mainPart = parenMatch[1].trim();
      const innerPart = parenMatch[2].trim();
      if (mainPart.length >= 2) registerAlias(mainPart, t, 2);
      if (innerPart.length >= 3) registerAlias(innerPart, t, 2);
    }

    // Strip quotes 『...』 or 「...」 for matching inside text as well as keeping with quotes
    const strippedQuotes = withoutAngle.replace(/^[『「](.+?)[』」]$/, '$1').trim();
    if (strippedQuotes !== withoutAngle && strippedQuotes.length >= 3) {
      registerAlias(strippedQuotes, t, 2);
    }

    // If term ends with 1世 (e.g., ナポレオン1世), allow base name if >= 4 chars
    const rulerMatch = withoutAngle.match(/^([ァ-ヶー＝]{4,})1世$/);
    if (rulerMatch) {
      registerAlias(rulerMatch[1], t, 1);
    }
  }

  // Build Trie for fast longest-match scanning of descriptions
  const trieRoot = {};
  for (const [surface, info] of aliasMap.entries()) {
    let node = trieRoot;
    for (const ch of surface) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = { id: info.id, surface };
  }

  function findInlineLinks(text, selfId) {
    const spans = [];
    const linkedIds = new Set();
    const chars = Array.from(text);
    const n = chars.length;
    let i = 0;

    while (i < n) {
      let node = trieRoot;
      let lastMatch = null;
      let lastMatchEnd = i;

      for (let j = i; j < n; j++) {
        const ch = chars[j];
        if (!node[ch]) break;
        node = node[ch];
        if (node.$ && node.$.id !== selfId) {
          lastMatch = node.$;
          lastMatchEnd = j + 1;
        }
      }

      if (lastMatch) {
        spans.push({
          termId: lastMatch.id,
          surface: chars.slice(i, lastMatchEnd).join(''),
          start: i,
          end: lastMatchEnd,
        });
        linkedIds.add(lastMatch.id);
        i = lastMatchEnd;
      } else {
        i++;
      }
    }

    return { spans, outIds: Array.from(linkedIds) };
  }

  const backlinksMap = new Map();
  for (const t of terms) {
    backlinksMap.set(t.id, new Set());
  }

  let totalLinks = 0;

  for (const t of terms) {
    const { spans, outIds } = findInlineLinks(t.description, t.id);
    t.inlineSpans = spans;
    t.outLinks = outIds;
    totalLinks += outIds.length;

    // Resolve raw_related ("p.198", "p.96, 105", or term names)
    const relatedPages = new Set();
    const explicitTermIds = new Set();

    for (const raw of t.raw_related) {
      const str = String(raw).trim();
      const aliasHit = aliasMap.get(str);
      if (aliasHit && aliasHit.id !== t.id) {
        explicitTermIds.add(aliasHit.id);
        backlinksMap.get(aliasHit.id)?.add(t.id);
      } else {
        // Extract page numbers if present
        const nums = str.match(/\d+/g);
        if (nums) {
          for (const numStr of nums) {
            const pNum = parseInt(numStr, 10);
            if (pNum >= 1 && pNum <= 362 && pNum !== t.source_page) {
              relatedPages.add(pNum);
            }
          }
        }
      }
    }

    for (const targetId of outIds) {
      backlinksMap.get(targetId)?.add(t.id);
    }

    t.explicitRelatedIds = Array.from(explicitTermIds);
    t.relatedPages = Array.from(relatedPages);
    delete t.raw_related;
  }

  for (const t of terms) {
    t.inLinks = Array.from(backlinksMap.get(t.id) || []).slice(0, 40);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ chapters: CHAPTERS, terms }),
    'utf-8'
  );

  console.log(
    `Enriched ${terms.length} terms with ${totalLinks} automatic inline links -> ${outputPath}`
  );
}

buildDictionary();
