export type InstallerId = 'curl' | 'npm' | 'cargo' | 'pip-uv' | 'brew';
export type InstallerLabel = 'curl' | 'npm' | 'cargo' | 'pip / uv' | 'brew';

export type Installer =
  | Readonly<{ id: InstallerId; label: InstallerLabel; status: 'available'; command: string }>
  | Readonly<{
      id: InstallerId;
      label: InstallerLabel;
      status: 'development' | 'coming-soon';
      message: string;
    }>;

export const INSTALLERS: readonly Installer[] = [
  {
    id: 'curl',
    label: 'curl',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'npm',
    label: 'npm',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'cargo',
    label: 'cargo',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'pip-uv',
    label: 'pip / uv',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  { id: 'brew', label: 'brew', status: 'coming-soon', message: 'Coming soon.' },
] as const satisfies readonly Installer[];
