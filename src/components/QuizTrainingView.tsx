'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { QAItem, EnrichedTerm } from '@/types/history';
import { triggerSavedHaptic } from '@/lib/haptics';
import LinkedDescription from './LinkedDescription';
import {
  Layers,
  ListChecks,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Sparkles,
  Flame,
  ArrowRight,
  Trophy,
  RefreshCw,
  Menu,
  X,
  Home,
  Building2,
  Play,
  Compass,
  EyeOff,
  Vibrate,
} from 'lucide-react';

export type QuizMode = 'flashcard' | 'multiple_choice';
type StatusFilter = 'unmastered' | 'review' | 'mastered' | 'all';

interface QuizTrainingViewProps {
  qaItems: QAItem[];
  termsById: Map<number, EnrichedTerm>;
  readTermIds: Set<number>;
  masteredQaIds: Set<number>;
  reviewQaIds: Set<number>;
  initialMode?: QuizMode;
  onRecordResult: (qaId: number, isCorrect: boolean, matchedTermId: number | null) => void;
  onJumpToTermInDB: (termId: number) => void;
  onNavigate: (view: 'home' | 'db' | 'city' | 'haptics') => void;
}

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
  initialMode = 'flashcard',
  onRecordResult,
  onJumpToTermInDB,
  onNavigate,
}: QuizTrainingViewProps) {
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unmastered');
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(false);

  // Video-game style Pause / Menu overlay
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Sync initialMode when launched from Top Menu
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Current deck & card index
  const [deck, setDeck] = useState<QAItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Flashcard state: strictly 2 states (Question -> Revealed Answer & Explanation)
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

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

  // Rebuild deck when filter settings change
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
    setSelectedChoice(null);
  }, [qaItems, selectedChapter, selectedSection, statusFilter, isRandomOrder, masteredQaIds, reviewQaIds]);

  // Only trigger full deck rebuild when filter controls change
  useEffect(() => {
    rebuildDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, selectedSection, statusFilter, isRandomOrder]);

  const currentItem: QAItem | undefined = deck[currentIndex];

  // Generate 4 choices whenever currentItem or mode changes
  useEffect(() => {
    setIsRevealed(false);
    setSelectedChoice(null);

    if (!currentItem) {
      setChoices([]);
      return;
    }

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

  function advanceToNextCard() {
    setIsRevealed(false);
    setSelectedChoice(null);
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }

  // Flashcard Tap on Revealed Card Body -> Same as "不正解・あいまい" & immediately go to next question
  function handleFlashcardKeepInRotation() {
    if (!currentItem) return;
    triggerSavedHaptic();
    setSessionTotal((prev) => prev + 1);
    setStreak(0);
    onRecordResult(currentItem.id, false, currentItem.matched_term_id);
    advanceToNextCard();
  }

  // Flashcard Corner Button "もうこの問題を表示しない" -> Same as "正解できた！" & remove from active deck & go to next question
  function handleFlashcardHideForever(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentItem) return;
    triggerSavedHaptic();
    const targetId = currentItem.id;
    setSessionTotal((prev) => prev + 1);
    setSessionCorrect((prev) => prev + 1);
    setStreak((prev) => prev + 1);
    onRecordResult(targetId, true, currentItem.matched_term_id);

    setIsRevealed(false);
    setSelectedChoice(null);

    if (statusFilter === 'unmastered') {
      setDeck((prevDeck) => {
        const nextDeck = prevDeck.filter((item) => item.id !== targetId);
        if (currentIndex >= nextDeck.length) {
          setCurrentIndex(0);
        }
        return nextDeck;
      });
    } else {
      advanceToNextCard();
    }
  }

  function handleSelectChoice(choice: string) {
    if (!currentItem || selectedChoice !== null) return;
    triggerSavedHaptic();
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

  function handlePrevQuestion(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setIsRevealed(false);
      setSelectedChoice(null);
      setCurrentIndex((prev) => prev - 1);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMenuOpen((prev) => !prev);
        return;
      }
      if (isMenuOpen) return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (!currentItem) return;

      if (mode === 'flashcard') {
        if ((e.code === 'Space' || e.code === 'Enter') && !isRevealed) {
          e.preventDefault();
          setIsRevealed(true);
        } else if (isRevealed) {
          if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
            e.preventDefault();
            handleFlashcardKeepInRotation();
          }
        }
      } else {
        if (selectedChoice === null && ['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (choices[idx]) handleSelectChoice(choices[idx]);
        } else if (
          selectedChoice !== null &&
          (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter')
        ) {
          e.preventDefault();
          advanceToNextCard();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="max-w-3xl mx-auto pt-1 pb-6">
      {/* Hidden iOS 17.4+ / 18+ Taptic Engine Switch element */}
      <label
        id="worldia-ios-haptic-label"
        className="sr-only pointer-events-none opacity-0 fixed -top-96 -left-96"
        aria-hidden="true"
      >
        <input
          type="checkbox"
          ref={(el) => {
            if (el) el.setAttribute('switch', '');
          }}
        />
      </label>

      {!currentItem ? (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              <Menu className="w-4 h-4" />
              <span>メニュー</span>
            </button>
          </div>
          <p className="text-base font-bold text-slate-200">
            選択した出題条件に該当する問題がありません。
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStatusFilter('all');
                setSelectedSection('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
            >
              すべての問題を表示する
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
            >
              トップメニューへ戻る
            </button>
          </div>
        </div>
      ) : mode === 'flashcard' ? (
        /* =========================================================
           MODE A: FLASHCARD (問題カード全体がボタン + 多層波枠アニメーション)
           ========================================================= */
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!isRevealed) {
              triggerSavedHaptic();
              setIsRevealed(true);
            } else {
              handleFlashcardKeepInRotation();
            }
          }}
          className={`relative rounded-[26px] p-[2.5px] transition-transform duration-150 active:scale-[0.992] cursor-pointer select-none shadow-2xl ${
            isRevealed ? 'wave-card-outer-revealed' : 'wave-card-outer'
          }`}
        >
          {/* Second counter-flowing wave border layer */}
          <div
            className={`rounded-[24px] p-[2px] ${
              isRevealed ? 'wave-card-middle-revealed' : 'wave-card-middle'
            }`}
          >
            {/* Inner Card Surface */}
            <div className="relative overflow-hidden rounded-[22px] bg-[#091326]/95 p-4 sm:p-6 space-y-5">
              {/* Top & Bottom Multi-Layer Slowly Flowing Wave Lines (Non-intrusive) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-5 overflow-hidden opacity-45">
                <svg
                  className="w-[200%] h-full wave-svg-slow"
                  viewBox="0 0 1200 24"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,12 C150,2 300,22 450,12 C600,2 750,22 900,12 C1050,2 1150,18 1200,12"
                    fill="none"
                    stroke={isRevealed ? '#34d399' : '#22d3ee'}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M0,16 C200,24 400,4 600,16 C800,24 1000,4 1200,16"
                    fill="none"
                    stroke={isRevealed ? '#38bdf8' : '#818cf8'}
                    strokeWidth="1"
                    strokeOpacity="0.7"
                  />
                </svg>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 overflow-hidden opacity-45">
                <svg
                  className="w-[200%] h-full wave-svg-reverse"
                  viewBox="0 0 1200 24"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,12 C150,22 300,2 450,12 C600,22 750,2 900,12 C1050,22 1150,6 1200,12"
                    fill="none"
                    stroke={isRevealed ? '#34d399' : '#22d3ee'}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M0,8 C200,2 400,20 600,8 C800,2 1000,20 1200,8"
                    fill="none"
                    stroke={isRevealed ? '#fbbf24' : '#2dd4bf'}
                    strokeWidth="1"
                    strokeOpacity="0.65"
                  />
                </svg>
              </div>

              {/* Top Bar inside Card: Chapter/Section + Question Counter + Unobtrusive Menu Button */}
              <div className="relative z-10 flex items-start justify-between gap-2 border-b border-slate-800/90 pb-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold truncate max-w-[220px] sm:max-w-none">
                      {currentItem.chapter}
                    </span>
                    {currentItem.section && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium truncate max-w-[150px] sm:max-w-none">
                        {currentItem.section}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-bold tabular-nums">
                    <span>
                      問題 {currentIndex + 1} / {deck.length.toLocaleString()}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-300">
                      ★{Math.min(5, Math.max(1, Math.round((currentItem.frequency || 3) / 2)))}
                    </span>
                    {reviewQaIds.has(currentItem.id) && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        復習中
                      </span>
                    )}
                  </div>
                </div>

                {/* Unobtrusive Video-Game Menu / Pause Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(true);
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                  title="遠征メニュー"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">メニュー</span>
                </button>
              </div>

              {/* STATE 1: BEFORE TAP -> QUESTION VIEW */}
              {!isRevealed ? (
                <div className="relative z-10 py-6 sm:py-10 space-y-8">
                  <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed tracking-wide">
                    {currentItem.question}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-cyan-300/80">
                    {currentIndex > 0 ? (
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold transition"
                      >
                        ← 前の問題
                      </button>
                    ) : (
                      <span />
                    )}
                    <span className="font-bold tracking-wider animate-pulse">
                      カードをタップして答えと解説を表示
                    </span>
                  </div>
                </div>
              ) : (
                /* STATE 2: AFTER TAP -> ANSWER & EXPLANATION FRONT AND CENTER ("ドーンと前に出す") */
                <div className="relative z-10 space-y-4 pt-1">
                  {/* Prominent Answer Header */}
                  <div className="bg-emerald-950/35 border border-emerald-500/40 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-0.5">
                          正解（ANSWER）
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                          {currentItem.answer}
                        </div>
                        {matchedTerm?.reading && (
                          <div className="text-xs sm:text-sm text-emerald-200/80 mt-0.5 font-medium">
                            {matchedTerm.reading}
                          </div>
                        )}
                      </div>

                      {matchedTerm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToTermInDB(matchedTerm.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-bold transition"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>世界史DBで開く</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prominent Glossary Explanation ("いきなり用語解説をドーンと前に出す") */}
                  <div className="bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-cyan-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          用語解説：{matchedTerm ? matchedTerm.term : currentItem.answer}
                        </span>
                        {matchedTerm?.era && (
                          <span className="text-amber-300/90 font-normal text-xs">
                            （{matchedTerm.era}）
                          </span>
                        )}
                      </span>
                    </div>

                    {matchedTerm ? (
                      <div className="text-base sm:text-lg text-slate-100 leading-relaxed">
                        <LinkedDescription
                          term={matchedTerm}
                          termsById={termsById}
                          readTermIds={readTermIds}
                          onSelectTerm={onJumpToTermInDB}
                        />
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
                        {currentItem.question}
                      </p>
                    )}
                  </div>

                  {/* Subtle Reference to the Question Text */}
                  <div className="px-2 text-xs text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-500 mr-1.5">問題:</span>
                    {currentItem.question}
                  </div>

                  {/* Bottom Bar: Corner Button "もうこの問題を表示しない" + Tap Card Hint */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-emerald-300/90">
                      カードをタップして次の問題へ →
                    </span>

                    <button
                      type="button"
                      onClick={handleFlashcardHideForever}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-400/50 text-slate-300 hover:text-emerald-200 text-xs font-bold transition cursor-pointer"
                      title="習得済みとして記録し、今後の出題から除外します（人口+200・文化+8）"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                      <span>もうこの問題を表示しない</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================
           MODE B: 4-CHOICE QUIZ (4択遠征)
           ========================================================= */
        <div className="bg-slate-900/95 border border-cyan-500/25 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800/90 pb-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold truncate max-w-[230px] sm:max-w-none">
                  {currentItem.chapter}
                </span>
                {currentItem.section && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium truncate max-w-[160px] sm:max-w-none">
                    {currentItem.section}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-bold tabular-nums">
                <span>
                  問題 {currentIndex + 1} / {deck.length.toLocaleString()}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300">
                  ★{Math.min(5, Math.max(1, Math.round((currentItem.frequency || 3) / 2)))}
                </span>
                {streak > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400 inline-flex items-center gap-0.5">
                      <Flame className="w-3.5 h-3.5" />
                      {streak}連続
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">メニュー</span>
            </button>
          </div>

          <div className="py-1 sm:py-3">
            <p className="text-base sm:text-xl font-bold text-white leading-relaxed tracking-wide">
              {currentItem.question}
            </p>
          </div>

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
                      正解！（人口+200 / 文化+8）
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
                      <span>世界史DBで見る</span>
                    </button>
                  )}

                  <button
                    onClick={advanceToNextCard}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow transition cursor-pointer"
                  >
                    <span>次の問題へ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {selectedChoice !== null && matchedTerm && (
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
          </div>
        </div>
      )}

      {/* VIDEO-GAME STYLE PAUSE / EXPEDITION MENU MODAL */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">
                  エクスペディション（遠征メニュー）
                </h3>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Status Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                <div className="text-slate-400 text-[11px] flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-400" />
                  <span>開拓済</span>
                </div>
                <div className="font-extrabold text-emerald-300 mt-0.5 tabular-nums">
                  {masteredQaIds.size.toLocaleString()} / {qaItems.length.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                <div className="text-slate-400 text-[11px] flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>要復習</span>
                </div>
                <div className="font-extrabold text-rose-300 mt-0.5 tabular-nums">
                  {reviewQaIds.size.toLocaleString()}問
                </div>
              </div>
              <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                <div className="text-slate-400 text-[11px]">今回の演習</div>
                <div className="font-extrabold text-cyan-300 mt-0.5 tabular-nums">
                  {sessionTotal}問
                </div>
              </div>
            </div>

            {/* Expedition Settings (Mode & Range Filters) */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90">
              <div className="text-xs font-extrabold text-slate-300">
                遠征スタイル・出題範囲の変更
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setMode('flashcard')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-extrabold transition ${
                    mode === 'flashcard'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>カード（一問一答）</span>
                </button>

                <button
                  onClick={() => setMode('multiple_choice')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-extrabold transition ${
                    mode === 'multiple_choice'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>4択クイズ</span>
                </button>
              </div>

              {/* Chapter Select */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">時代・章の選択</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setSelectedSection('ALL');
                  }}
                  className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">全章（全 {qaItems.length.toLocaleString()} 問）</option>
                  {chapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Select */}
              {sections.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">セクションの選択</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">章内の全セクション</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter & Order */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="unmastered">通常（非表示を除く）</option>
                  <option value="review">要復習のみ ({reviewQaIds.size})</option>
                  <option value="mastered">非表示済のみ ({masteredQaIds.size})</option>
                  <option value="all">すべての問題</option>
                </select>

                <button
                  onClick={() => setIsRandomOrder((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isRandomOrder
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isRandomOrder ? 'シャッフル順' : '教科書順'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  rebuildDeck();
                  setIsMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>現在の条件で1問目からやり直す</span>
              </button>
            </div>

            {/* Game Menu Actions (Resume / Navigate) */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>遠征を再開する</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('db')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>世界史DBへ</span>
                </button>

                <button
                  onClick={() => onNavigate('city')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>マイ歴史都市へ</span>
                </button>
              </div>

              <button
                onClick={() => onNavigate('haptics')}
                className="w-full py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Vibrate className="w-4 h-4 text-purple-400" />
                <span>スマホ振動（ハプティクス）実験ラボを開く</span>
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>トップメニューに戻る</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
