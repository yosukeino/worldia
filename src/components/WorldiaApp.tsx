'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Chapter, EnrichedTerm, QAItem, CitySaveState } from '@/types/history';
import {
  DEFAULT_SAVE_STATE,
  loadCityState,
  saveCityState,
} from '@/lib/storage';
import CityStatusHeader from './CityStatusHeader';
import TopMenuView from './TopMenuView';
import WorldHistoryDBView from './WorldHistoryDBView';
import QuizTrainingView, { QuizMode } from './QuizTrainingView';
import IsometricCityView from './IsometricCityView';
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
  const [activeTab, setActiveTab] = useState<'home' | 'db' | 'quiz' | 'city' | 'haptics'>('home');
  const [initialQuizMode, setInitialQuizMode] = useState<QuizMode>('flashcard');
  const [selectedTermId, setSelectedTermId] = useState<number>(12);
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
    if (loaded.recentTermIds.length > 0 && termsById.has(loaded.recentTermIds[0])) {
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
    matchedTermId: number | null
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
        isCorrect && matchedTermId !== null && !prev.readTermIds.includes(matchedTermId)
          ? [...prev.readTermIds, matchedTermId]
          : prev.readTermIds;

      return {
        ...prev,
        masteredQaIds: nextMastered,
        reviewQaIds: nextReview,
        readTermIds: nextRead,
      };
    });
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

  function handleUpdateBuildingPosition(buildingId: string, x: number, y: number) {
    setSaveState((prev) => ({
      ...prev,
      customBuildingPositions: {
        ...prev.customBuildingPositions,
        [buildingId]: { x, y },
      },
    }));
  }

  if (activeTab === 'home') {
    return (
      <TopMenuView
        cityName={saveState.cityName}
        readTermIds={readTermIdsSet}
        masteredQaCount={masteredQaIdsSet.size}
        reviewQaCount={reviewQaIdsSet.size}
        totalQaCount={qaItems.length}
        termsById={termsById}
        onSelectView={(view, quizMode) => {
          if (quizMode) {
            setInitialQuizMode(quizMode);
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
      {activeTab !== 'quiz' && (
        <CityStatusHeader
          cityName={saveState.cityName}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          readTermIds={readTermIdsSet}
          masteredQaCount={masteredQaIdsSet.size}
          termsById={termsById}
        />
      )}

      <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-5 flex-1">
        {activeTab === 'db' ? (
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
          />
        ) : activeTab === 'quiz' ? (
          <QuizTrainingView
            qaItems={qaItems}
            termsById={termsById}
            readTermIds={readTermIdsSet}
            masteredQaIds={masteredQaIdsSet}
            reviewQaIds={reviewQaIdsSet}
            qaAnswerViewCounts={saveState.qaAnswerViewCounts || {}}
            initialMode={initialQuizMode}
            onRevealAnswer={handleRevealAnswer}
            onRecordResult={handleRecordQuizResult}
            onJumpToTermInDB={handleSelectTerm}
            onNavigate={(view) => setActiveTab(view)}
          />
        ) : (
          <IsometricCityView
            cityName={saveState.cityName}
            onChangeCityName={(name) =>
              setSaveState((prev) => ({ ...prev, cityName: name }))
            }
            readTermIds={readTermIdsSet}
            termsById={termsById}
            allTerms={terms}
            customPositions={saveState.customBuildingPositions}
            onUpdatePosition={handleUpdateBuildingPosition}
            timeOfDay={saveState.timeOfDay}
            onChangeTimeOfDay={(timeOfDay) =>
              setSaveState((prev) => ({ ...prev, timeOfDay }))
            }
            onSelectTerm={handleSelectTerm}
          />
        )}
      </div>
    </div>
  );
}
