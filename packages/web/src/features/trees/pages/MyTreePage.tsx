import { Link, useNavigate } from 'react-router-dom';
import { Check, ExternalLink, Plus, TreePine } from 'lucide-react';
import { useMyTree } from '@/shared/hooks/useMyTree';

export default function MyTreePage() {
  const navigate = useNavigate();
  const { tree, createdTrees, selectedSlug, setMyTree, isLoading } = useMyTree();

  const handleUseTree = (slug: string) => {
    setMyTree(slug);
    navigate(`/trees/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TreePine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">My Tree</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which tree represents your own family.
            </p>
          </div>
        </div>
      </div>

      {tree && (
        <div className="mb-5 rounded-md border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Current My Tree
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">{tree.name}</h2>
              <p className="text-sm text-muted-foreground">
                {tree.memberCount ?? 0} members
              </p>
            </div>
            <Link
              to={`/trees/${tree.slug}`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {createdTrees.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center">
          <TreePine className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No trees created yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a tree first, then come back here to assign it as My Tree.
          </p>
          <Link
            to="/trees"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create New Tree
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Trees you created
          </h2>
          {createdTrees.map((createdTree) => {
            const isSelected = createdTree.slug === selectedSlug;
            return (
              <div
                key={createdTree.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{createdTree.name}</h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Check className="h-3 w-3" />
                        My Tree
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {createdTree.memberCount ?? 0} members
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/trees/${createdTree.slug}`}
                    className="inline-flex min-h-[40px] items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleUseTree(createdTree.slug)}
                    className="inline-flex min-h-[40px] items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {isSelected ? 'Open' : 'Use as My Tree'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
