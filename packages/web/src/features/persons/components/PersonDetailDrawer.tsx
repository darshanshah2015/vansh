import { useEffect, useState } from 'react';
import { X, UserCheck, Pencil, Check, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useDeletePerson, usePerson, usePersonRelationships, useUpdatePerson, useUploadPersonPhoto } from '../hooks/usePerson';
import { PersonTimeline } from './PersonTimeline';
import { RelationshipSlots } from './RelationshipSlots';
import { AddPersonForm } from './AddPersonForm';
import { LinkExistingPersonForm } from './LinkExistingPersonForm';
import { DateOfBirthPicker } from '@/shared/components/DateOfBirthPicker';
import { useCreateClaim } from '@/features/claims/hooks/useClaims';
import { useAuth } from '@/shared/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PersonDetailDrawerProps {
  personId: string;
  treeSlug: string;
  onClose: () => void;
  onSelectPerson?: (personId: string) => void;
  onNavigateToFamily?: (personId: string) => void;
  onDone?: () => void;
}

export function PersonDetailDrawer({
  personId,
  treeSlug,
  onClose,
  onSelectPerson,
  onNavigateToFamily,
  onDone,
}: PersonDetailDrawerProps) {
  const { data: person, isLoading } = usePerson(personId);
  const { data: relationships } = usePersonRelationships(personId);
  const { user } = useAuth();
  const createClaim = useCreateClaim();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const uploadPhoto = useUploadPersonPhoto();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showLinkExisting, setShowLinkExisting] = useState(false);
  const [addRelType, setAddRelType] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canClaim = person && !person.claimedByUserId && user;

  useEffect(() => {
    setEditing(false);
    setEditData({});
    setDeleteError(null);
    setActiveTab('details');
  }, [personId]);

  if (isLoading) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 h-2/3 rounded-t-xl border-t border-border bg-card shadow-lg md:absolute md:inset-y-0 md:bottom-0 md:left-auto md:right-0 md:h-full md:w-96 md:rounded-none md:border-l md:border-t-0">
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

  const startEditing = () => {
    setEditData({
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      dateOfBirth: person.dateOfBirth ? format(new Date(person.dateOfBirth), 'yyyy-MM-dd') : '',
      placeOfBirth: person.placeOfBirth ?? '',
      dateOfDeath: person.dateOfDeath ? format(new Date(person.dateOfDeath), 'yyyy-MM-dd') : '',
      gotra: person.gotra ?? '',
      health: person.health ?? '',
      occupation: person.occupation ?? '',
      isAlive: person.isAlive,
      bio: person.bio ?? '',
    });
    setEditing(true);
  };

  const saveEdits = async () => {
    const payload: Record<string, any> = {};
    if (editData.firstName !== person.firstName) payload.firstName = editData.firstName;
    if (editData.lastName !== person.lastName) payload.lastName = editData.lastName;
    if (editData.gender !== person.gender) payload.gender = editData.gender;
    if (editData.placeOfBirth !== (person.placeOfBirth ?? '')) {
      payload.placeOfBirth = editData.placeOfBirth || '';
    }
    if (editData.gotra !== (person.gotra ?? '')) payload.gotra = editData.gotra || null;
    if (editData.health !== (person.health ?? '')) payload.health = editData.health || null;
    if (editData.occupation !== (person.occupation ?? '')) payload.occupation = editData.occupation || null;
    if (editData.bio !== (person.bio ?? '')) payload.bio = editData.bio || null;
    if (editData.isAlive !== person.isAlive) payload.isAlive = editData.isAlive;

    const origDob = person.dateOfBirth ? format(new Date(person.dateOfBirth), 'yyyy-MM-dd') : '';
    if (editData.dateOfBirth !== origDob) {
      payload.dateOfBirth = editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString() : null;
    }
    const origDod = person.dateOfDeath ? format(new Date(person.dateOfDeath), 'yyyy-MM-dd') : '';
    if (editData.dateOfDeath !== origDod) {
      payload.dateOfDeath = editData.dateOfDeath ? new Date(editData.dateOfDeath).toISOString() : null;
    }

    if (Object.keys(payload).length > 0) {
      await updatePerson.mutateAsync({ id: personId, data: payload });
    }
    setEditing(false);
  };

  const handleDoneClick = async () => {
    if (editing) {
      await saveEdits();
    }
    onDone?.();
  };

  const handleDelete = async () => {
    setDeleteError(null);
    const ok = window.confirm(`Delete ${person.firstName} ${person.lastName}? This removes this node and its relationship links.`);
    if (!ok) return;
    try {
      await deletePerson.mutateAsync({ id: personId, treeSlug });
      onClose();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete this node. Please try again.'
      );
    }
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    await uploadPhoto.mutateAsync({ id: personId, file });
  };

  const inputClass = 'h-8 w-full rounded border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 h-2/3 rounded-t-xl border-t border-border bg-card shadow-lg md:absolute md:inset-y-0 md:bottom-0 md:left-auto md:right-0 md:h-full md:w-96 md:rounded-none md:border-l md:border-t-0">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">
            {person.firstName} {person.lastName}
          </h2>
          <div className="flex items-center gap-1">
            {editing ? (
              <button
                onClick={saveEdits}
                disabled={updatePerson.isPending}
                className="rounded-md p-2 text-primary hover:bg-secondary"
                aria-label="Save"
              >
                {updatePerson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary"
                  aria-label="Edit details"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletePerson.isPending}
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  aria-label="Delete node"
                >
                  {deletePerson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </>
            )}
            <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
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
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {deleteError && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          {activeTab === 'details' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-sm font-semibold text-muted-foreground">
                  {person.photoKey ? (
                    <img
                      src={`/api/persons/${person.id}/photo`}
                      alt={`${person.firstName} ${person.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`
                  )}
                </div>
                <div>
                  <label className="inline-flex min-h-[36px] cursor-pointer items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary">
                    {uploadPhoto.isPending ? 'Uploading...' : person.photoKey ? 'Change Photo' : 'Add Photo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => void handlePhotoChange(event.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">First Name</label>
                      <input className={inputClass} value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Last Name</label>
                      <input className={inputClass} value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Gender</label>
                    <div className="flex gap-2">
                      {['male', 'female', 'other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setEditData({ ...editData, gender: g })}
                          className={cn(
                            'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors',
                            editData.gender === g
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-secondary'
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Date of Birth</label>
                    <DateOfBirthPicker value={editData.dateOfBirth} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Place of Birth</label>
                    <input className={inputClass} value={editData.placeOfBirth} onChange={(e) => setEditData({ ...editData, placeOfBirth: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Living</label>
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, isAlive: !editData.isAlive })}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        editData.isAlive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {editData.isAlive ? 'Yes' : 'No'}
                    </button>
                  </div>
                  {!editData.isAlive && (
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Date of Death</label>
                      <DateOfBirthPicker value={editData.dateOfDeath} onChange={(v) => setEditData({ ...editData, dateOfDeath: v })} />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Gotra</label>
                    <input className={inputClass} value={editData.gotra} onChange={(e) => setEditData({ ...editData, gotra: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Occupation</label>
                    <input className={inputClass} value={editData.occupation} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Health</label>
                    <input className={inputClass} value={editData.health} onChange={(e) => setEditData({ ...editData, health: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Bio</label>
                    <textarea
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={3}
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveEdits}
                    disabled={updatePerson.isPending}
                    className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updatePerson.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save changes
                  </button>
                </div>
              ) : (
                <>
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
                    <div>
                      <span className="text-muted-foreground">Birth place</span>
                      <p>{person.placeOfBirth || 'Not added'}</p>
                    </div>
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
                    <div>
                      <span className="text-muted-foreground">Occupation</span>
                      <p>{person.occupation || 'Not added'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Health</span>
                      <p>{person.health || 'Not added'}</p>
                    </div>
                  </div>

                  {!person.placeOfBirth && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Add birth place
                    </button>
                  )}

                  {person.bio && (
                    <div>
                      <span className="text-sm text-muted-foreground">Bio</span>
                      <p className="mt-1 text-sm">{person.bio}</p>
                    </div>
                  )}
                </>
              )}

              {!editing && canClaim && (
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

              {!editing && (
                <RelationshipSlots
                  personId={personId}
                  personFirstName={person.firstName}
                  relationships={relationships}
                  onAddFromSlot={handleAddFromSlot}
                  onLinkExisting={() => setShowLinkExisting(true)}
                  onSelectPerson={onSelectPerson}
                  onNavigateToFamily={onNavigateToFamily}
                />
              )}
            </div>
          ) : (
            <PersonTimeline personId={personId} />
          )}
        </div>

        {onDone && (
          <div className="sticky bottom-0 z-10 border-t border-border bg-card p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
            <button
              type="button"
              onClick={handleDoneClick}
              disabled={updatePerson.isPending}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updatePerson.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Done
            </button>
          </div>
        )}
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

      {showLinkExisting && (
        <LinkExistingPersonForm
          treeSlug={treeSlug}
          personId={personId}
          relationships={relationships}
          onClose={() => setShowLinkExisting(false)}
        />
      )}
    </div>
  );
}
