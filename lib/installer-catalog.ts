export type InstallerId = 'curl' | 'npm' | 'cargo' | 'pip-uv' | 'brew';
export type InstallerLabel = 'curl' | 'npm' | 'cargo' | 'pip / uv' | 'brew';

export type Installer =
  | Readonly<{ id: InstallerId; label: InstallerLabel; status: 'available'; command: string }>
  | Readonly<{
      id: InstallerId;
      label: InstallerLabel;
      status: 'development';
      message: string;
    }>;

export const INSTALLERS: readonly Installer[] = [
  {
    id: 'curl',
    label: 'curl',
    status: 'development',
    message: 'Not available yet.',
  },
  {
    id: 'npm',
    label: 'npm',
    status: 'development',
    message: 'Not available yet.',
  },
  {
    id: 'cargo',
    label: 'cargo',
    status: 'development',
    message: 'Not available yet.',
  },
  {
    id: 'pip-uv',
    label: 'pip / uv',
    status: 'development',
    message: 'Not available yet.',
  },
  { id: 'brew', label: 'brew', status: 'development', message: 'Not available yet.' },
] as const satisfies readonly Installer[];

export function installerDocumentationDetail(installer: Installer): string {
  if (installer.status === 'available') return installer.command;
  return installer.message;
}
