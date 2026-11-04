'use client';

import React, { useState } from 'react';
import { EnrichedTerm } from '@/types/history';
import { CheckCircle2, ArrowUpRight, Star } from 'lucide-react';

interface LinkedDescriptionProps {
  term: EnrichedTerm;
  termsById: Map<number, EnrichedTerm>;
  readTermIds: Set<number>;
  onSelectTerm: (termId: number) => void;
}

export default function LinkedDescription({
  term,
  termsById,
  readTermIds,
  onSelectTerm,
}: LinkedDescriptionProps) {
  const [hoveredTermId, setHoveredTermId] = useState<number | null>(null);

  const chars = Array.from(term.description);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (let idx = 0; idx < term.inlineSpans.length; idx++) {
    const span = term.inlineSpans[idx];
    if (span.start > cursor) {
      segments.push(
        <span key={`txt_${idx}`}>{chars.slice(cursor, span.start).join('')}</span>
      );
    }

    const targetTerm = termsById.get(span.termId);
    const isRead = readTermIds.has(span.termId);

    if (targetTerm) {
      segments.push(
        <span
          key={`lnk_${idx}_${span.termId}`}
          className="relative inline-block"
          onMouseEnter={() => setHoveredTermId(span.termId)}
          onMouseLeave={() => setHoveredTermId(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTerm(span.termId);
            }}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-semibold transition border text-[15px] leading-snug ${
              isRead
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950'
            }`}
          >
            <span>{span.surface}</span>
            {isRead ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 opacity-75 shrink-0" />
            )}
          </button>

          {/* Wikipedia-style Hover Preview Card */}
          {hoveredTermId === span.termId && (
            <span className=" hidden sm:block absolute left-0 bottom-full mb-2 w-80 z-50 p-3.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-cyan-400/50 shadow-2xl text-left pointer-events-none">
              <span className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-400">
                  {targetTerm.chapterName}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  頻出度 {targetTerm.frequency}
                </span>
              </span>
              <span className="block text-sm font-bold text-white mb-0.5">
                {targetTerm.term}
                {targetTerm.era && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ({targetTerm.era})
                  </span>
                )}
              </span>
              <span className="block text-xs text-slate-300 leading-relaxed line-clamp-4">
                {targetTerm.description}
              </span>
              <span className="block mt-2 text-[11px] text-cyan-300 font-semibold">
                クリックしてこの項目へジャンプ →
              </span>
            </span>
          )}
        </span>
      );
    } else {
      segments.push(<span key={`raw_${idx}`}>{span.surface}</span>);
    }

    cursor = span.end;
  }

  if (cursor < chars.length) {
    segments.push(<span key="txt_end">{chars.slice(cursor).join('')}</span>);
  }

  return (
    <div className="text-base sm:text-lg leading-loose text-slate-100 tracking-wide">
      {segments}
    </div>
  );
}
