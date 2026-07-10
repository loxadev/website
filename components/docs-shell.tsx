'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { CSSProperties, ReactNode } from 'react';

import { DocsToolbar } from '@/components/docs-toolbar';
import { baseOptions } from '@/lib/layout.shared';

const layoutStyle = {
  '--fd-layout-width': '90rem',
  '--fd-sidebar-width': '268px',
} as CSSProperties;

export function DocsShell({
  children,
  tree,
}: Readonly<{ children: ReactNode; tree: Root }>) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={tree}
      tabs={false}
      slots={{ header: DocsToolbar }}
      containerProps={{ style: layoutStyle }}
    >
      {children}
    </DocsLayout>
  );
}
