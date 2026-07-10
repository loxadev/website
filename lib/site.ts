export const siteConfig = {
  name: 'Loxa',
  url: 'https://loxa.dev',
  description: 'Inspect local AI hardware and manage verified model files.',
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
  { label: 'Product', href: '/#capabilities' },
  { label: 'CLI', href: '/docs/cli' },
  { label: 'Project', href: '/docs/project' },
  { label: 'GitHub', href: siteConfig.sourceUrl, external: true },
];
