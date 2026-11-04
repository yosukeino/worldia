'use client';

import React, { useState, useEffect } from 'react';
import {
  HAPTIC_PRESETS,
  HapticPreset,
  HapticSettings,
  DEFAULT_HAPTIC_SETTINGS,
  loadHapticSettings,
  saveHapticSettings,
  triggerHapticPreset,
  triggerCustomMsHaptic,
} from '@/lib/haptics';
import {
  Smartphone,
  Vibrate,
  Volume2,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowLeft,
  Layers,
  Info,
  Zap,
} from 'lucide-react';

interface HapticsLabViewProps {
  onBack?: () => void;
}

export default function HapticsLabView({ onBack }: HapticsLabViewProps) {
  const [settings, setSettings] = useState<HapticSettings>(DEFAULT_HAPTIC_SETTINGS);
  const [supportsVibrate, setSupportsVibrate] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [lastTriggeredLabel, setLastTriggeredLabel] = useState<string>('まだタップされていません');
  const [tapCount, setTapCount] = useState<number>(0);

  // Mini Flashcard Simulator state inside the Lab
  const [simRevealed, setSimRevealed] = useState<boolean>(false);
  const [simIndex, setSimIndex] = useState<number>(0);

  const sampleCards = [
    {
      chapter: '第1章 文明の成立と古代文明の特質',
      question: 'ギリシア語で「川のあいだの土地」を意味し、ティグリス川とユーフラテス川の流域に広がる地域を何というか。',
      answer: 'メソポタミア',
      reading: 'めそぽたみあ',
      desc: 'ティグリス・ユーフラテス両河の流域にあたる地域で、語源は「川のあいだの土地」であり、その領域はおおむね現代のイラクに相当する。',
    },
    {
      chapter: '第4章 西アジアと地中海周辺の国家形成',
      question: '異民族の侵略に備えるため、全土を4分割して正帝2人と副帝2人で分掌統治した制度を何というか。',
      answer: '四帝分治制（テトラルキア）',
      reading: 'していぶんちせい',
      desc: 'ディオクレティアヌス帝が導入した統治体制。広大なローマ帝国領を4つに分け、2人の正帝（アウグストゥス）と2人の副帝（カエサル）が分担して統治した。',
    },
    {
      chapter: '第9章 大交易・大交流の時代',
      question: '明の永楽帝の命を受け、南海諸国へ大規模な大艦隊を率いて7回にわたる大遠征を指揮したムスリム宦官は誰か。',
      answer: '鄭和',
      reading: 'ていわ',
      desc: '雲南出身のイスラーム教徒の宦官。永楽帝に重用され、1405年から7回にわたり大艦隊を率いて東南アジア・インド洋からアフリカ東岸にまで遠征した。',
    },
  ];

  useEffect(() => {
    const loaded = loadHapticSettings();
    setSettings(loaded);

    if (typeof navigator !== 'undefined') {
      setSupportsVibrate(typeof navigator.vibrate === 'function');
      const ua = navigator.userAgent || '';
      const iosDetected =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIos(iosDetected);
    }
  }, []);

  function updateSettings(patch: Partial<HapticSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveHapticSettings(next);
      return next;
    });
  }

  function handleTestPreset(preset: HapticPreset) {
    updateSettings({ selectedPresetId: preset.id });
    triggerHapticPreset(preset, {
      enableIosSwitch: settings.useIosSwitchHaptic,
      enableAudioTactile: settings.useAudioTactile,
    });
    setTapCount((c) => c + 1);
    setLastTriggeredLabel(
      `${preset.name}（Pattern: ${JSON.stringify(preset.vibratePattern)}ms）`
    );
  }

  function handleTestCustomMs(ms: number) {
    updateSettings({ selectedPresetId: 'custom', customDurationMs: ms });
    triggerCustomMsHaptic(ms, {
      enableIosSwitch: settings.useIosSwitchHaptic,
      enableAudioTactile: settings.useAudioTactile,
    });
    setTapCount((c) => c + 1);
    setLastTriggeredLabel(`カスタム単発振動（${ms}ms）`);
  }

  function fireCurrentSelectedHaptic() {
    if (settings.selectedPresetId === 'custom') {
      triggerCustomMsHaptic(settings.customDurationMs, {
        enableIosSwitch: settings.useIosSwitchHaptic,
        enableAudioTactile: settings.useAudioTactile,
      });
    } else {
      const preset =
        HAPTIC_PRESETS.find((p) => p.id === settings.selectedPresetId) ||
        HAPTIC_PRESETS[1];
      triggerHapticPreset(preset, {
        enableIosSwitch: settings.useIosSwitchHaptic,
        enableAudioTactile: settings.useAudioTactile,
      });
    }
  }

  const currentCard = sampleCards[simIndex % sampleCards.length];

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 py-6 px-4">
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

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
              <Vibrate className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white">
                スマホ振動（ハプティクス）実験ラボ
              </h1>
              <p className="text-xs text-slate-400">
                実機でいろいろな長さ・パターンの振動を試して、一番心地よい設定をそのまま本番カードに適用できます
              </p>
            </div>
          </div>

          {onBack ? (
            <button
              onClick={onBack}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
          ) : (
            <a
              href="/"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>トップへ戻る</span>
            </a>
          )}
        </div>

        {/* Device & Browser Capability Notice */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-extrabold text-cyan-300">
              <Smartphone className="w-4 h-4" />
              <span>お使いの端末の振動サポート状況</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md font-bold ${
                  supportsVibrate
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                Vibration API: {supportsVibrate ? '対応 (Android等)' : '非対応 (iOS等)'}
              </span>
              {isIos && (
                <span className="px-2 py-0.5 rounded-md font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  iPhone / iOS 検出
                </span>
              )}
            </div>
          </div>

          <div className="text-slate-300 leading-relaxed flex items-start gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                <strong className="text-white">Android端末</strong>ではミリ秒単位（5ms〜200ms）の振動長の違いがそのままモーターに反映されます。
              </p>
              <p>
                <strong className="text-white">iPhone（iOS Safari）</strong>ではAppleの仕様により通常のWeb振動APIがブロックされていますが、<strong>① iOS Taptic Switchハック（コツッという純正触覚）</strong>と、<strong>② 超低周波パルス合成（スピーカーの超短波空気振動で指先に長さと重みを伝える効果）</strong>の2つを組み合わせて体験できるようにしています！
              </p>
            </div>
          </div>

          {/* Toggles for iOS Switch Haptic & Audio-Tactile Sub-bass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() =>
                updateSettings({ useIosSwitchHaptic: !settings.useIosSwitchHaptic })
              }
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                settings.useIosSwitchHaptic
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>iPhone Taptic Engine 振動</span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  iOS 17.4 / 18+ Safariの純正「コツッ」触覚
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 font-black text-[11px]">
                {settings.useIosSwitchHaptic ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateSettings({ useAudioTactile: !settings.useAudioTactile })
              }
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                settings.useAudioTactile
                  ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>重低音タクタイル共鳴（iPhone推奨）</span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  極短の低周波パルスで5ms〜50msの長さの差を表現
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 font-black text-[11px]">
                {settings.useAudioTactile ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Direct Native iOS <label><input switch> Comparison Box */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>A. iPhone ネイティブ Taptic Engine 直接タップ比較</span>
            </h2>
            <span className="text-[11px] text-slate-400">iOS Safari専用</span>
          </div>
          <p className="text-xs text-slate-300">
            iPhoneのSafariで下のボタンをタップすると、iOS純正スイッチのTaptic Engineが直接作動します（消音モードでも振動します）。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label
              onClick={() => {
                setTapCount((c) => c + 1);
                setLastTriggeredLabel('iPhone ネイティブ Taptic（単発）');
              }}
              className="py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/50 text-emerald-200 font-extrabold text-xs sm:text-sm text-center cursor-pointer select-none active:scale-95 transition flex flex-col items-center justify-center gap-1"
            >
              <input
                type="checkbox"
                className="sr-only"
                ref={(el) => {
                  if (el) el.setAttribute('switch', '');
                }}
              />
              <span>iPhone 純正 Taptic タップ</span>
              <span className="text-[10px] text-emerald-300/80 font-normal">
                （ネイティブ label 方式）
              </span>
            </label>

            <label
              onClick={() => {
                const ctx =
                  typeof window !== 'undefined'
                    ? new (window.AudioContext ||
                        (window as unknown as { webkitAudioContext: typeof AudioContext })
                          .webkitAudioContext)()
                    : null;
                if (ctx) {
                  const osc = ctx.createOscillator();
                  const g = ctx.createGain();
                  osc.frequency.setValueAtTime(135, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.015);
                  g.gain.setValueAtTime(0.45, ctx.currentTime);
                  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
                  osc.connect(g);
                  g.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.018);
                }
                setTapCount((c) => c + 1);
                setLastTriggeredLabel('iPhone 純正 Taptic ＋ 15ms 重低音パルス');
              }}
              className="py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-200 font-extrabold text-xs sm:text-sm text-center cursor-pointer select-none active:scale-95 transition flex flex-col items-center justify-center gap-1"
            >
              <input
                type="checkbox"
                className="sr-only"
                ref={(el) => {
                  if (el) el.setAttribute('switch', '');
                }}
              />
              <span>Taptic ＋ 15ms 共鳴パルス</span>
              <span className="text-[10px] text-cyan-300/80 font-normal">
                （振動＋低周波アタック音）
              </span>
            </label>
          </div>
        </div>

        {/* Preset Grid (5ms to Multi-pulse) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                B. 振動プリセット比較（タップして試打＆選択）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                選んだカードが「現在選択中」になり、本番のフラッシュカードにもそのまま反映されます
              </p>
            </div>
            <div className="text-xs font-bold text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              テスト回数: {tapCount}回
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {HAPTIC_PRESETS.map((preset) => {
              const isSelected = settings.selectedPresetId === preset.id;
              return (
                <label
                  key={preset.id}
                  onClick={() => handleTestPreset(preset)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer select-none active:scale-[0.98] flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 text-white ring-1 ring-emerald-400/50 shadow-lg'
                      : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                  }`}
                >
                  {/* Include native switch input so tapping any preset card on iPhone also triggers native Taptic */}
                  {settings.useIosSwitchHaptic && preset.id !== 'off' && (
                    <input
                      type="checkbox"
                      className="sr-only"
                      ref={(el) => {
                        if (el) el.setAttribute('switch', '');
                      }}
                    />
                  )}
                  <div className="space-y-1">
                    <div className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                      <span>{preset.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {preset.subtitle}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[10px] font-black">
                      <CheckCircle2 className="w-3 h-3" />
                      適用中
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Custom Millisecond Slider */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>C. 1ミリ秒単位のカスタム長さ調整スライダー</span>
            </h2>
            {settings.selectedPresetId === 'custom' && (
              <span className="px-2 py-0.5 rounded-md bg-purple-400 text-slate-950 text-[10px] font-black">
                カスタム適用中 ({settings.customDurationMs}ms)
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">振動の長さ（1ms 〜 150ms）:</span>
              <span className="text-base font-black text-purple-300 tabular-nums">
                {settings.customDurationMs} ms
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={150}
              step={1}
              value={settings.customDurationMs}
              onChange={(e) =>
                updateSettings({
                  selectedPresetId: 'custom',
                  customDurationMs: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-purple-400 cursor-pointer"
            />

            <div className="flex flex-wrap gap-2">
              {[1, 3, 6, 10, 14, 18, 25, 35, 50, 80, 120].map((ms) => (
                <label
                  key={ms}
                  onClick={() => handleTestCustomMs(ms)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold cursor-pointer select-none active:scale-95 transition ${
                    settings.selectedPresetId === 'custom' &&
                    settings.customDurationMs === ms
                      ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {settings.useIosSwitchHaptic && (
                    <input
                      type="checkbox"
                      className="sr-only"
                      ref={(el) => {
                        if (el) el.setAttribute('switch', '');
                      }}
                    />
                  )}
                  {ms}ms
                </label>
              ))}
            </div>

            <label
              onClick={() => handleTestCustomMs(settings.customDurationMs)}
              className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-black text-sm text-center shadow-lg cursor-pointer select-none active:scale-[0.99] transition"
            >
              {settings.useIosSwitchHaptic && (
                <input
                  type="checkbox"
                  className="sr-only"
                  ref={(el) => {
                    if (el) el.setAttribute('switch', '');
                  }}
                />
              )}
              現在のカスタム値（{settings.customDurationMs}ms）で振動テストする
            </label>
          </div>
        </div>

        {/* Live Mini Flashcard Simulator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-black text-cyan-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>D. フラッシュカード実戦シミュレーター（今の設定で試打）</span>
            </h2>
            <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
              直近: {lastTriggeredLabel}
            </span>
          </div>

          <label
            onClick={() => {
              fireCurrentSelectedHaptic();
              setTapCount((c) => c + 1);
              if (!simRevealed) {
                setSimRevealed(true);
              } else {
                setSimRevealed(false);
                setSimIndex((i) => i + 1);
              }
            }}
            className={`block relative rounded-[26px] p-[2.5px] transition-transform duration-150 active:scale-[0.992] cursor-pointer select-none shadow-2xl ${
              simRevealed ? 'wave-card-outer-revealed' : 'wave-card-outer'
            }`}
          >
            {settings.useIosSwitchHaptic && settings.selectedPresetId !== 'off' && (
              <input
                type="checkbox"
                className="sr-only"
                ref={(el) => {
                  if (el) el.setAttribute('switch', '');
                }}
              />
            )}
            <div
              className={`rounded-[24px] p-[2px] ${
                simRevealed ? 'wave-card-middle-revealed' : 'wave-card-middle'
              }`}
            >
              <div className="rounded-[22px] bg-[#091326]/95 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-bold border-b border-slate-800 pb-2">
                  <span>{currentCard.chapter}</span>
                  <span>サンプル {(simIndex % sampleCards.length) + 1} / 3</span>
                </div>

                {!simRevealed ? (
                  <div className="py-4 space-y-4">
                    <p className="text-base sm:text-xl font-bold text-white leading-relaxed">
                      {currentCard.question}
                    </p>
                    <div className="text-right text-xs text-cyan-300/80 font-bold animate-pulse">
                      タップして振動＋答えと解説を表示 →
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5">
                      <div className="text-[10px] font-bold text-emerald-400">
                        正解（ANSWER）
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {currentCard.answer}
                      </div>
                      <div className="text-xs text-emerald-200/80">
                        {currentCard.reading}
                      </div>
                    </div>

                    <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3.5 text-sm text-slate-200 leading-relaxed">
                      {currentCard.desc}
                    </div>

                    <div className="text-right text-xs text-emerald-300 font-bold">
                      もう一度タップして振動＋次の問題へ →
                    </div>
                  </div>
                )}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
