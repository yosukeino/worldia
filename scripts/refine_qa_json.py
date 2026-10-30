#!/usr/bin/env python3
"""
Antigravity JSON Refiner & Dictionary Aligner for World History Q&A Dataset
- Cleans section headers (removes checkbox OCR artifacts like '口園')
- Normalizes brackets (), （）, quotes 「」『』, and separators (・ / ＝)
- Uses combined (Answer similarity + Question-to-Glossary-Description N-gram similarity)
  within the same glossary page window to fix 1-kanji OCR typos (e.g. 鳥孫 -> 烏孫, 単手 -> 単于, 霊家 -> 墨家)
- Fixes common OCR character substitutions inside question sentences
"""

import difflib
import json
import re
from pathlib import Path


QUESTION_TYPO_FIXES = [
    ('エジブト', 'エジプト'),
    ('サビエンス', 'サピエンス'),
    ('ヨーロッパ語放', 'ヨーロッパ語族'),
    ('メソボタミア', 'メソポタミア'),
    ('メンポタミア', 'メソポタミア'),
    ('コンスタンティノーブル', 'コンスタンティノープル'),
    ('ハプスプルク', 'ハプスブルク'),
    ('アッバース胡', 'アッバース朝'),
    ('ウマイヤ胡', 'ウマイヤ朝'),
    ('オスマン帝団', 'オスマン帝国'),
    ('プロレタリア文化大革合', 'プロレタリア文化大革命'),
    ('中ン対立', '中ソ対立'),
    ('包奴', '匈奴'),
    ('半上生活', '半樹上生活'),
    ('中国の口店', '中国の周口店'),
    ('霊魂不滅を言じて', '霊魂不滅を信じて'),
    ('ビルグリム', 'ピルグリム'),
]

DIRECT_ANSWER_CORRECTIONS = {
    '炭昫': '灰陶',
    '蕘＝舜＝禹': '堯・舜・禹',
    '蕘・舜・禹': '堯・舜・禹',
    '芤': '礼',
    '薪著': '覇者',
    '蓁': '秦',
    '麺＝魏＝韓': '趙・魏・韓',
    '麺・魏・韓': '趙・魏・韓',
    '霊家': '墨家',
    '焚善＝坑橋': '焚書・坑儒',
    '焚善・坑橋': '焚書・坑儒',
    '医薬＝占い＝農業': '医薬・占い・農業',
    '五鉄競': '五銖銭',
    '殲': '外戚',
    '薪': '新',
    '普（西普）': '晋（西晋）',
    '望義え': '王羲之',
    '箸坊': '蕃坊',
    '乳糖': '孔穎達',
    '1出': '『五経正義』',
    'ビュ': 'ピュー',
    'ITA）ュ」': '祆教',
    'ヘイロータイ（ヘロ': 'ヘイロータイ（ヘロット）',
    '1ようでん': '『使徒言行録』',
    'カール大帝（シャル': 'カール大帝（シャルルマーニュ）',
    '封士（領地）': '封建制（フューダリズム）',
    '木輪木入権（インムニテート）': '不輸不入権（インムニテート）',
    'バミール高原': 'パミール高原',
    'バミール（高原）': 'パミール高原',
    'サハラ交易（塩金交': 'サハラ交易（塩金交易）',
    '人）のくびき」': '「タタールのくびき」',
    '罣逢': '王建',
    '筕': '行・作',
    'ス）': 'グユク',
    '萌': '明',
    '葡京（金陵）': '南京（金陵）',
    '永樂帯': '永楽帝',
    '葡宗画': '南宗画',
    '季費（李卓吾）': '李贄（李卓吾）',
    '旅人': '旗人',
    '羡禎帯': '崇禎帝',
    'ヤン': '両班（ヤンバン）',
    'リヴァプール＝マンチェスタ': 'リヴァプール・マンチェスター間',
    '球殿場（テニスコート）の誓い': '球戯場（テニスコート）の誓い',
    '宗教（（政教）協約（コ': '宗教協約（コンコルダート）',
    'ャクリ）朝': 'ラタナコーシン（チャクリ）朝',
    'ベリ': 'ペリー',
    '朝浯維薪': '明治維新',
    '（ミン」': '壬午軍乱',
    '甲年農民戦争（東学の乱）': '甲午農民戦争（東学の乱）',
    '121とう': '遼東半島',
    '歯大居': '西太后',
    'ニナーカ条の要求': '二十一カ条の要求',
    '中華ソヴィエト共和': '中華ソヴィエト共和国臨時政府',
    '常原喜重郎': '幣原喜重郎',
    '逆安': '延安',
    'ンクルマ（エンクル': 'ンクルマ（エンクルマ）',
    '協定（オスロ合意）': 'パレスチナ暫定自治協定（オスロ合意）',
    '力（APEC）': 'アジア太平洋経済協力会議（APEC）',
    'メンアメリカ文明（中米文明）': 'メソアメリカ文明',
    '木前・竹前': '木簡・竹簡',
    '木前＝竹前': '木簡・竹簡',
    '円銭（環養）': '円銭（環銭）',
    '李斯逗子': '李斯',
    'ホータン（チ間）': 'ホータン（于闐）',
    'のたまもの」': '「エジプトはナイルのたまもの」',
    'クレタ文明（ミノア': 'クレタ文明（ミノア文明）',
}


