import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateOfBirthPicker } from '@/shared/components/DateOfBirthPicker';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

const schema = z.object({
  spouse: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
      dateOfBirth: z.string().optional(),
      marriageDate: z.string().optional(),
    })
    .optional(),
  siblings: z
    .array(
      z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        gender: z.enum(['male', 'female', 'other']),
        dateOfBirth: z.string().optional(),
      })
    )
    .optional(),
});

export type FamilyData = z.infer<typeof schema>;

interface WizardStepFamilyProps {
  defaultValues?: Partial<FamilyData>;
  onNext: (data: FamilyData) => void;
  onBack: () => void;
}

export function WizardStepFamily({ defaultValues, onNext, onBack }: WizardStepFamilyProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FamilyData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { siblings: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'siblings' });

  const handleSkip = () => {
    onNext({});
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Add family members</h2>
        <p className="text-sm text-muted-foreground">
          Add your spouse and siblings. You can skip this step.
        </p>
      </div>

      {/* Spouse */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Spouse (optional)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">First Name</label>
            <input
              type="text"
              {...register('spouse.firstName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Last Name</label>
            <input
              type="text"
              {...register('spouse.lastName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Gender</label>
            <Controller
              control={control}
              name="spouse.gender"
              render={({ field }) => (
                <div className="flex gap-2">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
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
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Marriage Date</label>
            <Controller
              control={control}
              name="spouse.marriageDate"
              render={({ field }) => (
                <DateOfBirthPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </div>

      {/* Siblings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Siblings (optional)</h3>
          <button
            type="button"
            onClick={() => append({ firstName: '', lastName: '', gender: 'male' })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Sibling
          </button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Sibling {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded p-1 hover:bg-secondary"
                aria-label="Remove sibling"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  {...register(`siblings.${index}.firstName`)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.siblings?.[index]?.firstName && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.siblings[index].firstName?.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  {...register(`siblings.${index}.lastName`)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Controller
                  control={control}
                  name={`siblings.${index}.gender`}
                  render={({ field }) => (
                    <div className="flex gap-1.5">
                      {genderOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            'flex-1 rounded-md border px-2 py-2 text-sm font-medium transition-colors',
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
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
          >
            Skip
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      </div>
    </form>
  );
}
