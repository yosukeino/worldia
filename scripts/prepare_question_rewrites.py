#!/usr/bin/env python3
"""
Rewrite all 4,561 questions in datam/qa_dataset.json into copyright-safe,
natural Japanese questions.

Strategy:
1. Fix known answer/matched_term_id mismatches and restore clipped leading '1'
   in 4-digit years (e.g., 381年 -> 1381年 in medieval/modern chapters).
2. Primary synthesis (from paraphrased.json):
   - Convert S1 of paraphrased.json's description into a clean noun-ending phrase.
   - If S1 is short (< 28 chars), optionally prepend a clean modifier from S2
     (only when S2 has no contrastive conjunctions or multiple past-tense clauses).
   - Append a natural interrogative ending matching the question type.
3. Secondary synthesis (for 2nd occurrences of a matched_term_id or where S1
   leaks the answer):
   - Try converting S2 or S3 into a standalone question if it describes a distinct
     historical fact without leaking the answer.
4. Remaining items (unmatched terms or multi-angle questions):
   - Apply deep structural & lexical paraphrasing (clause inversion, synonym/phrase
     transformation, and interrogative reconstruction) + export any edge cases for
     inspection.
"""

import json
import re
from pathlib import Path

BASE_DIR = Path("/Users/yosukeino/Documents/Dev/世界史DB")
QA_PATH = BASE_DIR / "datam" / "qa_dataset.json"
PARA_PATH = BASE_DIR / "paraphrased.json"
SCRATCH_DIR = Path("/Users/yosukeino/.gemini/antigravity/brain/76fbae6e-7f3b-4fe8-97cb-bff1eb773795/scratch")
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)


def clean_term_core(term: str) -> str:
    return re.sub(r"（.*?）|\(.*?\)", "", term).strip()


def fix_clipped_years(q: str, chapter: str) -> str:
    """Restore leading '1' clipped at left margin in medieval/modern chapters (ch07-ch15)."""
    m = re.match(r"ch(\d+)", chapter or "")
    if not m:
        return q
    ch_num = int(m.group(1))
    if ch_num >= 7:
        # In ch07+, 3-digit years starting with 3..9 not preceded by digit or '前' are clipped 13xx..19xx
        def repl(match):
            yr = int(match.group(1))
            if ch_num >= 10 and yr >= 700:
                return f"1{yr}年"
            if ch_num >= 7 and yr >= 300:
                return f"1{yr}年"
            return match.group(0)
        q = re.sub(r"(?<![0-9前約])([3-9]\d{2})年", repl, q)
    return q


def infer_ending(orig_q: str, np: str, ans: str) -> str:
    """Choose a natural Japanese question ending based on original question and noun phrase."""
    # Check what kind of entity the original question asks for
    if orig_q.endswith("誰か。") or orig_q.endswith("だれか。"):
        if re.search(r"(人物|皇帝|王|将軍|政治家|思想家|哲学者|宗教家|詩人|作家|画家|科学者|探検家|航海者|指導者|初代大統領|大統領|首相|書記長|教皇|カリフ|スルタン|宦官|武将|僧|宣教師|学者|歴史家|医師|建築家|音楽家|劇作家)$", np):
            return "は誰か。"
        return "という人物は誰か。"

    if orig_q.endswith("どこか。"):
        if re.search(r"(都市|都|首都|港市|港町|町|地方|地域|半島|島|山脈|川|河川|湖|海|海峡|運河|遺跡|神殿|宮殿|城|国|王国|帝国|共和国|植民地|州)$", np):
            return "はどこか。"
        return "はどこか。"

    if orig_q.endswith("何世紀か。"):
        return "は何世紀か。"

    if orig_q.endswith("何年か。"):
        return "は何年か。"

    # Check noun phrase ending
    if re.search(r"(人物|皇帝|王|将軍|政治家|思想家|哲学者|宗教家|詩人|作家|画家|科学者|探検家|航海者|指導者|大統領|首相|書記長|教皇|カリフ|スルタン|宦官|武将|僧|宣教師|学者|歴史家|医師|建築家|音楽家|劇作家|創始者|建国者|提唱者)$", np):
        return "は誰か。"

    if re.search(r"(都市|都|首都|港市|港町|地方|地域|半島|島|山脈|川|河川|湖|海|海峡|遺跡)$", np):
        if orig_q.endswith("どこか。"):
            return "はどこか。"
        return "を何というか。"

    if re.search(r"(制度|体制|政策|改革|運動|反乱|戦争|戦い|戦役|事件|変|乱|革命|条約|協定|宣言|憲法|法典|法律|勅令|令|会議|公会議|同盟|連盟|機構|組織|機関|政党|派閥|思想|主義|説|学派|宗教|宗派|経典|書物|歴史書|作品|様式|文化|文明|時代|時期|王朝|帝国|王国|政権|国家|民族|語族|階級|身分|称号|官職|役職|税|税制|貨幣|文字|暦|技術|交易|貿易|航路|道路)$", np):
        return "を何というか。"

    if np.endswith("もの") or np.endswith("こと"):
        return "を何というか。"

    return "を何というか。"


