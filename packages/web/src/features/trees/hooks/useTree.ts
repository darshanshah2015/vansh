import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

interface Tree {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  generationCount: number;
  createdAt: string;
}

interface Person {
  id: string;
  treeId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  dateOfDeath: string | null;
  isAlive: boolean;
  gotra: string | null;
  photoKey: string | null;
  claimedByUserId: string | null;
  relationships?: Array<{
    id: string;
    personId1: string;
    personId2: string;
    relationshipType: string;
    marriageDate: string | null;
    divorceDate: string | null;
  }>;
}

interface TreeStats {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  generationSpan: number;
  commonGotra: string | null;
}

export function useTree(slug: string) {
  return useQuery({
    queryKey: ['tree', slug],
    queryFn: () => api.get<{ data: Tree }>(`/api/trees/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });
}

export function useTreePersons(slug: string) {
  return useQuery({
    queryKey: ['tree', slug, 'persons'],
    queryFn: () =>
      api
        .get<{ items: Person[] }>(`/api/trees/${slug}/persons?limit=100`)
        .then((r) => r.items.map((p) => ({
          ...p,
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
          dateOfDeath: p.dateOfDeath ? new Date(p.dateOfDeath) : null,
        }))),
    enabled: !!slug,
  });
}

export function useTreeStats(slug: string) {
  return useQuery({
    queryKey: ['tree', slug, 'stats'],
    queryFn: () => api.get<{ data: TreeStats }>(`/api/trees/${slug}/stats`).then((r) => r.data),
    enabled: !!slug,
  });
}

export function useTreeActivity(slug: string, page = 1) {
  return useQuery({
    queryKey: ['tree', slug, 'activity', page],
    queryFn: () =>
      api.get<{ items: any[]; pagination: any }>(`/api/trees/${slug}/activity?page=${page}`),
    enabled: !!slug,
  });
}

export function useCreateTree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<{ data: Tree }>('/api/trees', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trees'] }),
  });
}

export function useUpdateTree(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string | null }) =>
      api.patch<{ data: Tree }>(`/api/trees/${slug}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tree', slug] }),
  });
}
