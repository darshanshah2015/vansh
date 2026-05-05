import { usePerson } from '../hooks/usePerson';

interface PersonMiniCardProps {
  personId: string;
  onClick?: () => void;
}

export function PersonMiniCard({ personId, onClick }: PersonMiniCardProps) {
  const { data: person } = usePerson(personId);

  if (!person) {
    return <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open ${person.firstName} ${person.lastName} details`}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
        {person.firstName[0]}{person.lastName[0]}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{person.firstName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{person.lastName}</p>
        <p className="text-[10px] font-medium text-primary">Edit details</p>
      </div>
    </button>
  );
}
