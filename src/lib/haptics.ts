'use client';

export interface HapticPreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'light' | 'medium' | 'pattern' | 'tactile_audio';
  /** Vibration API pattern in ms (for Android / supported browsers) */
  vibratePattern: number | number[];
  /** Optional ultra-short sub-bass / tactile click synthesis (works on iPhone & Android) */
  audioPulse?: {
    freqStart: number;
    freqEnd: number;
    durationMs: number;
    gain: number;
    secondPulseDelayMs?: number;
    secondFreqStart?: number;
    secondFreqEnd?: number;
    secondDurationMs?: number;
  };
}

export const HAPTIC_PRESETS: HapticPreset[] = [
  {
    id: 'off',
    name: 'OFF（振動なし）',
    subtitle: '振動・触覚フィードバックを無効化します',
    category: 'light',
    vibratePattern: 0,
  },
  {
    id: 'micro_5',
    name: '① 極短マイクロ（5ms）',
    subtitle: '指先に「コツッ」とだけ伝わる最小限の極短パルス',
    category: 'light',
    vibratePattern: 5,
    audioPulse: {
      freqStart: 150,
      freqEnd: 55,
      durationMs: 6,
      gain: 0.25,
    },
  },
  {
    id: 'crisp_10',
    name: '② 軽快ショート（10ms）',
    subtitle: '純正キーボードの打鍵感に近い、連続タップしても疲れにくい軽さ',
    category: 'light',
    vibratePattern: 10,
    audioPulse: {
      freqStart: 135,
      freqEnd: 48,
      durationMs: 10,
      gain: 0.35,
    },
  },
  {
    id: 'card_18',
    name: '③ 標準カードめくり（18ms）',
    subtitle: 'カードをめくった手応えがしっかり感じられる中間の長さ',
    category: 'medium',
    vibratePattern: 18,
    audioPulse: {
      freqStart: 120,
      freqEnd: 42,
      durationMs: 18,
      gain: 0.45,
    },
  },
  {
    id: 'solid_30',
    name: '④ しっかりミディアム（30ms）',
    subtitle: '物理ボタンを押し込んだような明確で重みのある振動',
    category: 'medium',
    vibratePattern: 30,
    audioPulse: {
      freqStart: 105,
      freqEnd: 38,
      durationMs: 28,
      gain: 0.55,
    },
  },
  {
    id: 'heavy_50',
    name: '⑤ 重厚ディープ（50ms）',
    subtitle: 'ズシッと響く長めの単発振動（重要アクション向け）',
    category: 'medium',
    vibratePattern: 50,
    audioPulse: {
      freqStart: 90,
      freqEnd: 32,
      durationMs: 45,
      gain: 0.65,
    },
  },
  {
    id: 'double_light',
    name: '⑥ 軽快ダブルタップ（8ms + 12ms）',
    subtitle: '「トトンッ」と小気味よく2回弾むリズム振動',
    category: 'pattern',
    vibratePattern: [8, 30, 12],
    audioPulse: {
      freqStart: 140,
      freqEnd: 55,
      durationMs: 8,
      gain: 0.35,
      secondPulseDelayMs: 38,
      secondFreqStart: 170,
      secondFreqEnd: 65,
      secondDurationMs: 12,
    },
  },
  {
    id: 'heartbeat_up',
    name: '⑦ 強まる2段パルス（12ms → 28ms）',
    subtitle: '弱→強へと盛り上がる、知識を開拓した達成感のある振動',
    category: 'pattern',
    vibratePattern: [12, 45, 28],
    audioPulse: {
      freqStart: 110,
      freqEnd: 45,
      durationMs: 12,
      gain: 0.35,
      secondPulseDelayMs: 55,
      secondFreqStart: 145,
      secondFreqEnd: 40,
      secondDurationMs: 26,
    },
  },
  {
    id: 'wave_triple',
    name: '⑧ 3連ウェーブ（6ms → 12ms → 20ms）',
    subtitle: '波のように3段階で広がるリッチなフィードバック',
    category: 'pattern',
    vibratePattern: [6, 25, 12, 25, 20],
    audioPulse: {
      freqStart: 130,
      freqEnd: 45,
      durationMs: 14,
      gain: 0.4,
      secondPulseDelayMs: 45,
      secondFreqStart: 160,
      secondFreqEnd: 50,
      secondDurationMs: 20,
    },
  },
];

