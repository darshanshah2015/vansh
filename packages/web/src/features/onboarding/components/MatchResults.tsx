import { Users } from 'lucide-react';

interface Match {
  personId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gotra: string | null;
  treeId: string;
  treeName: string;
  treeSlug: string;
  confidence: number;
}

interface MatchResultsProps {
  matches: Match[];
  onConfirm: (match: Match) => void;
  onDismissAll: () => void;
}

export function MatchResults({ matches, onConfirm, onDismissAll }: MatchResultsProps) {
  if (matches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">We found potential matches</h2>
        <p className="text-sm text-muted-foreground">
          These people in existing trees may be you. Claiming a match lets you join their tree.
        </p>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.personId} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {match.firstName} {match.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    in <span className="font-medium">{match.treeName}</span>
                  </p>
                  {match.gotra && (
                    <p className="text-xs text-muted-foreground">Gotra: {match.gotra}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary">
                  {match.confidence}% match
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onConfirm(match)}
                className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                This is me
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onDismissAll}
        className="w-full rounded-md border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
      >
        None of these are me &mdash; create a new tree
      </button>
    </div>
  );
}
