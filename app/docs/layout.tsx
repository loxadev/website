import type { CSSProperties, ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function DocumentationLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.pageTree}
      tabs={false}
      containerProps={{
        style: {
          '--fd-layout-width': '90rem',
          '--fd-sidebar-width': '268px',
          '--fd-toc-width': '240px',
        } as CSSProperties,
      }}
    >
      {children}
    </DocsLayout>
  );
}
