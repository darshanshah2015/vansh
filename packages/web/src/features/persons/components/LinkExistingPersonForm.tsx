import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTreePersons } from '@/features/trees/hooks/useTree';
import { useAddRelationship } from '../hooks/usePerson';
import { ApiError } from '@/shared/services/api';

interface LinkExistingPersonFormProps {
  treeSlug: string;
  personId: string;
  relationships: any;
  onClose: () => void;
}

const relationOptions = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
] as const;

export function LinkExistingPersonForm({
  treeSlug,
  personId,
  relationships,
  onClose,
}: LinkExistingPersonFormProps) {
  const { data: persons = [] } = useTreePersons(treeSlug);
  const addRelationship = useAddRelationship(treeSlug);
  const [relation, setRelation] = useState<(typeof relationOptions)[number]['value']>('parent');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(
    () => persons.filter((person: any) => person.id !== personId),
    [persons, personId]
  );

  const linkExisting = async () => {
    if (!targetId) return;
    setError(null);
    try {
      if (relation === 'parent') {
        await addRelationship.mutateAsync({
          personId1: targetId,
          personId2: personId,
          relationshipType: 'parent_child',
        });
      } else if (relation === 'child') {
        await addRelationship.mutateAsync({
          personId1: personId,
          personId2: targetId,
          relationshipType: 'parent_child',
        });
      } else if (relation === 'spouse') {
        await addRelationship.mutateAsync({
          personId1: personId,
          personId2: targetId,
          relationshipType: 'spouse',
        });
      } else {
        const parentRels = (relationships?.direct ?? []).filter(
          (r: any) => r.relationshipType === 'parent_child' && r.personId2 === personId
        );
        if (parentRels.length === 0) {
          throw new Error('Add a parent first, then this member can be linked as a sibling.');
        }
        for (const parentRel of parentRels) {
          await addRelationship.mutateAsync({
            personId1: parentRel.personId1,
            personId2: targetId,
            relationshipType: 'parent_child',
          });
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Could not link member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="w-full max-w-md rounded-t-xl bg-card p-4 pb-20 md:rounded-xl md:pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Link existing member</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect someone already in this tree to this member.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Relationship</label>
            <div className="grid grid-cols-2 gap-2">
              {relationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRelation(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    relation === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="link-person" className="mb-1 block text-xs font-medium">
              Existing member
            </label>
            <select
              id="link-person"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Choose a member</option>
              {candidates.map((person: any) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!targetId || addRelationship.isPending}
            onClick={linkExisting}
            className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {addRelationship.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
