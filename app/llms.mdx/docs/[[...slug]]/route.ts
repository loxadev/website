import { getLlmText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

type RouteContext = Readonly<{
  params: Promise<{ slug?: string[] }>;
}>;

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams().map(({ slug }) => ({
    slug: slug?.length ? slug : ['index'],
  }));
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params;
  const page = source.getPage(slug?.length === 1 && slug[0] === 'index' ? undefined : slug);

  if (!page) return new Response('Not found\n', { status: 404 });

  return new Response(await getLlmText(page), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
