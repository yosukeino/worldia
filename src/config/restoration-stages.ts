import { CityPoints, QAItem } from '@/types/history';

export interface RestorationTask {
  id: string;
  title: string;
  description: string;
  cost: CityPoints;
  category: 'population' | 'culture' | 'tech';
  completeMessage: string;
}

export interface RestorationPhase {
  phaseNumber: number; // 1 to 5
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  /** Tasks required in this phase to advance to the next phase (empty on the final 100% phase) */
  tasks: RestorationTask[];
}

export interface RestorationStage {
  id: number;
  name: string;
  era: string;
  region: string;
  relatedTermId: number;
  summary: string;
  phases: RestorationPhase[];
}

/**
 * 1問回答ごとに獲得できる「人口」「文化」「技術」ポイントを算出する
 * - 通常進行（フラッシュカードのカードタップ / 4択不正解での学習）：ベース獲得
 * - ボーナス進行（フラッシュカードの「もうこの問題を表示しない」 / 4択正解）：大幅ボーナス
 * - 問題の内容・章に応じて3種のどれかに特化ボーナスも付与
 */
export function calculateQuestionReward(item: QAItem, isBonus: boolean): CityPoints {
  const basePop = isBonus ? 25 : 10;
  const baseCulture = isBonus ? 20 : 8;
  const baseTech = isBonus ? 20 : 8;

  const text = `${item.chapter} ${item.section} ${item.question} ${item.answer}`;

  let extraPop = 0;
  let extraCulture = 0;
  let extraTech = 0;

  if (/仏教|キリスト|イスラーム|文化|芸術|美術|文学|思想|哲学|神殿|教会|寺院|建築|壁画|文字/.test(text)) {
    extraCulture = isBonus ? 12 : 5;
  } else if (/革命|技術|鉄器|青銅|羅針盤|火薬|活版|航海|鉄道|蒸気|工業|科学|暦|農業|交易|貿易|貨幣/.test(text)) {
    extraTech = isBonus ? 12 : 5;
  } else {
    extraPop = isBonus ? 12 : 5;
  }

  return {
    population: basePop + extraPop,
    culture: baseCulture + extraCulture,
    tech: baseTech + extraTech,
  };
}

