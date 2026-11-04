'use client';

import React from 'react';
import { EnrichedTerm } from '@/types/history';
import {
  HISTORICAL_BUILDINGS,
  calculateCityLevel,
  isBuildingUnlocked,
} from '@/config/city-elements';
import {
  Compass,
  BookOpen,
  Building2,
  Users,
  Sparkles,
  FlaskConical,
  Trophy,
  ChevronRight,
  Layers,
  ListChecks,
  Flame,
} from 'lucide-react';

interface TopMenuViewProps {
  cityName: string;
  readTermIds: Set<number>;
  masteredQaCount: number;
  reviewQaCount: number;
  totalQaCount: number;
  termsById: Map<number, EnrichedTerm>;
  onSelectView: (view: 'db' | 'quiz' | 'city', initialQuizMode?: 'flashcard' | 'multiple_choice') => void;
}

export default function TopMenuView({
  cityName,
  readTermIds,
  masteredQaCount,
  reviewQaCount,
  totalQaCount,
  termsById,
  onSelectView,
}: TopMenuViewProps) {
  const readCount = readTermIds.size;
  const progressPoints = readCount + Math.floor(masteredQaCount / 2);
  const levelInfo = calculateCityLevel(progressPoints);
  const remainingToNext = Math.max(0, levelInfo.nextThreshold - progressPoints);

  let totalPop = readCount * 350 + masteredQaCount * 200;
  let totalCulture = readCount * 12 + masteredQaCount * 8;
  let totalScience = readCount * 10 + masteredQaCount * 6;
  let unlockedBuildingsCount = 0;

  for (const b of HISTORICAL_BUILDINGS) {
    const st = isBuildingUnlocked(b, readTermIds, termsById);
    if (st.unlocked) {
      unlockedBuildingsCount++;
      totalPop += b.populationBonus;
      totalCulture += b.cultureBonus;
      totalScience += b.scienceBonus;
    }
  }

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
            <span>WORLD HISTORY ARCHIVE & CITY BUILDER</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            WORLDIA <span className="text-cyan-400 font-extrabold text-xl sm:text-3xl">/ クロノポリス</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            歴史を学び、知識の遠征で時代を開拓して文明都市を育てよう
          </p>
        </div>

        {/* Compact City Status Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-xs">
                Lv.{levelInfo.level}
              </span>
              <div>
                <div className="text-sm font-extrabold text-white leading-tight">
                  {cityName}
                </div>
                <div className="text-[11px] text-cyan-300/90 font-medium">
                  {levelInfo.title}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              次の時代発展まであと <span className="text-cyan-300 font-bold">{remainingToNext}</span> ポイント
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>人口</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white tabular-nums mt-0.5">
                {totalPop.toLocaleString()}人
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>文化</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-300 tabular-nums mt-0.5">
                {totalCulture.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>科学</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-purple-300 tabular-nums mt-0.5">
                {totalScience.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>建造物</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-300 tabular-nums mt-0.5">
                {unlockedBuildingsCount}/{HISTORICAL_BUILDINGS.length}
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
                      歴史遠征・知識試練
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    全 {totalQaCount.toLocaleString()} 問の歴史試練に挑み、未知の時代を開拓します。正解するたびに都市の人口と文化が成長します。
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

          {/* 2. WORLD HISTORY DB (世界史DB) */}
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
                  5,577語の歴史用語・人物・事件がリンクで繋がる歴史事典。項目を読み進めることで新たな歴史建造物が解放されます。
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          {/* 3. MY HISTORICAL CITY (マイ歴史都市) */}
          <button
            onClick={() => onSelectView('city')}
            className="w-full text-left bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-lg transition flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition">
                    マイ歴史都市
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    2.5D 箱庭ジオラマ（建造物 {unlockedBuildingsCount}/{HISTORICAL_BUILDINGS.length}）
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  学習によって発展したあなたの歴史都市を眺めたり、ピラミッドやパルテノン神殿などのランドマークを自由配置できます。
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </main>
    </div>
  );
}
