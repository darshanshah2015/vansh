import { Users, Heart, Leaf } from 'lucide-react';

interface TreeStatsCardProps {
  stats: {
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    generationSpan: number;
    commonGotra: string | null;
  };
}

export function TreeStatsCard({ stats }: TreeStatsCardProps) {
  const items = [
    { label: 'Total Members', value: stats.totalMembers, icon: Users },
    { label: 'Living', value: stats.livingMembers, icon: Heart },
    { label: 'Deceased', value: stats.deceasedMembers, icon: Leaf },
    { label: 'Generations', value: stats.generationSpan, icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
      {stats.commonGotra && (
        <div className="col-span-2 rounded-lg border border-border bg-card p-3 md:col-span-4">
          <span className="text-xs text-muted-foreground">Common Gotra</span>
          <p className="mt-1 font-medium">{stats.commonGotra}</p>
        </div>
      )}
    </div>
  );
}
