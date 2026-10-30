import { HistoricalBuilding, EnrichedTerm, ChirperPost } from '@/types/history';

export const HISTORICAL_BUILDINGS: HistoricalBuilding[] = [
  {
    id: 'b_ziggurat',
    name: 'ウルのジッグラト',
    subtitle: 'メソポタミアの聖塔と都市神殿',
    chapterId: 'ch01',
    eraLabel: '古代オリエント',
    shape: 'ziggurat',
    primaryColor: '#d4a373',
    secondaryColor: '#b5835a',
    accentColor: '#3a86ff',
    gridX: 1,
    gridY: 1,
    size: 2,
    triggerTerms: ['ジッグラト', 'ウル', 'シュメール人', '楔形文字', 'ハンムラビ法典'],
    requiredChapterReads: 1,
    populationBonus: 1200,
    cultureBonus: 35,
    scienceBonus: 25,
    citizenRole: '粘土板の書記官',
    citizenColor: '#e9c46a',
    citizenQuote: '葦のペンで粘土板に麦の収穫量を記録中。楔形文字は画数が多くて腕が疲れるなあ。',
    lore: '都市の中心にそびえる階層状の聖塔。神殿を中心に穀物倉庫や書記の工房が集まり、人類最初の都市文明が鼓動を始めます。',
  },
  {
    id: 'b_pyramid',
    name: 'ギザの大ピラミッド',
    subtitle: '太陽神と王権の永遠なる象徴',
    chapterId: 'ch01',
    eraLabel: '古代エジプト',
    shape: 'pyramid',
    primaryColor: '#f4a261',
    secondaryColor: '#e76f51',
    accentColor: '#ffd166',
    gridX: 3,
    gridY: 1,
    size: 2,
    triggerTerms: ['ピラミッド', 'クフ', 'ギザ', '太陽暦', '神聖文字', 'ロゼッタ＝ストーン'],
    requiredChapterReads: 3,
    populationBonus: 2500,
    cultureBonus: 60,
    scienceBonus: 45,
    citizenRole: 'ナイルの測量技師',
    citizenColor: '#f4a261',
    citizenQuote: '今年のナイル川の氾濫も無事に引いたぞ！幾何学を使って農地の境界線を測り直そう。',
    lore: 'ナイルの賜物として栄えたエジプト古王国の巨大建造物。太陽暦と測量術の発展により、都市の治水と建築技術が飛躍的に向上します。',
  },
  {
    id: 'b_mohenjo',
    name: 'モヘンジョ＝ダロの大浴場',
    subtitle: '計画都市と上下水道の先駆け',
    chapterId: 'ch02',
    eraLabel: '古代インド・中国',
    shape: 'market',
    primaryColor: '#c97b63',
    secondaryColor: '#9e5844',
    accentColor: '#4cc9f0',
    gridX: 5,
    gridY: 1,
    size: 1,
    triggerTerms: ['モヘンジョ＝ダロ', 'インダス文明', 'ハラッパー', '甲骨文字', '殷'],
    requiredChapterReads: 1,
    populationBonus: 1800,
    cultureBonus: 30,
    scienceBonus: 50,
    citizenRole: 'インダスの都市計画師',
    citizenColor: '#4cc9f0',
    citizenQuote: '焼きレンガで舗装した大通りと排水溝が完成！衛生環境ならどの古代都市にも負けないよ。',
    lore: '碁盤の目状の街路と精巧な上下水道を備えた古代の計画都市区画。都市の衛生度と住民の健康を大きく引き上げます。',
  },
  {
    id: 'b_changan',
    name: '長安・大雁塔と朱雀大路',
    subtitle: '百万人が集うコスモポリタン都城',
    chapterId: 'ch03',
    eraLabel: '秦漢〜隋唐帝国',
    shape: 'pagoda',
    primaryColor: '#e63946',
    secondaryColor: '#457b9d',
    accentColor: '#ffb703',
    gridX: 6,
    gridY: 1,
    size: 2,
    triggerTerms: ['長安', '唐', '玄奘', '始皇帝', '万里の長城', '科挙'],
    requiredChapterReads: 2,
    populationBonus: 4500,
    cultureBonus: 85,
    scienceBonus: 70,
    citizenRole: 'シルクロードのソグド商人',
    citizenColor: '#e63946',
    citizenQuote: '西域からガラス器と絨毯を運んできたぞ！長安の西市はペルシア人や留学生でごった返しているね。',
    lore: '東西交易の終着点として世界最大の人口を誇った国際都市。科挙官僚や詩人、西域の商人が行き交い、都市の経済と文化が花開きます。',
  },
  {
    id: 'b_parthenon',
    name: 'アクロポリスとパルテノン神殿',
    subtitle: 'ポリス民主政と哲学の殿堂',
    chapterId: 'ch05',
    eraLabel: '古代ギリシア',
    shape: 'parthenon',
    primaryColor: '#f8f9fa',
    secondaryColor: '#dee2e6',
    accentColor: '#3a86ff',
    gridX: 1,
    gridY: 3,
    size: 2,
    triggerTerms: ['パルテノン神殿', 'アテネ', 'ペリクレス', 'ソクラテス', 'プラトン', 'ポリス'],
    requiredChapterReads: 1,
    populationBonus: 2200,
    cultureBonus: 95,
    scienceBonus: 80,
    citizenRole: 'アゴラの哲学者',
    citizenColor: '#3a86ff',
    citizenQuote: '今日の民会の議論は白熱したなあ。「無知の知」を胸に、広場（アゴラ）で若者たちと対話してこよう。',
    lore: '白亜の大理石で築かれたドーリア式の傑作。市民が集うアゴラと劇場が併設され、都市の民主主義と学術レベルを劇的に高めます。',
  },
  {
    id: 'b_colosseum',
    name: 'コロッセオとローマ水道橋',
    subtitle: '「すべての道はローマに通ず」',
    chapterId: 'ch05',
    eraLabel: 'ローマ帝国',
    shape: 'colosseum',
    primaryColor: '#e9d8a6',
    secondaryColor: '#ca6702',
    accentColor: '#ae2012',
    gridX: 3,
    gridY: 3,
    size: 2,
    triggerTerms: ['コロッセオ', 'ローマ', 'アウグストゥス', 'パクス＝ロマーナ', '五賢帝', 'コンスタンティヌス'],
    requiredChapterReads: 3,
    populationBonus: 5000,
    cultureBonus: 90,
    scienceBonus: 85,
    citizenRole: 'ローマ市民（元老院議員）',
    citizenColor: '#ae2012',
    citizenQuote: '水道橋のおかげで今日もテルマエ（公衆浴場）が快適だ！「パンとサーカス」で市民の幸福度も最高潮さ。',
    lore: '巨大な円形闘技場と精巧なアーチ式水道網。インフラ整備と都市エンターテインメントにより、メガロポリスとしての基盤が確立されます。',
  },
  {
    id: 'b_baghdad',
    name: 'バグダード「知恵の館」と大モスク',
    subtitle: '世界知識の交差点・円城都市',
    chapterId: 'ch06',
    eraLabel: 'イスラーム世界',
    shape: 'mosque',
    primaryColor: '#00b4d8',
    secondaryColor: '#f4e285',
    accentColor: '#0077b6',
    gridX: 5,
    gridY: 3,
    size: 2,
    triggerTerms: ['バグダード', '知恵の館', 'アッバース朝', 'ハールーン＝アッラシード', 'イブン＝シーナー'],
    requiredChapterReads: 1,
    populationBonus: 4200,
    cultureBonus: 90,
    scienceBonus: 110,
    citizenRole: '知恵の館の天文学者',
    citizenColor: '#00b4d8',
    citizenQuote: 'ギリシア語の医学書とインドの数学書をアラビア語に翻訳完了！代数学と天体観測がどんどん進んでいるよ。',
    lore: '青いドームとミナレットが輝く学術・商業の中心地。東西の文献が翻訳・研究され、都市の科学力が爆発的に伸びます。',
  },
  {
    id: 'b_cathedral',
    name: 'ゴシック大聖堂と中世大学',
    subtitle: '都市自治（コミューン）とステンドグラスの光',
    chapterId: 'ch07',
    eraLabel: '中世ヨーロッパ',
    shape: 'cathedral',
    primaryColor: '#adb5bd',
    secondaryColor: '#495057',
    accentColor: '#7209b7',
    gridX: 7,
    gridY: 3,
    size: 2,
    triggerTerms: ['ゴシック様式', 'ボローニャ大学', 'パリ大学', 'オクスフォード大学', 'ギルド', '十字軍'],
    requiredChapterReads: 1,
    populationBonus: 3100,
    cultureBonus: 85,
    scienceBonus: 65,
    citizenRole: '自由都市のギルド親方',
    citizenColor: '#7209b7',
    citizenQuote: '「都市の空気は自由にする」！大聖堂の尖塔も完成したし、今夜はギルドホールで職人たちと祝杯だ。',
    lore: '天高くそびえる尖塔とバラ窓を持つ大聖堂、そして学生たちが集う中世大学。商業ギルドとともに自治都市の活気を生み出します。',
  },
  {
    id: 'b_samarkand',
    name: 'サマルカンドの蒼き広場（レギスタン）',
    subtitle: 'ユーラシア交易とティムール朝の栄華',
    chapterId: 'ch08',
    eraLabel: 'モンゴル・東アジア再編',
    shape: 'palace_east',
    primaryColor: '#0096c7',
    secondaryColor: '#ffd166',
    accentColor: '#48cae4',
    gridX: 1,
    gridY: 5,
    size: 2,
    triggerTerms: ['サマルカンド', 'ティムール', 'フビライ', '大都', '交子', '杭州'],
    requiredChapterReads: 1,
    populationBonus: 3800,
    cultureBonus: 95,
    scienceBonus: 75,
    citizenRole: '駅伝（ジャムチ）の使者',
    citizenColor: '#48cae4',
    citizenQuote: '牌子（パイザ）を掲げてユーラシア大陸を横断中！サマルカンドの青タイルはいつ見ても息を呑む美しさだなあ。',
    lore: '『世界の宝石』と称えられた青の都。ユーラシア規模の物流網（ジャムチ）と商業ネットワークが都市の富を倍増させます。',
  },
  {
    id: 'b_duomo',
    name: 'サン＝ピエトロ大聖堂とルネサンス工房',
    subtitle: '人間性の再生と大航海時代の羅針盤',
    chapterId: 'ch09',
    eraLabel: 'ルネサンス・大航海時代',
    shape: 'dome_renaissance',
    primaryColor: '#e07a5f',
    secondaryColor: '#f4f1de',
    accentColor: '#3d405b',
    gridX: 3,
    gridY: 5,
    size: 2,
    triggerTerms: ['サン＝ピエトロ大聖堂', 'ルネサンス', 'レオナルド＝ダ＝ヴィンチ', 'ミケランジェロ', 'フィレンツェ', 'コロンブス'],
    requiredChapterReads: 1,
    populationBonus: 4600,
    cultureBonus: 130,
    scienceBonus: 110,
    citizenRole: 'フィレンツェの万能芸術家',
    citizenColor: '#e07a5f',
    citizenQuote: '遠近法を使った新作のフレスコ画に、活版印刷術の本も届いた！新しい時代の風が街中に吹いているね。',
    lore: 'ミケランジェロが設計した壮麗な大円蓋（クーポラ）。芸術工房、活版印刷所、天文台が集まり、都市の文化と科学が黄金期を迎えます。',
  },
  {
    id: 'b_tajmahal',
    name: 'タージ＝マハルとイスラーム帝国庭園',
    subtitle: '白大理石のシンメトリーと海洋交易',
    chapterId: 'ch09',
    eraLabel: 'イスラーム三大帝国',
    shape: 'taj_mahal',
    primaryColor: '#ffffff',
    secondaryColor: '#e2eafc',
    accentColor: '#06d6a0',
    gridX: 5,
    gridY: 5,
    size: 2,
    triggerTerms: ['タージ＝マハル', 'ムガル帝国', 'シャー＝ジャハーン', 'アクバル', 'オスマン帝国', 'スレイマン1世'],
    requiredChapterReads: 3,
    populationBonus: 4800,
    cultureBonus: 140,
    scienceBonus: 80,
    citizenRole: '宮廷の細密画（ミニアチュール）師',
    citizenColor: '#06d6a0',
    citizenQuote: '水路に映る白大理石のドームが完璧な左右対称を描いている…これぞ帝国建築の極致だね！',
    lore: 'インド・イスラーム文化が融合した白亜の霊廟と幾何学庭園。都市の景観評価と観光・文化魅力度を最高ランクへ引き上げます。',
  },
  {
    id: 'b_versailles',
    name: 'ヴェルサイユ宮殿と王立科学アカデミー',
    subtitle: '太陽王のバロック宮廷と科学革命',
    chapterId: 'ch10',
    eraLabel: '絶対王政・科学革命',
    shape: 'versailles',
    primaryColor: '#ffbe0b',
    secondaryColor: '#3a86ff',
    accentColor: '#fb5607',
    gridX: 7,
    gridY: 5,
    size: 2,
    triggerTerms: ['ヴェルサイユ宮殿', 'ルイ14世', 'ニュートン', '科学革命', '重商主義', '東インド会社'],
    requiredChapterReads: 1,
    populationBonus: 5500,
    cultureBonus: 125,
    scienceBonus: 135,
    citizenRole: '王立天文台の自然哲学者',
    citizenColor: '#ffbe0b',
    citizenQuote: 'サロンで珈琲を飲みながら万有引力の法則について議論したよ。宮殿の鏡の回廊では今夜も舞踏会が開かれているらしい。',
    lore: '広大な幾何学式庭園を持つバロック建築の頂点。王立科学アカデミーや取引所が整備され、近代国家としての都市機能が一気に整います。',
  },
  {
    id: 'b_factory_rail',
    name: '蒸気機関ステーションと近代工場街',
    subtitle: '産業革命と鉄道ネットワークの誕生',
    chapterId: 'ch11',
    eraLabel: '産業革命・市民革命',
    shape: 'factory',
    primaryColor: '#8d99ae',
    secondaryColor: '#ef233c',
    accentColor: '#2b2d42',
    gridX: 2,
    gridY: 7,
    size: 2,
    triggerTerms: ['産業革命', 'ワット', 'スティーヴンソン', 'フランス革命', '人権宣言', 'ナポレオン1世'],
    requiredChapterReads: 1,
    populationBonus: 8500,
    cultureBonus: 95,
    scienceBonus: 180,
    citizenRole: '蒸気機関車の機関士',
    citizenColor: '#ef233c',
    citizenQuote: '石炭をくべろ！マンチェスターからロンドンまで鉄道が開通して、街の物流と人口が一気に10倍になったぞ！',
    lore: '赤レンガの時計塔付き中央駅と蒸気機関工場。鉄道網によって都市人口が爆発的に増加し、近代市民社会へと突入します。',
  },
  {
    id: 'b_eiffel',
    name: 'エッフェル塔と万国博覧会パビリオン',
    subtitle: '鉄とガラスの世紀・ベル＝エポックの摩天楼',
    chapterId: 'ch13',
    eraLabel: '帝国主義・近代都市',
    shape: 'eiffel',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    accentColor: '#38bdf8',
    gridX: 5,
    gridY: 7,
    size: 2,
    triggerTerms: ['パリ万国博覧会', 'エッフェル塔', 'ベル＝エポック', '帝国主義', 'スエズ運河', '大陸横断鉄道'],
    requiredChapterReads: 1,
    populationBonus: 9500,
    cultureBonus: 170,
    scienceBonus: 165,
    citizenRole: '万博を取材する新聞記者',
    citizenColor: '#f59e0b',
    citizenQuote: '街に電灯が灯り、地下鉄と自動車が走り始めた！万博パビリオンの鉄骨タワーから眺める夜景はまるで未来都市だ。',
    lore: '近代建築と鉄鋼技術の象徴。電力網・地下鉄・大通り（ブールヴァール）が都市全体に行き渡り、華やかな近代メトロポリスが完成します。',
  },
  {
    id: 'b_modern_un',
    name: '国際連合本部とグローバル・サイエンスタワー',
    subtitle: '宇宙開発・情報革命と多文化共生メトロポリス',
    chapterId: 'ch15',
    eraLabel: '現代世界',
    shape: 'modern_tower',
    primaryColor: '#38bdf8',
    secondaryColor: '#0284c7',
    accentColor: '#a855f7',
    gridX: 7,
    gridY: 7,
    size: 2,
    triggerTerms: ['国際連合', '冷戦', '人工衛星', 'インターネット', 'ヨーロッパ連合', 'ポスト＝モダニズム'],
    requiredChapterReads: 1,
    populationBonus: 12000,
    cultureBonus: 200,
    scienceBonus: 250,
    citizenRole: '国際機関のデータ研究者',
    citizenColor: '#38bdf8',
    citizenQuote: '先史時代の石器から始まったこの都市も、いまや世界中の文化と歴史遺産が共存するスマート・メトロポリスになったね！',
    lore: 'ガラス張りの高層ビルと国際会議場。5,000年にわたる人類の知恵と建造物が一堂に会する、究極の世界史都市のランドマークです。',
  },
];

