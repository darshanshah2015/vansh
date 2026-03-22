import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

interface DashboardStats {
  totalUsers: number;
  totalTrees: number;
  pendingVerifications: number;
  pendingDeletions: number;
  pendingMerges: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  treeId: string | null;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<{ data: DashboardStats }>('/api/admin/dashboard').then((r) => r.data),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => api.get<{ data: AuditEntry[] }>('/api/admin/activity').then((r) => r.data),
  });
}

export function useVerificationRequests(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin', 'verifications', page, limit],
    queryFn: () =>
      api.get<{ items: any[]; pagination: any }>(
        `/api/admin/verifications?page=${page}&limit=${limit}`
      ),
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: 'approved' | 'rejected'; reason?: string }) =>
      api.patch(`/api/admin/verifications/${userId}`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminUsers(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, limit, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      return api.get<{ items: any[]; pagination: any }>(`/api/admin/users?${params}`);
    },
  });
}

export function useChangeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'user' | 'admin' }) =>
      api.patch(`/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ data: { tempPassword: string } }>(`/api/admin/users/${userId}/reset-password`).then((r) => r.data),
  });
}

export function useChangeUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.patch(`/api/admin/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminTrees(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin', 'trees', page, limit],
    queryFn: () =>
      api.get<{ items: any[]; pagination: any }>(`/api/admin/trees?page=${page}&limit=${limit}`),
  });
}

export function useDeletionRequests(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin', 'deletions', page, limit],
    queryFn: () =>
      api.get<{ items: any[]; pagination: any }>(`/api/admin/deletions?page=${page}&limit=${limit}`),
  });
}

export function useReviewDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: 'approved' | 'rejected'; reviewNote?: string }) =>
      api.patch(`/api/admin/deletions/${id}`, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAdminMerges(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin', 'merges', page, limit],
    queryFn: () =>
      api.get<{ items: any[]; pagination: any }>(`/api/admin/merges?page=${page}&limit=${limit}`),
  });
}
