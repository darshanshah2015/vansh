import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Check, X } from 'lucide-react';
import { useDeletionRequests, useReviewDeletion } from '../hooks/useAdmin';

export default function AdminDeletionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDeletionRequests(page);
  const reviewMutation = useReviewDeletion();

  const handleApprove = (id: string) => {
    if (!confirm('Are you sure you want to approve this deletion? The person will be permanently removed.')) return;
    reviewMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    reviewMutation.mutate({ id, status: 'rejected' });
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Deletion Requests</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && data?.items?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Trash2 className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No pending deletion requests</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items?.map((req: any) => (
          <div key={req.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Delete: {req.personFirstName} {req.personLastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tree: {req.treeName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested by {req.requestedByFirstName} {req.requestedByLastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                </p>
                {req.reason && (
                  <p className="mt-1 text-xs italic text-muted-foreground">"{req.reason}"</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={reviewMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Approve Deletion
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={reviewMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