def transform_s1_to_noun_phrase(s1: str, ans_core: str) -> str | None:
    """
    Convert the first sentence of paraphrased.json description into a clean
    noun-ending phrase without leaking ans_core.
    """
    s = s1.strip().rstrip("。")
    if not s:
        return None

    # Strip trailing "を指す", "をさす", "のこと", "のことをいう", "である" if preceded by noun
    s = re.sub(r"のことを(指す|さす|いう|呼ぶ)$", "", s)
    s = re.sub(r"を(指す|さす)$", "", s)
    s = re.sub(r"のこと$", "", s)

    # Check if pattern: "[Description]として生み出されたのが[ans_core]である" or "〜が「[ans_core]」である"
    m_cleft = re.match(rf"^(.+?)(?:のが|が)[「『]?{re.escape(ans_core)}[」』]?である$", s)
    if m_cleft:
        prefix = m_cleft.group(1).strip()
        if re.search(r"[一-龥ァ-ヶー]$", prefix):
            s = prefix
        else:
            s = prefix + "もの"

    # Strip leading topic if it starts with the answer itself: "〇〇は、" or "「〇〇」とは、"
    s = re.sub(rf"^[「『]?{re.escape(ans_core)}[」』]?（.*?）(とは|は)、?", "", s)
    s = re.sub(rf"^[「『]?{re.escape(ans_core)}[」』]?(とは|は)、?", "", s)

    # Remove parenthetical readings or aliases that contain ans_core or substring of ans_core
    s = re.sub(r"（[^）]*）", "", s)

    if ans_core and ans_core in s:
        return None

    # Already ends in verb/auxiliary? Try inverting around "で、" or "であり、"
    verb_ending_re = r"(した|された|れた|えた|った|んだ|いた|きた|みた|られた|かった|ない|ある|いる|なる|いう|よぶ|呼ぶ|呼ばれた|知られる|知られた|おこなった|行った|設けた|定めた|築いた|建てた|著した|書いた|唱えた|起こした|開いた|結んだ|破った|滅ぼした|統一した|創始した|建国した|即位した|就任した|活躍した|栄えた|発展した|成立した|制定された|発布された|締結された|開催された|名高い|有名である|位置づけられる)$"

    if re.search(verb_ending_re, s):
        # Check if pattern: [NounPhraseA](で|であり)、[VerbClauseB]
        m = re.match(r"^(.+?)(?:であり|で)、(.+)$", s)
        if m:
            np_a, clause_b = m.group(1).strip(), m.group(2).strip()
            # Clean trailing "名高い" / "知られる" / "位置づけられる" in clause_b so it can modify np_a
            clause_b = re.sub(r"によって名高い$", "で知られる", clause_b)
            clause_b = re.sub(r"で名高い$", "で知られる", clause_b)
            bad_np_a = r"(のもと|の結果|の影響|の背景|のきっかけ|ののち|の後|の前|の間|の中|の頃|のころ|の時代|の治世|の世紀|年代|年頃|年ごろ|年に|世紀に|国内|国外|各地|全土|世界|ヨーロッパ|アジア|アフリカ|アメリカ|中国|インド|オリエント|ローマ|ギリシア|フランス|イギリス|ドイツ|ロシア|日本)$"
            if not re.search(bad_np_a, np_a) and len(np_a) >= 2:
                return f"{clause_b}、{np_a}"
        return None

    # Ensure it ends in a noun/kanji/katakana/closing paren
    if re.search(r"[一-龥ァ-ヶーa-zA-Z0-9）\)]$", s):
        return s

    return None


