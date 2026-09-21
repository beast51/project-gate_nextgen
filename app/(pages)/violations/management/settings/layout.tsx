import { Sidebar } from '@/widgetsLayer/Sidebar';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // the header of this page holds the filters of the journals
  return <Sidebar type="journal">{children}</Sidebar>;
}
