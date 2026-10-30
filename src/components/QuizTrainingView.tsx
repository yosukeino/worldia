'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { QAItem, EnrichedTerm } from '@/types/history';
import LinkedDescription from './LinkedDescription';
import {
  Layers,
  ListChecks,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Sparkles,
  Filter,
  Flame,
  Eye,
  ArrowRight,
  Trophy,
  RefreshCw,
} from 'lucide-react';

interface QuizTrainingViewProps {
  qaItems: QAItem[];
  termsById: Map<number, EnrichedTerm>;
  readTermIds: Set<number>;
  masteredQaIds: Set<number>;
  reviewQaIds: Set<number>;
  onRecordResult: (qaId: number, isCorrect: boolean, matchedTermId: number | null) => void;
  onJumpToTermInDB: (termId: number) => void;
}

type QuizMode = 'flashcard' | 'multiple_choice';
type StatusFilter = 'all' | 'unmastered' | 'review' | 'mastered';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuizTrainingView({
  qaItems,
  termsById,
  readTermIds,
  masteredQaIds,
  reviewQaIds,
  onRecordResult,
  onJumpToTermInDB,
}: QuizTrainingViewProps) {
  const [mode, setMode] = useState<QuizMode>('flashcard');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(false);

  // Current deck & card index
  const [deck, setDeck] = useState<QAItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Flashcard state
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [flashcardJudged, setFlashcardJudged] = useState<'correct' | 'wrong' | null>(null);

  // 4-choice state
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Session counters
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [sessionTotal, setSessionTotal] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Unique chapters in order of appearance
  const chapters = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const item of qaItems) {
      if (item.chapter && !seen.has(item.chapter)) {
        seen.add(item.chapter);
        list.push(item.chapter);
      }
    }
    return list;
  }, [qaItems]);

  // Unique sections within selectedChapter
  const sections = useMemo(() => {
    if (selectedChapter === 'ALL') return [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const item of qaItems) {
      if (item.chapter === selectedChapter && item.section && !seen.has(item.section)) {
        seen.add(item.section);
        list.push(item.section);
      }
    }
    return list;
  }, [qaItems, selectedChapter]);

  // Rebuild deck ONLY when filter settings change or user clicks reshuffle
  const rebuildDeck = useCallback(() => {
    let filtered = qaItems.filter((item) => {
      if (selectedChapter !== 'ALL' && item.chapter !== selectedChapter) return false;
      if (selectedSection !== 'ALL' && item.section !== selectedSection) return false;
      if (statusFilter === 'unmastered' && masteredQaIds.has(item.id)) return false;
      if (statusFilter === 'review' && !reviewQaIds.has(item.id)) return false;
      if (statusFilter === 'mastered' && !masteredQaIds.has(item.id)) return false;
      return true;
    });

    if (isRandomOrder) {
      filtered = shuffleArray(filtered);
    }

    setDeck(filtered);
    setCurrentIndex(0);
    setIsRevealed(false);
    setFlashcardJudged(null);
    setSelectedChoice(null);
  }, [qaItems, selectedChapter, selectedSection, statusFilter, isRandomOrder]);

  useEffect(() => {
    rebuildDeck();
  }, [selectedChapter, selectedSection, statusFilter, isRandomOrder]);

  const currentItem: QAItem | undefined = deck[currentIndex];

  // Generate 4 choices whenever currentItem or mode changes
  useEffect(() => {
    setIsRevealed(false);
    setFlashcardJudged(null);
    setSelectedChoice(null);

    if (!currentItem) {
      setChoices([]);
      return;
    }

    // Build plausible distractors from same section -> same chapter -> all items
    const correctAns = currentItem.answer;
    const sameSectionPool = qaItems.filter(
      (x) =>
        x.chapter === currentItem.chapter &&
        x.section === currentItem.section &&
        x.answer !== correctAns
    );
    const sameChapterPool = qaItems.filter(
      (x) => x.chapter === currentItem.chapter && x.answer !== correctAns
    );

    const distractorSet = new Set<string>();
    for (const candidate of shuffleArray(sameSectionPool)) {
      if (distractorSet.size >= 3) break;
      distractorSet.add(candidate.answer);
    }
    if (distractorSet.size < 3) {
      for (const candidate of shuffleArray(sameChapterPool)) {
        if (distractorSet.size >= 3) break;
        distractorSet.add(candidate.answer);
      }
    }
    if (distractorSet.size < 3) {
      for (const candidate of shuffleArray(qaItems)) {
        if (distractorSet.size >= 3) break;
        if (candidate.answer !== correctAns) {
          distractorSet.add(candidate.answer);
        }
      }
    }

    const fourOptions = shuffleArray([correctAns, ...Array.from(distractorSet).slice(0, 3)]);
    setChoices(fourOptions);
  }, [currentItem, mode, qaItems]);

  const matchedTerm: EnrichedTerm | undefined = useMemo(() => {
    if (!currentItem || currentItem.matched_term_id === null) return undefined;
    return termsById.get(currentItem.matched_term_id);
  }, [currentItem, termsById]);

  function handleFlashcardJudge(isCorrect: boolean) {
    if (!currentItem) return;
    setFlashcardJudged(isCorrect ? 'correct' : 'wrong');
    setSessionTotal((prev) => prev + 1);
    if (isCorrect) {
      setSessionCorrect((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    onRecordResult(currentItem.id, isCorrect, currentItem.matched_term_id);
  }

  function handleSelectChoice(choice: string) {
    if (!currentItem || selectedChoice !== null) return;
    setSelectedChoice(choice);
    const isCorrect = choice === currentItem.answer;
    setSessionTotal((prev) => prev + 1);
    if (isCorrect) {
      setSessionCorrect((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    onRecordResult(currentItem.id, isCorrect, currentItem.matched_term_id);
  }

  function handleNextQuestion() {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }

  function handlePrevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  // Keyboard shortcuts for fast studying
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (!currentItem) return;

      if (mode === 'flashcard') {
        if (e.code === 'Space' && !isRevealed) {
          e.preventDefault();
          setIsRevealed(true);
        } else if (isRevealed && flashcardJudged === null) {
          if (e.key === '1' || e.key === 'o' || e.key === 'O') {
            handleFlashcardJudge(true);
          } else if (e.key === '2' || e.key === 'x' || e.key === 'X') {
            handleFlashcardJudge(false);
          }
        } else if (flashcardJudged !== null && (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter')) {
          e.preventDefault();
          handleNextQuestion();
        }
      } else {
        if (selectedChoice === null && ['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (choices[idx]) handleSelectChoice(choices[idx]);
        } else if (selectedChoice !== null && (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter')) {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const isAnswered =
    (mode === 'flashcard' && flashcardJudged !== null) ||
    (mode === 'multiple_choice' && selectedChoice !== null);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Mode Switcher & Stats Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mode Switcher: Flashcard (一問一答) vs 4-Choice (4択) */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('flashcard')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition ${
              mode === 'flashcard'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>一問一答（カード）</span>
          </button>

          <button
            onClick={() => setMode('multiple_choice')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition ${
              mode === 'multiple_choice'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>4択クイズ</span>
          </button>
        </div>

        {/* Progress & Streak Stats */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">習得済:</span>
            <span className="font-extrabold text-emerald-300 tabular-nums">
              {masteredQaIds.size.toLocaleString()}
            </span>
            <span className="text-slate-500">/ {qaItems.length.toLocaleString()}問</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">連続正解:</span>
            <span className="font-extrabold text-amber-300 tabular-nums">{streak}</span>
          </div>

          {sessionTotal > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">今回:</span>
              <span className="font-extrabold text-cyan-300 tabular-nums">
                {sessionCorrect}/{sessionTotal} ({Math.round((sessionCorrect / sessionTotal) * 100)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar (Chapter, Section, Status, Order) */}
      <div className="bg-slate-900/75 border border-slate-800/90 rounded-2xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>出題範囲:</span>
        </div>

        <select
          value={selectedChapter}
          onChange={(e) => {
            setSelectedChapter(e.target.value);
            setSelectedSection('ALL');
          }}
          className="bg-slate-950 text-slate-100 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400 max-w-full sm:max-w-[260px]"
        >
          <option value="ALL">全章（全 {qaItems.length.toLocaleString()} 問）</option>
          {chapters.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>

        {sections.length > 0 && (
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-slate-950 text-slate-100 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400 max-w-full sm:max-w-[200px]"
          >
            <option value="ALL">章内の全セクション</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-slate-950 text-slate-100 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400"
        >
          <option value="all">すべての問題</option>
          <option value="unmastered">未習得のみ</option>
          <option value="review">要復習（不正解）のみ ({reviewQaIds.size})</option>
          <option value="mastered">習得済みのみ ({masteredQaIds.size})</option>
        </select>

        <button
          onClick={() => setIsRandomOrder((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
            isRandomOrder
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          <span>{isRandomOrder ? 'シャッフル順' : '教科書順'}</span>
        </button>

        <button
          onClick={rebuildDeck}
          className="ml-auto px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
          title="現在のフィルタでデッキをリセット"
        >
          <RotateCcw className="w-3 h-3" />
          <span>最初から</span>
        </button>
      </div>

      {/* Main Question Card */}
      {!currentItem ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-base font-bold text-slate-200">
            選択した条件に該当する問題がありません。
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSelectedSection('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs"
          >
            すべての問題を表示する
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/95 border border-cyan-500/25 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          {/* Card Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                {currentItem.chapter}
              </span>
              {currentItem.section && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                  {currentItem.section}
                </span>
              )}
              {masteredQaIds.has(currentItem.id) && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                  ✓ 習得済
                </span>
              )}
              {reviewQaIds.has(currentItem.id) && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                  要復習
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold tabular-nums">
              <span>
                問題 {currentIndex + 1} / {deck.length.toLocaleString()}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300">
                ★{Math.min(5, Math.max(1, Math.round((currentItem.frequency || 3) / 2)))}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2 sm:py-4">
            <p className="text-base sm:text-xl font-bold text-white leading-relaxed tracking-wide">
              {currentItem.question}
            </p>
          </div>

          {/* MODE A: FLASHCARD (一問一答) */}
          {mode === 'flashcard' && (
            <div className="space-y-4">
              {!isRevealed ? (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-2 border-dashed border-emerald-400/50 text-emerald-200 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-inner"
                >
                  <Eye className="w-5 h-5 text-emerald-400" />
                  <span>タップして正解を表示する（Spaceキー）</span>
                </button>
              ) : (
                <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                        正解（ANSWER）
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-white tracking-wide">
                        {currentItem.answer}
                      </div>
                      {matchedTerm?.reading && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {matchedTerm.reading}
                        </div>
                      )}
                    </div>

                    {matchedTerm && (
                      <button
                        onClick={() => onJumpToTermInDB(matchedTerm.id)}
                        className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>世界史DBでこの用語を開く</span>
                      </button>
                    )}
                  </div>

                  {/* Self-Assessment Buttons */}
                  {flashcardJudged === null ? (
                    <div className="pt-2 space-y-2">
                      <p className="text-xs text-slate-400 text-center font-medium">
                        あなたの自己採点を選んでください（正解すると都市の人口・文化が成長します）
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleFlashcardJudge(false)}
                          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 font-extrabold text-sm transition cursor-pointer"
                        >
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>不正解・あいまい</span>
                        </button>

                        <button
                          onClick={() => handleFlashcardJudge(true)}
                          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>正解できた！</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
                        {flashcardJudged === 'correct' ? (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            正解として記録しました！
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            「要復習」リストに追加しました
                          </span>
                        )}
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow transition cursor-pointer"
                      >
                        <span>次の問題へ</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE B: 4-CHOICE QUIZ (4択クイズ) */}
          {mode === 'multiple_choice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {choices.map((option, idx) => {
                  const isCorrectOption = option === currentItem.answer;
                  const isSelected = selectedChoice === option;

                  let btnStyle =
                    'bg-slate-950/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-100';
                  if (selectedChoice !== null) {
                    if (isCorrectOption) {
                      btnStyle =
                        'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50';
                    } else if (isSelected && !isCorrectOption) {
                      btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
                    } else {
                      btnStyle = 'bg-slate-950/40 border-slate-800/60 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={`${option}-${idx}`}
                      disabled={selectedChoice !== null}
                      onClick={() => handleSelectChoice(option)}
                      className={`text-left p-3.5 sm:p-4 rounded-xl border font-bold text-sm sm:text-base transition flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{option}</span>
                      </div>

                      {selectedChoice !== null && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {selectedChoice !== null && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedChoice !== null && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selectedChoice === currentItem.answer ? (
                      <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        正解です！（{currentItem.answer}）
                      </span>
                    ) : (
                      <span className="text-rose-400 font-extrabold text-sm flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        不正解… 正解は「{currentItem.answer}」
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {matchedTerm && (
                      <button
                        onClick={() => onJumpToTermInDB(matchedTerm.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>世界史DBで詳しく見る</span>
                      </button>
                    )}

                    <button
                      onClick={handleNextQuestion}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow transition cursor-pointer"
                    >
                      <span>次の問題へ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked Glossary Explanation Card (shown after answer is revealed/judged) */}
          {((mode === 'flashcard' && isRevealed) ||
            (mode === 'multiple_choice' && selectedChoice !== null)) &&
            matchedTerm && (
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>用語解説：{matchedTerm.term}</span>
                    {matchedTerm.era && (
                      <span className="text-amber-300/90 font-normal">
                        （{matchedTerm.era}）
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <LinkedDescription
                    term={matchedTerm}
                    termsById={termsById}
                    readTermIds={readTermIds}
                    onSelectTerm={onJumpToTermInDB}
                  />
                </div>
              </div>
            )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-slate-300 font-bold transition"
            >
              ← 前の問題
            </button>

            {!isAnswered && (
              <button
                onClick={handleNextQuestion}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold transition"
              >
                スキップして次へ →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