const HAPTIC_STORAGE_KEY = 'worldia_haptic_settings_v1';

export interface HapticSettings {
  selectedPresetId: string;
  useIosSwitchHaptic: boolean;
  useAudioTactile: boolean;
  customDurationMs: number;
}

export const DEFAULT_HAPTIC_SETTINGS: HapticSettings = {
  selectedPresetId: 'crisp_10',
  useIosSwitchHaptic: true,
  useAudioTactile: false,
  customDurationMs: 15,
};

export function loadHapticSettings(): HapticSettings {
  if (typeof window === 'undefined') return DEFAULT_HAPTIC_SETTINGS;
  try {
    const raw = window.localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (!raw) return DEFAULT_HAPTIC_SETTINGS;
    return { ...DEFAULT_HAPTIC_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HAPTIC_SETTINGS;
  }
}

export function saveHapticSettings(settings: HapticSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playSubBassPulse(
  ctx: AudioContext,
  startTime: number,
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  gainVal: number
) {
  const durSec = Math.max(0.004, durationMs / 1000);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqStart, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + durSec);

  gain.gain.setValueAtTime(gainVal, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + durSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + durSec + 0.005);
}

/**
 * Fires iOS 17.4+ / 18+ hidden <input type="checkbox" switch> label click if present in DOM
 */
export function triggerIosTapticSwitch(): boolean {
  if (typeof document === 'undefined') return false;
  const label = document.getElementById('worldia-ios-haptic-label');
  if (label) {
    label.click();
    return true;
  }
  return false;
}

/**
 * Triggers a specific preset or custom pattern
 */
export function triggerHapticPreset(
  preset: HapticPreset,
  options?: { enableIosSwitch?: boolean; enableAudioTactile?: boolean }
): void {
  if (typeof window === 'undefined' || preset.id === 'off') return;

  const useIos = options?.enableIosSwitch ?? true;
  const useAudio = options?.enableAudioTactile ?? false;

  // 1. Standard Web Vibration API (Android Chrome / Edge / Firefox)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(preset.vibratePattern);
    } catch {
      // ignore
    }
  }

  // 2. iOS Safari 17.4+ / 18+ Taptic Engine Switch trigger
  if (useIos) {
    triggerIosTapticSwitch();
  }

  // 3. Optional low-frequency acoustic-tactile thump (adds variable duration/weight feel even on iOS)
  if (useAudio && preset.audioPulse) {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      const p = preset.audioPulse;
      playSubBassPulse(ctx, now, p.freqStart, p.freqEnd, p.durationMs, p.gain);
      if (p.secondPulseDelayMs && p.secondFreqStart && p.secondFreqEnd && p.secondDurationMs) {
        playSubBassPulse(
          ctx,
          now + p.secondPulseDelayMs / 1000,
          p.secondFreqStart,
          p.secondFreqEnd,
          p.secondDurationMs,
          p.gain * 1.1
        );
      }
    }
  }
}

/**
 * Triggers custom millisecond vibration + optional audio-tactile pulse
 */
export function triggerCustomMsHaptic(
  durationMs: number,
  options?: { enableIosSwitch?: boolean; enableAudioTactile?: boolean }
): void {
  if (typeof window === 'undefined' || durationMs <= 0) return;

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // ignore
    }
  }

  if (options?.enableIosSwitch ?? true) {
    triggerIosTapticSwitch();
  }

  if (options?.enableAudioTactile) {
    const ctx = getAudioContext();
    if (ctx) {
      playSubBassPulse(ctx, ctx.currentTime, 130, 42, durationMs, 0.45);
    }
  }
}

/**
 * Fires the user's saved haptic preference (used in Flashcard & 4-choice quiz)
 */
export function triggerSavedHaptic(): void {
  const settings = loadHapticSettings();
  if (settings.selectedPresetId === 'custom') {
    triggerCustomMsHaptic(settings.customDurationMs, {
      enableIosSwitch: settings.useIosSwitchHaptic,
      enableAudioTactile: settings.useAudioTactile,
    });
    return;
  }
  const preset =
    HAPTIC_PRESETS.find((p) => p.id === settings.selectedPresetId) || HAPTIC_PRESETS[2];
  triggerHapticPreset(preset, {
    enableIosSwitch: settings.useIosSwitchHaptic,
    enableAudioTactile: settings.useAudioTactile,
  });
}
