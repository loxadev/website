import { INSTALLERS } from '@/lib/installer-catalog';

export function InstallStatusList() {
  return (
    <ul aria-label="Installation methods">
      {INSTALLERS.map((installer) => (
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
