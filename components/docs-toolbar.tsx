'use client';

import type { Node } from 'fumadocs-core/page-tree';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTreeContext } from 'fumadocs-ui/contexts/tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type MouseEvent, useEffect, useRef, useState } from 'react';

import styles from './docs-toolbar.module.css';

function TreeLinks({
  nodes,
  pathname,
  onNavigate,
}: Readonly<{
  nodes: Node[];
  pathname: string;
  onNavigate: () => void;
}>) {
  return (
    <ul className={styles.list}>
      {nodes.map((node, index) => {
        const key =
          node.$id ?? (node.type === 'page' ? node.url : `${node.type}-${index}`);

        if (node.type === 'separator') {
          return node.name ? (
            <li className={styles.sectionLabel} key={key}>
              {node.name}
            </li>
          ) : null;
        }

        if (node.type === 'folder') {
          return (
            <li className={styles.folder} key={key}>
              <p className={styles.sectionLabel}>{node.name}</p>
              {node.index ? (
                <Link
                  className={styles.link}
                  href={node.index.url}
                  aria-current={pathname === node.index.url ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  Overview
                </Link>
              ) : null}
              <TreeLinks
                nodes={node.children}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            </li>
          );
        }

        return (
          <li key={key}>
            <Link
              className={styles.link}
              href={node.url}
              aria-current={pathname === node.url ? 'page' : undefined}
              onClick={onNavigate}
              {...(node.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {node.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DocsToolbar() {
  const { root } = useTreeContext();
  const { setOpenSearch } = useSearchContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!window.matchMedia) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    function closeAtDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    desktop.addEventListener('change', closeAtDesktop);
    return () => desktop.removeEventListener('change', closeAtDesktop);
  }, []);

  function finishClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) setOpen(false);
  }

  return (
    <div className={styles.toolbar}>
      <span className={styles.label}>Documentation</span>
      <button
        className={styles.control}
        type="button"
        aria-label="Search documentation"
        onClick={() => setOpenSearch(true)}
      >
        Search
      </button>
      <button
        ref={triggerRef}
        className={styles.control}
        type="button"
        aria-label="Open documentation navigation"
        aria-controls="docs-navigation-dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Menu
      </button>

      <dialog
        ref={dialogRef}
        id="docs-navigation-dialog"
        className={styles.drawer}
        aria-labelledby="docs-navigation-title"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={closeFromBackdrop}
        onClose={finishClose}
      >
        <div className={styles.drawerSurface}>
          <div className={styles.drawerTop}>
            <p id="docs-navigation-title">Documentation</p>
            <button
              className={styles.control}
              type="button"
              aria-label="Close documentation navigation"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className={styles.navigation} aria-label="Documentation">
            <TreeLinks
              nodes={root.children}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      </dialog>
    </div>
  );
}
