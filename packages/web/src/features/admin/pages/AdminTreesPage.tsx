import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { TreePine, ExternalLink } from 'lucide-react';
import { useAdminTrees } from '../hooks/useAdmin';

export default function AdminTreesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminTrees(page);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Trees</h1>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && data?.items?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <TreePine className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No trees yet</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Members</th>
              <th className="px-4 py-2 text-left font-medium">Created</th>
              <th className="px-4 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.items?.map((tree: any) => (
              <tr key={tree.id}>
                <td className="px-4 py-2 font-medium">{tree.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{tree.memberCount}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {format(new Date(tree.createdAt), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-2">
                  <Link
                    to={`/trees/${tree.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
