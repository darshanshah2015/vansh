import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateOfBirthPicker } from '@/shared/components/DateOfBirthPicker';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;
import { useAddPerson, useAddRelationship, usePersonRelationships, useUploadPersonPhoto } from '../hooks/usePerson';
import { ApiError } from '@/shared/services/api';

const personSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  health: z.string().optional(),
  occupation: z.string().optional(),
  gotra: z.string().optional(),
});

type PersonForm = z.infer<typeof personSchema>;

interface AddPersonFormProps {
  treeSlug: string;
  prefilledRelType: string | null;
  relatedPersonId: string | null;
  onClose: () => void;
  title?: string;
  intro?: string;
  submitLabel?: string;
}

export function AddPersonForm({
  treeSlug,
  prefilledRelType,
  relatedPersonId,
  onClose,
  title = 'Add Person',
  intro,
  submitLabel = 'Add Person',
}: AddPersonFormProps) {
  const addPerson = useAddPerson(treeSlug);
  const addRelationship = useAddRelationship(treeSlug);
  const uploadPhoto = useUploadPersonPhoto();
  const { data: existingRels } = usePersonRelationships(relatedPersonId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PersonForm>({ resolver: zodResolver(personSchema) });

  const onSubmit = async (data: PersonForm) => {
    setError(null);
    try {
      const result = await addPerson.mutateAsync({
        ...data,
        lastName: data.lastName?.trim() || '',
        gender: data.gender || 'other',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
      });

      if (prefilledRelType && relatedPersonId) {
        const newPersonId = (result as any).data.id;
        let relData;

        if (prefilledRelType === 'add_parent') {
          // New person is parent, existing person is child
          relData = { personId1: newPersonId, personId2: relatedPersonId, relationshipType: 'parent_child' };
        } else if (prefilledRelType === 'add_child') {
          // Existing person is parent, new person is child
          relData = { personId1: relatedPersonId, personId2: newPersonId, relationshipType: 'parent_child' };
        } else if (prefilledRelType === 'add_sibling') {
          // Prefer shared parents; if parents are unknown, keep a direct sibling link.
          const parentRels = (existingRels?.direct ?? []).filter(
            (r: any) => r.relationshipType === 'parent_child' && r.personId2 === relatedPersonId
          );
          if (parentRels.length > 0) {
            for (const pr of parentRels) {
              await addRelationship.mutateAsync({
                personId1: pr.personId1,
                personId2: newPersonId,
                relationshipType: 'parent_child',
              });
            }
            relData = null; // Already handled
          } else {
            relData = {
              personId1: relatedPersonId,
              personId2: newPersonId,
              relationshipType: 'half_sibling',
            };
          }
        } else {
          // Spouse or other: existing person → new person
          relData = { personId1: relatedPersonId, personId2: newPersonId, relationshipType: prefilledRelType };
        }

        if (relData) {
          await addRelationship.mutateAsync(relData);
        }
      }

      if (photoFile) {
        const newPersonId = (result as any).data.id;
        await uploadPhoto.mutateAsync({ id: newPersonId, file: photoFile });
      }

      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to add person');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-card p-4 pb-20 md:rounded-xl md:pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {intro && <p className="mt-1 text-xs text-muted-foreground">{intro}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ap-firstName" className="mb-1 block text-xs font-medium">
                Name
              </label>
              <input
                id="ap-firstName"
                type="text"
                autoComplete="off"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="ap-lastName" className="mb-1 block text-xs font-medium">
                Family or surname
              </label>
              <input
                id="ap-lastName"
                type="text"
                autoComplete="off"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Gender</label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <div className="flex gap-2">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(field.value === opt.value ? undefined : opt.value)}
                      className={cn(
                        'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                        field.value === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Optional. Leave blank if unknown.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Date of Birth</label>
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <DateOfBirthPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <label htmlFor="ap-placeOfBirth" className="mb-1 block text-xs font-medium">
              Place of Birth
            </label>
            <input
              id="ap-placeOfBirth"
              type="text"
              autoComplete="off"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('placeOfBirth')}
            />
          </div>

          <div>
            <label htmlFor="ap-gotra" className="mb-1 block text-xs font-medium">
              Gotra
            </label>
            <input
              id="ap-gotra"
              type="text"
              autoComplete="off"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('gotra')}
            />
          </div>

          <div>
            <label htmlFor="ap-occupation" className="mb-1 block text-xs font-medium">
              Occupation
            </label>
            <input
              id="ap-occupation"
              type="text"
              autoComplete="off"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('occupation')}
            />
          </div>

          <div>
            <label htmlFor="ap-health" className="mb-1 block text-xs font-medium">
              Health
            </label>
            <input
              id="ap-health"
              type="text"
              autoComplete="off"
              placeholder="Optional notes"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('health')}
            />
          </div>

          <div>
            <label htmlFor="ap-photo" className="mb-1 block text-xs font-medium">
              Photo
            </label>
            <input
              id="ap-photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={addPerson.isPending || uploadPhoto.isPending}
            className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {addPerson.isPending || uploadPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
