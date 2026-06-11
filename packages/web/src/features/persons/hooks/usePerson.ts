import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => api.get<{ data: any }>(`/api/persons/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePersonRelationships(id: string) {
  return useQuery({
    queryKey: ['person', id, 'relationships'],
    queryFn: () => api.get<{ data: any }>(`/api/persons/${id}/relationships`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePersonTimeline(id: string, page = 1) {
  return useQuery({
    queryKey: ['person', id, 'timeline', page],
    queryFn: () => api.get<{ items: any[]; pagination: any }>(`/api/persons/${id}/timeline?page=${page}`),
    enabled: !!id,
  });
}

export function useAddPerson(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<{ data: any }>(`/api/trees/${slug}/persons`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', slug, 'persons'] });
      queryClient.invalidateQueries({ queryKey: ['tree', slug, 'stats'] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch<{ data: any }>(`/api/persons/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['person', variables.id, 'relationships'] });
      queryClient.invalidateQueries({ queryKey: ['tree'] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; treeSlug?: string }) => api.delete(`/api/persons/${id}`),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({ queryKey: ['person', variables.id] });
      queryClient.removeQueries({ queryKey: ['person', variables.id, 'relationships'] });
      queryClient.invalidateQueries({ queryKey: ['person'] });
      if (variables.treeSlug) {
        queryClient.invalidateQueries({ queryKey: ['tree', variables.treeSlug] });
        queryClient.invalidateQueries({ queryKey: ['tree', variables.treeSlug, 'persons'] });
        queryClient.invalidateQueries({ queryKey: ['tree', variables.treeSlug, 'stats'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['tree'] });
      }
      queryClient.invalidateQueries({ queryKey: ['trees'] });
    },
  });
}

export function useUploadPersonPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      return api.upload<{ data: any }>(`/api/persons/${id}/photo`, formData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tree'] });
    },
  });
}

export function useAddRelationship(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<{ data: any }>(`/api/trees/${slug}/relationships`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', slug, 'persons'] });
      queryClient.invalidateQueries({ queryKey: ['person'] });
    },
  });
}

export function useRemoveRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/relationships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree'] });
      queryClient.invalidateQueries({ queryKey: ['person'] });
    },
  });
}