def clean_term_variants(raw_term: str) -> list[str]:
    t = raw_term.strip()
    variants = [t]

    # Remove 〈...〉
    t1 = re.sub(r'〈[^〉]+〉', '', t).strip()
    if t1 and t1 not in variants:
        variants.append(t1)

    # Remove quotes 「...」『...』
    t2 = re.sub(r'^[「『](.+?)[」』]$', r'\1', t1).strip()
    if t2 and t2 not in variants:
        variants.append(t2)

    # Remove full-width and half-width parens: （...） and (...)
    t3 = re.sub(r'[（(][^）)]+[）)]', '', t2).strip()
    if t3 and t3 not in variants:
        variants.append(t3)

    # Also extract inner part of parens if >= 2 chars
    for m in re.findall(r'[（(]([^）)]+)[）)]', t2):
        m_clean = m.strip()
        if len(m_clean) >= 2 and m_clean not in variants:
            variants.append(m_clean)

    # Unify ・ and ＝
    extra = []
    for v in variants:
        v_eq = re.sub(r'[・゠=]+', '＝', v)
        v_dot = re.sub(r'[＝゠=]+', '・', v)
        if v_eq not in variants and v_eq not in extra:
            extra.append(v_eq)
        if v_dot not in variants and v_dot not in extra:
            extra.append(v_dot)
        # If ends with 王朝 and length >= 3 (e.g. 夏王朝 -> 夏), add short dynasty name
        if v.endswith('王朝') and len(v) == 3:
            extra.append(v[:-2])

    return variants + extra


def char_ngrams(text: str, n: int = 2) -> set[str]:
    s = re.sub(r'[\s、。・（）()「」『』＝=゠]', '', text)
    if len(s) < n:
        return {s} if s else set()
    return {s[i : i + n] for i in range(len(s) - n + 1)}


def is_valid_section_name(sec: str) -> bool:
    if not sec or len(sec) <= 1:
        return False
    if re.fullmatch(r'[ロ口■□四国園目0OODUL1!！・\s\-ー*★☆•]+', sec):
        return False
    return True


def clean_question_text(q: str) -> str:
    q = q.strip()
    q = re.sub(r'^[ロ口■□四国園目0OODUL1!！・\s\-ー*★☆•]+', '', q).strip()
    for wrong, right in QUESTION_TYPO_FIXES:
        q = q.replace(wrong, right)
    return q


