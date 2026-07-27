export const siteConfig = {
  name: 'Loxa',
  url: 'https://loxa.dev',
  description:
    'Loxa is being built as an open-source local AI node for running open models on hardware you control. Still in development and Apple Silicon first.',
  version: '0.1.0-dev',
  sourceUrl: 'https://github.com/loxadev/loxa',
  licenseUrl: 'https://github.com/loxadev/loxa/blob/main/LICENSE',
} as const;

export type SiteLink = Readonly<{
  label: string;
  href: string;
  external?: boolean;
}>;

export const siteLinks: readonly SiteLink[] = [
  { label: 'Product', href: '/#product-direction' },
  { label: 'CLI', href: '/docs/cli' },
  { label: 'Project', href: '/docs/project' },
  { label: 'GitHub', href: siteConfig.sourceUrl, external: true },
];
