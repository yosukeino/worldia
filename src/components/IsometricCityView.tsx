'use client';

import React, { useState, useMemo } from 'react';
import {
  HistoricalBuilding,
  EnrichedTerm,
  BuildingShape,
} from '@/types/history';
import {
  HISTORICAL_BUILDINGS,
  isBuildingUnlocked,
} from '@/config/city-elements';
import {
  Sun,
  Sunset,
  Moon,
  ZoomIn,
  ZoomOut,
  Move,
  BookOpen,
  Users,
  Sparkles,
  FlaskConical,
  Lock,
  CheckCircle2,
  Compass,
  Info,
} from 'lucide-react';

interface IsometricCityViewProps {
  cityName: string;
  onChangeCityName: (name: string) => void;
  readTermIds: Set<number>;
  termsById: Map<number, EnrichedTerm>;
  allTerms: EnrichedTerm[];
  customPositions: Record<string, { x: number; y: number }>;
  onUpdatePosition: (buildingId: string, x: number, y: number) => void;
  timeOfDay: 'day' | 'sunset' | 'night';
  onChangeTimeOfDay: (time: 'day' | 'sunset' | 'night') => void;
  onSelectTerm: (termId: number) => void;
}

const GRID_SIZE = 9;
const TILE_W = 88;
const TILE_H = 44;

function gridToIso(gx: number, gy: number) {
  const screenX = (gx - gy) * (TILE_W / 2);
  const screenY = (gx + gy) * (TILE_H / 2);
  return { x: screenX, y: screenY };
}

