import { cn } from '@/lib/utils';

interface TreeNodeProps {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date | null;
    dateOfDeath?: Date | null;
    isAlive: boolean;
    photoKey: string | null;
    gender: string;
  };
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

export function TreeNode({ person, isSelected, onClick }: TreeNodeProps) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
  const birthYear = person.dateOfBirth ? new Date(person.dateOfBirth).getFullYear() : null;
  const deathYear = person.dateOfDeath ? new Date(person.dateOfDeath).getFullYear() : null;
  const yearRange = birthYear
    ? `${birthYear}${deathYear ? ` - ${deathYear}` : person.isAlive ? '' : ' - ?'}`
    : '';

  return (
    <button
      onClick={() => onClick?.(person.id)}
      className={cn(
        'flex min-h-[44px] min-w-[44px] flex-col items-center gap-1 rounded-lg border border-border bg-card p-2 shadow-sm transition-colors hover:border-primary',
        isSelected && 'border-primary ring-2 ring-primary/20',
        !person.isAlive && 'opacity-70 grayscale'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium',
          person.gender === 'male'
            ? 'bg-blue-100 text-blue-700'
            : person.gender === 'female'
              ? 'bg-pink-100 text-pink-700'
              : 'bg-gray-100 text-gray-700'
        )}
      >
        {person.photoKey ? (
          <img
            src={`/api/persons/${person.id}/photo`}
            alt={`${person.firstName} ${person.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            loading="lazy"
          />
        ) : (
          initials
        )}
      </div>
      <span className="max-w-[80px] truncate text-xs font-medium">
        {person.firstName} {person.lastName}
      </span>
      {yearRange && <span className="text-[10px] tabular-nums text-muted-foreground">{yearRange}</span>}
    </button>
  );
}
