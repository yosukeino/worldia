import fs from 'fs';
import path from 'path';
import WorldiaApp from '@/components/WorldiaApp';
import { Chapter, EnrichedTerm, QAItem } from '@/types/history';

export default function HomePage() {
  const dataPath = path.join(process.cwd(), 'src', 'data', 'enriched-terms.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const parsed = JSON.parse(raw) as {
    chapters: Chapter[];
    terms: EnrichedTerm[];
  };

  const qaPath = path.join(process.cwd(), 'src', 'data', 'qa-dataset.json');
  const qaRaw = fs.readFileSync(qaPath, 'utf-8');
  const qaItems = JSON.parse(qaRaw) as QAItem[];

  return (
    <WorldiaApp
      chapters={parsed.chapters}
      terms={parsed.terms}
      qaItems={qaItems}
    />
  );
}