def main():
    glossary_path = Path('paraphrased.json')
    qa_path = Path('datam/qa_dataset.json')

    with open(glossary_path, 'r', encoding='utf-8') as f:
        glossary_raw = json.load(f)

    terms = []
    variant_map = {}
    by_page = {}

    for idx, item in enumerate(glossary_raw):
        tid = idx + 1
        t_name = item['term'].strip()
        page = item.get('source_page') or 1
        desc = (item.get('description') or '').strip()
        variants = clean_term_variants(t_name)

        entry = {
            'id': tid,
            'term': t_name,
            'display_answer': re.sub(r'〈[^〉]+〉', '', t_name).strip(),
            'variants': variants,
            'source_page': page,
            'description': desc,
            'desc_grams': char_ngrams(desc, 2),
            'frequency': item.get('frequency') or 1,
        }
        terms.append(entry)
        by_page.setdefault(page, []).append(entry)

        for v in variants:
            variant_map.setdefault(v, []).append(entry)

    with open(qa_path, 'r', encoding='utf-8') as f:
        qa_list = json.load(f)

    last_valid_section = '人類の進化'
    newly_matched = 0

    for item in qa_list:
        # 1. Clean section name
        sec = (item.get('section') or '').strip()
        if is_valid_section_name(sec):
            last_valid_section = sec
        else:
            item['section'] = last_valid_section

        # 2. Clean question text
        item['question'] = clean_question_text(item['question'])
        q_grams = char_ngrams(item['question'], 2)

        # 3. Re-verify or resolve unmatched answers
        raw_ans = (item.get('raw_ocr_answer') or item.get('answer') or '').strip()
        if raw_ans in DIRECT_ANSWER_CORRECTIONS:
            corrected = DIRECT_ANSWER_CORRECTIONS[raw_ans]
            item['answer'] = corrected
            item['matched_term_id'] = None
            raw_ans = corrected
        elif item.get('answer') in DIRECT_ANSWER_CORRECTIONS:
            corrected = DIRECT_ANSWER_CORRECTIONS[item['answer']]
            item['answer'] = corrected
            item['matched_term_id'] = None
            raw_ans = corrected

        # Special question-contextual fixes for single-char garbled answers
        q_txt = item['question']
        if '加工保存した遺体' in q_txt:
            raw_ans = 'ミイラ'
            item['answer'] = 'ミイラ'
            item['matched_term_id'] = None
        elif '1381年にイギリス東南部でおこった農民の反乱' in q_txt or '381年にイギリス東南部でおこった農民の反乱' in q_txt:
            raw_ans = 'ワット＝タイラーの乱'
            item['answer'] = 'ワット＝タイラーの乱'
            item['matched_term_id'] = None
        elif '包囲されたオルレアンに入り' in q_txt:
            raw_ans = 'ジャンヌ＝ダルク'
            item['answer'] = 'ジャンヌ＝ダルク'
            item['matched_term_id'] = None
        elif '三帝会戦とも呼ばれた戦い' in q_txt:
            raw_ans = 'アウステルリッツの戦い'
            item['answer'] = 'アウステルリッツの戦い'
            item['matched_term_id'] = None
        elif '日露戦争の講和条約' in q_txt:
            raw_ans = 'ポーツマス条約'
            item['answer'] = 'ポーツマス条約'
            item['matched_term_id'] = None
        elif '奉天派の代表は誰か' in q_txt:
            raw_ans = '張作霖'
            item['answer'] = '張作霖'
            item['matched_term_id'] = None
        elif '両シチリア王国を建てたノルマン人' in q_txt:
            raw_ans = 'ロジェ2世'
            item['answer'] = 'ロジェ2世'
            item['matched_term_id'] = None

        norm_ans = re.sub(r'^[ぁ-ん、,」』\s]{1,7}?(?=[一-龥])', '', raw_ans)
        norm_ans = re.sub(r'[゠=・]+', '＝', norm_ans).strip(' 　・、。-ー*＊')
        norm_ans_no_quotes = re.sub(r'^[「『](.+?)[」』]$', r'\1', norm_ans)

        hint_pages = item.get('glossary_pages') or []
        min_p = max(1, min(hint_pages) - 4) if hint_pages else 1
        max_p = min(365, max(hint_pages) + 4) if hint_pages else 365

        # If not matched yet, try exact variant lookup first
        if item.get('matched_term_id') is None:
            for cand_str in (norm_ans, norm_ans_no_quotes, raw_ans):
                if cand_str in variant_map:
                    hits = variant_map[cand_str]
                    # Prefer hit within hint_pages window
                    best_hit = hits[0]
                    for h in hits:
                        if min_p <= h['source_page'] <= max_p:
                            best_hit = h
                            break
                    item['answer'] = best_hit['display_answer']
                    item['matched_term_id'] = best_hit['id']
                    if not item.get('frequency'):
                        item['frequency'] = best_hit['frequency']
                    newly_matched += 1
                    break

        # If still not matched, search glossary terms in page window [min_p, max_p]
        # using combined Answer Similarity + Question-to-Description Context Overlap
        if item.get('matched_term_id') is None and hint_pages:
            window_entries = []
            for p in range(min_p, max_p + 1):
                window_entries.extend(by_page.get(p, []))

            best_entry = None
            best_combined = 0.0

            for entry in window_entries:
                desc_overlap = len(q_grams & entry['desc_grams'])
                desc_ratio = desc_overlap / max(1, min(len(q_grams), 12))

                max_ans_sim = 0.0
                for v in entry['variants']:
                    sim = difflib.SequenceMatcher(None, norm_ans_no_quotes, v).ratio()
                    # Special boost for 2-kanji words where 1 kanji matches and lengths are equal (e.g. 鳥孫 -> 烏孫)
                    if len(norm_ans_no_quotes) == len(v) == 2 and (
                        norm_ans_no_quotes[0] == v[0] or norm_ans_no_quotes[1] == v[1]
                    ):
                        sim = max(sim, 0.75)
                    if sim > max_ans_sim:
                        max_ans_sim = sim

                # Require either strong answer similarity + some description overlap,
                # or very strong description overlap when OCR answer was garbled (like '＝' or '一ロ')
                combined = max_ans_sim * 0.65 + desc_ratio * 0.55
                if (max_ans_sim >= 0.50 and desc_overlap >= 2 and combined > best_combined) or (
                    desc_overlap >= 5 and desc_ratio >= 0.45 and combined > best_combined
                ):
                    best_combined = combined
                    best_entry = entry

            if best_entry and best_combined >= 0.52:
                item['answer'] = best_entry['display_answer']
                item['matched_term_id'] = best_entry['id']
                if not item.get('frequency'):
                    item['frequency'] = best_entry['frequency']
                newly_matched += 1

        # Fill missing frequency from matched glossary term if available
        if item.get('matched_term_id') and not item.get('frequency'):
            tid = item['matched_term_id']
            if 1 <= tid <= len(terms):
                item['frequency'] = terms[tid - 1]['frequency']

    clean_output = []
    for idx, item in enumerate(qa_list):
        clean_output.append({
            'id': idx + 1,
            'chapter': item['chapter'],
            'section': item['section'],
            'question': item['question'],
            'answer': item['answer'],
            'matched_term_id': item.get('matched_term_id'),
            'frequency': item.get('frequency') or 3,
        })

    with open(qa_path, 'w', encoding='utf-8') as f:
        json.dump(clean_output, f, ensure_ascii=False, indent=2)

    total_matched = sum(1 for x in clean_output if x.get('matched_term_id') is not None)
    print(
        f'Refinement complete! Newly resolved {newly_matched} answers -> Total matched: {total_matched} / {len(clean_output)} ({total_matched / len(clean_output) * 100:.1f}%)'
    )


if __name__ == '__main__':
    main()
