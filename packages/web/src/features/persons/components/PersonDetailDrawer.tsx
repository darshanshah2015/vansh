import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { usePerson, usePersonRelationships } from '../hooks/usePerson';
import { PersonTimeline } from './PersonTimeline';
import { RelationshipSlots } from './RelationshipSlots';
import { AddPersonForm } from './AddPersonForm';
import { useCreateClaim } from '@/features/claims/hooks/useClaims';
import { useAuth } from '@/shared/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PersonDetailDrawerProps {
  personId: string;
  treeSlug: string;
  onClose: () => void;
}

export function PersonDetailDrawer({ personId, treeSlug, onClose }: PersonDetailDrawerProps) {
  const { data: person, isLoading } = usePerson(personId);
  const { data: relationships } = usePersonRelationships(personId);
  const { user } = useAuth();
  const createClaim = useCreateClaim();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [addRelType, setAddRelType] = useState<string | null>(null);

  const canClaim = person && !person.claimedByUserId && user;

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 h-2/3 rounded-t-xl border-t border-border bg-card shadow-lg md:absolute md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-96 md:rounded-none md:border-l md:border-t-0">
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!person) return null;

  const handleAddFromSlot = (relType: string) => {
    setAddRelType(relType);
    setShowAddPerson(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 h-2/3 rounded-t-xl border-t border-border bg-card shadow-lg md:absolute md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-96 md:rounded-none md:border-l md:border-t-0">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">
            {person.firstName} {person.lastName}
          </h2>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['details', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium capitalize',
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Gender</span>
                  <p className="capitalize">{person.gender}</p>
                </div>
                {person.dateOfBirth && (
                  <div>
                    <span className="text-muted-foreground">Born</span>
                    <p>{format(new Date(person.dateOfBirth), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {person.dateOfDeath && (
                  <div>
                    <span className="text-muted-foreground">Died</span>
                    <p>{format(new Date(person.dateOfDeath), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {person.gotra && (
                  <div>
                    <span className="text-muted-foreground">Gotra</span>
                    <p>{person.gotra}</p>
                  </div>
                )}
              </div>

              {person.bio && (
                <div>
                  <span className="text-sm text-muted-foreground">Bio</span>
                  <p className="mt-1 text-sm">{person.bio}</p>
                </div>
              )}

              {canClaim && (
                <button
                  onClick={() => createClaim.mutate({ personId })}
                  disabled={createClaim.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary/5 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  data-tour="add-person"
                >
                  <UserCheck className="h-4 w-4" />
                  {createClaim.isPending ? 'Claiming...' : 'This is me'}
                </button>
              )}
              {createClaim.isSuccess && (
                <p className="text-xs text-green-600">Claim submitted! Waiting for approval.</p>
              )}

              <RelationshipSlots
                personId={personId}
                relationships={relationships}
                onAddFromSlot={handleAddFromSlot}
              />
            </div>
          ) : (
            <PersonTimeline personId={personId} />
          )}
        </div>
      </div>

      {showAddPerson && (
        <AddPersonForm
          treeSlug={treeSlug}
          prefilledRelType={addRelType}
          relatedPersonId={personId}
          onClose={() => {
            setShowAddPerson(false);
            setAddRelType(null);
          }}
        />
      )}
    </div>
  );
}
