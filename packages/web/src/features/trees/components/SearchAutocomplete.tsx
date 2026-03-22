import { Search } from 'lucide-react';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  results?: Array<{ id: string; name: string; slug: string; memberCount: number }>;
  onSelect?: (slug: string) => void;
}

export function SearchAutocomplete({ value, onChange, results, onSelect }: SearchAutocompleteProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="search-trees" className="sr-only">Search trees</label>
        <input id="search-trees" name="search" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search trees by name..." autoComplete="off"
          className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      {results && results.length > 0 && value && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          {results.map((tree) => (
            <button key={tree.id} onClick={() => onSelect?.(tree.slug)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-secondary">
              <span className="font-medium">{tree.name}</span>
              <span className="text-xs text-muted-foreground">{tree.memberCount} members</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