function renderBuildingIsoSVG(
  shape: BuildingShape,
  primary: string,
  secondary: string,
  accent: string,
  isNight: boolean,
  isUnlocked: boolean
) {
  const opacity = isUnlocked ? 1 : 0.38;
  const winGlow = isNight && isUnlocked ? '#fde047' : '#38bdf8';

  switch (shape) {
    case 'pyramid':
      return (
        <g opacity={opacity}>
          {/* Shadow */}
          <polygon points="-38,2 0,20 42,0 0,-18" fill="rgba(0,0,0,0.28)" />
          {/* Left face */}
          <polygon
            points="0,-54 -36,0 0,18"
            fill={primary}
            stroke="#78350f"
            strokeWidth="1"
          />
          {/* Right face */}
          <polygon
            points="0,-54 0,18 36,0"
            fill={secondary}
            stroke="#78350f"
            strokeWidth="1"
          />
          {/* Golden Capstone */}
          <polygon points="0,-54 -10,-39 0,-34 10,-39" fill={accent} />
          {isNight && isUnlocked && (
            <circle cx="0" cy="-56" r="4" fill="#fde047" opacity="0.85" />
          )}
        </g>
      );

    case 'ziggurat':
      return (
        <g opacity={opacity}>
          {/* Tier 1 base */}
          <polygon points="0,-16 -34,0 0,17 34,0" fill={primary} />
          <polygon points="-34,0 0,17 0,30 -34,13" fill={primary} />
          <polygon points="34,0 0,17 0,30 34,13" fill={secondary} />
          {/* Tier 2 */}
          <polygon points="0,-32 -23,-20 0,-9 23,-20" fill={primary} />
          <polygon points="-23,-20 0,-9 0,3 -23,-8" fill={primary} />
          <polygon points="23,-20 0,-9 0,3 23,-8" fill={secondary} />
          {/* Top Shrine */}
          <polygon points="0,-46 -11,-40 0,-34 11,-40" fill={accent} />
          <polygon points="-11,-40 0,-34 0,-22 -11,-28" fill={accent} />
          <polygon points="11,-40 0,-34 0,-22 11,-28" fill="#1d4ed8" />
          {/* Grand Stairway */}
          <polygon points="0,17 -6,20 -18,6 -12,3" fill="#fef3c7" />
        </g>
      );

    case 'parthenon':
      return (
        <g opacity={opacity}>
          {/* Acropolis stone base */}
          <polygon points="0,-10 -34,7 0,24 34,7" fill="#cbd5e1" />
          <polygon points="-34,7 0,24 0,32 -34,15" fill="#94a3b8" />
          <polygon points="34,7 0,24 0,32 34,15" fill="#64748b" />
          {/* Columns Left & Right */}
          {[-24, -14, -4].map((xOffset, idx) => (
            <rect
              key={`colL_${idx}`}
              x={xOffset}
              y={-18 + idx * 4}
              width="4"
              height="20"
              fill={primary}
            />
          ))}
          {[6, 16, 24].map((xOffset, idx) => (
            <rect
              key={`colR_${idx}`}
              x={xOffset}
              y={-10 - idx * 4}
              width="4"
              height="20"
              fill={secondary}
            />
          ))}
          {/* Roof & Pediment */}
          <polygon points="0,-44 -32,-16 0,-2 32,-16" fill={primary} stroke={accent} strokeWidth="1.5" />
          <polygon points="-32,-16 0,-32 0,-2" fill="#e2e8f0" />
          <polygon points="32,-16 0,-32 0,-2" fill="#cbd5e1" />
        </g>
      );

    case 'colosseum':
      return (
        <g opacity={opacity}>
          <ellipse cx="0" cy="4" rx="34" ry="18" fill={secondary} />
          <path
            d="M -34,4 L -34,-20 A 34,18 0 0,0 34,-20 L 34,4 A 34,18 0 0,1 -34,4 Z"
            fill={primary}
            stroke="#9a3412"
            strokeWidth="1"
          />
          <ellipse cx="0" cy="-20" rx="34" ry="16" fill="#78350f" />
          <ellipse cx="0" cy="-18" rx="22" ry="10" fill="#fef3c7" />
          {/* Arches */}
          {[-22, -11, 0, 11, 22].map((ax, i) => (
            <rect
              key={i}
              x={ax - 3}
              y={-10}
              width="5"
              height="9"
              rx="2.5"
              fill={isNight && isUnlocked ? winGlow : '#431407'}
            />
          ))}
        </g>
      );

    case 'pagoda':
      return (
        <g opacity={opacity}>
          {/* Base courtyard */}
          <polygon points="0,-6 -30,9 0,24 30,9" fill="#94a3b8" />
          {/* 3 Pagoda tiers */}
          {[0, 1, 2].map((tier) => {
            const yBase = -8 - tier * 16;
            const w = 24 - tier * 5;
            return (
              <g key={tier}>
                <polygon
                  points={`0,${yBase - 10} -${w},${yBase} 0,${yBase + 8} ${w},${yBase}`}
                  fill={primary}
                  stroke={accent}
                  strokeWidth="1"
                />
                <rect
                  x={-w * 0.5}
                  y={yBase - 16}
                  width={w}
                  height="10"
                  fill="#fef2f2"
                />
              </g>
            );
          })}
          {/* Spire */}
          <line x1="0" y1="-48" x2="0" y2="-64" stroke={accent} strokeWidth="3" />
          <circle cx="0" cy="-64" r="3.5" fill={accent} />
        </g>
      );

    case 'mosque':
    case 'taj_mahal':
      return (
        <g opacity={opacity}>
          {/* Main sanctuary cube */}
          <polygon points="0,-16 -28,-2 0,12 28,-2" fill={primary} />
          <polygon points="-28,-2 0,12 0,28 -28,14" fill={primary} />
          <polygon points="28,-2 0,12 0,28 28,14" fill={secondary} />
          {/* Grand Onion / Azure Dome */}
          <path
            d="M -16,-10 C -18,-34 0,-42 0,-48 C 0,-42 18,-34 16,-10 Z"
            fill={shape === 'taj_mahal' ? '#ffffff' : accent}
            stroke={secondary}
            strokeWidth="1"
          />
          {/* Twin Minarets */}
          <rect x="-32" y="-38" width="5" height="44" fill={primary} />
          <circle cx="-29.5" cy="-40" r="4" fill={accent} />
          <rect x="27" y="-38" width="5" height="44" fill={secondary} />
          <circle cx="29.5" cy="-40" r="4" fill={accent} />
          {/* Arch portal */}
          <path d="M -6,24 L -6,12 A 6,6 0 0,1 6,12 L 6,24 Z" fill={winGlow} />
        </g>
      );

    case 'cathedral':
    case 'dome_renaissance':
      return (
        <g opacity={opacity}>
          {/* Nave */}
          <polygon points="-26,4 0,18 0,30 -26,16" fill={primary} />
          <polygon points="26,4 0,18 0,30 26,16" fill={secondary} />
          <polygon points="0,-18 -26,4 0,18 26,4" fill={accent} />
          {/* Twin Spires or Cupola */}
          <polygon points="-18,6 -10,-48 -2,6" fill={primary} />
          <polygon points="2,6 10,-48 18,6" fill={secondary} />
          {/* Rose window */}
          <circle cx="-10" cy="10" r="5" fill={winGlow} />
          <circle cx="10" cy="10" r="5" fill={winGlow} />
        </g>
      );

    case 'versailles':
    case 'palace_east':
      return (
        <g opacity={opacity}>
          {/* Courtyard garden */}
          <polygon points="0,-8 -36,10 0,28 36,10" fill="#10b981" />
          {/* Left & Right Grand Wings */}
          <polygon points="-32,4 0,20 0,30 -32,14" fill={primary} />
          <polygon points="32,4 0,20 0,30 32,14" fill={secondary} />
          <polygon points="0,-14 -32,4 0,20 32,4" fill={accent} />
          {/* Central Pavilion */}
          <rect x="-10" y="-22" width="20" height="18" rx="2" fill={primary} />
          <polygon points="0,-34 -14,-20 14,-20" fill={secondary} />
          {/* Glowing palace windows */}
          {[-20, -10, 0, 10, 20].map((wx, i) => (
            <rect key={i} x={wx - 2} y="10" width="3" height="6" fill={winGlow} />
          ))}
        </g>
      );

    case 'factory':
      return (
        <g opacity={opacity}>
          {/* Brick Factory Hall */}
          <polygon points="-30,2 0,18 0,30 -30,14" fill={secondary} />
          <polygon points="30,2 0,18 0,30 30,14" fill="#991b1b" />
          <polygon points="0,-12 -30,2 0,18 30,2" fill={primary} />
          {/* Twin Tall Smokestacks */}
          <rect x="-20" y="-44" width="6" height="46" fill="#475569" />
          <rect x="-8" y="-38" width="6" height="40" fill="#334155" />
          {/* Steam puffs */}
          {isUnlocked && (
            <>
              <circle cx="-17" cy="-50" r="5" fill="#e2e8f0" opacity="0.75" />
              <circle cx="-12" cy="-58" r="7" fill="#f1f5f9" opacity="0.55" />
            </>
          )}
        </g>
      );

    case 'eiffel':
      return (
        <g opacity={opacity}>
          {/* Base legs */}
          <polygon points="-24,20 -8,-4 8,-4 24,20 14,20 0,2 -14,20" fill={primary} />
          {/* Middle section */}
          <polygon points="-10,-4 -5,-32 5,-32 10,-4" fill={secondary} />
          {/* Top Spire */}
          <polygon points="-4,-32 0,-68 4,-32" fill={primary} />
          {isUnlocked && (
            <circle
              cx="0"
              cy="-68"
              r={isNight ? 6 : 3.5}
              fill={isNight ? '#fde047' : accent}
            />
          )}
        </g>
      );

    case 'modern_tower':
    default:
      return (
        <g opacity={opacity}>
          {/* Sleek glass high-rise */}
          <polygon points="0,-60 -20,-50 0,-40 20,-50" fill="#bae6fd" />
          <polygon points="-20,-50 0,-40 0,24 -20,14" fill={primary} />
          <polygon points="20,-50 0,-40 0,24 20,14" fill={secondary} />
          {/* Illuminated horizontal window bands */}
          {[-34, -22, -10, 2, 14].map((wy, idx) => (
            <line
              key={idx}
              x1="-16"
              y1={wy}
              x2="-2"
              y2={wy + 7}
              stroke={winGlow}
              strokeWidth="2"
            />
          ))}
        </g>
      );
  }
}

