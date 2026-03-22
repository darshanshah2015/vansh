import { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { NotificationGroup } from '../components/NotificationGroup';

export default function NotificationsPage() {
  const [page] = useState(1);
  const { data, isLoading } = useNotifications(page, 50);
  const markAllAsRead = useMarkAllAsRead();
  const notifications = data?.items ?? [];

  const hasUnread = notifications.some((n) => !n.isRead);

  const grouped = useMemo(() => {
    const groups: Record<string, { treeName: string | null; items: typeof notifications }> = {};
    for (const item of notifications) {
      const key = item.treeId ?? 'general';
      if (!groups[key]) {
        groups[key] = { treeName: item.treeName, items: [] };
      }
      groups[key].items.push(item);
    }
    return Object.values(groups);
  }, [notifications]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
        {hasUnread && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground">
            You'll be notified when someone makes changes to your tree.
          </p>
        </div>
      )}

      {grouped.map((group, i) => (
        <div key={i} className="mb-4 rounded-lg border border-border">
          <NotificationGroup
            treeName={group.treeName}
            notifications={group.items}
          />
        </div>
      ))}
    </div>
  );
}
