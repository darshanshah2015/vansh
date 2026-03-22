import { Link, useLocation } from 'react-router-dom';
import { Home, TreePine, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyTree } from '@/shared/hooks/useMyTree';

export function MobileBottomNav() {
  const location = useLocation();
  const { myTreePath } = useMyTree();

  const navItems = [
    { to: '/trees', label: 'Home', icon: Home },
    { to: myTreePath, label: 'My Tree', icon: TreePine },
    { to: '/search', label: 'Search', icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
