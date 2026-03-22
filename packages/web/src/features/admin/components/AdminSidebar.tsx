import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, TreePine, Trash2, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStats } from '../hooks/useAdmin';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, badgeKey: 'pendingVerifications' as const },
  { to: '/admin/trees', label: 'Trees', icon: TreePine },
  { to: '/admin/deletions', label: 'Deletions', icon: Trash2, badgeKey: 'pendingDeletions' as const },
  { to: '/admin/merges', label: 'Merges', icon: GitMerge, badgeKey: 'pendingMerges' as const },
];

export function AdminSidebar() {
  const location = useLocation();
  const { data: stats } = useDashboardStats();

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-3 md:mb-0 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
      {links.map((link) => {
        const isActive =
          link.to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(link.to);
        const badge = link.badgeKey && stats ? stats[link.badgeKey] : 0;

        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            <span>{link.label}</span>
            {badge != null && badge > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
