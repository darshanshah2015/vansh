import { format } from 'date-fns';
import { usePersonTimeline } from '../hooks/usePerson';

interface PersonTimelineProps {
  personId: string;
}

export function PersonTimeline({ personId }: PersonTimelineProps) {
  const { data, isLoading } = usePersonTimeline(personId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No timeline events</p>;
  }

  return (
    <div className="relative space-y-4 pl-6">
      <div className="absolute left-2 top-0 h-full w-0.5 bg-border" />
      {items.map((item: any) => (
        <div key={item.id} className="relative">
          <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <div>
            <p className="text-sm">
              <span className="font-medium">{item.userFirstName} {item.userLastName}</span>{' '}
              <span className="text-muted-foreground">{item.action}d {item.entityType}</span>
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
