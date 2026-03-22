import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/api';

export function useTreeSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const query = useQuery({
    queryKey: ['trees', 'search', debouncedTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedTerm) params.set('search', debouncedTerm);
      params.set('limit', '20');
      return api.get<{ items: any[]; pagination: any }>(`/api/trees?${params}`);
    },
  });

  return { searchTerm, setSearchTerm, ...query };
}
