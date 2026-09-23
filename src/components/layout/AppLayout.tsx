import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Wifi, WifiOff, CloudSync, UserCircle2, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../ui/Logo';
import { useAuthStore, type Role } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';

export default function AppLayout() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, login } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  ];

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-muted/30">
      {/* Desktop Sidebar (macOS/iPadOS style) */}
      <aside className="hidden w-64 flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl md:flex shadow-sm z-10">
        <div className="flex h-14 items-center px-6 pt-4 pb-2">
          <span className="flex items-center gap-2.5 font-semibold text-lg text-foreground tracking-tight">
            <Logo className="w-6 h-6 text-primary" />
            GABAY
          </span>
        </div>
        
        <div className="flex-1 overflow-auto py-4 px-3 flex flex-col gap-6">
          <div>
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</div>
            <nav className="grid items-start gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Sidebar Area - Profile & SY */}
        <div className="p-4 border-t border-border/50 flex flex-col gap-3 bg-background/40">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground px-1">School Year</div>
            <select 
              className="text-sm bg-black/5 dark:bg-white/10 border-none rounded-lg focus:ring-2 focus:ring-primary py-1.5 px-2 cursor-pointer font-medium outline-none"
              value={useSettingsStore((state) => state.activeSchoolYear)}
              onChange={(e) => useSettingsStore.getState().setActiveSchoolYear(e.target.value)}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground px-1">Active Role</div>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/10 p-1.5 rounded-lg">
              <UserCircle2 className="h-4 w-4 text-foreground/70 ml-1" />
              <select 
                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer font-medium w-full outline-none"
                value={user?.role || 'Guidance'}
                onChange={(e) => {
                  const role = e.target.value as Role;
                  login({ id: 'u-1', name: `MVP ${role}`, role });
                }}
              >
                <option value="Teacher">Teacher</option>
                <option value="Guidance">Guidance</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Top App Bar (iOS style frosted) */}
        <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background/70 backdrop-blur-xl px-4 lg:px-6 z-10 sticky top-0">
          <div className="flex items-center gap-2.5 font-semibold text-lg md:hidden text-foreground tracking-tight">
            <Logo className="w-6 h-6 text-primary" />
            GABAY
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 md:ml-auto">
            
            <div className="flex items-center gap-4 text-sm font-medium">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CloudSync className="h-4 w-4" />
                <span className="hidden md:inline">3 pending syncs</span>
                <span className="md:hidden">3</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                  isOnline
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation (iOS Tab Bar style) */}
        <nav className="flex h-[80px] pb-4 border-t border-border/50 bg-background/80 backdrop-blur-xl md:hidden z-10 sticky bottom-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors pt-2",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
