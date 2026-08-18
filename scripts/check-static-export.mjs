import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { JSDOM } from 'jsdom';

const repositoryRoot = process.cwd();
const outputDirectory = resolve(repositoryRoot, 'out');

const documentRoutes = [
  '/',
  '/early-access',
  '/docs',
  '/docs/install',
  '/docs/doctor',
  '/docs/models',
  '/docs/cli',
  '/docs/troubleshooting',
  '/docs/project',
];

const retiredDocumentRoutes = ['/docs/experimental/supervisor'];

const searchRoute = '/api/search';
const llmRoutes = [
  '/llms.txt',
  '/llms-full.txt',
  '/llms.mdx/docs/index',
  '/llms.mdx/docs/install',
  '/llms.mdx/docs/doctor',
  '/llms.mdx/docs/models',
  '/llms.mdx/docs/cli',
  '/llms.mdx/docs/troubleshooting',
  '/llms.mdx/docs/project',
];
const retiredLlmRoutes = ['/llms.mdx/docs/experimental/supervisor'];
const nextServerDirectory = '_next/server';
const staticIcons = [
  { path: '/favicon.ico', type: 'image/x-icon' },
  { path: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
  { path: '/icon1.png', type: 'image/png', sizes: '32x32' },
  {
    path: '/apple-icon.png',
    rel: 'apple-touch-icon',
    type: 'image/png',
    sizes: '180x180',
  },
];

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

const generatedMarkdownPatterns = [
  ...privatePatterns,
  { label: 'unsupported performance claim', pattern: /tokens?\s*\/\s*s(?:ec(?:ond)?s?)?|time to first token|\bfastest\b/i },
  { label: 'unsupported readiness claim', pattern: /production[- ]ready|openai[- ]compatible|anthropic[- ]compatible/i },
  { label: 'unsupported failover claim', pattern: /cloud.{0,20}(?:failover|fails?\s+over)/i },
  {
    label: 'unsupported installer command',
    pattern:
      /\bcurl\b[^\n]{0,120}\|\s*(?:ba)?sh\b|\bnpm\s+(?:install|i|exec)(?:\s+(?:-g|--global))?\s+loxa\b|\bnpx(?:\s+(?:-y|--yes))?\s+loxa\b|\bcargo\s+install(?:\s+--locked)?\s+loxa\b|\bpip(?:3)?\s+install(?:\s+--user)?\s+loxa\b|\buv\s+(?:tool\s+install(?:\s+--upgrade)?|add(?:\s+--dev)?)\s+loxa\b|\bbrew\s+install(?:\s+--cask)?\b/i,
  },
  {
    label: 'internal repository history',
    pattern: /(?:private|internal)\s+(?:repository|repo)\b/i,
  },
  {
    label: 'unsupported traction claim',
    pattern:
      /\b\d+\s+(?:users?|customers?|pilots?)\b|\b(?:has|serves?)\s+(?:(?:\d+\s+)?(?:users?|customers?|pilots?)|(?:an?\s+)(?:customer|pilot))\b|\b(?:generates?|reports?|has)\s+(?:(?:\$\s*)?\d[\d,]*(?:\.\d+)?(?:[kmb])?\s+(?:in\s+)?)?revenue\b|\b(?:mrr|arr)\s*(?:is|of|:|\$|\d)|\bretention\s+(?:is|of|at|:)\s*(?:\d|high\b|strong\b|healthy\b|positive\b)|\b(?:has|runs?)\s+(?:\d+\s+)?enterprise deployments?\b/i,
  },
  { label: 'credential-like token', pattern: /\b(?:sk|gh[opurs]|hf)_[A-Za-z0-9_-]{20,}\b/ },
  { label: 'credential assignment', pattern: /\b(?:CLOUDFLARE_API_TOKEN|GITHUB_TOKEN)\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/i },
];

const maxGeneratedMarkdownBytes = 2 * 1024 * 1024;

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
    join(outputDirectory, normalized),
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

async function requireAbsentDocument(route) {
  const candidates = documentCandidates(route);

  for (const candidate of candidates) {
    if (await isFile(candidate)) {
      throw new Error('retired static route: ' + route + '; found ' + displayPath(candidate));
    }
  }
}

function staticIconLinks(homeDocument) {
  const document = new JSDOM(homeDocument).window.document;

  return Array.from(document.querySelectorAll('link'))
    .map((link) => ({
      rel: link.getAttribute('rel'),
      href: link.getAttribute('href'),
      type: link.getAttribute('type'),
      sizes: link.getAttribute('sizes'),
    }))
    .filter((link) => link.href !== null);
}

async function requireStaticIcons(homeDocument) {
  for (const icon of staticIcons) {
    const iconPath = join(outputDirectory, basename(icon.path));
    const iconStats = await getStats(iconPath);

    if (!iconStats?.isFile() || iconStats.size === 0) {
      throw new Error('missing static icon: ' + displayPath(iconPath));
    }
  }

  const links = staticIconLinks(await readFile(homeDocument, 'utf8'));

  for (const icon of staticIcons) {
    const matchingLinks = links.filter((link) => {
      try {
        return new URL(link.href, 'https://loxa.dev').pathname === icon.path;
      } catch {
        return false;
      }
    });

    if (matchingLinks.length === 0) {
      throw new Error('missing static icon link: ' + icon.path);
    }

    if (matchingLinks.length > 1) {
      throw new Error('duplicate static icon link: ' + icon.path);
    }

    const link = matchingLinks[0];
    const rel = icon.rel ?? 'icon';

    if (
      link.rel !== rel ||
      link.type !== icon.type ||
      (icon.sizes !== undefined && link.sizes !== icon.sizes)
    ) {
      throw new Error('invalid static icon link: ' + icon.path);
    }
  }
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

function hasCloudflareHeaderRule(headers, route, header) {
  let currentRoute = null;

  for (const line of headers.split(/\r?\n/)) {
    if (line.trim().length === 0) {
      currentRoute = null;
    } else if (!/^\s/.test(line)) {
      currentRoute = line;
    } else if (currentRoute === route && line.trim() === header) {
      return true;
    }
  }

  return false;
}

async function requireCloudflareHeaders() {
  const headersPath = join(outputDirectory, '_headers');

  if (!(await isFile(headersPath))) {
    throw new Error('missing Cloudflare Markdown header rules: out/_headers');
  }

  const headers = await readFile(headersPath, 'utf8');
  const required = [
    '/llms.mdx/docs/*',
    'Content-Type: text/markdown; charset=utf-8',
    'Content-Disposition: inline',
  ];

  for (const line of required) {
    if (!headers.includes(line)) {
      throw new Error('missing Cloudflare Markdown header rule: ' + line);
    }
  }

  if (!headers.split(/\r?\n/).includes(searchRoute)) {
    throw new Error('missing Cloudflare search JSON header rule: ' + searchRoute);
  }

  const jsonContentType = 'Content-Type: application/json; charset=utf-8';
  if (!hasCloudflareHeaderRule(headers, searchRoute, jsonContentType)) {
    throw new Error('missing Cloudflare search JSON header rule: ' + jsonContentType);
  }
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
  const isGeneratedMarkdown = (file) => {
    const path = emittedPath(file);
    return path === 'llms.txt' || path === 'llms-full.txt' || path.startsWith('llms.mdx/docs/');
  };
  const textualFiles = files.filter(
    (file) => textualExtensions.has(extname(file).toLowerCase()) || file === searchPayload || isGeneratedMarkdown(file),
  );

  for (const file of textualFiles) {
    const generatedMarkdown = isGeneratedMarkdown(file);
    if (generatedMarkdown && (await stat(file)).size > maxGeneratedMarkdownBytes) {
      throw new Error('generated Markdown exceeds size ceiling: ' + displayPath(file));
    }

    const text = await readFile(file, 'utf8');
    const patterns = generatedMarkdown ? generatedMarkdownPatterns : privatePatterns;
    const violation = patterns.find(({ pattern }) => pattern.test(text));

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

  const [homeDocument] = await Promise.all(documentRoutes.map(requireDocument));
  await Promise.all(
    [...retiredDocumentRoutes, ...retiredLlmRoutes].map(requireAbsentDocument),
  );
  await Promise.all(llmRoutes.map(requireDocument));
  await requireStaticIcons(homeDocument);
  await requireCloudflareHeaders();
  const searchPayload = await requireSearchPayload();
  const emittedFiles = await collectFiles(outputDirectory);

  verifyRuntimeArtifacts(emittedFiles);
  await verifyPublicText(emittedFiles, searchPayload);

  const checkedRouteCount = documentRoutes.length + llmRoutes.length + 1;
  console.log('Static export check passed: ' + checkedRouteCount + ' routes checked.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Static export check failed: ' + message);
  process.exitCode = 1;
});
