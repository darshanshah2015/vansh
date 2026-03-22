import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, Check, X, Eye } from 'lucide-react';
import { useVerificationRequests, useReviewVerification } from '../hooks/useAdmin';

export default function AdminVerificationPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVerificationRequests(page);
  const reviewMutation = useReviewVerification();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const handleApprove = (userId: string) => {
    reviewMutation.mutate({ userId, status: 'approved' });
  };

  const handleReject = (userId: string) => {
    if (showReject !== userId) {
      setShowReject(userId);
      return;
    }
    reviewMutation.mutate({
      userId,
      status: 'rejected',
      reason: rejectReason[userId] || undefined,
    });
    setShowReject(null);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Verification Queue</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && data?.items?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No pending verifications</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items?.map((user: any) => (
          <div key={user.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </p>
              </div>
              {user.aadhaarPhotoKey && (
                <button
                  onClick={() => setViewPhoto(viewPhoto === user.id ? null : user.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Aadhaar
                </button>
              )}
            </div>

            {viewPhoto === user.id && user.aadhaarPhotoKey && (
              <div className="mt-3 rounded-md border border-border p-2">
                <img
                  src={`/api/users/${user.id}/aadhaar`}
                  alt="Aadhaar photo"
                  className="max-h-64 w-full object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {showReject === user.id && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Reason for rejection (optional)"
                  value={rejectReason[user.id] || ''}
                  onChange={(e) => setRejectReason((r) => ({ ...r, [user.id]: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleApprove(user.id)}
                disabled={reviewMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </button>
              <button
                onClick={() => handleReject(user.id)}
                disabled={reviewMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
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