export default function IsometricCityView({
  cityName,
  onChangeCityName,
  readTermIds,
  termsById,
  allTerms,
  customPositions,
  onUpdatePosition,
  timeOfDay,
  onChangeTimeOfDay,
  onSelectTerm,
}: IsometricCityViewProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    HISTORICAL_BUILDINGS[0].id
  );
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [showLockedBlueprints, setShowLockedBlueprints] = useState(true);
  const [editingCityName, setEditingCityName] = useState(false);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const buildingStatuses = useMemo(() => {
    const map = new Map<
      string,
      {
        building: HistoricalBuilding;
        unlocked: boolean;
        progress: number;
        reason: string;
        gx: number;
        gy: number;
      }
    >();

    for (const b of HISTORICAL_BUILDINGS) {
      const status = isBuildingUnlocked(b, readTermIds, termsById);
      const custom = customPositions[b.id];
      map.set(b.id, {
        building: b,
        ...status,
        gx: custom ? custom.x : b.gridX,
        gy: custom ? custom.y : b.gridY,
      });
    }
    return map;
  }, [readTermIds, termsById, customPositions]);

  const selectedEntry = buildingStatuses.get(selectedBuildingId);

  // Find related terms in our 5,577 term DB for the currently selected building
  const relatedTermsForSelected = useMemo(() => {
    if (!selectedEntry) return [];
    const b = selectedEntry.building;
    const hits: EnrichedTerm[] = [];
    for (const t of allTerms) {
      if (b.triggerTerms.some((kw) => t.term.includes(kw) || kw.includes(t.term))) {
        hits.push(t);
      }
      if (hits.length >= 8) break;
    }
    if (hits.length < 6) {
      for (const t of allTerms) {
        if (t.chapterId === b.chapterId && !hits.some((h) => h.id === t.id)) {
          hits.push(t);
        }
        if (hits.length >= 8) break;
      }
    }
    return hits;
  }, [selectedEntry, allTerms]);

  // Generate small residential houses based on total read count
  const residentialHouses = useMemo(() => {
    const count = Math.min(18, Math.max(2, Math.floor(readTermIds.size / 2) + 2));
    const houseCoords = [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
      { x: 0, y: 4 },
      { x: 4, y: 0 },
      { x: 8, y: 2 },
      { x: 2, y: 8 },
      { x: 8, y: 4 },
      { x: 4, y: 8 },
      { x: 0, y: 6 },
      { x: 6, y: 0 },
      { x: 8, y: 6 },
      { x: 6, y: 8 },
      { x: 8, y: 8 },
    ];
    return houseCoords.slice(0, count);
  }, [readTermIds.size]);

  const unlockedList = Array.from(buildingStatuses.values()).filter((x) => x.unlocked);

  const bgGradient = isNight
    ? 'from-slate-950 via-blue-950 to-indigo-950'
    : isSunset
    ? 'from-amber-900/80 via-rose-900/70 to-slate-900'
    : 'from-sky-900/60 via-cyan-900/40 to-slate-900';

  function handleTileClick(gx: number, gy: number) {
    if (isMoveMode && selectedBuildingId) {
      onUpdatePosition(selectedBuildingId, gx, gy);
      setIsMoveMode(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left 8 Cols: 2.5D Isometric City Viewport */}
      <div
        className={`lg:col-span-8 relative rounded-2xl border border-cyan-500/30 bg-gradient-to-b ${bgGradient} overflow-hidden shadow-2xl min-h-[540px] flex flex-col justify-between`}
      >
        {/* Top Floating Controls Bar (Cities: Skylines style) */}
        <div className="z-10 flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/75 backdrop-blur-md border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-cyan-400" />
            {editingCityName ? (
              <input
                type="text"
                value={cityName}
                onChange={(e) => onChangeCityName(e.target.value)}
                onBlur={() => setEditingCityName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingCityName(false)}
                autoFocus
                className="bg-slate-800 text-white px-2.5 py-1 rounded border border-cyan-400 text-sm font-bold"
              />
            ) : (
              <button
                onClick={() => setEditingCityName(true)}
                className="text-base font-bold text-white hover:text-cyan-300 flex items-center gap-1.5"
                title="クリックして都市名を変更"
              >
                <span>{cityName}</span>
                <span className="text-xs font-normal text-cyan-400/80 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  建造物 {unlockedList.length} / {HISTORICAL_BUILDINGS.length}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Time of Day Switcher */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => onChangeTimeOfDay('day')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition ${
                  timeOfDay === 'day'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="昼モード"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">昼</span>
              </button>
              <button
                onClick={() => onChangeTimeOfDay('sunset')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition ${
                  timeOfDay === 'sunset'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="夕暮れモード"
              >
                <Sunset className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">夕</span>
              </button>
              <button
                onClick={() => onChangeTimeOfDay('night')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition ${
                  timeOfDay === 'night'
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="夜景モード"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">夜</span>
              </button>
            </div>

            {/* Blueprint toggle */}
            <button
              onClick={() => setShowLockedBlueprints((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                showLockedBlueprints
                  ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
            >
              未建設の設計図: {showLockedBlueprints ? '表示中' : '非表示'}
            </button>

            {/* Move Building Toggle */}
            <button
              onClick={() => setIsMoveMode((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition ${
                isMoveMode
                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold animate-pulse'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-400'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isMoveMode ? '移動先のタイルをクリック' : '区画配置変更'}</span>
            </button>

            {/* Zoom */}
            <div className="flex items-center bg-slate-950/80 rounded-lg border border-slate-700">
              <button
                onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
                className="p-1.5 text-slate-300 hover:text-white"
                title="縮小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))}
                className="p-1.5 text-slate-300 hover:text-white"
                title="拡大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Isometric SVG Canvas */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden select-none py-4">
          <svg
            viewBox="-450 -140 900 520"
            className="w-full h-full max-h-[500px] transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Isometric Island Bedrock Slab */}
            <polygon
              points="0,396 -410,190 0,-16 410,190"
              fill={isNight ? '#0f172a' : '#1e293b'}
              stroke="#0ea5e9"
              strokeWidth="2"
              opacity="0.9"
            />
            <polygon
              points="-410,190 0,396 0,432 -410,226"
              fill="#334155"
            />
            <polygon
              points="410,190 0,396 0,432 410,226"
              fill="#1e293b"
            />

            {/* Grid Tiles, Grand Canal & Stone Roads */}
            {Array.from({ length: GRID_SIZE }).map((_, gx) =>
              Array.from({ length: GRID_SIZE }).map((__, gy) => {
                const { x, y } = gridToIso(gx, gy);
                const isRiver = gx === 4 && gy !== 4;
                const isRoad = gy === 2 || gy === 4 || gy === 6 || gx === 2 || gx === 6;

                let tileFill = isNight
                  ? '#14332b'
                  : isSunset
                  ? '#365314'
                  : '#15803d';
                if (isRiver) {
                  tileFill = isNight ? '#0369a1' : '#0284c7';
                } else if (isRoad) {
                  tileFill = isNight ? '#334155' : '#64748b';
                }

                return (
                  <g
                    key={`tile_${gx}_${gy}`}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => handleTileClick(gx, gy)}
                    className={
                      isMoveMode ? 'cursor-pointer hover:opacity-80' : undefined
                    }
                  >
                    <polygon
                      points={`0,0 ${-TILE_W / 2},${TILE_H / 2} 0,${TILE_H} ${
                        TILE_W / 2
                      },${TILE_H / 2}`}
                      fill={tileFill}
                      stroke={
                        isMoveMode
                          ? 'rgba(56, 189, 248, 0.55)'
                          : 'rgba(255,255,255,0.12)'
                      }
                      strokeWidth={isMoveMode ? '1.5' : '0.8'}
                    />
                    {isRoad && !isRiver && (
                      <line
                        x1={-TILE_W / 4}
                        y1={TILE_H / 2}
                        x2={TILE_W / 4}
                        y2={TILE_H / 2}
                        stroke="#cbd5e1"
                        strokeDasharray="3,3"
                        strokeWidth="1"
                        opacity="0.5"
                      />
                    )}
                  </g>
                );
              })
            )}

            {/* Small Evolving Residential Houses */}
            {residentialHouses.map((pos, idx) => {
              const { x, y } = gridToIso(pos.x, pos.y);
              return (
                <g
                  key={`res_${idx}`}
                  transform={`translate(${x}, ${y + TILE_H / 2})`}
                >
                  <polygon points="0,-16 -14,-8 0,0 14,-8" fill="#f59e0b" />
                  <polygon points="-14,-8 0,0 0,10 -14,2" fill="#e2e8f0" />
                  <polygon points="14,-8 0,0 0,10 14,2" fill="#cbd5e1" />
                  {isNight && (
                    <rect x="-6" y="-2" width="3" height="4" fill="#fde047" />
                  )}
                </g>
              );
            })}

            {/* Historical Monuments & Landmarks sorted back-to-front by (gx + gy) */}
            {Array.from(buildingStatuses.values())
              .filter((item) => item.unlocked || showLockedBlueprints)
              .sort((a, b) => a.gx + a.gy - (b.gx + b.gy))
              .map((item) => {
                const { building, unlocked, gx, gy } = item;
                const { x, y } = gridToIso(gx, gy);
                const isSelected = selectedBuildingId === building.id;

                return (
                  <g
                    key={building.id}
                    transform={`translate(${x}, ${y + TILE_H / 2})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBuildingId(building.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Selection Highlight Ring */}
                    {isSelected && (
                      <ellipse
                        cx="0"
                        cy="8"
                        rx="42"
                        ry="21"
                        fill="none"
                        stroke="#00f5d4"
                        strokeWidth="2.5"
                        strokeDasharray="5,3"
                      />
                    )}

                    {/* Render 2.5D Isometric Monument */}
                    {renderBuildingIsoSVG(
                      building.shape,
                      building.primaryColor,
                      building.secondaryColor,
                      building.accentColor,
                      isNight,
                      unlocked
                    )}

                    {/* Animated Citizen standing/strolling near unlocked buildings */}
                    {unlocked && (
                      <g transform="translate(22, 16)">
                        <circle
                          cx="0"
                          cy="-10"
                          r="3.5"
                          fill="#fde68a"
                          stroke="#0f172a"
                          strokeWidth="0.8"
                        />
                        <path
                          d="M -4,-6 L 4,-6 L 5,3 L -5,3 Z"
                          fill={building.citizenColor}
                        />
                      </g>
                    )}

                    {/* Floating Label Badge */}
                    <g transform="translate(0, -68)">
                      <rect
                        x="-58"
                        y="-14"
                        width="116"
                        height="20"
                        rx="10"
                        fill={
                          isSelected
                            ? '#00b4d8'
                            : unlocked
                            ? 'rgba(15, 23, 42, 0.85)'
                            : 'rgba(15, 23, 42, 0.55)'
                        }
                        stroke={unlocked ? '#38bdf8' : '#64748b'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-1"
                        textAnchor="middle"
                        fill={isSelected ? '#020617' : unlocked ? '#f8fafc' : '#94a3b8'}
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        {unlocked ? building.name : `🔒 ${building.name}`}
                      </text>
                    </g>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* Bottom Legend Bar */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              ジオラマ上の<strong>建造物</strong>をクリックすると、建物の解説と<strong>関連する世界史用語</strong>を確認できます。
            </span>
          </div>
          <span className="text-cyan-400 font-semibold">
            読了用語が増えるほど住宅区画とランドマークが自動発展！
          </span>
        </div>
      </div>

      {/* Right 4 Cols: Cities: Skylines Building & Citizen Inspector Panel */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {selectedEntry && (
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-1">
                  {selectedEntry.building.eraLabel}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedEntry.building.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedEntry.building.subtitle}
                </p>
              </div>
              {selectedEntry.unlocked ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  建設済
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                  建設中 ({selectedEntry.progress}%)
                </span>
              )}
            </div>

            {/* City Stat Contributions */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>人口増加</span>
                </div>
                <div className="text-sm font-bold text-white">
                  +{selectedEntry.building.populationBonus.toLocaleString()}人
                </div>
              </div>
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>文化度</span>
                </div>
                <div className="text-sm font-bold text-white">
                  +{selectedEntry.building.cultureBonus}
                </div>
              </div>
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-0.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                  <span>技術・学術</span>
                </div>
                <div className="text-sm font-bold text-white">
                  +{selectedEntry.building.scienceBonus}
                </div>
              </div>
            </div>

            {/* Building Lore */}
            <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              {selectedEntry.building.lore}
            </p>

            {/* Unlock status & Direct Jump to Related World History DB Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  この建造物に関連する世界史DB用語
                </span>
                <span className="text-[11px] text-slate-400">
                  クリックで記事を読む
                </span>
              </div>
              <p className="text-[11px] text-amber-300/90 mb-2.5">
                {selectedEntry.reason}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {relatedTermsForSelected.map((t) => {
                  const isRead = readTermIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTerm(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isRead
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/70'
                          : 'bg-slate-800/90 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500 hover:text-slate-950 font-medium'
                      }`}
                    >
                      <span>{t.term}</span>
                      {isRead && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Building Roster */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            都市ランドマーク一覧（クリックで選択）
          </h4>
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {Array.from(buildingStatuses.values()).map(({ building, unlocked }) => (
              <button
                key={building.id}
                onClick={() => setSelectedBuildingId(building.id)}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs border transition truncate ${
                  selectedBuildingId === building.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                    : unlocked
                    ? 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-600'
                    : 'bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-400'
                }`}
              >
                {unlocked ? '🏛️ ' : '🔒 '}
                {building.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