export interface CityLevelInfo {
  level: number;
  title: string;
  eraName: string;
  nextThreshold: number;
}

export function calculateCityLevel(readCount: number): CityLevelInfo {
  const tiers = [
    { level: 1, title: '新石器の集落', eraName: '先史・農耕開始期', min: 0, next: 3 },
    { level: 2, title: '大河の都市国家', eraName: '古代オリエント・大河文明期', min: 3, next: 8 },
    { level: 3, title: 'ポリスと交易都市', eraName: '古典古代・地中海交易期', min: 8, next: 15 },
    { level: 4, title: 'シルクロードの国際都城', eraName: '世界帝国・東西交流期', min: 15, next: 25 },
    { level: 5, title: '自由都市とルネサンスの都', eraName: '中世都市・大航海時代', min: 25, next: 40 },
    { level: 6, title: '蒸気と革命の近代メトロポリス', eraName: '産業革命・国民国家期', min: 40, next: 65 },
    { level: 7, title: '人類知のグローバル首都', eraName: '現代・スマート文明期', min: 65, next: 100 },
  ];

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (readCount >= tiers[i].min) {
      return {
        level: tiers[i].level,
        title: tiers[i].title,
        eraName: tiers[i].eraName,
        nextThreshold: tiers[i].next,
      };
    }
  }
  return { level: 1, title: '新石器の集落', eraName: '先史・農耕開始期', nextThreshold: 3 };
}

