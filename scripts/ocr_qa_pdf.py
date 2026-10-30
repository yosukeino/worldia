#!/usr/bin/env python3
"""
Mac Local Vision OCR + Antigravity JSON Formatter for World History Q&A PDF
- Uses macOS native Quartz + Vision.framework (VNRecognizeTextRequest)
- Applies a red-ink darkening filter (min(R,G,B)) so red-sheet answers are crisp black
- Parses 3-column Q&A layout (Left: frequency/number, Middle: question, Right: answer)
- Splits questions cleanly on sentence endings ('か。') and cross-references both term names
  and descriptions in `paraphrased.json` (5,577 terms) to auto-correct OCR typos
- Supports checkpointing so full-book runs can resume seamlessly
"""

import argparse
import difflib
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import objc
import Quartz
from Foundation import NSURL

# Load Apple Vision framework
objc.loadBundle('Vision', globals(), '/System/Library/Frameworks/Vision.framework')


def load_glossary_terms(glossary_path: Path):
    if not glossary_path.exists():
        return [], {}, {}
    with open(glossary_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    terms = []
    exact_map = {}
    by_page = {}

    for idx, item in enumerate(data):
        tid = idx + 1
        t_name = item['term'].strip()
        clean_name = re.sub(r'〈[^〉]+〉', '', t_name).strip()
        clean_no_paren = re.sub(r'（[^）]+）', '', clean_name).strip()
        page = item.get('source_page') or 1
        desc = (item.get('description') or '').strip()

        entry = {
            'id': tid,
            'term': t_name,
            'clean_name': clean_name,
            'clean_no_paren': clean_no_paren,
            'source_page': page,
            'description': desc,
        }
        terms.append(entry)
        exact_map[t_name] = entry
        exact_map[clean_name] = entry
        if len(clean_no_paren) >= 2:
            exact_map.setdefault(clean_no_paren, entry)

        by_page.setdefault(page, []).append(entry)

    return terms, exact_map, by_page


def normalize_answer_text(text: str) -> str:
    text = text.strip()
    # Remove leading hiragana furigana artifact like "は、" or "れませっと」" before Kanji
    text = re.sub(r'^[ぁ-ん、,」』\s]{1,7}?(?=[一-龥])', '', text)
    # Unify separator symbols to Yamakawa style ＝
    text = re.sub(r'[゠=＝・]+', '＝', text)
    text = text.strip(' 　・、。-ー*＊')
    return text


def char_ngrams(text: str, n: int = 2) -> set[str]:
    s = re.sub(r'[\s、。・（）「」『』＝]', '', text)
    if len(s) < n:
        return {s} if s else set()
    return {s[i : i + n] for i in range(len(s) - n + 1)}


def match_and_correct_answer(
    raw_ans: str,
    question_text: str,
    hint_pages: list[int],
    used_term_ids: set[int],
    terms,
    exact_map,
    by_page,
):
    norm = normalize_answer_text(raw_ans)
    if not norm:
        return norm, None

    # 1. Direct match
    if norm in exact_map:
        hit = exact_map[norm]
        return hit['term'], hit['id']

    no_paren = re.sub(r'（[^）]+）', '', norm).strip()
    if no_paren in exact_map:
        hit = exact_map[no_paren]
        return norm, hit['id']

    # 2. Fuzzy match within hinted glossary pages (+/- 3 pages) first, using question <-> description context!
    q_grams = char_ngrams(question_text, 2)

    candidate_pool = []
    if hint_pages:
        min_p = max(1, min(hint_pages) - 3)
        max_p = min(365, max(hint_pages) + 3)
        for p in range(min_p, max_p + 1):
            candidate_pool.extend(by_page.get(p, []))

    for pool, threshold in [(candidate_pool, 0.72), (terms, 0.84)]:
        best_entry = None
        best_score = 0.0

        for entry in pool:
            for target in (entry['clean_name'], entry['clean_no_paren']):
                if not target or abs(len(target) - len(norm)) > 2:
                    continue
                score = difflib.SequenceMatcher(None, norm, target).ratio()
                if len(norm) == len(target) and len(norm) >= 3:
                    diffs = sum(1 for a, b in zip(norm, target) if a != b)
                    if diffs == 1:
                        score = max(score, 0.88)

                if score >= threshold:
                    desc_grams = char_ngrams(entry['description'], 2)
                    overlap = len(q_grams & desc_grams)
                    penalty = -0.15 if entry['id'] in used_term_ids else 0.0
                    total_score = score + min(0.09, overlap * 0.015) + penalty
                    if total_score > best_score:
                        best_score = total_score
                        best_entry = entry

        if best_entry:
            return best_entry['clean_name'], best_entry['id']

    return norm, None


def ocr_pdf_page(pdf_doc, page_num: int, scale: float = 2.6):
    page = Quartz.CGPDFDocumentGetPage(pdf_doc, page_num)
    if page is None:
        return []

    rect = Quartz.CGPDFPageGetBoxRect(page, Quartz.kCGPDFMediaBox)
    w = int(rect.size.width * scale)
    h = int(rect.size.height * scale)

    cs = Quartz.CGColorSpaceCreateDeviceRGB()
    buf = bytearray(w * h * 4)
    ctx = Quartz.CGBitmapContextCreate(
        buf, w, h, 8, w * 4, cs, Quartz.kCGImageAlphaPremultipliedLast
    )
    Quartz.CGContextSetRGBFillColor(ctx, 1, 1, 1, 1)
    Quartz.CGContextFillRect(ctx, Quartz.CGRectMake(0, 0, w, h))
    Quartz.CGContextScaleCTM(ctx, scale, scale)
    Quartz.CGContextDrawPDFPage(ctx, page)

    # Darken red/orange ink using min(R, G, B)
    arr = np.frombuffer(buf, dtype=np.uint8).reshape((h, w, 4))
    gray = np.minimum(np.minimum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
    arr[:, :, 0] = gray
    arr[:, :, 1] = gray
    arr[:, :, 2] = gray

    cg_img = Quartz.CGBitmapContextCreateImage(ctx)

    req = VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(0)  # Accurate
    req.setRecognitionLanguages_(['ja-JP', 'en-US'])
    req.setUsesLanguageCorrection_(True)

    handler = VNImageRequestHandler.alloc().initWithCGImage_options_(cg_img, {})
    success = handler.performRequests_error_([req], None)
    if not success:
        return []

    observations = []
    for obs in req.results():
        cand = obs.topCandidates_(1)
        if not cand:
            continue
        text = cand[0].string().strip()
        if not text:
            continue
        bb = obs.boundingBox()
        y_top = 1.0 - (bb.origin.y + bb.size.height)
        observations.append({
            'text': text,
            'x': float(bb.origin.x),
            'y': float(y_top),
            'w': float(bb.size.width),
            'h': float(bb.size.height),
        })

    observations.sort(key=lambda item: (round(item['y'], 3), item['x']))
    return observations


def is_furigana(obs) -> bool:
    txt = obs['text']
    if obs['h'] < 0.0155 and not re.search(r'[一-龥A-Za-z0-9]', txt):
        # Small height and no Kanji/Latin/Digits (mostly hiragana/symbols)
        if re.search(r'[ぁ-ん]', txt):
            return True
    return False


def is_checkbox_noise(txt: str) -> bool:
    cleaned = txt.lstrip('■● ').strip()
    if not cleaned:
        return True
    if re.fullmatch(r'[ロ口■□四国0OODUL・\s\-ー*★☆•]+', cleaned):
        return True
    return False


def parse_qa_from_page(
    page_num: int,
    observations: list[dict],
    current_chapter: str,
    current_section: str,
    current_glossary_pages: list[int],
    terms,
    exact_map,
    by_page,
):
    for obs in observations:
        if obs['y'] > 0.94 and 0.06 <= obs['x'] <= 0.45:
            if '章' in obs['text']:
                current_chapter = obs['text'].strip()

    star_obs = [
        o
        for o in observations
        if o['x'] < 0.14 and ('★' in o['text'] or '☆' in o['text'] or '*' in o['text'])
    ]
    ans_zone_obs = [
        o for o in observations if o['x'] >= 0.68 and 0.04 <= o['y'] <= 0.94
    ]

    has_question_ending = any(
        ('か。' in o['text'] or 'よ。' in o['text'] or 'せ。' in o['text'])
        for o in observations
        if 0.12 <= o['x'] < 0.68
    )
    if (len(star_obs) < 2 and not has_question_ending) or len(ans_zone_obs) < 2 or not has_question_ending:
        return [], current_chapter, current_section, current_glossary_pages

    question_lines = []
    raw_answer_lines = []
    section_updates = []

    for obs in observations:
        y = obs['y']
        x = obs['x']
        txt = obs['text']

        if y > 0.95 or y < 0.03:
            continue

        if is_furigana(obs):
            continue

        if '用語集' in txt:
            nums = [int(n) for n in re.findall(r'\d+', txt) if 1 <= int(n) <= 365]
            if nums:
                if len(nums) == 2 and nums[1] >= nums[0] and (nums[1] - nums[0]) <= 15:
                    current_glossary_pages = list(range(nums[0], nums[1] + 1))
                else:
                    current_glossary_pages = nums
            continue

        # Section header e.g. "■人類の進化", "■人類と言語" (exclude "■口口" checkboxes!)
        if x < 0.25 and (txt.startswith('■') or txt.startswith('●')):
            if not is_checkbox_noise(txt):
                sec_title = txt.lstrip('■● ').strip()
                section_updates.append((y, sec_title))
            continue

        if x < 0.125:
            continue

        if 0.125 <= x < 0.68:
            if is_checkbox_noise(txt):
                continue
            question_lines.append(obs)
            continue

        if x >= 0.68:
            if y > 0.94 and re.fullmatch(r'\d+', txt):
                continue
            raw_answer_lines.append(obs)

    if not raw_answer_lines or not question_lines:
        return [], current_chapter, current_section, current_glossary_pages

    question_lines.sort(key=lambda o: o['y'])
    raw_answer_lines.sort(key=lambda o: o['y'])

    # Group question lines into discrete Question Blocks:
    # A question block ends as soon as a line ends with 'か。' (or when vertical gap > 0.045)
    question_blocks = []
    curr_q = None

    def is_q_end(s: str) -> bool:
        return s.endswith(('か。', 'か．', 'よ。', 'よ．', 'せ。', 'せ．'))

    for ql in question_lines:
        line_txt = re.sub(r'^[ロ口■□0OOD]{2,4}\s*', '', ql['text']).strip()
        if not line_txt:
            continue

        if curr_q is None:
            curr_q = {
                'y_start': ql['y'],
                'y_end': ql['y'] + ql['h'],
                'lines': [line_txt],
                'closed': is_q_end(line_txt),
            }
        else:
            dy = ql['y'] - curr_q['y_end']
            if curr_q['closed'] or dy > 0.042:
                question_blocks.append(curr_q)
                curr_q = {
                    'y_start': ql['y'],
                    'y_end': ql['y'] + ql['h'],
                    'lines': [line_txt],
                    'closed': is_q_end(line_txt),
                }
            else:
                curr_q['lines'].append(line_txt)
                curr_q['y_end'] = ql['y'] + ql['h']
                if is_q_end(line_txt):
                    curr_q['closed'] = True

    if curr_q is not None:
        question_blocks.append(curr_q)

    # Merge multi-line answers on the right column
    merged_answers = []
    for ans in raw_answer_lines:
        if not merged_answers:
            merged_answers.append({
                'y_start': ans['y'],
                'y_end': ans['y'] + ans['h'],
                'lines': [ans['text']],
            })
        else:
            prev = merged_answers[-1]
            dy = ans['y'] - prev['y_start']
            # Check if a new question block starts near ans['y']
            starts_new_q = any(abs(qb['y_start'] - ans['y']) < 0.018 for qb in question_blocks)
            if dy < 0.036 and not starts_new_q:
                prev['lines'].append(ans['text'])
                prev['y_end'] = ans['y'] + ans['h']
            else:
                merged_answers.append({
                    'y_start': ans['y'],
                    'y_end': ans['y'] + ans['h'],
                    'lines': [ans['text']],
                })

    # Pair each answer block with the closest Question Block aligned at y_start
    qa_items = []
    used_q_indices = set()
    used_term_ids = set()

    for ans_block in merged_answers:
        best_q_idx = None
        best_dist = 999.0
        for q_idx, qb in enumerate(question_blocks):
            if q_idx in used_q_indices:
                continue
            dist = abs(qb['y_start'] - ans_block['y_start'])
            if dist < best_dist and dist < 0.045:
                best_dist = dist
                best_q_idx = q_idx

        if best_q_idx is None:
            continue

        used_q_indices.add(best_q_idx)
        qb = question_blocks[best_q_idx]

        for sec_y, sec_title in section_updates:
            if sec_y <= qb['y_start'] + 0.01:
                current_section = sec_title

        stars_near = [
            s['text']
            for s in star_obs
            if (qb['y_start'] - 0.015) <= s['y'] <= (qb['y_end'] + 0.03)
        ]
        star_count = 0
        if stars_near:
            star_str = stars_near[0]
            star_count = star_str.count('★') + star_str.count('*') + star_str.count('＊')
            star_count = min(7, max(1, star_count))

        question_text = ''.join(qb['lines']).strip()
        raw_ans_str = ''.join(ans_block['lines']).strip()
        corrected_ans, matched_term_id = match_and_correct_answer(
            raw_ans_str,
            question_text,
            current_glossary_pages,
            used_term_ids,
            terms,
            exact_map,
            by_page,
        )
        if matched_term_id:
            used_term_ids.add(matched_term_id)

        if question_text and corrected_ans:
            qa_items.append({
                'pdf_page': page_num,
                'chapter': current_chapter,
                'section': current_section,
                'question': question_text,
                'answer': corrected_ans,
                'raw_ocr_answer': raw_ans_str,
                'matched_term_id': matched_term_id,
                'frequency': star_count if star_count > 0 else None,
                'glossary_pages': current_glossary_pages,
            })

    return qa_items, current_chapter, current_section, current_glossary_pages


def main():
    parser = argparse.ArgumentParser(description='Mac Vision OCR for World History Q&A PDF')
    parser.add_argument('--pdf', type=str, default='datam/20261030.pdf', help='Path to input PDF')
    parser.add_argument('--glossary', type=str, default='paraphrased.json', help='Path to paraphrased.json')
    parser.add_argument('--output', type=str, default='datam/qa_dataset.json', help='Path to output JSON')
    parser.add_argument('--checkpoint', type=str, default='datam/ocr_checkpoint.jsonl', help='Checkpoint JSONL file')
    parser.add_argument('--start-page', type=int, default=7, help='Start page (1-indexed)')
    parser.add_argument('--end-page', type=int, default=392, help='End page (1-indexed)')
    parser.add_argument('--reset', action='store_true', help='Ignore existing checkpoint and start fresh')
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f'Error: PDF not found at {pdf_path}', file=sys.stderr)
        sys.exit(1)

    terms, exact_map, by_page = load_glossary_terms(Path(args.glossary))
    print(f'Loaded {len(terms)} glossary terms from {args.glossary} for answer verification.')

    checkpoint_path = Path(args.checkpoint)
    if args.reset and checkpoint_path.exists():
        checkpoint_path.unlink()

    processed_pages = {}
    if checkpoint_path.exists():
        with open(checkpoint_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    processed_pages[rec['page']] = rec

    pdf_url = NSURL.fileURLWithPath_(str(pdf_path.resolve()))
    pdf_doc = Quartz.CGPDFDocumentCreateWithURL(pdf_url)
    total_pdf_pages = Quartz.CGPDFDocumentGetNumberOfPages(pdf_doc)
    end_page = min(args.end_page, total_pdf_pages)

    current_chapter = '序章 自然環境と人類の進化'
    current_section = '人類の進化'
    current_glossary_pages = [1]

    all_qa = []
    start_time = time.time()

    with open(checkpoint_path, 'a', encoding='utf-8') as ckpt_file:
        for p in range(args.start_page, end_page + 1):
            if p in processed_pages:
                rec = processed_pages[p]
                current_chapter = rec.get('chapter', current_chapter)
                current_section = rec.get('section', current_section)
                current_glossary_pages = rec.get('glossary_pages', current_glossary_pages)
                all_qa.extend(rec.get('items', []))
                continue

            t0 = time.time()
            obs = ocr_pdf_page(pdf_doc, p)
            items, current_chapter, current_section, current_glossary_pages = parse_qa_from_page(
                p,
                obs,
                current_chapter,
                current_section,
                current_glossary_pages,
                terms,
                exact_map,
                by_page,
            )
            all_qa.extend(items)

            rec = {
                'page': p,
                'chapter': current_chapter,
                'section': current_section,
                'glossary_pages': current_glossary_pages,
                'items': items,
            }
            ckpt_file.write(json.dumps(rec, ensure_ascii=False) + '\n')
            ckpt_file.flush()

            elapsed = time.time() - t0
            print(
                f'[Page {p}/{end_page}] Extracted {len(items):2d} Q&As ({elapsed:.2f}s) | Total: {len(all_qa)} | Section: {current_section}',
                flush=True,
            )

    for idx, item in enumerate(all_qa):
        item['id'] = idx + 1

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_qa, f, ensure_ascii=False, indent=2)

    total_elapsed = time.time() - start_time
    matched_count = sum(1 for x in all_qa if x.get('matched_term_id'))
    print(
        f'\nDone! Saved {len(all_qa)} Q&A items ({matched_count} linked to paraphrased.json terms) to {output_path} in {total_elapsed:.1f}s.'
    )


if __name__ == '__main__':
    main()
