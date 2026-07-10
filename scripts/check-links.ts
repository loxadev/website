import {
  type FileObject,
  printErrors,
  scanURLs,
  validateFiles,
} from 'next-validate-link';
import { register } from 'fumadocs-mdx/node';

register();

const { source } = await import('@/lib/source');

function getHeadings({ data }: (typeof source)['$inferPage']): string[] {
  return data.toc.map((item) => item.url.slice(1));
}

function getAbsolutePath(page: (typeof source)['$inferPage']): string {
  if (!page.absolutePath) {
    throw new Error(`Missing source path for ${page.url}`);
  }

  return page.absolutePath;
}

async function getFiles(): Promise<FileObject[]> {
  return Promise.all(
    source.getPages().map(async (page) => ({
      path: getAbsolutePath(page),
      content: await page.data.getText('raw'),
      url: page.url,
      data: page.data,
    })),
  );
}

async function checkLinks() {
  const scanned = await scanURLs({
    preset: 'next',
    populate: {
      'docs/[[...slug]]': source.getPages().map((page) => ({
        value: { slug: page.slugs },
        hashes: getHeadings(page),
      })),
    },
  });

  printErrors(
    await validateFiles(await getFiles(), {
      scanned,
      checkRelativePaths: 'as-url',
    }),
    true,
  );
}

void checkLinks();
