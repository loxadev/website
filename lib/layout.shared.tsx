import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { siteLinks } from '@/lib/site';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      url: '/',
      title: <span className="sr-only">Loxa docs</span>,
      transparentMode: 'none',
    },
    links: siteLinks.map(({ label, href, external }) => ({
      text: label,
      url: href,
      external,
    })),
    searchToggle: { enabled: true },
    themeSwitch: { enabled: false },
  };
}
