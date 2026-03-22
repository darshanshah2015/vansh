import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

interface MergeProposalDetail {
  id: string;
  sourceTreeId: string;
  targetTreeId: string;
  proposedById: string;
  status: string;
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  sourceTree: { name: string; slug: string } | null;
  targetTree: { name: string; slug: string } | null;
  proposer: { firstName: string; lastName: string } | null;
  mappings: Array<{
    id: string;
    sourcePersonId: string;
    targetPersonId: string | null;
    resolution: string | null;
  }>;
  sourcePersons: PersonSummary[];
  targetPersons: PersonSummary[];
  approvals: Record<string, { userId: string; approvedAt: string }>;
}

interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gotra: string | null;
  gender: string;
}

export function useMergeProposal(id: string) {
  return useQuery({
    queryKey: ['merge', id],
    queryFn: () => api.get<{ data: MergeProposalDetail }>(`/api/merge/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useTreeMergeProposals(slug: string) {
  return useQuery({
    queryKey: ['merge', 'tree', slug],
    queryFn: () =>
      api.get<{ items: MergeProposalDetail[]; pagination: unknown }>(
        `/api/trees/${slug}/merge-proposals`
      ),
    enabled: !!slug,
  });
}

export function useCreateMergeProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sourceTreeId: string; targetTreeId: string; reason?: string }) =>
      api.post('/api/merge', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merge'] });
    },
  });
}

export function useAddMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      sourcePersonId,
      targetPersonId,
    }: {
      proposalId: string;
      sourcePersonId: string;
      targetPersonId: string;
    }) => api.post(`/api/merge/${proposalId}/mappings`, { sourcePersonId, targetPersonId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['merge', vars.proposalId] });
    },
  });
}

export function useRemoveMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, mappingId }: { proposalId: string; mappingId: string }) =>
      api.delete(`/api/merge/${proposalId}/mappings/${mappingId}`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['merge', vars.proposalId] });
    },
  });
}

export function useResolveConflict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      mappingId,
      resolution,
    }: {
      proposalId: string;
      mappingId: string;
      resolution: string;
    }) => api.patch(`/api/merge/${proposalId}/mappings/${mappingId}/resolve`, { resolution }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['merge', vars.proposalId] });
    },
  });
}

export function useApproveMerge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, side }: { proposalId: string; side: 'source' | 'target' }) =>
      api.post(`/api/merge/${proposalId}/approve`, { side }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['merge', vars.proposalId] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
    },
  });
}

export function useAutoDetectMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => api.post(`/api/merge/${proposalId}/auto-detect`),
    onSuccess: (_, proposalId) => {
      queryClient.invalidateQueries({ queryKey: ['merge', proposalId] });
    },
  });
}
