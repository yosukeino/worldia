'use client';

import React from 'react';
import { CityPoints } from '@/types/history';
import { RESTORATION_STAGES } from '@/config/restoration-stages';
import {
  Compass,
  BookOpen,
  Users,
  Sparkles,
  Wrench,
  Trophy,
  ChevronRight,
  Layers,
  ListChecks,
  Flame,
  Vibrate,
  Hammer,
} from 'lucide-react';

interface TopMenuViewProps {
  cityName: string;
  readTermIds: Set<number>;
  masteredQaCount: number;
  reviewQaCount: number;
  totalQaCount: number;
  points: CityPoints;
  currentStageId: number;
  completedTaskIds: string[];
  onSelectView: (
    view: 'db' | 'quiz' | 'city' | 'haptics',
    initialQuizMode?: 'flashcard' | 'multiple_choice'
  ) => void;
}

export default function TopMenuView({
  readTermIds,
  masteredQaCount,
  reviewQaCount,
  totalQaCount,
  points,
  currentStageId,
  completedTaskIds,
  onSelectView,
}: TopMenuViewProps) {
  const readCount = readTermIds.size;
  const completedSet = new Set(completedTaskIds);
  const activeStage =
    RESTORATION_STAGES.find((s) => s.id === currentStageId) || RESTORATION_STAGES[0];
  const stageTasks = activeStage.phases.flatMap((p) => p.tasks);
  const stageDoneCount = stageTasks.filter((t) => completedSet.has(t.id)).length;
  const stageProgressPercent =
    stageTasks.length > 0 ? Math.round((stageDoneCount / stageTasks.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-3xl w-full mx-auto px-4 py-6 sm:py-12 flex-1 flex flex-col justify-center space-y-6">
        {/* Game Title & City Status Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-extrabold tracking-widest uppercase">
            <span>WORLD HISTORY ARCHIVE & MONUMENT REBUILDER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            WORLDIA <span className="text-cyan-400 font-extrabold text-xl sm:text-3xl">/ クロノポリス</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            歴史を学び、獲得した「人口・文化・技術」で荒廃した歴史遺産を当時の姿へ復興しよう
          </p>
        </div>

        {/* Compact Held Points & Stage Restoration Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xs">
                STAGE {activeStage.id}
              </span>
              <div>
                <div className="text-sm font-extrabold text-white leading-tight">
                  {activeStage.name}
                </div>
                <div className="text-[11px] text-amber-300/90 font-medium">
                  {activeStage.era}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              現在の遺跡修復率{' '}
              <span className="text-emerald-400 font-black">{stageProgressPercent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/80 rounded-xl p-2 border border-cyan-500/25">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>人口</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-cyan-300 tabular-nums mt-0.5">
                {points.population.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500">pt</span>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-amber-500/25">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>文化</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-300 tabular-nums mt-0.5">
                {points.culture.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500">pt</span>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-purple-500/25">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Wrench className="w-3.5 h-3.5 text-purple-400" />
                <span>技術</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-purple-300 tabular-nums mt-0.5">
                {points.tech.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500">pt</span>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-emerald-500/25">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>修復工程</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-300 tabular-nums mt-0.5">
                {stageDoneCount}/{stageTasks.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Menu Mode Cards */}
        <div className="space-y-3">
          {/* 1. EXPEDITION (歴史遠征) */}
          <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900/95 to-slate-900/95 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition hover:border-emerald-400/70">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      エクスペディション
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                      歴史遠征・ポイント獲得
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    全 {totalQaCount.toLocaleString()} 問の歴史試練に挑み、遺跡修復に必要な「人口・文化・技術」ポイントを獲得します。
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>
                      開拓済: <strong className="text-emerald-300">{masteredQaCount.toLocaleString()}</strong> / {totalQaCount.toLocaleString()}
                    </span>
                    {reviewQaCount > 0 && (
                      <span className="text-rose-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        要復習: <strong>{reviewQaCount}</strong>問
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => onSelectView('quiz', 'flashcard')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>カード遠征（一問一答）</span>
              </button>

              <button
                onClick={() => onSelectView('quiz', 'multiple_choice')}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-200 font-extrabold text-xs sm:text-sm transition cursor-pointer"
              >
                <ListChecks className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>4択遠征（クイズ）</span>
              </button>
            </div>
          </div>

          {/* 2. MY RESTORATION CITY (マイ育成都市) */}
          <button
            onClick={() => onSelectView('city')}
            className="w-full text-left bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-4 sm:p-5 shadow-lg transition flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Hammer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition">
                    マイ育成都市
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    STAGE {activeStage.id}: {activeStage.name}（修復率 {stageProgressPercent}%）
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  問題演習で貯めた「人口・文化・技術」ポイントを手動で消費し、荒廃した歴史的建造物の瓦礫を撤去して当時の輝く姿へと少しずつ修復していきます。
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* 3. WORLD HISTORY DB (世界史DB) */}
          <button
            onClick={() => onSelectView('db')}
            className="w-full text-left bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-4 sm:p-5 shadow-lg transition flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition">
                    世界史DB
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                    大図書館アーカイブ（既読 {readCount.toLocaleString()} 語）
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  5,577語の歴史用語・人物・事件がリンクで繋がる歴史事典。気になった用語を深掘りして知識のネットワークを広げましょう。
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* 4. HAPTICS LAB (スマホ振動実験ラボ) */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => onSelectView('haptics')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-purple-300 text-xs font-bold transition cursor-pointer"
            >
              <Vibrate className="w-3.5 h-3.5 text-purple-400" />
              <span>スマホ振動（ハプティクス）実験ラボを開く</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
