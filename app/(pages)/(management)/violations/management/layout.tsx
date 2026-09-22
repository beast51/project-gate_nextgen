// The black list is its own section, not a page inside the violations section: nested, it would get the header,
// the footer and the top padding of both layouts (a second header over the first, 64px too much of scroll).
// The route group keeps the URL /violations/management.
import { Sidebar } from '@/widgetsLayer/Sidebar';

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar type="violationsManagement" title="">
      <div className="full-height pt64">
        {children}
      </div>
    </Sidebar>
  );
}