export function isBuildingUnlocked(
  building: HistoricalBuilding,
  readTermIds: Set<number>,
  termsById: Map<number, EnrichedTerm>
): { unlocked: boolean; progress: number; reason: string } {
  let chapterReadCount = 0;
  let matchedTriggerTerm: string | null = null;

  for (const id of readTermIds) {
    const t = termsById.get(id);
    if (!t) continue;
    if (t.chapterId === building.chapterId) {
      chapterReadCount++;
    }
    for (const kw of building.triggerTerms) {
      if (t.term.includes(kw) || kw.includes(t.term)) {
        matchedTriggerTerm = t.term;
      }
    }
  }

  if (matchedTriggerTerm) {
    return {
      unlocked: true,
      progress: 100,
      reason: `関連用語「${matchedTriggerTerm}」の学習により建設完了！`,
    };
  }

  if (chapterReadCount >= building.requiredChapterReads) {
    return {
      unlocked: true,
      progress: 100,
      reason: `${building.eraLabel}エリアの用語を${chapterReadCount}語学習して建設完了！`,
    };
  }

  const pct = Math.min(
    99,
    Math.round((chapterReadCount / building.requiredChapterReads) * 100)
  );
  return {
    unlocked: false,
    progress: pct,
    reason: `解放条件：「${building.triggerTerms.slice(0, 3).join('・')}」等の用語を読むか、${building.eraLabel}の用語をあと${building.requiredChapterReads - chapterReadCount}語読む`,
  };
}

