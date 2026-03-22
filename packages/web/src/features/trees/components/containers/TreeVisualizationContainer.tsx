import { useTreePersons } from '../../hooks/useTree';

interface Props {
  slug: string;
  children: (data: { persons: any[]; relationships: any[] }) => React.ReactNode;
}

export function TreeVisualizationContainer({ slug, children }: Props) {
  const { data: persons, isLoading, error } = useTreePersons(slug);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (error) {
    return <div className="flex h-full items-center justify-center p-6 text-center"><p className="text-sm text-destructive">Failed to load tree data</p></div>;
  }

  const allRels = (persons || []).flatMap((p: any) => p.relationships || []);
  const uniqueRels = Array.from(new Map(allRels.map((r: any) => [r.id, r])).values());
  return <>{children({ persons: persons || [], relationships: uniqueRels })}</>;
}
