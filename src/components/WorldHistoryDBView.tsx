'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Chapter, EnrichedTerm } from '@/types/history';
import { fetchWikipediaResource, WikiResource } from '@/lib/wikipedia';
import { HISTORICAL_BUILDINGS } from '@/config/city-elements';
import { triggerSavedHaptic } from '@/lib/haptics';
import LinkedDescription from './LinkedDescription';
import {
  Search,
  Shuffle,
  Star,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  ArrowLeftRight,
  Clock,
  ChevronRight,
  Image as ImageIcon,
  X,
  Menu,
  Home,
  Compass,
  Building2,
  BookOpen,
  ArrowRight,
  Vibrate,
} from 'lucide-react';

interface WorldHistoryDBViewProps {
  chapters: Chapter[];
  allTerms: EnrichedTerm[];
  termsById: Map<number, EnrichedTerm>;
  selectedTermId: number;
  onSelectTerm: (termId: number) => void;
  readTermIds: Set<number>;
  bookmarkedTermIds: Set<number>;
  recentTermIds: number[];
  onToggleBookmark: (termId: number) => void;
  canReturnToQuiz?: boolean;
  onReturnToQuizNext?: () => void;
  onNavigate?: (view: 'home' | 'quiz' | 'city' | 'haptics') => void;
}

