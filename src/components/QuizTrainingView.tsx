'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { QAItem, EnrichedTerm, CityPoints } from '@/types/history';
import { calculateQuestionReward } from '@/config/restoration-stages';
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
  Menu,
  X,
  Home,
  Building2,
  Play,
  Compass,
  EyeOff,
  Vibrate,
  Shuffle,
  Users,
  Wrench,
  Flag,
} from 'lucide-react';

export type QuizMode = 'flashcard' | 'multiple_choice';
type StatusFilter = 'unmastered' | 'review' | 'mastered' | 'all';
type ShuffleMode = 'sequential' | 'chapter' | 'all';

interface QuizTrainingViewProps {
  qaItems: QAItem[];
  termsById: Map<number, EnrichedTerm>;
  readTermIds: Set<number>;
  masteredQaIds: Set<number>;
  reviewQaIds: Set<number>;
  qaAnswerViewCounts: Record<number, number>;
  currentPoints: CityPoints;
  initialMode?: QuizMode;
  advanceTrigger?: number;
  onRevealAnswer: (qaId: number) => void;
  onRecordResult: (
    qaId: number,
    isCorrect: boolean,
    matchedTermId: number | null,
    earnedPoints: CityPoints
  ) => void;
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

/**
 * 20問連続正解まで10段階（2問ごとに1段階アップ）で色・サイズ・輝きアニメーションが進化する連続正解バッジ
 * - 数字そのものを独立した大きめオブジェクトとして表示
 * - 6段階目（11連続正解〜）からはテキスト自体がキラキラ輝くシマー＆スパークルアニメーション付き
 */
function renderStreakBadge(streak: number) {
  const tier = Math.min(10, Math.max(1, Math.ceil(streak / 2)));

  const tierStyles: Record<
    number,
    {
      badge: string;
      iconColor: string;
      numClass: string;
      labelClass: string;
      hasSparkles: boolean;
    }
  > = {
    // 1段階目 (1〜2連続): エメラルドグリーン
    1: {
      badge: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400',
      numClass: 'text-base sm:text-lg font-black text-emerald-300',
      labelClass: 'text-emerald-300/90',
      hasSparkles: false,
    },
    // 2段階目 (3〜4連続): シアンブルー
    2: {
      badge: 'bg-cyan-500/12 border-cyan-500/35',
      iconColor: 'text-cyan-400',
      numClass: 'text-base sm:text-lg font-black text-cyan-300',
      labelClass: 'text-cyan-300/90',
      hasSparkles: false,
    },
    // 3段階目 (5〜6連続): アンバーイエロー
    3: {
      badge: 'bg-amber-500/15 border-amber-500/40',
      iconColor: 'text-amber-400',
      numClass: 'text-base sm:text-lg font-black text-amber-300',
      labelClass: 'text-amber-300',
      hasSparkles: false,
    },
    // 4段階目 (7〜8連続): フレイムオレンジ
    4: {
      badge: 'bg-orange-500/15 border-orange-500/45 shadow-[0_0_8px_rgba(249,115,22,0.2)]',
      iconColor: 'text-orange-400',
      numClass:
        'text-lg sm:text-xl font-black text-orange-300 drop-shadow-[0_0_5px_rgba(249,115,22,0.45)]',
      labelClass: 'text-orange-300',
      hasSparkles: false,
    },
    // 5段階目 (9〜10連続): クリムゾンローズ
    5: {
      badge: 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.28)]',
      iconColor: 'text-rose-400',
      numClass:
        'text-lg sm:text-xl font-black text-rose-300 drop-shadow-[0_0_7px_rgba(244,63,94,0.65)]',
      labelClass: 'text-rose-200',
      hasSparkles: false,
    },
    // 6段階目 (11〜12連続): ゴールデン・シマー（ここからキラキラアニメーション開始！）
    6: {
      badge: 'bg-yellow-500/15 border-yellow-400/60 shadow-[0_0_12px_rgba(250,204,21,0.3)]',
      iconColor: 'text-yellow-300 animate-pulse',
      numClass: 'text-lg sm:text-xl font-black streak-num-tier-6',
      labelClass: 'text-yellow-200 streak-num-tier-6',
      hasSparkles: true,
    },
    // 7段階目 (13〜14連続): アメジスト・ネオンシマー
    7: {
      badge: 'bg-fuchsia-500/15 border-fuchsia-400/65 shadow-[0_0_14px_rgba(232,121,249,0.35)]',
      iconColor: 'text-fuchsia-300 animate-pulse',
      numClass: 'text-xl sm:text-2xl font-black streak-num-tier-7',
      labelClass: 'text-fuchsia-200 streak-num-tier-7',
      hasSparkles: true,
    },
    // 8段階目 (15〜16連続): 蒼白スーパーノヴァ・プラズマ
    8: {
      badge: 'bg-cyan-500/20 border-cyan-300/75 shadow-[0_0_16px_rgba(56,189,248,0.42)]',
      iconColor: 'text-cyan-200 animate-bounce',
      numClass: 'text-xl sm:text-2xl font-black streak-num-tier-8',
      labelClass: 'text-cyan-100 streak-num-tier-8',
      hasSparkles: true,
    },
    // 9段階目 (17〜18連続): ソーラーフレア紅蓮黄金
    9: {
      badge:
        'bg-gradient-to-r from-rose-500/25 to-amber-500/25 border-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.5)]',
      iconColor: 'text-amber-200 animate-bounce',
      numClass: 'text-xl sm:text-2xl font-black streak-num-tier-9',
      labelClass: 'text-amber-100 streak-num-tier-9',
      hasSparkles: true,
    },
    // 10段階目 (19〜20+連続): 神話級レインボー・プリズムクラウン
    10: {
      badge:
        'bg-gradient-to-r from-amber-500/25 via-fuchsia-500/25 to-cyan-500/25 border-amber-200/90 shadow-[0_0_22px_rgba(244,114,182,0.58)]',
      iconColor: 'text-amber-200 animate-spin',
      numClass: 'text-2xl sm:text-[26px] font-black streak-num-tier-10',
      labelClass: 'text-white streak-num-tier-10',
      hasSparkles: true,
    },
  };

  const style = tierStyles[tier];

  return (
    <span
      className={`inline-flex items-baseline gap-1 px-2.5 py-0.5 rounded-xl border transition-all duration-300 ${style.badge}`}
      title={`連続正解 ${streak}問（ランク ${tier}/10）`}
    >
      <Flame className={`w-3.5 h-3.5 self-center shrink-0 ${style.iconColor}`} />

      {/* 数字を独立した大きなオブジェクトとして表示 + 正解更新時に弾むアニメーション */}
      <span
        key={streak}
        className={`animate-streak-pop leading-none tracking-tight tabular-nums px-0.5 ${style.numClass}`}
      >
        {streak}
      </span>

      <span className={`text-[11px] font-extrabold leading-none ${style.labelClass}`}>
        連続
      </span>

      {/* 6段階目（11連続〜）以上でキラキラ輝くスパークルエフェクト */}
      {style.hasSparkles && (
        <Sparkles className="w-3.5 h-3.5 self-center text-yellow-200 animate-sparkle-twinkle shrink-0" />
      )}
      {tier >= 8 && (
        <Sparkles className="w-3 h-3 self-center text-cyan-200 animate-sparkle-twinkle-delayed shrink-0" />
      )}
    </span>
  );
}

