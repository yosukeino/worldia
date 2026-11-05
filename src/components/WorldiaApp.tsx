'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chapter,
  EnrichedTerm,
  QAItem,
  CitySaveState,
  CityPoints,
} from '@/types/history';
import {
  DEFAULT_SAVE_STATE,
  loadCityState,
  saveCityState,
} from '@/lib/storage';
import { RestorationTask } from '@/config/restoration-stages';
import TopMenuView from './TopMenuView';
import WorldHistoryDBView from './WorldHistoryDBView';
import QuizTrainingView, { QuizMode } from './QuizTrainingView';
import MonumentRestorationView from './MonumentRestorationView';
import HapticsLabView from './HapticsLabView';

interface WorldiaAppProps {
  chapters: Chapter[];
  terms: EnrichedTerm[];
  qaItems: QAItem[];
}

export default function WorldiaApp({
  chapters,
  terms,
  qaItems,
}: WorldiaAppProps) {
  const [activeTab, setActiveTab] = useState<
    'home' | 'db' | 'quiz' | 'city' | 'haptics'
  >('home');
  const [initialQuizMode, setInitialQuizMode] = useState<QuizMode>('flashcard');
  const [selectedTermId, setSelectedTermId] = useState<number>(12);
  const [cameFromQuiz, setCameFromQuiz] = useState<boolean>(false);
  const [advanceQuizTrigger, setAdvanceQuizTrigger] = useState<number>(0);
  const [saveState, setSaveState] = useState<CitySaveState>(DEFAULT_SAVE_STATE);
  const [hydrated, setHydrated] = useState(false);

  const termsById = useMemo(() => {
    const map = new Map<number, EnrichedTerm>();
    for (const t of terms) {
      map.set(t.id, t);
    }
    return map;
  }, [terms]);

  useEffect(() => {
    const loaded = loadCityState();
    setSaveState(loaded);
    if (
      loaded.recentTermIds.length > 0 &&
      termsById.has(loaded.recentTermIds[0])
    ) {
      setSelectedTermId(loaded.recentTermIds[0]);
    }
    setHydrated(true);
  }, [termsById]);

  useEffect(() => {
    if (!hydrated) return;
    saveCityState(saveState);
  }, [saveState, hydrated]);

  const readTermIdsSet = useMemo(
    () => new Set(saveState.readTermIds),
    [saveState.readTermIds]
  );

  const bookmarkedIdsSet = useMemo(
    () => new Set(saveState.bookmarkedTermIds),
    [saveState.bookmarkedTermIds]
  );

  const masteredQaIdsSet = useMemo(
    () => new Set(saveState.masteredQaIds || []),
    [saveState.masteredQaIds]
  );

  const reviewQaIdsSet = useMemo(
    () => new Set(saveState.reviewQaIds || []),
    [saveState.reviewQaIds]
  );

  const currentPoints: CityPoints = saveState.points || {
    population: 40,
    culture: 25,
    tech: 25,
  };

  const totalEarnedPoints: CityPoints = saveState.totalEarnedPoints || currentPoints;

  function handleRevealAnswer(qaId: number) {
    setSaveState((prev) => {
      const prevCounts = prev.qaAnswerViewCounts || {};
      const nextCount = (prevCounts[qaId] || 0) + 1;
      return {
        ...prev,
        qaAnswerViewCounts: {
          ...prevCounts,
          [qaId]: nextCount,
        },
      };
    });
  }

  function handleRecordQuizResult(
    qaId: number,
    isCorrect: boolean,
    matchedTermId: number | null,
    earnedPoints: CityPoints
  ) {
    setSaveState((prev) => {
      const prevMastered = prev.masteredQaIds || [];
      const prevReview = prev.reviewQaIds || [];

      const nextMastered = isCorrect
        ? prevMastered.includes(qaId)
          ? prevMastered
          : [...prevMastered, qaId]
        : prevMastered;

      const nextReview = isCorrect
        ? prevReview.filter((id) => id !== qaId)
        : prevReview.includes(qaId)
        ? prevReview
        : [...prevReview, qaId];

      const nextRead =
        isCorrect &&
        matchedTermId !== null &&
        !prev.readTermIds.includes(matchedTermId)
          ? [...prev.readTermIds, matchedTermId]
          : prev.readTermIds;

      const prevPoints = prev.points || { population: 40, culture: 25, tech: 25 };
      const prevTotal = prev.totalEarnedPoints || prevPoints;

      const nextPoints: CityPoints = {
        population: prevPoints.population + earnedPoints.population,
        culture: prevPoints.culture + earnedPoints.culture,
        tech: prevPoints.tech + earnedPoints.tech,
      };

      const nextTotal: CityPoints = {
        population: prevTotal.population + earnedPoints.population,
        culture: prevTotal.culture + earnedPoints.culture,
        tech: prevTotal.tech + earnedPoints.tech,
      };

      return {
        ...prev,
        masteredQaIds: nextMastered,
        reviewQaIds: nextReview,
        readTermIds: nextRead,
        points: nextPoints,
        totalEarnedPoints: nextTotal,
      };
    });
  }

  function handleCompleteRestorationTask(task: RestorationTask) {
    setSaveState((prev) => {
      const prevCompleted = prev.completedTaskIds || [];
      if (prevCompleted.includes(task.id)) return prev;

      const prevPoints = prev.points || { population: 40, culture: 25, tech: 25 };
      if (
        prevPoints.population < task.cost.population ||
        prevPoints.culture < task.cost.culture ||
        prevPoints.tech < task.cost.tech
      ) {
        return prev;
      }

      return {
        ...prev,
        points: {
          population: prevPoints.population - task.cost.population,
          culture: prevPoints.culture - task.cost.culture,
          tech: prevPoints.tech - task.cost.tech,
        },
        completedTaskIds: [...prevCompleted, task.id],
      };
    });
  }

  function handleSelectStage(stageId: number) {
    setSaveState((prev) => ({
      ...prev,
      currentStageId: stageId,
    }));
  }

  function handleSelectTerm(termId: number) {
    const term = termsById.get(termId);
    if (!term) return;

    setSelectedTermId(termId);
    setActiveTab('db');

    setSaveState((prev) => {
      const nextRecent = [
        termId,
        ...prev.recentTermIds.filter((id) => id !== termId),
      ].slice(0, 15);
      const nextRead = prev.readTermIds.includes(termId)
        ? prev.readTermIds
        : [...prev.readTermIds, termId];

      return {
        ...prev,
        recentTermIds: nextRecent,
        readTermIds: nextRead,
      };
    });
  }

  function handleToggleBookmark(termId: number) {
    setSaveState((prev) => {
      const exists = prev.bookmarkedTermIds.includes(termId);
      const next = exists
        ? prev.bookmarkedTermIds.filter((id) => id !== termId)
        : [...prev.bookmarkedTermIds, termId];
      return {
        ...prev,
        bookmarkedTermIds: next,
      };
    });
  }

  function handleJumpToTermFromQuiz(termId: number) {
    setCameFromQuiz(true);
    handleSelectTerm(termId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleReturnToQuizNext() {
    setAdvanceQuizTrigger((prev) => prev + 1);
    setActiveTab('quiz');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (activeTab === 'home') {
    return (
      <TopMenuView
        cityName={saveState.cityName}
        readTermIds={readTermIdsSet}
        masteredQaCount={masteredQaIdsSet.size}
        reviewQaCount={reviewQaIdsSet.size}
        totalQaCount={qaItems.length}
        points={currentPoints}
        currentStageId={saveState.currentStageId || 1}
        completedTaskIds={saveState.completedTaskIds || []}
        onSelectView={(view, quizMode) => {
          if (quizMode) {
            setInitialQuizMode(quizMode);
          }
          if (view === 'db') {
            setCameFromQuiz(false);
          }
          setActiveTab(view);
        }}
      />
    );
  }

  if (activeTab === 'haptics') {
    return <HapticsLabView onBack={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-5 flex-1">
        {activeTab === 'db' && (
          <WorldHistoryDBView
            chapters={chapters}
            allTerms={terms}
            termsById={termsById}
            selectedTermId={selectedTermId}
            onSelectTerm={handleSelectTerm}
            readTermIds={readTermIdsSet}
            bookmarkedTermIds={bookmarkedIdsSet}
            recentTermIds={saveState.recentTermIds}
            onToggleBookmark={handleToggleBookmark}
            canReturnToQuiz={cameFromQuiz}
            onReturnToQuizNext={handleReturnToQuizNext}
            onNavigate={(view) => {
              setActiveTab(view);
            }}
          />
        )}

        <div className={activeTab === 'quiz' ? 'block' : 'hidden'}>
          <QuizTrainingView
            qaItems={qaItems}
            termsById={termsById}
            readTermIds={readTermIdsSet}
            masteredQaIds={masteredQaIdsSet}
            reviewQaIds={reviewQaIdsSet}
            qaAnswerViewCounts={saveState.qaAnswerViewCounts || {}}
            currentPoints={currentPoints}
            initialMode={initialQuizMode}
            advanceTrigger={advanceQuizTrigger}
            onRevealAnswer={handleRevealAnswer}
            onRecordResult={handleRecordQuizResult}
            onJumpToTermInDB={handleJumpToTermFromQuiz}
            onNavigate={(view) => {
              if (view === 'db') setCameFromQuiz(false);
              setActiveTab(view);
            }}
          />
        </div>

        {activeTab === 'city' && (
          <MonumentRestorationView
            points={currentPoints}
            totalEarnedPoints={totalEarnedPoints}
            currentStageId={saveState.currentStageId || 1}
            completedTaskIds={saveState.completedTaskIds || []}
            onCompleteTask={handleCompleteRestorationTask}
            onSelectStage={handleSelectStage}
            onNavigate={(view) => {
              if (view === 'db') setCameFromQuiz(false);
              setActiveTab(view);
            }}
            onJumpToTermInDB={(termId) => {
              setCameFromQuiz(false);
              handleSelectTerm(termId);
            }}
          />
        )}
      </div>
    </div>
  );
}
