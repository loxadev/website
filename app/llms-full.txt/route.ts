import { getLlmText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const pages = source.getPages();
  const documents = await Promise.all(pages.map(getLlmText));

  return new Response(documents.join('\n---\n\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
