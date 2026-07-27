import type { Installer } from '@/lib/installer-catalog';

type InstallStatusListProps = Readonly<{
  installers: readonly Installer[];
}>;

export function InstallStatusList({ installers }: InstallStatusListProps) {
  return (
    <ul aria-label="Installation methods">
      {installers.map((installer) => (
        <li key={installer.id}>
          <strong>{installer.label}</strong>
          <p>
            {installer.status === 'available' ? installer.command : installer.message}
          </p>
        </li>
      ))}
    </ul>
  );
}
