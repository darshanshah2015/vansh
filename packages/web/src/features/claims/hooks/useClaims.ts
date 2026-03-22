import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

interface Claim {
  id: string;
  status: string;
  reason: string | null;
  reviewNote: string | null;
  autoApproveAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  personId: string;
  personFirstName: string;
  personLastName: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail?: string;
  treeId?: string;
  treeName?: string;
  treeSlug?: string;
}

export function useTreeClaims(slug: string) {
  return useQuery({
    queryKey: ['claims', 'tree', slug],
    queryFn: () =>
      api
        .get<{ items: Claim[]; pagination: unknown }>(`/api/trees/${slug}/claims`)
        .then((r) => r),
  });
}

export function useMyClaims() {
  return useQuery({
    queryKey: ['claims', 'my'],
    queryFn: () => api.get<{ data: Claim[] }>('/api/claims/my').then((r) => r.data),
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ personId, reason }: { personId: string; reason?: string }) =>
      api.post(`/api/persons/${personId}/claim`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

export function useReviewClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      status,
      reviewNote,
    }: {
      claimId: string;
      status: 'approved' | 'rejected';
      reviewNote?: string;
    }) => api.patch(`/api/claims/${claimId}`, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
    },
  });
}
