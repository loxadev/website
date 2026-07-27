'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';

import type { Installer, InstallerId } from '@/lib/installer-catalog';

import styles from './install-command-tabs.module.css';

type InstallCommandTabsProps = Readonly<{
  installers: readonly Installer[];
  defaultInstaller?: InstallerId;
}>;

function selectInitialInstaller(
  installers: readonly Installer[],
  defaultInstaller: InstallerId | undefined,
): Installer | undefined {
  return (
    installers.find((installer) => installer.id === defaultInstaller) ??
    installers.find((installer) => installer.status === 'available') ??
    installers[0]
  );
}

export function InstallCommandTabs({
  installers,
  defaultInstaller,
}: InstallCommandTabsProps) {
  const initialInstaller = selectInitialInstaller(installers, defaultInstaller);
  const [activeId, setActiveId] = useState(initialInstaller?.id ?? '');
  const [copyMessage, setCopyMessage] = useState('');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIdRef = useRef(activeId);
  const copyRequestId = useRef(0);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  if (!initialInstaller) {
    return null;
  }

  function selectInstaller(nextId: InstallerId) {
    activeIdRef.current = nextId;
    copyRequestId.current += 1;
    setActiveId(nextId);
    setCopyMessage('');
  }

  function selectAt(index: number) {
    const nextIndex = (index + installers.length) % installers.length;
    const next = installers[nextIndex];
    selectInstaller(next.id);
    const tab = tabRefs.current[nextIndex];
    tab?.focus();
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectAt(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectAt(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectAt(installers.length - 1);
    }
  }

  async function copyCommand(installer: Extract<Installer, { status: 'available' }>) {
    const requestId = copyRequestId.current + 1;
    copyRequestId.current = requestId;

    if (!navigator.clipboard) {
      setCopyMessage('Could not copy the command. Select and copy it manually.');
      return;
    }

    try {
      await navigator.clipboard.writeText(installer.command);
      if (copyRequestId.current === requestId && activeIdRef.current === installer.id) {
        setCopyMessage(`Copied ${installer.label} command.`);
      }
    } catch {
      if (copyRequestId.current === requestId && activeIdRef.current === installer.id) {
        setCopyMessage('Could not copy the command. Select and copy it manually.');
      }
    }
  }

  return (
    <section className={styles.container} aria-label="Installation methods">
      <div className={styles.tablist} role="tablist" aria-label="Installation methods">
        {installers.map((installer, index) => {
          const isActive = installer.id === activeId;
          const tabId = `installer-${instanceId}-tab-${installer.id}`;
          const panelId = `installer-${instanceId}-panel-${installer.id}`;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={styles.tab}
              id={tabId}
              key={installer.id}
              onClick={() => selectInstaller(installer.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {installer.label}
            </button>
          );
        })}
      </div>

      {installers.map((installer) => {
        const isActive = installer.id === activeId;
        const tabId = `installer-${instanceId}-tab-${installer.id}`;
        const panelId = `installer-${instanceId}-panel-${installer.id}`;

        return (
          <div
            aria-labelledby={tabId}
            className={styles.panel}
            hidden={!isActive}
            id={panelId}
            key={installer.id}
            role="tabpanel"
          >
            {installer.status === 'available' ? (
              <div className={styles.availablePanel}>
                <code className={styles.command}>{installer.command}</code>
                <button
                  className={styles.copyButton}
                  onClick={() => copyCommand(installer)}
                  type="button"
                >
                  Copy {installer.label} command
                </button>
              </div>
            ) : (
              <p className={styles.message}>{installer.message}</p>
            )}
          </div>
        );
      })}

      <p aria-live="polite" className={styles.copyMessage} role="status">
        {copyMessage}
      </p>
    </section>
  );
}