def s2_to_clean_modifier(s2: str, ans_core: str) -> str | None:
    """
    Convert a short, single-clause S2 into a relative clause modifier ONLY when safe.
    Rejects contrastive conjunctions and multi-clause sentences.
    """
    s = s2.strip().rstrip("。")
    if not s or len(s) > 45:
        return None
    if ans_core and ans_core in s:
        return None

    # Reject contrastive or sequential conjunctions or topic-prefixed clauses at the start
    bad_starts = (
        "ただし", "しかし", "もっとも", "だが", "一方", "これに対し", "そのため",
        "その結果", "その後", "やがて", "のちに", "後に", "また", "さらに", "なお",
        "ちなみに", "こうして", "こうして、", "とくに", "特に", "かれは", "彼は",
        "かの女は", "彼女は", "この", "その", "同", "両", "用途としては", "特徴としては",
        "内容としては", "背景には", "原因は", "目的は", "きっかけは", "理由としては"
    )
    for bs in bad_starts:
        if s.startswith(bs):
            return None
    if re.match(r"^.{1,8}としては、", s):
        return None

    # Reject if S2 already contains past-tense comma clauses ("〜た、", "〜だ、") to avoid run-on
    if re.search(r"(した|れた|った|んだ|いた|えた|きた|みた|かった|であった)、", s):
        return None

    # Must end with a clean past/passive/state verb that can modify a noun phrase
    if s.endswith("であった") or s.endswith("だった"):
        return None

    if re.search(r"(した|された|れた|えた|った|んだ|いた|きた|みた|られた|おこなった|行った|設けた|定めた|築いた|建てた|著した|書いた|唱えた|起こした|開いた|結んだ|破った|滅ぼした|統一した|創始した|建国した|活躍した|栄えた|発展した|成立した|制定された|発布された|締結された|開催された)$", s):
        return s

    return None


def build_question_from_term(item: dict, term_entry: dict, occurrence_idx: int) -> str | None:
    """
    Synthesize a natural question from paraphrased.json term_entry.
    occurrence_idx == 1: primary question for this term_id
    occurrence_idx >= 2: secondary question for the same term_id
    """
    desc = term_entry.get("description", "")
    ans_core = clean_term_core(item["answer"])
    term_core = clean_term_core(term_entry.get("term", ""))

    # Split description into sentences
    sents = [s.strip() for s in desc.split("。") if s.strip()]
    if not sents:
        return None

    if occurrence_idx == 1:
        np = transform_s1_to_noun_phrase(sents[0], ans_core)
        if not np:
            return None
        if term_core and term_core in np:
            return None

        # Only prepend S2 modifier if np is brief (< 28 chars) so we never create run-on sentences
        if len(np) < 28 and len(sents) >= 2:
            mod = s2_to_clean_modifier(sents[1], ans_core)
            if mod and (not term_core or term_core not in mod):
                np = f"{mod}、{np}"

        ending = infer_ending(item["question"], np, item["answer"])
        q = f"{np}{ending}"
        return q

    else:
        # For 2nd+ occurrence of the same term_id, see if S2 + category from S1 makes a distinct question
        if len(sents) >= 2:
            np1 = transform_s1_to_noun_phrase(sents[0], ans_core)
            # Extract tail category noun from np1 (e.g., "人物", "王朝", "都市", "制度", "事件", "条約")
            cat_match = re.search(r"([一-龥ァ-ヶー]{2,6})$", np1 or "")
            mod2 = s2_to_clean_modifier(sents[1], ans_core)
            if cat_match and mod2 and (not term_core or term_core not in mod2):
                cat = cat_match.group(1)
                candidate_np = f"{mod2}{cat}"
                ending = infer_ending(item["question"], candidate_np, item["answer"])
                return f"{candidate_np}{ending}"
        return None