export const RESTORATION_STAGES: RestorationStage[] = [
  {
    id: 1,
    name: 'パルテノン神殿とアクロポリス',
    era: '紀元前5世紀（古代ギリシア・ポリス黄金時代）',
    region: 'アテネ（ギリシア）',
    relatedTermId: 394,
    summary:
      '長年の戦火と風化で瓦礫に埋もれたアクロポリスの丘を片付け、ペリクレス時代の極彩色に輝くパルテノン神殿へと少しずつ修復しましょう。',
    phases: [
      {
        phaseNumber: 1,
        title: '第1段階：荒廃した遺跡と瓦礫の撤去',
        subtitle: '崩壊した円柱と雑草に覆われたアクロポリス',
        description:
          '現在のアクロポリスは崩れ落ちた大理石の破片と雑草で足の踏み場もありません。まずは人手と道具を投入して広場を片付け、基礎を露出させましょう。',
        imageUrl: '/stages/stage1/phase1.jpg',
        tasks: [
          {
            id: 's1_p1_t1',
            title: '散乱した大理石の瓦礫を撤去する',
            description: '市民と石工を集め、参道に崩れ落ちた巨大な円柱ドラムと石材を片付けます。',
            cost: { population: 25, culture: 0, tech: 10 },
            category: 'population',
            completeMessage: '広場を塞いでいた瓦礫が撤去され、見通しが良くなりました！',
          },
          {
            id: 's1_p1_t2',
            title: '遺跡を覆う雑草の伐採と石畳の清掃',
            description: '石畳の隙間から生い茂った雑草を刈り取り、当時の聖なる参道を掘り起こします。',
            cost: { population: 30, culture: 15, tech: 0 },
            category: 'population',
            completeMessage: '美しい石畳の広場が姿を現しました！',
          },
          {
            id: 's1_p1_t3',
            title: '基壇（スタイロベート）の水平測量と補修',
            description: 'わずかに湾曲させて視覚的調和を生む古代ギリシアの測量技術で基礎を直します。',
            cost: { population: 15, culture: 10, tech: 35 },
            category: 'tech',
            completeMessage: '第1段階完了！木製クレーンと足場が組まれ、いよいよ神殿再建が始まります！',
          },
        ],
      },
      {
        phaseNumber: 2,
        title: '第2段階：基礎の整備とドーリア式列柱の立ち上げ',
        subtitle: '整地された広場と古代木製クレーンの稼働',
        description:
          '瓦礫が片付き、石畳と基礎が綺麗に整いました！滑車を用いた木製クレーンと足場を使って、外周46本の巨大なドーリア式白大理石円柱を積み上げましょう。',
        imageUrl: '/stages/stage1/phase2.jpg',
        tasks: [
          {
            id: 's1_p2_t1',
            title: 'ペンテリコン山から白大理石を切り出し運搬',
            description: 'アテネ近郊の名石ペンテリコン大理石を切り出し、アクロポリス頂上へ引き上げます。',
            cost: { population: 50, culture: 0, tech: 30 },
            category: 'population',
            completeMessage: '純白のペンテリコン大理石ブロックが現場に揃いました！',
          },
          {
            id: 's1_p2_t2',
            title: '滑車式大型クレーンと足場の構築',
            description: '数トンの石材を精密に積み上げるための古代ギリシア式滑車クレーンを稼働させます。',
            cost: { population: 25, culture: 15, tech: 55 },
            category: 'tech',
            completeMessage: '大型木製クレーンが稼働し、高所作業が可能になりました！',
          },
          {
            id: 's1_p2_t3',
            title: 'エンタシスの膨らみを持つ46本の円柱を再建',
            description: '美しい視覚効果を生むドーリア式円柱のドラムを、鉛と鉄の留め具で正確に接合します。',
            cost: { population: 55, culture: 40, tech: 45 },
            category: 'culture',
            completeMessage: '第2段階完了！46本の白亜の大列柱が天に向かって立ち並びました！',
          },
        ],
      },
      {
        phaseNumber: 3,
        title: '第3段階：大列柱の完成と屋根架構・彫刻の造営',
        subtitle: '立ち並んだ白亜の円柱と屋根の組み上げ',
        description:
          '外周のドーリア式円柱がすべて立ち上がりました！次は柱の上に大梁（エンタブラチュア）を渡し、大理石の屋根瓦と華麗な浮彫彫刻を施しましょう。',
        imageUrl: '/stages/stage1/phase3.jpg',
        tasks: [
          {
            id: 's1_p3_t1',
            title: '大梁（アーキトレーヴ）と木造小屋組の架設',
            description: '列柱の頂部をつなぐ巨大な石梁を渡し、糸杉の木材で頑丈な屋根構造を組みます。',
            cost: { population: 65, culture: 20, tech: 70 },
            category: 'tech',
            completeMessage: '神殿上部の骨格がしっかりと組み上がりました！',
          },
          {
            id: 's1_p3_t2',
            title: 'パロス島産大理石の屋根瓦の敷設',
            description: '太陽光を透過する最高級のパロス島産大理石で作られた屋根瓦を隙間なく並べます。',
            cost: { population: 60, culture: 45, tech: 55 },
            category: 'tech',
            completeMessage: '白く輝く大理石の屋根が完成しました！',
          },
          {
            id: 's1_p3_t3',
            title: 'メトープ浮彫とパンアテナイア祭フリーズの彫刻',
            description: '神話の戦いとアテネ市民の祭礼行列を描いた全長160mの浮彫彫刻を復元します。',
            cost: { population: 40, culture: 90, tech: 40 },
            category: 'culture',
            completeMessage: '第3段階完了！破風彫刻と極彩色の装飾が神殿に蘇りました！',
          },
        ],
      },
      {
        phaseNumber: 4,
        title: '第4段階：極彩色（ポリクロミー）と破風彫刻の仕上げ',
        subtitle: '蘇った古代の色彩・黄金時代への最終仕上げ',
        description:
          '本来、古代ギリシアの神殿は真っ白ではなく、ラピスラズリの青・辰砂の赤・金箔で彩られていました。神殿内部の本尊と広場のモニュメントを仕上げて完全復興を果たしましょう！',
        imageUrl: '/stages/stage1/phase4.jpg',
        tasks: [
          {
            id: 's1_p4_t1',
            title: 'フェイディアス作「黄金象牙のアテナ女神像」安置',
            description: '高さ12メートル、黄金と象牙で造られた守護神アテナ・パルテノス像を神殿内部に奉納します。',
            cost: { population: 50, culture: 110, tech: 60 },
            category: 'culture',
            completeMessage: '神殿の奥に黄金のアテナ女神像が鎮座しました！',
          },
          {
            id: 's1_p4_t2',
            title: '屋根頂部の黄金アクロテリア（棟飾り）の設置',
            description: '屋根の頂点と四隅に、太陽の光を反射して輝く黄金の唐草模様飾りを据え付けます。',
            cost: { population: 40, culture: 80, tech: 75 },
            category: 'tech',
            completeMessage: '黄金の棟飾りが地中海の太陽を浴びて輝き始めました！',
          },
          {
            id: 's1_p4_t3',
            title: '聖なるオリーブの木とアテネ市民の祝祭広場復興',
            description: '広場にブロンズ像とオリーブの木を植え、市民が集うパンアテナイア祭の賑わいを取り戻します。',
            cost: { population: 110, culture: 90, tech: 40 },
            category: 'population',
            completeMessage: 'ステージ1 完全復興達成！黄金時代のアクロポリスが当時の姿で完全に蘇りました！',
          },
        ],
      },
      {
        phaseNumber: 5,
        title: '完全復興：紀元前5世紀・黄金時代のアクロポリス',
        subtitle: '100% RESTORED — 当時のままの極彩色パルテノン神殿',
        description:
          '見事です！瓦礫に埋もれていた遺跡は完全に片付けられ、極彩色の彫刻と黄金の装飾が輝く紀元前5世紀アテネ最盛期の姿へと完全に復興されました！',
        imageUrl: '/stages/stage1/phase5.jpg',
        tasks: [],
      },
    ],
  },
  {
    id: 2,
    name: 'ギザの大ピラミッドとスフィンクス',
    era: '紀元前26世紀（エジプト古王国時代・第4王朝）',
    region: 'ギザ（エジプト）',
    relatedTermId: 12,
    summary:
      '砂漠の砂嵐に埋もれ、化粧石が剥がれ落ちた大ピラミッドとスフィンクスを発掘・修復し、白亜の石灰岩と黄金のキャップストーンが輝く古代エジプトの威容を取り戻しましょう。',
    phases: [
      {
        phaseNumber: 1,
        title: '第1段階：砂に埋もれたスフィンクスとピラミッドの発掘',
        subtitle: '肩まで砂丘に埋没した古代エジプトの巨像',
        description:
          '数千年の砂嵐により、大スフィンクスは肩まで砂に埋もれ、参道も瓦礫で塞がれています。まずは膨大な砂を掘り起こし、古代の参道を蘇らせましょう。',
        imageUrl: '/stages/stage2/phase1.jpg',
        tasks: [
          {
            id: 's2_p1_t1',
            title: 'スフィンクス周囲の巨大な砂丘を掘り起こす',
            description: '労働力を結集して、スフィンクスの胴体と前足を覆い尽くす砂漠の砂を搬出します。',
            cost: { population: 80, culture: 20, tech: 30 },
            category: 'population',
            completeMessage: 'スフィンクスの巨大な前足と「夢の碑文」が砂の中から姿を現しました！',
          },
          {
            id: 's2_p1_t2',
            title: '葬祭殿とピラミッド参道（コーズウェイ）の瓦礫撤去',
            description: 'ナイル河畔の河岸神殿からピラミッドへと続く石造りの参道を発掘・清掃します。',
            cost: { population: 90, culture: 50, tech: 50 },
            category: 'tech',
            completeMessage: '古代エジプトの聖なる参道が開通しました！',
          },
          {
            id: 's2_p1_t3',
            title: 'トゥーラ産白石灰岩の化粧石と黄金キャップストーン復元',
            description: 'ピラミッド表面を滑らかな白亜の化粧石で覆い、頂上に黄金のピラミディオンを冠します。',
            cost: { population: 120, culture: 120, tech: 100 },
            category: 'culture',
            completeMessage: 'ギザの砂漠に白亜と黄金のピラミッドが輝きを取り戻しました！',
          },
        ],
      },
    ],
  },
];
