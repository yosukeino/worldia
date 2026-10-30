#!/usr/bin/env python3
"""
Strict Re-builder of datam/qa_dataset.json from datam/ocr_checkpoint.jsonl + paraphrased.json
- Preserves valid OCR answers (e.g. ウル第3王朝, ノモス, 太陽のピラミッド, トルテカ文明, 三国時代)
  when they are not headwords in paraphrased.json, instead of overwriting them with unrelated terms
- Links matched_term_id whenever the answer genuinely matches a paraphrased.json term
"""

import difflib
import json
import re
from pathlib import Path

from refine_qa_json import (
    DIRECT_ANSWER_CORRECTIONS,
    QUESTION_TYPO_FIXES,
    char_ngrams,
    clean_question_text,
    clean_term_variants,
    is_valid_section_name,
)


def main():
    glossary_path = Path('paraphrased.json')
    ckpt_path = Path('datam/ocr_checkpoint.jsonl')
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
            'frequency': item.get('frequency') or 3,
        }
        terms.append(entry)
        by_page.setdefault(page, []).append(entry)
        for v in variants:
            variant_map.setdefault(v, []).append(entry)

    # Read raw items from checkpoint in page order
    pages_data = {}
    with open(ckpt_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                rec = json.loads(line)
                pages_data[rec['page']] = rec

    raw_items = []
    for p in sorted(pages_data.keys()):
        raw_items.extend(pages_data[p].get('items', []))

    last_valid_section = '人類の進化'
    clean_output = []

    for idx, item in enumerate(raw_items):
        sec = (item.get('section') or '').strip()
        if is_valid_section_name(sec):
            last_valid_section = sec
        else:
            sec = last_valid_section

        q_txt = clean_question_text(item['question'])
        q_grams = char_ngrams(q_txt, 2)

        raw_ans = (item.get('raw_ocr_answer') or item.get('answer') or '').strip()

        # Apply explicit known OCR typo corrections first
        if raw_ans in DIRECT_ANSWER_CORRECTIONS:
            raw_ans = DIRECT_ANSWER_CORRECTIONS[raw_ans]

        # Special contextual fixes for single-char garbled answers
        if '加工保存した遺体' in q_txt:
            raw_ans = 'ミイラ'
        elif '381年にイギリス東南部でおこった農民の反乱' in q_txt:
            raw_ans = 'ワット＝タイラーの乱'
        elif '包囲されたオルレアンに入り' in q_txt:
            raw_ans = 'ジャンヌ＝ダルク'
        elif '三帝会戦とも呼ばれた戦い' in q_txt:
            raw_ans = 'アウステルリッツの戦い'
        elif '日露戦争の講和条約' in q_txt:
            raw_ans = 'ポーツマス条約'
        elif '奉天派の代表は誰か' in q_txt:
            raw_ans = '張作霖'
        elif '両シチリア王国を建てたノルマン人' in q_txt:
            raw_ans = 'ロジェ2世'
        elif '墨子を祖とする学派' in q_txt:
            raw_ans = '墨家'

        norm_ans = re.sub(r'^[ぁ-ん、,」』\s]{1,7}?(?=[一-龥])', '', raw_ans)
        norm_ans = re.sub(r'[゠=・]+', '＝', norm_ans).strip(' 　・、。-ー*＊')
        norm_ans_no_quotes = re.sub(r'^[「『](.+?)[」』]$', r'\1', norm_ans)

        hint_pages = item.get('glossary_pages') or []
        min_p = max(1, min(hint_pages) - 4) if hint_pages else 1
        max_p = min(365, max(hint_pages) + 4) if hint_pages else 365

        matched_id = None
        final_ans = norm_ans

        # 1. Exact variant match
        for cand_str in (norm_ans, norm_ans_no_quotes, raw_ans):
            if cand_str in variant_map:
                hits = variant_map[cand_str]
                best_hit = hits[0]
                for h in hits:
                    if min_p <= h['source_page'] <= max_p:
                        best_hit = h
                        break
                matched_id = best_hit['id']
                final_ans = best_hit['display_answer']
                break

        # 2. High-confidence character-similarity fuzzy match within page window
        # NEVER overwrite a distinct word unless character similarity >= 0.66 (e.g., 1 char typo in 2-5 char term)
        if matched_id is None and hint_pages:
            window_entries = []
            for p in range(min_p, max_p + 1):
                window_entries.extend(by_page.get(p, []))

            best_entry = None
            best_score = 0.0

            for entry in window_entries:
                desc_overlap = len(q_grams & entry['desc_grams'])
                for v in entry['variants']:
                    if not v or abs(len(v) - len(norm_ans_no_quotes)) > 2:
                        continue
                    sim = difflib.SequenceMatcher(None, norm_ans_no_quotes, v).ratio()
                    if len(norm_ans_no_quotes) == len(v) and len(v) >= 2:
                        diffs = sum(1 for a, b in zip(norm_ans_no_quotes, v) if a != b)
                        if diffs == 1 and desc_overlap >= 2:
                            sim = max(sim, 0.82)
                    if sim >= 0.68:
                        score = sim + min(0.12, desc_overlap * 0.02)
                        if score > best_score:
                            best_score = score
                            best_entry = entry

            if best_entry and best_score >= 0.72:
                matched_id = best_entry['id']
                final_ans = best_entry['display_answer']

        freq = item.get('frequency')
        if not freq and matched_id:
            freq = terms[matched_id - 1]['frequency']

        clean_output.append({
            'id': idx + 1,
            'chapter': item['chapter'],
            'section': sec,
            'question': q_txt,
            'answer': final_ans,
            'matched_term_id': matched_id,
            'frequency': freq or 3,
        })

    with open(qa_path, 'w', encoding='utf-8') as f:
        json.dump(clean_output, f, ensure_ascii=False, indent=2)

    matched_cnt = sum(1 for x in clean_output if x['matched_term_id'] is not None)
    print(f'Strict rebuild complete: {len(clean_output)} items ({matched_cnt} linked to paraphrased.json)')


if __name__ == '__main__':
    main()
