import { cn } from '@/lib/utils';

const COMMON_GOTRAS = ['Khandelwal', 'Oswal', 'Porwal', 'Agarwal'];

export function SearchFilterChips({ selectedGotra, onGotraChange }: { selectedGotra: string | null; onGotraChange: (g: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onGotraChange(null)}
        className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', !selectedGotra ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
        All
      </button>
      {COMMON_GOTRAS.map((g) => (
        <button key={g} onClick={() => onGotraChange(selectedGotra === g ? null : g)}
          className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', selectedGotra === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
          {g}
        </button>
      ))}
    </div>
  );
}
