import { useMemo } from 'react';
import { isToday } from 'date-fns';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { NotificationGroup } from './NotificationGroup';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const notifications = data?.items ?? [];

  const { today, earlier } = useMemo(() => {
    const t: typeof notifications = [];
    const e: typeof notifications = [];
    for (const n of notifications) {
      if (isToday(new Date(n.createdAt))) {
        t.push(n);
      } else {
        e.push(n);
      }
    }
    return { today: t, earlier: e };
  }, [notifications]);

  const groupByTree = (items: typeof notifications) => {
    const groups: Record<string, { treeName: string | null; items: typeof notifications }> = {};
    for (const item of items) {
      const key = item.treeId ?? 'general';
      if (!groups[key]) {
        groups[key] = { treeName: item.treeName, items: [] };
      }
      groups[key].items.push(item);
    }
    return Object.values(groups);
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex max-h-96 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">Notifications</span>
        {hasUnread && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}

        {today.length > 0 && (
          <div>
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Today</span>
            </div>
            {groupByTree(today).map((group, i) => (
              <NotificationGroup
                key={i}
                treeName={group.treeName}
                notifications={group.items}
                onClose={onClose}
              />
            ))}
          </div>
        )}

        {earlier.length > 0 && (
          <div>
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Earlier</span>
            </div>
            {groupByTree(earlier).map((group, i) => (
              <NotificationGroup
                key={i}
                treeName={group.treeName}
                notifications={group.items}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
