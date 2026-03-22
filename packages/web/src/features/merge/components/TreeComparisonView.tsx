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
  sourcePersons: PersonSummary[];
  targetPersons: PersonSummary[];
  mappings: Mapping[];
  sourceTreeName: string;
  targetTreeName: string;
  selectedSourceId: string | null;
  selectedTargetId: string | null;
  onSelectSource: (id: string | null) => void;
  onSelectTarget: (id: string | null) => void;
}

export default function TreeComparisonView({
  sourcePersons,
  targetPersons,
  mappings,
  sourceTreeName,
  targetTreeName,
  selectedSourceId,
  selectedTargetId,
  onSelectSource,
  onSelectTarget,
}: Props) {
  const mappedSourceIds = new Set(mappings.map((m) => m.sourcePersonId));
  const mappedTargetIds = new Set(
    mappings.map((m) => m.targetPersonId).filter(Boolean) as string[]
  );

  function getMappingStatus(personId: string, side: 'source' | 'target') {
    const mapping = mappings.find(
      side === 'source' ? (m) => m.sourcePersonId === personId : (m) => m.targetPersonId === personId
    );
    if (!mapping) return null;
    if (mapping.resolution) {
      try {
        const res = JSON.parse(mapping.resolution);
        if (res.autoDetected) return 'auto';
      } catch {}
      return 'resolved';
    }
    return 'confirmed';
  }

  const totalMapped = mappings.length;
  const totalConflicts = mappings.filter((m) => !m.resolution).length;
  const totalUnmapped =
    sourcePersons.filter((p) => !mappedSourceIds.has(p.id)).length +
    targetPersons.filter((p) => !mappedTargetIds.has(p.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border-green-200">
          {totalMapped} matched
        </span>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 border-yellow-200">
          {totalConflicts} need resolution
        </span>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 border-gray-200">
          {totalUnmapped} unmatched
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-2">{sourceTreeName}</h3>
          <div className="space-y-2">
            {sourcePersons.map((person) => {
              const status = getMappingStatus(person.id, 'source');
              const isSelected = selectedSourceId === person.id;
              return (
                <button
                  key={person.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : status === 'confirmed' || status === 'resolved'
                        ? 'border-green-300 bg-green-50'
                        : status === 'auto'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectSource(isSelected ? null : person.id)}
                >
                  <div className="font-medium text-sm">
                    {person.firstName} {person.lastName}
                  </div>
                  <div className="text-xs text-text-muted">
                    {person.gotra && <span>{person.gotra}</span>}
                    {person.dateOfBirth && (
                      <span className="ml-2">
                        b. {new Date(person.dateOfBirth).getFullYear()}
                      </span>
                    )}
                  </div>
                  {status && (
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        status === 'confirmed' || status === 'resolved'
                          ? 'text-green-600 border-green-200'
                          : 'text-yellow-600 border-yellow-200'
                      }`}
                    >
                      {status === 'auto' ? 'Auto-detected' : 'Mapped'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-muted mb-2">{targetTreeName}</h3>
          <div className="space-y-2">
            {targetPersons.map((person) => {
              const status = getMappingStatus(person.id, 'target');
              const isSelected = selectedTargetId === person.id;
              return (
                <button
                  key={person.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : status === 'confirmed' || status === 'resolved'
                        ? 'border-green-300 bg-green-50'
                        : status === 'auto'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectTarget(isSelected ? null : person.id)}
                >
                  <div className="font-medium text-sm">
                    {person.firstName} {person.lastName}
                  </div>
                  <div className="text-xs text-text-muted">
                    {person.gotra && <span>{person.gotra}</span>}
                    {person.dateOfBirth && (
                      <span className="ml-2">
                        b. {new Date(person.dateOfBirth).getFullYear()}
                      </span>
                    )}
                  </div>
                  {status && (
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        status === 'confirmed' || status === 'resolved'
                          ? 'text-green-600 border-green-200'
                          : 'text-yellow-600 border-yellow-200'
                      }`}
                    >
                      {status === 'auto' ? 'Auto-detected' : 'Mapped'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
