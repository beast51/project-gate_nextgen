import { Sidebar } from '@/widgetsLayer/Sidebar';
import React from 'react';

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar type="callsList" title="">
      <div className="full-height pt64">{children}</div>
    </Sidebar>
  );
}