const CITIZEN_NAMES = [
  'アメンホテプ', 'リュサンドロス', 'マルクス', '張騫', 'ファーティマ',
  'ジョヴァンニ', 'レオノーラ', 'アル＝ビールーニー', 'ジャン', 'ソフィア',
  'トーマス', 'シャルロット', 'ハサン', 'クララ', 'エミール',
];

export function generateChirperPostForTerm(term: EnrichedTerm): ChirperPost {
  const name = CITIZEN_NAMES[term.id % CITIZEN_NAMES.length];
  const colors = ['#00b4d8', '#f4a261', '#e63946', '#06d6a0', '#ffbe0b', '#8338ec'];
  const avatarColor = colors[term.id % colors.length];

  const shortDesc =
    term.description.length > 52
      ? term.description.slice(0, 52) + '…'
      : term.description;

  const templates = [
    `街の図書館で「${term.term}」の記録が発見されたよ！${term.era ? `（${term.era}）` : ''} ${shortDesc} #${term.term}`,
    `広場のみんなが「${term.term}」の話題で持ちきりだ！私たちの都市の文化度がまた一歩進んだね✨ #${term.chapterName}`,
    `今日の都市ニュース：「${term.term}」の知識がアーカイブに登録されました！関連する歴史建造物の建設も進んでいます🏛️ #${term.term}`,
  ];

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    id: `chirp_${term.id}_${Date.now()}`,
    citizenName: `${name}（${term.chapterName.slice(0, 6)}地区の住民）`,
    citizenRole: term.era || term.chapterName,
    avatarColor,
    message: templates[term.id % templates.length],
    relatedTermId: term.id,
    relatedTermName: term.term,
    timestamp: timeStr,
  };
}
