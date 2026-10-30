'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EnrichedTerm } from '@/types/history';
import {
  HISTORICAL_BUILDINGS,
  calculateCityLevel,
  isBuildingUnlocked,
} from '@/config/city-elements';
import {
  BookOpen,
  Building2,
  Swords,
  Users,
  Sparkles,
  FlaskConical,
  Trophy,
} from 'lucide-react';

interface CityStatusHeaderProps {
  cityName: string;
  activeTab: 'db' | 'quiz' | 'city';
  onChangeTab: (tab: 'db' | 'quiz' | 'city') => void;
  readTermIds: Set<number>;
  masteredQaCount: number;
  termsById: Map<number, EnrichedTerm>;
}

interface AnimatedStatProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  valueClassName: string;
  badgeColorClass: string;
}

function AnimatedStatCounter({
  icon,
  value,
  suffix = '',
  valueClassName,
  badgeColorClass,
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [delta, setDelta] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef<number>(value);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const prev = prevValueRef.current;
    if (value === prev) return;

    const diff = value - prev;
    prevValueRef.current = value;

    if (diff > 0) {
      setDelta(diff);
      setIsPulsing(true);

      const startTime = performance.now();
      const duration = 550;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(prev + diff * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);

      const timer = setTimeout(() => {
        setDelta(null);
        setIsPulsing(false);
      }, 1100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <div
      className={`relative flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-all duration-300 ${
        isPulsing ? 'bg-cyan-500/20 scale-105' : ''
      }`}
    >
      {icon}
      <span className={`font-bold tabular-nums ${valueClassName}`}>
        {displayValue.toLocaleString()}
        {suffix}
      </span>

      {delta !== null && (
        <span
          className={`pointer-events-none select-none absolute -top-3.5 right-0 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shadow-sm animate-bounce ${badgeColorClass}`}
        >
          +{delta.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function CityStatusHeader({
  cityName,
  activeTab,
  onChangeTab,
  readTermIds,
  masteredQaCount,
  termsById,
}: CityStatusHeaderProps) {
  const readCount = readTermIds.size;
  const levelInfo = calculateCityLevel(readCount + Math.floor(masteredQaCount / 2));

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
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/25 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Compact City Level + Live Counters */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-2 py-1 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-xs shrink-0">
            Lv.{levelInfo.level}
          </div>
          <span className="hidden md:inline text-sm font-extrabold text-white truncate">
            {cityName}
          </span>

          <div className="flex items-center gap-0.5 sm:gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
            <AnimatedStatCounter
              icon={<Users className="w-3.5 h-3.5 text-cyan-400" />}
              value={totalPop}
              suffix="人"
              valueClassName="text-white"
              badgeColorClass="bg-cyan-400 text-slate-950"
            />
            <div className="h-3 w-px bg-slate-800" />
            <AnimatedStatCounter
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              value={totalCulture}
              valueClassName="text-amber-300"
              badgeColorClass="bg-amber-400 text-slate-950"
            />
            <div className="h-3 w-px bg-slate-800" />
            <AnimatedStatCounter
              icon={<FlaskConical className="w-3.5 h-3.5 text-purple-400" />}
              value={totalScience}
              valueClassName="text-purple-300"
              badgeColorClass="bg-purple-400 text-slate-950"
            />
            <div className="h-3 w-px bg-slate-800" />
            <AnimatedStatCounter
              icon={<Trophy className="w-3.5 h-3.5 text-emerald-400" />}
              value={unlockedBuildingsCount}
              suffix={`/${HISTORICAL_BUILDINGS.length}`}
              valueClassName="text-emerald-300"
              badgeColorClass="bg-emerald-400 text-slate-950"
            />
          </div>
        </div>

        {/* Compact Switcher Tabs */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-cyan-500/30 ml-auto">
          <button
            onClick={() => onChangeTab('db')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'db'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>世界史DB</span>
          </button>

          <button
            onClick={() => onChangeTab('quiz')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>一問一答・4択</span>
          </button>

          <button
            onClick={() => onChangeTab('city')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'city'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>マイ歴史都市</span>
          </button>
        </div>
      </div>
    </header>
  );
}
