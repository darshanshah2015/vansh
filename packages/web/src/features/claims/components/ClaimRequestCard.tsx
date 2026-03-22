import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Check, X } from 'lucide-react';
import { useReviewClaim } from '../hooks/useClaims';

interface ClaimRequestCardProps {
  claim: {
    id: string;
    status: string;
    reason: string | null;
    reviewNote: string | null;
    autoApproveAt: string | null;
    createdAt: string;
    personFirstName: string;
    personLastName: string;
    userFirstName: string;
    userLastName: string;
    userEmail?: string;
  };
  canReview: boolean;
}

export function ClaimRequestCard({ claim, canReview }: ClaimRequestCardProps) {
  const reviewMutation = useReviewClaim();
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isPending = claim.status === 'pending';

  const handleApprove = () => {
    reviewMutation.mutate({ claimId: claim.id, status: 'approved' });
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    reviewMutation.mutate({ claimId: claim.id, status: 'rejected', reviewNote: rejectNote || undefined });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {claim.userFirstName} {claim.userLastName}
          </p>
          {claim.userEmail && (
            <p className="text-xs text-muted-foreground">{claim.userEmail}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            wants to claim{' '}
            <span className="font-medium text-foreground">
              {claim.personFirstName} {claim.personLastName}
            </span>
          </p>
          {claim.reason && (
            <p className="mt-1 text-xs text-muted-foreground italic">"{claim.reason}"</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            claim.status === 'approved'
              ? 'bg-green-50 text-green-700'
              : claim.status === 'rejected'
                ? 'bg-red-50 text-red-700'
                : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {claim.status}
        </span>
      </div>

      {isPending && canReview && (
        <div className="mt-3 border-t border-border pt-3">
          {showRejectInput && (
            <div className="mb-3">
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={reviewMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      )}

      {claim.status === 'rejected' && claim.reviewNote && (
        <div className="mt-3 rounded-md bg-destructive/5 p-2 text-xs text-destructive">
          Rejection reason: {claim.reviewNote}
        </div>
      )}
    </div>
  );
}
