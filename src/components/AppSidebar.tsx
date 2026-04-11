import { ShoppingCart, Package, Users, TrendingUp, UserCheck, AlertCircle, CalendarDays } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Minimarket', url: '/', icon: ShoppingCart },
  { title: 'Update Stok', url: '/stok', icon: Package },
  { title: 'Anggota', url: '/anggota', icon: Users },
  { title: 'Laporan Laba/Rugi', url: '/laporan', icon: TrendingUp },
  { title: 'Laporan per Anggota', url: '/laporan-anggota', icon: UserCheck },
  { title: 'Loss Profit', url: '/loss-profit', icon: AlertCircle },
  { title: 'Laporan Akhir Tahun', url: '/laporan-tahunan', icon: CalendarDays },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="w-10 h-10 rounded-[10px] bg-primary flex items-center justify-center text-xl flex-shrink-0">
            🛒
          </div>
          {!collapsed && (
            <div>
              <div className="text-sidebar-primary-foreground font-bold text-base leading-tight">Yasa Shop</div>
              <div className="text-sidebar-foreground text-xs">Sistem Kasir</div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
