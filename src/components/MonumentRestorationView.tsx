'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CityPoints } from '@/types/history';
import {
  RESTORATION_STAGES,
  RestorationStage,
  RestorationTask,
} from '@/config/restoration-stages';
import { triggerSavedHaptic } from '@/lib/haptics';
import {
  Users,
  Sparkles,
  Wrench,
  CheckCircle2,
  Lock,
  Hammer,
  Compass,
  BookOpen,
  ArrowRight,
  Trophy,
  Eye,
  Menu,
  X,
  Home,
} from 'lucide-react';

interface MonumentRestorationViewProps {
  points: CityPoints;
  totalEarnedPoints: CityPoints;
  currentStageId: number;
  completedTaskIds: string[];
  onCompleteTask: (task: RestorationTask) => void;
  onSelectStage: (stageId: number) => void;
  onNavigate: (view: 'home' | 'db' | 'quiz') => void;
  onJumpToTermInDB: (termId: number) => void;
}

export default function MonumentRestorationView({
  points,
  totalEarnedPoints,
  currentStageId,
  completedTaskIds,
  onCompleteTask,
  onSelectStage,
  onNavigate,
  onJumpToTermInDB,
}: MonumentRestorationViewProps) {
  const completedSet = useMemo(() => new Set(completedTaskIds), [completedTaskIds]);

  const activeStage: RestorationStage = useMemo(() => {
    return (
      RESTORATION_STAGES.find((s) => s.id === currentStageId) ||
      RESTORATION_STAGES[0]
    );
  }, [currentStageId]);

  // Determine the current active phase index based on completed tasks
  const activePhaseIndex = useMemo(() => {
    for (let i = 0; i < activeStage.phases.length; i++) {
      const phase = activeStage.phases[i];
      if (phase.tasks.length === 0) {
        return i;
      }
      const allDone = phase.tasks.every((t) => completedSet.has(t.id));
      if (!allDone) {
        return i;
      }
    }
    return activeStage.phases.length - 1;
  }, [activeStage, completedSet]);

  // Allow user to preview earlier unlocked phases (Before / After comparison)
  const [previewPhaseIdx, setPreviewPhaseIdx] = useState<number | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Reset preview index whenever activePhaseIndex advances
  useEffect(() => {
    setPreviewPhaseIdx(null);
    setIsPhaseTransitioning(true);
    const t = setTimeout(() => setIsPhaseTransitioning(false), 650);
    return () => clearTimeout(t);
  }, [activePhaseIndex, currentStageId]);

  const displayedPhaseIndex =
    previewPhaseIdx !== null && previewPhaseIdx <= activePhaseIndex
      ? previewPhaseIdx
      : activePhaseIndex;

  const displayedPhase = activeStage.phases[displayedPhaseIndex] || activeStage.phases[0];
  const currentWorkPhase = activeStage.phases[activePhaseIndex] || activeStage.phases[0];

  // Overall stage completion stats
  const allStageTasks = useMemo(
    () => activeStage.phases.flatMap((p) => p.tasks),
    [activeStage]
  );
  const completedStageTasksCount = useMemo(
    () => allStageTasks.filter((t) => completedSet.has(t.id)).length,
    [allStageTasks, completedSet]
  );
  const stageProgressPercent =
    allStageTasks.length > 0
      ? Math.round((completedStageTasksCount / allStageTasks.length) * 100)
      : 100;

  const isStageFullyRestored =
    allStageTasks.length > 0 && completedStageTasksCount === allStageTasks.length;

  function canAfford(cost: CityPoints): boolean {
    return (
      points.population >= cost.population &&
      points.culture >= cost.culture &&
      points.tech >= cost.tech
    );
  }

  function handleExecuteTask(task: RestorationTask) {
    if (completedSet.has(task.id) || !canAfford(task.cost)) return;
    triggerSavedHaptic();
    onCompleteTask(task);
    setFeedbackBanner(task.completeMessage);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      {/* Top Bar: Stage Title + Spendable Points Wallet + Menu Button */}
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shrink-0">
              STAGE {activeStage.id}
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-white truncate">
                {activeStage.name}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                {activeStage.era} ・ {activeStage.region}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>問題でポイントを稼ぐ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">メニュー</span>
            </button>
          </div>
        </div>

        {/* Spendable Points Wallet (人口 / 文化 / 技術) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400">
                  所持 人口
                </div>
                <div className="text-sm sm:text-lg font-black text-cyan-300 tabular-nums">
                  {points.population.toLocaleString()}{' '}
                  <span className="text-[10px] font-bold text-slate-500">pt</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400">
                  所持 文化
                </div>
                <div className="text-sm sm:text-lg font-black text-amber-300 tabular-nums">
                  {points.culture.toLocaleString()}{' '}
                  <span className="text-[10px] font-bold text-slate-500">pt</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-purple-500/30 rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400">
                  所持 技術
                </div>
                <div className="text-sm sm:text-lg font-black text-purple-300 tabular-nums">
                  {points.tech.toLocaleString()}{' '}
                  <span className="text-[10px] font-bold text-slate-500">pt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single-Picture Monument Restoration Showcase */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress Header inside Image Card */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-extrabold text-white">
              {displayedPhase.title}
            </span>
            {previewPhaseIdx !== null && previewPhaseIdx !== activePhaseIndex && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                過去段階プレビュー中
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-slate-300 tabular-nums">
              修復進行度: <span className="text-emerald-400 font-black">{stageProgressPercent}%</span>
              <span className="text-slate-500 ml-1">
                ({completedStageTasksCount}/{allStageTasks.length} 工程)
              </span>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full h-2 bg-slate-950 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-500"
            style={{ width: `${stageProgressPercent}%` }}
          />
        </div>

        {/* 16:9 Monument Illustration */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={displayedPhase.imageUrl}
            src={displayedPhase.imageUrl}
            alt={displayedPhase.title}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isPhaseTransitioning ? 'scale-[1.02] brightness-110' : 'scale-100 brightness-100'
            }`}
          />

          {/* Subtle Gradient Overlay at Bottom of Image */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />

          {/* Phase Badge Overlay on Image Bottom-Left */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-0.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-cyan-500/40 text-cyan-300 text-[11px] font-extrabold">
                <span>
                  PHASE {displayedPhase.phaseNumber} / {activeStage.phases.length}
                </span>
                <span>・</span>
                <span>{displayedPhase.subtitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium drop-shadow">
                {displayedPhase.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onJumpToTermInDB(activeStage.relatedTermId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer backdrop-blur-md"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>世界史DBで解説を読む</span>
            </button>
          </div>
        </div>

        {/* Phase History / Before-After Switcher Bar */}
        <div className="px-4 py-2.5 bg-slate-950/95 border-t border-slate-800/90 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>修復過程を見比べる:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {activeStage.phases.map((phase, idx) => {
              const isUnlocked = idx <= activePhaseIndex;
              const isSelected = idx === displayedPhaseIndex;
              return (
                <button
                  key={phase.phaseNumber}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => setPreviewPhaseIdx(idx === activePhaseIndex ? null : idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow'
                      : isUnlocked
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer'
                      : 'bg-slate-900/60 text-slate-600 border border-slate-800/60 cursor-not-allowed'
                  }`}
                >
                  {!isUnlocked && <Lock className="w-3 h-3" />}
                  <span>
                    {idx === activeStage.phases.length - 1 && activeStage.phases.length > 1
                      ? '完全復興'
                      : `段階${phase.phaseNumber}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback Banner when a Task is Completed */}
      {feedbackBanner && (
        <div className="bg-emerald-950/60 border border-emerald-400/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-emerald-200 text-xs sm:text-sm font-bold shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            閉じる
          </button>
        </div>
      )}

      {/* WW2 Rebuilder-style Restoration Tasks List OR Stage Completion Card */}
      {isStageFullyRestored ? (
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-emerald-950/50 border-2 border-amber-400/60 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              STAGE {activeStage.id} COMPLETE!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {activeStage.name} 完全復興！
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              すべての瓦礫が撤去され、当時の鮮やかな色彩と市民の賑わいが完全に蘇りました。上の「修復過程を見比べる」ボタンから、荒廃していた初期状態とのビフォーアフターをいつでも振り返ることができます。
            </p>
          </div>

          {activeStage.id < RESTORATION_STAGES.length && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerSavedHaptic();
                  onSelectStage(activeStage.id + 1);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl transition cursor-pointer"
              >
                <span>
                  次のステージ（STAGE {activeStage.id + 1}：
                  {RESTORATION_STAGES[activeStage.id].name}）へ進む
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Hammer className="w-4 h-4 text-cyan-400" />
                <span>
                  現在の修復作業（{currentWorkPhase.title}）
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                下記の修復作業をすべて完了すると、遺跡の姿が次の段階へと変化します！
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentWorkPhase.tasks.map((task) => {
              const isDone = completedSet.has(task.id);
              const affordable = canAfford(task.cost);

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-950/25 border-emerald-500/40 opacity-80'
                      : affordable
                      ? 'bg-slate-950/90 border-cyan-500/40 hover:border-cyan-400'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          修復完了
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[11px] font-bold">
                          未着手
                        </span>
                      )}
                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        {task.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Cost Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500 font-bold">
                        必要ポイント:
                      </span>
                      {task.cost.population > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold border ${
                            isDone || points.population >= task.cost.population
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <Users className="w-3 h-3" />
                          <span>人口 {task.cost.population}</span>
                        </span>
                      )}
                      {task.cost.culture > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold border ${
                            isDone || points.culture >= task.cost.culture
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>文化 {task.cost.culture}</span>
                        </span>
                      )}
                      {task.cost.tech > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold border ${
                            isDone || points.tech >= task.cost.tech
                              ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <Wrench className="w-3 h-3" />
                          <span>技術 {task.cost.tech}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>完了済</span>
                      </div>
                    ) : affordable ? (
                      <button
                        type="button"
                        onClick={() => handleExecuteTask(task)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Hammer className="w-4 h-4" />
                        <span>ポイントを消費して修復する</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate('quiz')}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ポイント不足（遠征で稼ぐ）</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage Selector Footer Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
          <span>ステージ選択（歴史遺跡リスト）</span>
          <span className="text-[11px] text-slate-500">
            累計獲得：人口 {totalEarnedPoints.population} / 文化 {totalEarnedPoints.culture} / 技術 {totalEarnedPoints.tech}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {RESTORATION_STAGES.map((stage) => {
            const isCurrent = stage.id === activeStage.id;
            const stageTasks = stage.phases.flatMap((p) => p.tasks);
            const doneCount = stageTasks.filter((t) => completedSet.has(t.id)).length;
            const pct =
              stageTasks.length > 0
                ? Math.round((doneCount / stageTasks.length) * 100)
                : 0;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelectStage(stage.id)}
                className={`text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-white'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-cyan-400">
                    STAGE {stage.id} ・ {stage.region}
                  </div>
                  <div className="text-xs sm:text-sm font-black truncate">
                    {stage.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-emerald-400 tabular-nums">
                    {pct}%
                  </div>
                  <div className="text-[10px] text-slate-500">修復率</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  マイ育成都市メニュー
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('quiz');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>エクスペディション（問題演習）へ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('db');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>世界史DBへ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('home');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
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
