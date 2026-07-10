import type { ReactNode } from 'react';

import { DocsShell } from '@/components/docs-shell';
import { source } from '@/lib/source';

export default function DocumentationLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <DocsShell tree={source.pageTree}>{children}</DocsShell>;
}
