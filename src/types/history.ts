export interface InlineSpan {
  termId: number;
  surface: string;
  start: number;
  end: number;
}

export interface Chapter {
  id: string;
  districtId: string;
  name: string;
  minPage: number;
  maxPage: number;
}

export interface EnrichedTerm {
  id: number;
  term: string;
  reading: string | null;
  english_name: string | null;
  frequency: number;
  era: string | null;
  description: string;
  source_page: number;
  chapterId: string;
  chapterName: string;
  districtId: string;
  inlineSpans: InlineSpan[];
  outLinks: number[];
  inLinks: number[];
  explicitRelatedIds: number[];
  relatedPages: number[];
}

export type BuildingShape =
  | 'pyramid'
  | 'ziggurat'
  | 'parthenon'
  | 'colosseum'
  | 'aqueduct'
  | 'pagoda'
  | 'palace_east'
  | 'mosque'
  | 'cathedral'
  | 'dome_renaissance'
  | 'taj_mahal'
  | 'versailles'
  | 'factory'
  | 'eiffel'
  | 'modern_tower'
  | 'house_ancient'
  | 'house_medieval'
  | 'house_modern'
  | 'market'
  | 'academy';

export interface HistoricalBuilding {
  id: string;
  name: string;
  subtitle: string;
  chapterId: string;
  eraLabel: string;
  shape: BuildingShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gridX: number;
  gridY: number;
  size: 1 | 2;
  /** Term keywords or chapter read count that unlock this building */
  triggerTerms: string[];
  requiredChapterReads: number;
  populationBonus: number;
  cultureBonus: number;
  scienceBonus: number;
  citizenRole: string;
  citizenColor: string;
  citizenQuote: string;
  lore: string;
}

export interface ChirperPost {
  id: string;
  citizenName: string;
  citizenRole: string;
  avatarColor: string;
  message: string;
  relatedTermId?: number;
  relatedTermName?: string;
  timestamp: string;
}

export interface QAItem {
  id: number;
  chapter: string;
  section: string;
  question: string;
  answer: string;
  matched_term_id: number | null;
  frequency: number;
}

export interface CitySaveState {
  cityName: string;
  readTermIds: number[];
  bookmarkedTermIds: number[];
  recentTermIds: number[];
  masteredQaIds: number[];
  reviewQaIds: number[];
  qaAnswerViewCounts?: Record<number, number>;
  customBuildingPositions: Record<string, { x: number; y: number }>;
  chirperFeed: ChirperPost[];
  timeOfDay: 'day' | 'sunset' | 'night';
}
