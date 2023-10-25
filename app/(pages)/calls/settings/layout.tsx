import { Sidebar } from '@/widgetsLayer/Sidebar';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Sidebar type="settings">{children}</Sidebar>;
}
