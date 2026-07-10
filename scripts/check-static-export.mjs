import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve, sep } from 'node:path';

const repositoryRoot = process.cwd();
const outputDirectory = resolve(repositoryRoot, 'out');

const documentRoutes = [
  '/',
  '/docs',
  '/docs/doctor',
  '/docs/models',
  '/docs/cli',
  '/docs/troubleshooting',
  '/docs/project',
  '/docs/experimental/supervisor',
];

const searchRoute = '/api/search';
const nextServerDirectory = '_next/server';

const privatePatterns = [
  {
    label: 'absolute user path',
    pattern: /\/Users\/[^/\\\s"'<>]+(?:[/\\][^\s"'<>]*)?/i,
  },
  {
    label: 'context directory',
    pattern: /(?:^|[^A-Za-z0-9])(?:private|internal)[-_ ]?context(?:[/\\]|$)/i,
  },
  {
    label: 'internal tooling path',
    pattern: /(?:^|[^A-Za-z0-9])\.superpowers(?:[/\\]|$)/i,
  },
];

const textualExtensions = new Set([
  '.html',
  '.txt',
  '.md',
  '.js',
  '.css',
  '.json',
  '.xml',
  '.svg',
]);

const unsupportedRuntimeBasenames = [
  /^middleware(?:[-_.][^/]*)?$/i,
  /^server-reference-manifest(?:[-_.][^/]*)?$/i,
  /^(?:[^/]+[-_.])?server-(?:action|function)s?(?:[-_.][^/]*)?\.(?:js|mjs|cjs)$/i,
];

async function getStats(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return null;
    throw error;
  }
}

async function isFile(path) {
  const stats = await getStats(path);
  return stats?.isFile() ?? false;
}

function displayPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/');
}

function emittedPath(path) {
  return relative(outputDirectory, path).split(sep).join('/');
}

function documentCandidates(route) {
  if (route === '/') return [join(outputDirectory, 'index.html')];

  const normalized = route.replace(/^\/+|\/+$/g, '');

  return [
    join(outputDirectory, normalized + '.html'),
    join(outputDirectory, normalized, 'index.html'),
  ];
}

async function requireDocument(route) {
  const candidates = documentCandidates(route);

  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }

  throw new Error(
    'missing document for ' +
      route +
      '; checked ' +
      candidates.map(displayPath).join(', '),
  );
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidOramaPayload(payload) {
  if (!isRecord(payload) || payload.type !== 'advanced') return false;

  const internalIds = payload.internalDocumentIDStore?.internalIdToId;
  if (
    !isRecord(payload.internalDocumentIDStore) ||
    !Array.isArray(internalIds) ||
    internalIds.length === 0 ||
    internalIds.some(
      (value) => typeof value !== 'string' || value.trim().length === 0,
    )
  ) {
    return false;
  }

  if (!isRecord(payload.docs) || !isRecord(payload.docs.docs)) return false;

  const documentCount = payload.docs.count;
  const documentKeys = Object.keys(payload.docs.docs);

  if (
    documentKeys.length === 0 ||
    !Number.isInteger(documentCount) ||
    documentCount <= 0 ||
    documentCount !== internalIds.length ||
    documentCount !== documentKeys.length
  ) {
    return false;
  }

  if (
    !isRecord(payload.index) ||
    !isRecord(payload.index.indexes) ||
    Object.keys(payload.index.indexes).length === 0 ||
    !Array.isArray(payload.index.searchableProperties) ||
    payload.index.searchableProperties.length === 0 ||
    payload.index.searchableProperties.some(
      (value) => typeof value !== 'string' || value.trim().length === 0,
    )
  ) {
    return false;
  }

  const hasUsableIndexEntry = payload.index.searchableProperties.some((property) => {
    const entry = payload.index.indexes[property];
    return isRecord(entry) && Object.keys(entry).length > 0;
  });

  if (!hasUsableIndexEntry) return false;

  if (!isRecord(payload.sorting) || !isRecord(payload.pinning)) return false;

  return typeof payload.language === 'string' && payload.language.trim().length > 0;
}

function searchPayloadCandidates() {
  return [
    join(outputDirectory, 'api', 'search'),
    join(outputDirectory, 'api', 'search.json'),
    join(outputDirectory, 'api', 'search', 'index'),
    join(outputDirectory, 'api', 'search', 'index.json'),
  ];
}

async function requireSearchPayload() {
  const candidates = searchPayloadCandidates();

  for (const candidate of candidates) {
    if (!(await isFile(candidate))) continue;

    try {
      const payload = JSON.parse(await readFile(candidate, 'utf8'));
      if (isValidOramaPayload(payload)) return candidate;
    } catch {
      // Continue so the final error reports every accepted static-export form.
    }
  }

  throw new Error(
    'missing or invalid static Orama payload for ' +
      searchRoute +
      '; checked ' +
      candidates.map(displayPath).join(', '),
  );
}

function verifyRuntimeArtifacts(files) {
  for (const file of files) {
    const path = emittedPath(file);
    const fileBasename = basename(path);

    if (path === nextServerDirectory || path.startsWith(nextServerDirectory + '/')) {
      throw new Error('unsupported runtime artifact: ' + displayPath(file));
    }

    if (unsupportedRuntimeBasenames.some((pattern) => pattern.test(fileBasename))) {
      throw new Error('unsupported runtime artifact: ' + displayPath(file));
    }
  }
}

async function verifyPublicText(files, searchPayload) {
  const textualFiles = files.filter(
    (file) => textualExtensions.has(extname(file).toLowerCase()) || file === searchPayload,
  );

  for (const file of textualFiles) {
    const text = await readFile(file, 'utf8');
    const violation = privatePatterns.find(({ pattern }) => pattern.test(text));

    if (violation) {
      throw new Error(violation.label + ' found in ' + displayPath(file));
    }
  }
}

async function main() {
  const outputStats = await getStats(outputDirectory);

  if (!outputStats?.isDirectory()) {
    throw new Error('out/ is absent; run pnpm build first');
  }

  await Promise.all(documentRoutes.map(requireDocument));
  const searchPayload = await requireSearchPayload();
  const emittedFiles = await collectFiles(outputDirectory);

  verifyRuntimeArtifacts(emittedFiles);
  await verifyPublicText(emittedFiles, searchPayload);

  const checkedRouteCount = documentRoutes.length + 1;
  console.log('Static export check passed: ' + checkedRouteCount + ' routes checked.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Static export check failed: ' + message);
  process.exitCode = 1;
});
