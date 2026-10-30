import { EnrichedTerm } from '@/types/history';

export interface WikiResource {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  pageUrl: string;
  lang: 'ja' | 'en';
  description?: string;
}

const wikiCache = new Map<number, WikiResource | null>();

function buildCandidateTitles(term: EnrichedTerm): string[] {
  const candidates: string[] = [];
  const raw = term.term
    .replace(/〈[^〉]+〉/g, '')
    .replace(/^[『「](.+?)[』」]$/, '$1')
    .trim();

  // Replace ＝ with ・ for Japanese Wikipedia
  const withDot = raw.replace(/＝/g, '・');
  const withoutParen = withDot.replace(/（[^）]+）/g, '').trim();

  if (withoutParen) candidates.push(withoutParen);
  if (withDot !== withoutParen) candidates.push(withDot);
  if (raw !== withDot) candidates.push(raw);

  const parenMatch = withDot.match(/（(.+?)）/);
  if (parenMatch && parenMatch[1].length >= 2) {
    candidates.push(parenMatch[1].trim());
  }

  return Array.from(new Set(candidates));
}

async function fetchSummaryByTitle(
  title: string,
  lang: 'ja' | 'en'
): Promise<WikiResource | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      title
    )}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return null;

    return {
      title: data.title,
      extract: data.extract,
      thumbnailUrl: data.thumbnail?.source || null,
      originalImageUrl: data.originalimage?.source || data.thumbnail?.source || null,
      pageUrl:
        data.content_urls?.desktop?.page ||
        `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
      lang,
      description: data.description,
    };
  } catch {
    return null;
  }
}

async function searchWikiTitle(query: string, lang: 'ja' | 'en'): Promise<string | null> {
  try {
    const api = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=1&format=json&origin=*`;
    const res = await fetch(api);
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.query?.search?.[0];
    return first?.title || null;
  } catch {
    return null;
  }
}

export async function fetchWikipediaResource(
  term: EnrichedTerm
): Promise<WikiResource | null> {
  if (wikiCache.has(term.id)) {
    return wikiCache.get(term.id) ?? null;
  }

  const jaCandidates = buildCandidateTitles(term);
  let bestResult: WikiResource | null = null;

  for (const candidate of jaCandidates) {
    const summary = await fetchSummaryByTitle(candidate, 'ja');
    if (summary) {
      bestResult = summary;
      if (summary.thumbnailUrl) {
        wikiCache.set(term.id, summary);
        return summary;
      }
      break;
    }
  }

  // Try Japanese Wikipedia search API if no direct hit
  if (!bestResult && jaCandidates[0]) {
    const searchedTitle = await searchWikiTitle(jaCandidates[0], 'ja');
    if (searchedTitle) {
      bestResult = await fetchSummaryByTitle(searchedTitle, 'ja');
      if (bestResult?.thumbnailUrl) {
        wikiCache.set(term.id, bestResult);
        return bestResult;
      }
    }
  }

  // If Japanese article had no thumbnail image (or wasn't found), check English Wikipedia using english_name
  if (term.english_name) {
    const enClean = term.english_name.split(',')[0].split(';')[0].trim();
    const enSummary = await fetchSummaryByTitle(enClean, 'en');
    if (enSummary) {
      if (bestResult && !bestResult.thumbnailUrl && enSummary.thumbnailUrl) {
        bestResult = {
          ...bestResult,
          thumbnailUrl: enSummary.thumbnailUrl,
          originalImageUrl: enSummary.originalImageUrl,
        };
      } else if (!bestResult) {
        bestResult = enSummary;
      }
    }
  }

  wikiCache.set(term.id, bestResult);
  return bestResult;
}
