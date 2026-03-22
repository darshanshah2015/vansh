import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';

interface TreeInfo {
  id: string;
  name: string;
  slug: string;
}

export function useMyTree() {
  const { user, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['my-tree', user?.id],
    queryFn: async () => {
      const res = await api.get<{ items: Array<{ slug: string; name: string; id: string }> }>(
        '/api/trees?page=1&limit=1'
      );
      return res.items[0] ?? null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    tree: query.data as TreeInfo | null | undefined,
    isLoading: query.isLoading,
    myTreePath: query.data?.slug ? `/trees/${query.data.slug}` : '/onboarding',
  };
}
