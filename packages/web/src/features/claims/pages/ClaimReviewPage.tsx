import { useParams } from 'react-router-dom';
import { useTreeClaims, useMyClaims } from '../hooks/useClaims';
import { ClaimRequestCard } from '../components/ClaimRequestCard';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Inbox } from 'lucide-react';

export default function ClaimReviewPage() {
  const { id: slug } = useParams<{ id: string }>();
  const { user } = useAuth();
  const treeClaims = useTreeClaims(slug ?? '');
  const myClaims = useMyClaims();

  const claims = slug ? treeClaims.data?.items : myClaims.data;
  const isLoading = slug ? treeClaims.isLoading : myClaims.isLoading;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold text-foreground">
        {slug ? 'Tree Claims' : 'My Claims'}
      </h1>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {!isLoading && (!claims || claims.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No claims to review</p>
        </div>
      )}

      <div className="space-y-3">
        {claims?.map((claim) => (
          <ClaimRequestCard
            key={claim.id}
            claim={claim}
            canReview={!!slug && claim.userId !== user?.id}
          />
        ))}
      </div>
    </div>
  );
}
