import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine } from 'lucide-react';
import { SearchAutocomplete } from '../components/SearchAutocomplete';
import { SearchFilterChips } from '../components/SearchFilterChips';
import { useTreeSearch } from '../hooks/useTreeSearch';
import { useCreateTree } from '../hooks/useTree';

export default function TreeSearchPage() {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, data, isLoading } = useTreeSearch();
  const [selectedGotra, setSelectedGotra] = useState<string | null>(null);
  const createTree = useCreateTree();
  const [showCreate, setShowCreate] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');

  const handleCreateTree = async () => {
    if (!newTreeName.trim()) return;
    const result = await createTree.mutateAsync({ name: newTreeName });
    navigate(`/trees/${(result as any).data.slug}`);
  };

  const trees = data?.items || [];

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trees</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Tree
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-medium">Create a new tree</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTreeName}
              onChange={(e) => setNewTreeName(e.target.value)}
              placeholder="Tree name"
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              onClick={handleCreateTree}
              disabled={createTree.isPending}
              className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <SearchAutocomplete
          value={searchTerm}
          onChange={setSearchTerm}
          results={trees}
          onSelect={(slug) => navigate(`/trees/${slug}`)}
        />
        <SearchFilterChips selectedGotra={selectedGotra} onGotraChange={setSelectedGotra} />
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : trees.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <TreePine className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No trees found. Create your first tree!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {trees.map((tree: any) => (
            <button
              key={tree.id}
              onClick={() => navigate(`/trees/${tree.slug}`)}
              className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            >
              <h3 className="font-medium">{tree.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tree.memberCount} members
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
