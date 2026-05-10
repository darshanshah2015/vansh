import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';

interface TreeInfo {
  id: string;
  name: string;
  slug: string;
  createdById?: string;
  memberCount?: number;
}

const myTreeChangedEvent = 'vansh:my-tree-changed';

function storageKey(userId?: string) {
  return userId ? `vansh:my-tree:${userId}` : null;
}

export function useMyTree() {
  const { user, isAuthenticated } = useAuth();
  const key = storageKey(user?.id);
  const [selectedSlug, setSelectedSlugState] = useState<string | null>(() =>
    key ? window.localStorage.getItem(key) : null
  );

  useEffect(() => {
    setSelectedSlugState(key ? window.localStorage.getItem(key) : null);
  }, [key]);

  useEffect(() => {
    const syncSelectedTree = () => {
      setSelectedSlugState(key ? window.localStorage.getItem(key) : null);
    };
    window.addEventListener('storage', syncSelectedTree);
    window.addEventListener(myTreeChangedEvent, syncSelectedTree);
    return () => {
      window.removeEventListener('storage', syncSelectedTree);
      window.removeEventListener(myTreeChangedEvent, syncSelectedTree);
    };
  }, [key]);

  const query = useQuery({
    queryKey: ['my-tree-options', user?.id],
    queryFn: async () => {
      const res = await api.get<{ items: TreeInfo[] }>('/api/trees?page=1&limit=100');
      return res.items.filter((tree) => tree.createdById === user?.id);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const createdTrees = query.data ?? [];
  const tree = useMemo(
    () => createdTrees.find((candidate) => candidate.slug === selectedSlug) ?? null,
    [createdTrees, selectedSlug]
  );

  const setMyTree = (slug: string) => {
    if (!key) return;
    window.localStorage.setItem(key, slug);
    window.dispatchEvent(new CustomEvent(myTreeChangedEvent));
  };

  return {
    tree,
    createdTrees,
    selectedSlug,
    setMyTree,
    isLoading: query.isLoading,
    myTreePath: tree?.slug ? `/trees/${tree.slug}` : '/my-tree',
  };
}
