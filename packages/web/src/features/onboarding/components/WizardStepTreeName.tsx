import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  treeName: z.string().min(1, 'Tree name is required').max(255),
});

type TreeNameData = z.infer<typeof schema>;

interface WizardStepTreeNameProps {
  suggestedName: string;
  onSubmit: (treeName: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function WizardStepTreeName({
  suggestedName,
  onSubmit,
  onBack,
  isSubmitting,
}: WizardStepTreeNameProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TreeNameData>({
    resolver: zodResolver(schema),
    defaultValues: { treeName: suggestedName },
  });

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d.treeName))} className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Name your tree</h2>
      <p className="text-sm text-muted-foreground">
        Choose a name for your family tree. You can change this later.
      </p>

      <div>
        <label htmlFor="treeName" className="mb-1 block text-sm font-medium">
          Tree Name
        </label>
        <input
          id="treeName"
          type="text"
          {...register('treeName')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.treeName && (
          <p className="mt-1 text-xs text-destructive">{errors.treeName.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          )}
          Create My Tree
        </button>
      </div>
    </form>
  );
}