export default function WorldHistoryDBView({
  chapters,
  allTerms,
  termsById,
  selectedTermId,
  onSelectTerm,
  readTermIds,
  bookmarkedTermIds,
  recentTermIds,
  onToggleBookmark,
  canReturnToQuiz = false,
  onReturnToQuizNext,
  onNavigate,
}: WorldHistoryDBViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [minFrequency, setMinFrequency] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<
    'all' | 'landmarks' | 'unread' | 'read' | 'bookmarks'
  >('all');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [wikiData, setWikiData] = useState<WikiResource | null>(null);
  const [wikiLoading, setWikiLoading] = useState<boolean>(false);

  const currentTerm = termsById.get(selectedTermId) || allTerms[0];

  // Set of term IDs that directly unlock a historical building in the city
  const landmarkTriggerTermIds = useMemo(() => {
    const ids = new Set<number>();
    const keywords = HISTORICAL_BUILDINGS.flatMap((b) => b.triggerTerms);
    for (const t of allTerms) {
      if (keywords.some((kw) => t.term.includes(kw) || kw.includes(t.term))) {
        ids.add(t.id);
      }
    }
    return ids;
  }, [allTerms]);

  // Fetch Wikipedia / Wikimedia Commons image & extended article summary when term changes
  useEffect(() => {
    let cancelled = false;
    setWikiLoading(true);
    setWikiData(null);

    fetchWikipediaResource(currentTerm).then((res) => {
      if (!cancelled) {
        setWikiData(res);
        setWikiLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentTerm]);

  // Filtered list of terms for sidebar / search modal
  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTerms.filter((t) => {
      if (selectedChapterId !== 'all' && t.chapterId !== selectedChapterId) {
        return false;
      }
      if (t.frequency < minFrequency) return false;
      if (filterMode === 'unread' && readTermIds.has(t.id)) return false;
      if (filterMode === 'read' && !readTermIds.has(t.id)) return false;
      if (filterMode === 'bookmarks' && !bookmarkedTermIds.has(t.id)) return false;
      if (filterMode === 'landmarks' && !landmarkTriggerTermIds.has(t.id)) {
        return false;
      }

      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        (t.reading && t.reading.toLowerCase().includes(q)) ||
        (t.english_name && t.english_name.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [
    allTerms,
    searchQuery,
    selectedChapterId,
    minFrequency,
    filterMode,
    readTermIds,
    bookmarkedTermIds,
    landmarkTriggerTermIds,
  ]);

  const outLinkedTerms = useMemo(() => {
    const combined = new Set<number>([
      ...currentTerm.explicitRelatedIds,
      ...currentTerm.outLinks,
    ]);
    return Array.from(combined)
      .map((id) => termsById.get(id))
      .filter((t): t is EnrichedTerm => Boolean(t));
  }, [currentTerm, termsById]);

  const backlinkedTerms = useMemo(() => {
    return currentTerm.inLinks
      .map((id) => termsById.get(id))
      .filter((t): t is EnrichedTerm => Boolean(t));
  }, [currentTerm, termsById]);

  const sameOrReferencedPageTerms = useMemo(() => {
    const targetPages = new Set<number>([
      currentTerm.source_page,
      ...currentTerm.relatedPages,
    ]);
    return allTerms
      .filter((t) => t.id !== currentTerm.id && targetPages.has(t.source_page))
      .slice(0, 24);
  }, [allTerms, currentTerm]);

  function handleChooseTerm(termId: number) {
    onSelectTerm(termId);
    setMobileSearchOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleRandomJump() {
    const pool = filteredTerms.length > 0 ? filteredTerms : allTerms;
    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    if (randomItem) {
      handleChooseTerm(randomItem.id);
    }
  }

  const isCurrentBookmarked = bookmarkedTermIds.has(currentTerm.id);

  const searchDirectoryContent = (
    <div className="flex flex-col gap-3">
      {/* Search Input + Random Jump */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="用語・人名・英語名・解説文で検索..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <button
          onClick={handleRandomJump}
          className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition shrink-0"
          title="ランダムな世界史用語へジャンプ"
        >
          <Shuffle className="w-4 h-4" />
          <span>おまかせ</span>
        </button>
      </div>

      {/* Chapter / Era Selector */}
      <select
        value={selectedChapterId}
        onChange={(e) => setSelectedChapterId(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
      >
        <option value="all">
          すべての時代・地域（全 {allTerms.length.toLocaleString()} 語）
        </option>
        {chapters.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.name}
          </option>
        ))}
      </select>

      {/* Filter Pills & Frequency Filter */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'すべて' },
            { id: 'landmarks', label: '🏛️ 建造物' },
            { id: 'unread', label: '未読' },
            { id: 'read', label: '✓ 既読' },
            { id: 'bookmarks', label: '★ 保存済' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as typeof filterMode)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === tab.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={minFrequency}
          onChange={(e) => setMinFrequency(Number(e.target.value))}
          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300"
        >
          <option value={1}>頻出度: すべて</option>
          <option value={4}>★4 以上</option>
          <option value={6}>★6 以上</option>
        </select>
      </div>

      {/* Scrollable Term List */}
      <div className="flex flex-col gap-1.5 max-h-[55vh] lg:max-h-[540px] overflow-y-auto pr-1">
        {filteredTerms.slice(0, 150).map((t) => {
          const isSelected = t.id === currentTerm.id;
          const isRead = readTermIds.has(t.id);
          const isLandmarkKey = landmarkTriggerTermIds.has(t.id);

          return (
            <button
              key={t.id}
              onClick={() => handleChooseTerm(t.id)}
              className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                  : isRead
                  ? 'bg-emerald-950/25 border-emerald-500/30 hover:border-emerald-400/60'
                  : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-600'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-sm font-bold truncate ${
                      isSelected ? 'text-cyan-200' : 'text-white'
                    }`}
                  >
                    {t.term}
                  </span>
                  {isLandmarkKey && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🏛️
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {t.description}
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {t.frequency}
                </span>
                {isRead && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    既読
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Main Article Column: Order-1 on Mobile so Term Explanation Card is ALWAYS in the First View! */}
      <main className="order-1 lg:order-2 lg:col-span-8 flex flex-col gap-3.5">
        {/* Prominent Return-to-Quiz (Next Question) Button when accessed from Answer Card */}
        {canReturnToQuiz && onReturnToQuizNext && (
          <button
            type="button"
            onClick={() => {
              triggerSavedHaptic();
              onReturnToQuizNext();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
          >
            <Compass className="w-5 h-5" />
            <span>問題に戻る（次の問題へ進む）</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {/* Compact Mobile Search Bar, Random Button & Unobtrusive Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-300 text-left min-w-0"
          >
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              用語を検索・時代一覧から探す...
            </span>
          </button>
          <button
            onClick={handleRandomJump}
            className="px-2.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>おまかせ</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="px-2.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            title="メニュー"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Main Term Article Card (First View!) */}
        <article className="rounded-2xl border border-cyan-500/35 bg-slate-900/95 backdrop-blur-md p-4 sm:p-7 shadow-2xl flex flex-col gap-4">
          {/* Top Header: Badges, Title, Bookmark Icon & Desktop Menu Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {currentTerm.chapterName}
                </span>
                {currentTerm.era && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentTerm.era}
                  </span>
                )}
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-amber-400">
                  {Array.from({ length: Math.min(7, currentTerm.frequency) }).map(
                    (_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                    )
                  )}
                  <span className="ml-1">頻出度 {currentTerm.frequency}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentTerm.term}
              </h2>

              {(currentTerm.reading || currentTerm.english_name) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {currentTerm.reading && <span>{currentTerm.reading}</span>}
                  {currentTerm.english_name && (
                    <span className="font-mono text-cyan-300/90 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                      {currentTerm.english_name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Clean Bookmark Icon Button */}
              <button
                onClick={() => onToggleBookmark(currentTerm.id)}
                className={`p-2 rounded-xl border transition ${
                  isCurrentBookmarked
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="ブックマークに保存"
              >
                <Bookmark
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isCurrentBookmarked ? 'fill-amber-400' : ''
                  }`}
                />
              </button>

              {/* Desktop Unobtrusive Menu Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                title="メニュー"
              >
                <Menu className="w-4 h-4" />
                <span>メニュー</span>
              </button>
            </div>
          </div>

          {/* Main Term Description directly below title (No noisy sub-labels!) */}
          <div className="bg-slate-950/60 rounded-xl p-4 sm:p-5 border border-slate-800/90">
            <LinkedDescription
              term={currentTerm}
              termsById={termsById}
              readTermIds={readTermIds}
              onSelectTerm={handleChooseTerm}
            />
          </div>

          {/* Secondary Prominent Return-to-Quiz Button right under Description */}
          {canReturnToQuiz && onReturnToQuizNext && (
            <button
              type="button"
              onClick={() => {
                triggerSavedHaptic();
                onReturnToQuizNext();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>問題に戻る（次の問題へ進む）</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Wikipedia & Wikimedia Commons Live Resource Integration */}
          {(wikiLoading || wikiData) && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-4">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-200">
                    Wikipedia / Wikimedia Commons
                  </h3>
                </div>
                {wikiData && (
                  <a
                    href={wikiData.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Wikipedia ({wikiData.lang.toUpperCase()})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {wikiLoading ? (
                <div className="py-3 text-xs text-slate-400 animate-pulse">
                  Wikipedia から関連画像と詳細記事を取得中...
                </div>
              ) : wikiData ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                  {wikiData.thumbnailUrl ? (
                    <div className="md:col-span-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex flex-col items-center">
                      <img
                        src={wikiData.thumbnailUrl}
                        alt={wikiData.title}
                        className="w-full max-h-48 object-contain bg-black/40"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-3 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 flex flex-col items-center justify-center text-slate-500 text-xs gap-1 min-h-[80px]">
                      <ImageIcon className="w-5 h-5 opacity-50" />
                      <span>画像なし</span>
                    </div>
                  )}
                  <div
                    className={
                      wikiData.thumbnailUrl ? 'md:col-span-8' : 'md:col-span-9'
                    }
                  >
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {wikiData.extract}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </article>

        {/* Breadcrumb Reading Trail (辿った用語の足跡) */}
        {recentTermIds.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-1" />
            <span className="text-slate-400 shrink-0 mr-1">履歴:</span>
            {recentTermIds.slice(0, 8).map((id, idx) => {
              const item = termsById.get(id);
              if (!item) return null;
              const isCurrent = id === currentTerm.id;
              return (
                <React.Fragment key={`${id}_${idx}`}>
                  {idx > 0 && (
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                  <button
                    onClick={() => handleChooseTerm(id)}
                    className={`px-2 py-0.5 rounded-md shrink-0 transition ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.term}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Related Links & Backlinks */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Outgoing Related Terms */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col gap-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Link2 className="w-4 h-4" />
              <span>関連する用語 ({outLinkedTerms.length})</span>
            </h3>
            {outLinkedTerms.length === 0 ? (
              <p className="text-xs text-slate-500">
                解説文内に他の登録用語への直接リンクはありません。
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                {outLinkedTerms.map((rel) => {
                  const isRead = readTermIds.has(rel.id);
                  return (
                    <button
                      key={rel.id}
                      onClick={() => handleChooseTerm(rel.id)}
                      className="text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{rel.term}</span>
                          {isRead && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {rel.era || rel.chapterName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {rel.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Incoming Backlinks */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col gap-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4" />
              <span>
                「{currentTerm.term}」が登場する他の項目 ({backlinkedTerms.length})
              </span>
            </h3>
            {backlinkedTerms.length === 0 ? (
              <p className="text-xs text-slate-500">
                他の用語の解説文での直接言及はありません。
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                {backlinkedTerms.map((back) => {
                  const isRead = readTermIds.has(back.id);
                  return (
                    <button
                      key={back.id}
                      onClick={() => handleChooseTerm(back.id)}
                      className="text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{back.term}</span>
                          {isRead && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </span>
                        <span className="text-[11px] text-amber-400/90">
                          {back.era || back.chapterName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {back.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 3. Same Era & Contextual Terms */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-2.5">
            同時代・同地域の周辺用語（{currentTerm.chapterName}）
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sameOrReferencedPageTerms.map((item) => {
              const isRead = readTermIds.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleChooseTerm(item.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs border transition flex items-center gap-1 ${
                    isRead
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-400 hover:text-white'
                  }`}
                >
                  <span>{item.term}</span>
                  {isRead && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Desktop Left Sidebar (Order-2 on mobile so it never pushes the article down) */}
      <aside className="order-2 lg:order-1 lg:col-span-4">
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md p-4 shadow-xl">
          {searchDirectoryContent}
        </div>
      </aside>

      {/* Mobile Search Drawer Modal when user taps the compact search bar */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/85 backdrop-blur-md p-3 flex flex-col">
          <div className="rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 flex flex-col gap-3 max-h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white">
                用語を検索・選択
              </span>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {searchDirectoryContent}
          </div>
        </div>
      )}

      {/* Video-Game Style Menu Modal for World History DB */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  世界史DB（アーカイブメニュー）
                </h3>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {canReturnToQuiz && onReturnToQuizNext && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    triggerSavedHaptic();
                    onReturnToQuizNext();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>問題に戻る（次の問題へ進む）</span>
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>このまま世界史DBを読む</span>
              </button>

              {onNavigate && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate('quiz');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>エクスペディション</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigate('city');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>マイ歴史都市</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate('haptics');
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Vibrate className="w-4 h-4 text-purple-400" />
                    <span>スマホ振動（ハプティクス）実験ラボ</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onNavigate('home');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>トップメニューに戻る</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
