import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { TreePine, User, LogOut, Search, Menu, X, Shield, HelpCircle, Download, Home } from 'lucide-react';

import { NotificationBell } from './NotificationBell';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useMyTree } from '@/shared/hooks/useMyTree';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';
import { InstallInstructionsDialog } from './InstallInstructionsDialog';
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt';
import { cn } from '@/lib/utils';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { myTreePath } = useMyTree();
  const { canInstall, canPromptNatively, isInstalled, instructions, promptInstall } = useInstallPrompt();

  const handleInstallClick = async () => {
    setProfileOpen(false);
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') setInstallDialogOpen(true);
    } else {
      setInstallDialogOpen(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/onboarding', label: 'Home', icon: Home },
    { to: myTreePath, label: 'My Tree', icon: TreePine },
    { to: '/trees', label: 'Browse Trees', icon: Search },
    { to: '/search', label: 'Search', icon: Search },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out md:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-border bg-card flex flex-col transition-transform duration-300 ease-in-out md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative flex h-14 items-center justify-center border-b border-border px-4">
          <img src="/logo-text.png" alt="Vansh" className="h-8 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 rounded-md p-1 hover:bg-secondary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname.startsWith(link.to)
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center justify-center border-b border-border px-4">
          <img src="/logo-text.png" alt="Vansh" className="h-8 w-auto" />
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname.startsWith(link.to)
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="relative flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 hover:bg-secondary md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <img src="/logo-text.png" alt="Vansh" className="h-7 w-auto" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
                aria-label="Profile menu"
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-card py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      window.dispatchEvent(new CustomEvent('vansh:start-tour'));
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </button>
                  {!isInstalled && canInstall && (
                    <button
                      onClick={handleInstallClick}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                    >
                      <Download className="h-4 w-4" />
                      Install App
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav />

        {/* PWA Install Prompt */}
        <InstallPrompt />
        <InstallInstructionsDialog
          open={installDialogOpen}
          instructions={instructions}
          onClose={() => setInstallDialogOpen(false)}
        />
      </div>
    </div>
  );
}
