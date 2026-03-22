import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  accent?: string;
}

export function StatCard({ label, count, icon: Icon, accent = 'text-primary' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{count}</p>
        </div>
        <div className={`rounded-lg bg-secondary p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
