import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { useAdminMerges } from '../hooks/useAdmin';

export default function AdminMergesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminMerges(page);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Merge Proposals</h1>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && (!data?.items || data.items.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <GitMerge className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No merge proposals</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items?.map((merge: any) => (
          <div key={merge.id} className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Merge #{merge.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">Status: {merge.status}</p>
          </div>
        ))}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
