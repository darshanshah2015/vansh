import { format } from 'date-fns';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: Date | null;
  isAlive: boolean;
  gotra: string | null;
}

export function TreeListView({ persons, onPersonClick }: { persons: Person[]; onPersonClick: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gender</th>
            <th className="hidden px-3 py-2 text-left font-medium text-muted-foreground sm:table-cell">DOB</th>
            <th className="hidden px-3 py-2 text-left font-medium text-muted-foreground md:table-cell">Gotra</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {persons.map((p) => (
            <tr key={p.id} onClick={() => onPersonClick(p.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPersonClick(p.id); } }} tabIndex={0} role="button" aria-label={`View ${p.firstName} ${p.lastName}`} className="cursor-pointer border-b border-border hover:bg-secondary/50 focus:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <td className="px-3 py-2 font-medium">{p.firstName} {p.lastName}</td>
              <td className="px-3 py-2 capitalize">{p.gender}</td>
              <td className="hidden px-3 py-2 sm:table-cell">{p.dateOfBirth ? format(new Date(p.dateOfBirth), 'dd MMM yyyy') : '-'}</td>
              <td className="hidden px-3 py-2 md:table-cell">{p.gotra || '-'}</td>
              <td className="px-3 py-2"><span className={p.isAlive ? 'text-primary' : 'text-muted-foreground'}>{p.isAlive ? 'Living' : 'Deceased'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
