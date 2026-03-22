import { Link2, X } from 'lucide-react';

interface Mapping {
  id: string;
  sourcePersonId: string;
  targetPersonId: string | null;
  resolution: string | null;
}

interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  selectedSourceId: string | null;
  selectedTargetId: string | null;
  mappings: Mapping[];
  sourcePersons: PersonSummary[];
  targetPersons: PersonSummary[];
  onLink: (sourcePersonId: string, targetPersonId: string) => void;
  onUnlink: (mappingId: string) => void;
  isLinking: boolean;
}

export default function MergeNodeMapper({
  selectedSourceId,
  selectedTargetId,
  mappings,
  sourcePersons,
  targetPersons,
  onLink,
  onUnlink,
  isLinking,
}: Props) {
  const canLink = selectedSourceId && selectedTargetId;

  const getPersonName = (id: string, side: 'source' | 'target') => {
    const list = side === 'source' ? sourcePersons : targetPersons;
    const person = list.find((p) => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={!canLink || isLinking}
          onClick={() => {
            if (selectedSourceId && selectedTargetId) {
              onLink(selectedSourceId, selectedTargetId);
            }
          }}
        >
          <Link2 className="h-4 w-4 mr-1" />
          {isLinking ? 'Linking...' : 'Link Selected'}
        </button>
        <p className="text-sm text-text-muted">
          {canLink
            ? 'Click to link the selected persons'
            : 'Select one person from each tree to create a mapping'}
        </p>
      </div>

      {mappings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Mappings</h4>
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="flex items-center justify-between p-2 rounded border border-green-200 bg-green-50"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {getPersonName(mapping.sourcePersonId, 'source')}
                </span>
                <Link2 className="h-3 w-3 text-green-600" />
                <span className="font-medium">
                  {mapping.targetPersonId
                    ? getPersonName(mapping.targetPersonId, 'target')
                    : 'Unmapped'}
                </span>
              </div>
              <button
                className="h-7 w-7 p-0 inline-flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
                onClick={() => onUnlink(mapping.id)}
                aria-label="Remove mapping"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
