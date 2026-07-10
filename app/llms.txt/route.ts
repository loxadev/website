import { llms } from 'fumadocs-core/source';

import { canonicalOrigin } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export function GET(): Response {
  const index = llms(source)
    .index()
    .replace(/\]\((\/docs(?:[^)]*)?)\)/g, (_match, path: string) =>
      `](${new URL(path, canonicalOrigin)})`,
    );

  return new Response(index, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