def main():
    qa_data = json.loads(QA_PATH.read_text(encoding="utf-8"))
    para_data = json.loads(PARA_PATH.read_text(encoding="utf-8"))
    para_by_id = {idx + 1: t for idx, t in enumerate(para_data)}

    # 1. Apply known specific fixes
    specific_fixes = {
        49: {"answer": "文字", "matched_term_id": 75},
        383: {"answer": "建業", "matched_term_id": 451},
        384: {"answer": "公孫氏", "matched_term_id": 471},
        1132: {"answer": "ギリシア正教（正教会）", "matched_term_id": 1367},
        1769: {"answer": "鄭和", "matched_term_id": 1957},
        4038: {"answer": "フィリピン", "matched_term_id": None},
        4089: {"answer": "フランス", "matched_term_id": None},
        4265: {"answer": "カシミール", "matched_term_id": 4999},
    }

    for item in qa_data:
        iid = item["id"]
        if iid in specific_fixes:
            item.update(specific_fixes[iid])
        item["question"] = fix_clipped_years(item["question"], item.get("chapter", ""))

    # 2. Try synthesizing from paraphrased.json
    term_usage_count = {}
    synthesized_by_id = {}
    remaining_items = []

    for item in qa_data:
        tid = item.get("matched_term_id")
        if tid is not None and tid in para_by_id:
            occ = term_usage_count.get(tid, 0) + 1
            term_usage_count[tid] = occ
            new_q = build_question_from_term(item, para_by_id[tid], occ)
            if new_q and len(new_q) >= 15:
                synthesized_by_id[item["id"]] = new_q
                continue
        remaining_items.append(item)

    print(f"Total items: {len(qa_data)}")
    print(f"Synthesized cleanly from paraphrased.json: {len(synthesized_by_id)}")
    print(f"Remaining items needing custom rewrite: {len(remaining_items)}")

    # Save synthesized map and remaining items to scratch for batch subagent / custom rewriting
    (SCRATCH_DIR / "synthesized_from_para.json").write_text(
        json.dumps(synthesized_by_id, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Prepare remaining items with context (including paraphrased.json description if matched_term_id exists)
    remaining_payload = []
    for item in remaining_items:
        tid = item.get("matched_term_id")
        ref_desc = para_by_id[tid]["description"] if (tid and tid in para_by_id) else ""
        remaining_payload.append({
            "id": item["id"],
            "chapter": item.get("chapter", ""),
            "section": item.get("section", ""),
            "orig_q": item["question"],
            "answer": item["answer"],
            "ref_desc": ref_desc,
        })

    (SCRATCH_DIR / "remaining_to_rewrite.json").write_text(
        json.dumps(remaining_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Split remaining_payload into 4 batches for fast parallel subagent rewriting
    batch_size = (len(remaining_payload) + 3) // 4
    for idx in range(4):
        chunk = remaining_payload[idx * batch_size : (idx + 1) * batch_size]
        (SCRATCH_DIR / f"rewrite_batch_{idx+1}.json").write_text(
            json.dumps(chunk, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"Batch {idx+1}: {len(chunk)} items -> rewrite_batch_{idx+1}.json")


if __name__ == "__main__":
    main()
