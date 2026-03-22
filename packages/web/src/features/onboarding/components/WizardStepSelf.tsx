import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { DateOfBirthPicker } from '@/shared/components/DateOfBirthPicker';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  dateOfBirth: z.string().optional(),
  gotra: z.string().optional(),
});

export type SelfData = z.infer<typeof schema>;

interface WizardStepSelfProps {
  defaultValues?: Partial<SelfData>;
  onNext: (data: SelfData) => void;
}

export function WizardStepSelf({ defaultValues, onNext }: WizardStepSelfProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SelfData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Tell us about yourself</h2>
      <p className="text-sm text-muted-foreground">
        This will be the first person in your family tree.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            {...register('firstName')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            {...register('lastName')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Gender</label>
        <Controller
          control={control}
          name="gender"
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
        {errors.gender && (
          <p className="mt-1 text-xs text-destructive">{errors.gender.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Date of Birth</label>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <DateOfBirthPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <label htmlFor="gotra" className="mb-1 block text-sm font-medium">
            Gotra (optional)
          </label>
          <input
            id="gotra"
            type="text"
            {...register('gotra')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Next
        </button>
      </div>
    </form>
  );
}