export default function QuizTrainingView({
  qaItems,
  termsById,
  readTermIds,
  masteredQaIds,
  reviewQaIds,
  qaAnswerViewCounts,
  currentPoints,
  initialMode = 'flashcard',
  advanceTrigger = 0,
  onRevealAnswer,
  onRecordResult,
  onJumpToTermInDB,
  onNavigate,
}: QuizTrainingViewProps) {
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unmastered');
  const [shuffleMode, setShuffleMode] = useState<ShuffleMode>('sequential');
  const [shuffleAnimKey, setShuffleAnimKey] = useState<number>(0);

  // Video-game style Pause / Menu overlay & Result Screen Modal
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [pendingDestination, setPendingDestination] = useState<'home' | 'city' | 'db' | null>(null);

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

  // Session counters & session earned points
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [sessionTotal, setSessionTotal] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [sessionEarned, setSessionEarned] = useState<CityPoints>({
    population: 0,
    culture: 0,
    tech: 0,
  });
  const [lastReward, setLastReward] = useState<CityPoints | null>(null);

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

  // Rebuild deck when filter settings or shuffle mode change
  const rebuildDeck = useCallback(() => {
    const activeChapterHint = deck[currentIndex]?.chapter;

    const matchesStatus = (item: QAItem) => {
      if (statusFilter === 'unmastered' && masteredQaIds.has(item.id)) return false;
      if (statusFilter === 'review' && !reviewQaIds.has(item.id)) return false;
      if (statusFilter === 'mastered' && !masteredQaIds.has(item.id)) return false;
      return true;
    };

    let nextDeck: QAItem[] = [];

    if (shuffleMode === 'all') {
      // 全時代（全問）からのシャッフル: 章フィルターに関わらず全時代からシャッフル出題
      nextDeck = shuffleArray(qaItems.filter(matchesStatus));
    } else if (shuffleMode === 'chapter') {
      // 章単位でのシャッフル: 各章の中で問題をシャッフル（現在表示中の章を先頭に配置）
      const filtered = qaItems.filter((item) => {
        if (selectedChapter !== 'ALL' && item.chapter !== selectedChapter) return false;
        if (selectedSection !== 'ALL' && item.section !== selectedSection) return false;
        return matchesStatus(item);
      });

      if (selectedChapter !== 'ALL') {
        nextDeck = shuffleArray(filtered);
      } else {
        const byChapter = new Map<string, QAItem[]>();
        for (const ch of chapters) {
          byChapter.set(ch, []);
        }
        for (const item of filtered) {
          const list = byChapter.get(item.chapter) || [];
          list.push(item);
          byChapter.set(item.chapter, list);
        }

        const startIdx = activeChapterHint ? Math.max(0, chapters.indexOf(activeChapterHint)) : 0;
        const orderedChapters = [
          ...chapters.slice(startIdx),
          ...chapters.slice(0, startIdx),
        ];

        for (const ch of orderedChapters) {
          const group = byChapter.get(ch);
          if (group && group.length > 0) {
            nextDeck.push(...shuffleArray(group));
          }
        }
      }
    } else {
      // 問題番号順（sequential）
      nextDeck = qaItems.filter((item) => {
        if (selectedChapter !== 'ALL' && item.chapter !== selectedChapter) return false;
        if (selectedSection !== 'ALL' && item.section !== selectedSection) return false;
        return matchesStatus(item);
      });
    }

    setDeck(nextDeck);
    setCurrentIndex(0);
    setIsRevealed(false);
    setSelectedChoice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qaItems, chapters, selectedChapter, selectedSection, statusFilter, shuffleMode, masteredQaIds, reviewQaIds]);

  // Trigger deck rebuild when filter controls or shuffleMode change
  useEffect(() => {
    rebuildDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, selectedSection, statusFilter, shuffleMode]);

  function cycleShuffleMode(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    triggerSavedHaptic();
    setShuffleAnimKey((prev) => prev + 1);
    setShuffleMode((prev) => {
      if (prev === 'sequential') return 'chapter';
      if (prev === 'chapter') return 'all';
      return 'sequential';
    });
  }

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

  function recordQuestionCompletion(item: QAItem, isBonus: boolean) {
    const reward = calculateQuestionReward(item, isBonus);
    setSessionTotal((prev) => prev + 1);
    if (isBonus) {
      setSessionCorrect((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
    setSessionEarned((prev) => ({
      population: prev.population + reward.population,
      culture: prev.culture + reward.culture,
      tech: prev.tech + reward.tech,
    }));
    setLastReward(reward);
    onRecordResult(item.id, isBonus, item.matched_term_id, reward);
  }

  function handleOpenResultScreen(dest: 'home' | 'city' | 'db' | null = null) {
    triggerSavedHaptic();
    setIsMenuOpen(false);
    setPendingDestination(dest);
    setIsResultModalOpen(true);
  }

  function handleFinishSessionAndNavigate(dest: 'home' | 'city' | 'db') {
    triggerSavedHaptic();
    setIsResultModalOpen(false);
    setIsMenuOpen(false);
    setSessionTotal(0);
    setSessionCorrect(0);
    setStreak(0);
    setSessionEarned({ population: 0, culture: 0, tech: 0 });
    setLastReward(null);
    onNavigate(dest);
  }

  // Advance to the next question when returning from World History DB via "問題に戻る"
  useEffect(() => {
    if (advanceTrigger > 0) {
      if (mode === 'flashcard' && currentItem) {
        recordQuestionCompletion(currentItem, false);
      }
      advanceToNextCard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceTrigger]);

  // Flashcard Tap on Revealed Card Body -> Same as "不正解・あいまい" & immediately go to next question
  function handleFlashcardKeepInRotation() {
    if (!currentItem) return;
    triggerSavedHaptic();
    recordQuestionCompletion(currentItem, false);
    advanceToNextCard();
  }

  // Flashcard Corner Button "もうこの問題を表示しない" -> Same as "正解できた！" & remove from active deck & go to next question
  function handleFlashcardHideForever(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentItem) return;
    triggerSavedHaptic();
    const targetId = currentItem.id;
    recordQuestionCompletion(currentItem, true);

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
    recordQuestionCompletion(currentItem, isCorrect);
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
          onRevealAnswer(currentItem.id);
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
              onRevealAnswer(currentItem.id);
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

              {/* Top Bar inside Card: Chapter + Star Rating + Answer View Count (when revealed) + Menu Button */}
              <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-800/90 pb-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold truncate max-w-[230px] sm:max-w-none">
                    {currentItem.chapter}
                  </span>
                  <span className="text-amber-300 text-xs font-bold tabular-nums">
                    ★{Math.min(5, Math.max(1, Math.round((currentItem.frequency || 3) / 2)))}
                  </span>
                  {isRevealed && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-extrabold tabular-nums">
                      答え閲覧 {qaAnswerViewCounts[currentItem.id] || 1}回目
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {/* Shuffle Button on Flashcard Question Page: cycles sequential -> chapter -> all */}
                  {!isRevealed && (
                    <button
                      type="button"
                      onClick={cycleShuffleMode}
                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        shuffleMode === 'sequential'
                          ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200'
                          : shuffleMode === 'chapter'
                          ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.28)]'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/60 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.32)]'
                      }`}
                      title={
                        shuffleMode === 'sequential'
                          ? '出題順：問題番号順（タップで「章単位シャッフル」へ）'
                          : shuffleMode === 'chapter'
                          ? '出題順：章単位でのシャッフル（タップで「全時代シャッフル」へ）'
                          : '出題順：全時代（全問）からのシャッフル（タップで「問題番号順」へ）'
                      }
                      aria-label={
                        shuffleMode === 'sequential'
                          ? '問題番号順'
                          : shuffleMode === 'chapter'
                          ? '章単位でのシャッフル'
                          : '全時代からのシャッフル'
                      }
                    >
                      <span
                        key={shuffleAnimKey}
                        className={shuffleAnimKey > 0 ? 'animate-shuffle-tap inline-flex' : 'inline-flex'}
                      >
                        <Shuffle className="w-4 h-4" />
                      </span>
                      {shuffleMode === 'chapter' && (
                        <span className="text-[11px] font-extrabold tracking-tight">章単位</span>
                      )}
                      {shuffleMode === 'all' && (
                        <span className="text-[11px] font-extrabold tracking-tight">全時代</span>
                      )}
                    </button>
                  )}

                  {/* Finish Session & View Result Button (shown once at least 1 question is answered) */}
                  {sessionTotal > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenResultScreen(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold transition cursor-pointer"
                      title="演習を終了して獲得ポイントのリザルトを見る"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>終了・結果</span>
                    </button>
                  )}

                  {/* Unobtrusive Video-Game Menu / Pause Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                    title="遠征メニュー"
                  >
                    <Menu className="w-4 h-4" />
                    <span className="hidden sm:inline">メニュー</span>
                  </button>
                </div>
              </div>

              {/* STATE 1: BEFORE TAP -> QUESTION VIEW */}
              {!isRevealed ? (
                <div className="relative z-10 py-6 sm:py-10 space-y-8">
                  <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed tracking-wide">
                    {currentItem.question}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                    {currentIndex > 0 ? (
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-medium transition"
                      >
                        ← 前の問題
                      </button>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] font-normal text-slate-500">
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
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                            正解（ANSWER）
                          </span>
                        </div>
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
                  <div className="bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span>
                          用語解説：{matchedTerm ? matchedTerm.term : currentItem.answer}
                        </span>
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

                  {/* Bottom Bar: Unobtrusive Tap Card Hint + Corner Button "もうこの問題を表示しない" */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-normal text-slate-500">
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
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 pb-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold truncate max-w-[230px] sm:max-w-none">
                {currentItem.chapter}
              </span>
              <span className="text-amber-300 text-xs font-bold tabular-nums">
                ★{Math.min(5, Math.max(1, Math.round((currentItem.frequency || 3) / 2)))}
              </span>
              {streak > 0 && renderStreakBadge(streak)}
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              {/* Shuffle Button for 4-Choice Quiz: cycles sequential -> chapter -> all */}
              <button
                type="button"
                onClick={cycleShuffleMode}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                  shuffleMode === 'sequential'
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200'
                    : shuffleMode === 'chapter'
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.28)]'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/60 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.32)]'
                }`}
                title={
                  shuffleMode === 'sequential'
                    ? '出題順：問題番号順（タップで「章単位シャッフル」へ）'
                    : shuffleMode === 'chapter'
                    ? '出題順：章単位でのシャッフル（タップで「全時代シャッフル」へ）'
                    : '出題順：全時代（全問）からのシャッフル（タップで「問題番号順」へ）'
                }
                aria-label={
                  shuffleMode === 'sequential'
                    ? '問題番号順'
                    : shuffleMode === 'chapter'
                    ? '章単位でのシャッフル'
                    : '全時代からのシャッフル'
                }
              >
                <span
                  key={`4choice-${shuffleAnimKey}`}
                  className={shuffleAnimKey > 0 ? 'animate-shuffle-tap inline-flex' : 'inline-flex'}
                >
                  <Shuffle className="w-4 h-4" />
                </span>
                {shuffleMode === 'chapter' && (
                  <span className="text-[11px] font-extrabold tracking-tight">章単位</span>
                )}
                {shuffleMode === 'all' && (
                  <span className="text-[11px] font-extrabold tracking-tight">全時代</span>
                )}
              </button>

              {sessionTotal > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenResultScreen(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold transition cursor-pointer"
                  title="演習を終了して獲得ポイントのリザルトを見る"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>終了・結果</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">メニュー</span>
              </button>
            </div>
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
                <div className="flex flex-col gap-1">
                  {selectedChoice === currentItem.answer ? (
                    <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      正解！（人口+{lastReward?.population || 25} / 文化+{lastReward?.culture || 20} / 技術+{lastReward?.tech || 20}）
                    </span>
                  ) : (
                    <span className="text-rose-400 font-extrabold text-sm flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      不正解… 正解は「{currentItem.answer}」（学習Pt: 人口+{lastReward?.population || 10} / 文化+{lastReward?.culture || 8} / 技術+{lastReward?.tech || 8}）
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
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>用語解説：{matchedTerm.term}</span>
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

            {/* Session Earned Points Mini Summary */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">今回の遠征で獲得中（{sessionTotal}問演習）</span>
                {sessionTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenResultScreen(null)}
                    className="text-emerald-400 hover:text-emerald-300 font-extrabold underline cursor-pointer"
                  >
                    リザルト画面を開く →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900 rounded-lg p-2 border border-cyan-500/20">
                  <div className="text-[10px] text-slate-400">人口</div>
                  <div className="font-black text-cyan-300 tabular-nums">+{sessionEarned.population}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-amber-500/20">
                  <div className="text-[10px] text-slate-400">文化</div>
                  <div className="font-black text-amber-300 tabular-nums">+{sessionEarned.culture}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-purple-500/20">
                  <div className="text-[10px] text-slate-400">技術</div>
                  <div className="font-black text-purple-300 tabular-nums">+{sessionEarned.tech}</div>
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
                  onClick={cycleShuffleMode}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    shuffleMode === 'sequential'
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      : shuffleMode === 'chapter'
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                      : 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>
                    {shuffleMode === 'sequential'
                      ? '問題番号順'
                      : shuffleMode === 'chapter'
                      ? '章単位シャッフル'
                      : '全時代シャッフル'}
                  </span>
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

            {/* Game Menu Actions (Resume / Result / Navigate) */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>遠征を再開する</span>
              </button>

              {sessionTotal > 0 && (
                <button
                  onClick={() => handleOpenResultScreen('city')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  <span>遠征を終了して獲得ポイント結果を見る</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (sessionTotal > 0) {
                      handleOpenResultScreen('db');
                    } else {
                      onNavigate('db');
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>世界史DBへ</span>
                </button>

                <button
                  onClick={() => {
                    if (sessionTotal > 0) {
                      handleOpenResultScreen('city');
                    } else {
                      onNavigate('city');
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>マイ育成都市へ</span>
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
                onClick={() => {
                  if (sessionTotal > 0) {
                    handleOpenResultScreen('home');
                  } else {
                    onNavigate('home');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>トップメニューに戻る</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPEDITION RESULT SCREEN MODAL (今回獲得したポイント小計 & 累積所持ポイント) */}
      {isResultModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold tracking-widest uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>EXPEDITION RESULT</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                遠征リザルト（獲得ポイント集計）
              </h2>
              <p className="text-xs text-slate-400">
                今回の演習問題数: <span className="text-white font-extrabold">{sessionTotal}問</span>
              </p>
            </div>

            {/* 3 Points Breakdown: Subtotal Earned & Cumulative Wallet Total */}
            <div className="space-y-2.5">
              {/* 1. 人口ポイント */}
              <div className="bg-slate-950/90 border border-cyan-500/35 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-300">人口ポイント</div>
                    <div className="text-[11px] text-slate-400">
                      累積所持: <span className="text-white font-black tabular-nums">{currentPoints.population.toLocaleString()} pt</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-cyan-400">今回の獲得小計</div>
                  <div className="text-xl font-black text-cyan-300 tabular-nums">
                    +{sessionEarned.population.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 2. 文化ポイント */}
              <div className="bg-slate-950/90 border border-amber-500/35 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-300">文化ポイント</div>
                    <div className="text-[11px] text-slate-400">
                      累積所持: <span className="text-white font-black tabular-nums">{currentPoints.culture.toLocaleString()} pt</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-amber-400">今回の獲得小計</div>
                  <div className="text-xl font-black text-amber-300 tabular-nums">
                    +{sessionEarned.culture.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 3. 技術ポイント */}
              <div className="bg-slate-950/90 border border-purple-500/35 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center text-purple-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-300">技術ポイント</div>
                    <div className="text-[11px] text-slate-400">
                      累積所持: <span className="text-white font-black tabular-nums">{currentPoints.tech.toLocaleString()} pt</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-purple-400">今回の獲得小計</div>
                  <div className="text-xl font-black text-purple-300 tabular-nums">
                    +{sessionEarned.tech.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleFinishSessionAndNavigate('city')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>マイ育成都市で遺跡を修復する →</span>
              </button>

              {pendingDestination === 'db' && (
                <button
                  type="button"
                  onClick={() => handleFinishSessionAndNavigate('db')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>世界史DBへ移動する</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>演習を続ける</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishSessionAndNavigate('home')}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>トップメニューへ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
