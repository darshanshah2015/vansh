import { cn } from '@/lib/utils';

const steps = ['About You', 'Parents', 'Family', 'Name Your Tree'];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                  i < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i === currentStep
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border border-border bg-background text-muted-foreground'
                )}
              >
                {i < currentStep ? '\u2713' : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs sm:block',
                  i <= currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1',
                  i < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
