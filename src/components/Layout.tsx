import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="h-12 shrink-0 items-center border-b bg-card px-2 md:hidden flex">
            <SidebarTrigger />
          </header>
          <main className="flex-1 min-h-0 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
