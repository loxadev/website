import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';

import { ibmPlexMono, instrumentSans } from '@/app/fonts';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { siteConfig } from '@/lib/site';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Loxa | Inspect local AI hardware and model files',
    template: '%s | Loxa',
  },
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: siteConfig.name,
    title: 'Loxa | Inspect local AI hardware and model files',
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={[instrumentSans.variable, ibmPlexMono.variable].join(' ')}>
        <RootProvider
          search={{
            options: { type: 'static' },
          }}
          theme={{
            attribute: 'class',
            defaultTheme: 'system',
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          <a className="skipLink" href="#main-content">
            Skip to content
          </a>
          <SiteHeader />
          <div className="siteContent">{children}</div>
          <SiteFooter />
        </RootProvider>
      </body>
    </html>
  );
}
