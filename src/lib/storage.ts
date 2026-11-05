import { CitySaveState, ChirperPost } from '@/types/history';

const STORAGE_KEY = 'world_history_skylines_save_v1';

const DEFAULT_CHIRPER: ChirperPost[] = [
  {
    id: 'init_1',
    citizenName: '都市計画アドバイザー（シヴィス）',
    citizenRole: '市長室ナビゲーター',
    avatarColor: '#00b4d8',
    message:
      '市長、ようこそ！『世界史DB』で歴史用語を読み進めるほど、我が街にピラミッドやパルテノン神殿などの歴史建造物が建ち、住民が増えていきます🏛️',
    timestamp: 'Just now',
  },
  {
    id: 'init_2',
    citizenName: '粘土板の書記官（ウル地区）',
    citizenRole: '古代オリエント市民',
    avatarColor: '#e9c46a',
    message:
      'まずは気になる用語を検索するか、解説文の青いリンクを辿って知識の旅に出てみよう！ #世界史DB #街づくり',
    timestamp: '1m ago',
  },
];

export const DEFAULT_SAVE_STATE: CitySaveState = {
  cityName: 'Worldia（歴史都市）',
  // Start with 2 iconic starter terms unlocked so the initial diorama has its first monument & citizens
  readTermIds: [8],
  bookmarkedTermIds: [],
  recentTermIds: [8],
  masteredQaIds: [],
  reviewQaIds: [],
  qaAnswerViewCounts: {},
  points: {
    population: 40,
    culture: 25,
    tech: 25,
  },
  totalEarnedPoints: {
    population: 40,
    culture: 25,
    tech: 25,
  },
  currentStageId: 1,
  completedTaskIds: [],
  customBuildingPositions: {},
  chirperFeed: DEFAULT_CHIRPER,
  timeOfDay: 'day',
};

export function loadCityState(): CitySaveState {
  if (typeof window === 'undefined') return DEFAULT_SAVE_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_STATE,
      ...parsed,
      points: parsed.points || DEFAULT_SAVE_STATE.points,
      totalEarnedPoints: parsed.totalEarnedPoints || parsed.points || DEFAULT_SAVE_STATE.totalEarnedPoints,
      currentStageId: parsed.currentStageId || 1,
      completedTaskIds: parsed.completedTaskIds || [],
    };
  } catch {
    return DEFAULT_SAVE_STATE;
  }
}

export function saveCityState(state: CitySaveState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save city state:', e);
  }
}
