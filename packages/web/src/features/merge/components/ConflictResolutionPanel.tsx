import { useState } from 'react';

interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gotra: string | null;
  gender: string;
}

interface Mapping {
  id: string;
  sourcePersonId: string;
  targetPersonId: string | null;
  resolution: string | null;
}

interface Props {
  mapping: Mapping;
  sourcePerson: PersonSummary | undefined;
  targetPerson: PersonSummary | undefined;
  onResolve: (mappingId: string, resolution: string) => void;
  isResolving: boolean;
}

const FIELDS = ['firstName', 'lastName', 'dateOfBirth', 'gotra', 'gender'] as const;
const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  gotra: 'Gotra',
  gender: 'Gender',
};

export default function ConflictResolutionPanel({
  mapping,
  sourcePerson,
  targetPerson,
  onResolve,
  isResolving,
}: Props) {
  const [selections, setSelections] = useState<Record<string, 'source' | 'target'>>({});

  if (!sourcePerson || !targetPerson) return null;

  const conflicts = FIELDS.filter((field) => {
    const sv = sourcePerson[field];
    const tv = targetPerson[field];
    if (!sv && !tv) return false;
    return sv !== tv;
  });

  if (conflicts.length === 0) {
    return (
      <div className="p-3 rounded border border-green-200 bg-green-50 text-sm text-green-700">
        No conflicts - persons have matching data.
      </div>
    );
  }

  const handleResolve = () => {
    const fields: Record<string, unknown> = {};
    for (const field of conflicts) {
      const pick = selections[field] || 'target';
      fields[field] = pick === 'source' ? sourcePerson[field] : targetPerson[field];
    }
    onResolve(mapping.id, JSON.stringify({ fields }));
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.match(/^\d{4}-/)) {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">
        Resolve conflicts: {sourcePerson.firstName} {sourcePerson.lastName}
      </h4>
      <div className="space-y-2">
        {conflicts.map((field) => (
          <div key={field} className="p-3 rounded border border-border">
            <div className="text-xs text-text-muted mb-2">{FIELD_LABELS[field]}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`p-2 rounded text-sm text-left transition-colors ${
                  selections[field] === 'source'
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-gray-50 border border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelections((s) => ({ ...s, [field]: 'source' }))}
              >
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mb-1">
                  Source
                </span>
                <div>{formatValue(sourcePerson[field])}</div>
              </button>
              <button
                className={`p-2 rounded text-sm text-left transition-colors ${
                  selections[field] === 'target' || !selections[field]
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-gray-50 border border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelections((s) => ({ ...s, [field]: 'target' }))}
              >
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mb-1">
                  Target
                </span>
                <div>{formatValue(targetPerson[field])}</div>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        onClick={handleResolve}
        disabled={isResolving}
      >
        {isResolving ? 'Saving...' : 'Save Resolution'}
      </button>
    </div>
  );
}
