import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  userFirstName: string;
  userLastName: string;
}

export function TreeActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
            {item.userFirstName?.[0]}{item.userLastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{item.userFirstName} {item.userLastName}</span>{' '}
              <span className="text-muted-foreground">{item.action}d a {item.entityType}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
