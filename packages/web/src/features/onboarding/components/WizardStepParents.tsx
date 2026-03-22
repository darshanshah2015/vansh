import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateOfBirthPicker } from '@/shared/components/DateOfBirthPicker';

const parentSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const schema = z.object({
  father: parentSchema,
  mother: parentSchema,
});

export type ParentsData = z.infer<typeof schema>;

interface WizardStepParentsProps {
  defaultValues?: Partial<ParentsData>;
  onNext: (data: ParentsData) => void;
  onBack: () => void;
}

export function WizardStepParents({ defaultValues, onNext, onBack }: WizardStepParentsProps) {
  const { register, handleSubmit, control } = useForm<ParentsData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSkip = () => {
    onNext({ father: {}, mother: {} });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Add your parents</h2>
        <p className="text-sm text-muted-foreground">
          This helps build your tree and find matches. You can skip this step.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Father */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Father</h3>
          <div>
            <label htmlFor="father.firstName" className="mb-1 block text-xs font-medium">
              First Name
            </label>
            <input
              id="father.firstName"
              type="text"
              {...register('father.firstName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="father.lastName" className="mb-1 block text-xs font-medium">
              Last Name
            </label>
            <input
              id="father.lastName"
              type="text"
              {...register('father.lastName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Date of Birth</label>
            <Controller
              control={control}
              name="father.dateOfBirth"
              render={({ field }) => (
                <DateOfBirthPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>

        {/* Mother */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Mother</h3>
          <div>
            <label htmlFor="mother.firstName" className="mb-1 block text-xs font-medium">
              First Name
            </label>
            <input
              id="mother.firstName"
              type="text"
              {...register('mother.firstName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="mother.lastName" className="mb-1 block text-xs font-medium">
              Last Name
            </label>
            <input
              id="mother.lastName"
              type="text"
              {...register('mother.lastName')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Date of Birth</label>
            <Controller
              control={control}
              name="mother.dateOfBirth"
              render={({ field }) => (
                <DateOfBirthPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
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
