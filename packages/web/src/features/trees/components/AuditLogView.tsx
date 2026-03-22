import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';
import { RotateCcw, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  userName?: string;
}

interface Props {
  items: AuditEntry[];
  showRevert?: boolean;
  onReverted?: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  claim: 'Claimed',
  merge: 'Merged',
  revert: 'Reverted',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-50 text-green-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  claim: 'bg-purple-50 text-purple-700',
  merge: 'bg-yellow-50 text-yellow-700',
  revert: 'bg-orange-50 text-orange-700',
};

export function AuditLogView({ items, showRevert = false, onReverted }: Props) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);

  const filtered = filterAction ? items.filter((i) => i.action === filterAction) : items;
  const actions = [...new Set(items.map((i) => i.action))];

  const handleRevert = async (entryId: string) => {
    setReverting(entryId);
    try {
      await api.post(`/api/audit/${entryId}/revert`, {});
      onReverted?.();
    } catch {
      // Error handled by API client
    } finally {
      setReverting(null);
    }
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="space-y-3">
      {actions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-text-muted" />
          <button
            className={`rounded-md px-3 py-1 text-sm font-medium ${filterAction === null ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
            onClick={() => setFilterAction(null)}
          >
            All
          </button>
          {actions.map((action) => (
            <button
              key={action}
              className={`rounded-md px-3 py-1 text-sm font-medium ${filterAction === action ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
              onClick={() => setFilterAction(action)}
            >
              {ACTION_LABELS[action] || action}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-text-muted py-4 text-center">No audit entries found.</p>
      )}

      {filtered.map((entry) => {
        const isExpanded = expandedId === entry.id;
        const canRevert =
          showRevert && user && (entry.action === 'update' || entry.action === 'delete');

        return (
          <div key={entry.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[entry.action] || ''}`}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                  <span className="text-sm font-medium">{entry.entityType}</span>
                  {entry.userName && (
                    <span className="text-xs text-text-muted">by {entry.userName}</span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {canRevert && (
                  <button
                    className="inline-flex items-center rounded px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                    disabled={reverting === entry.id}
                    onClick={() => handleRevert(entry.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {reverting === entry.id ? 'Reverting...' : 'Revert'}
                  </button>
                )}
                {(entry.oldValue !== null || entry.newValue !== null) && (
                  <button
                    className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-secondary"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {entry.oldValue !== null && entry.oldValue !== undefined && (
                  <div>
                    <div className="text-text-muted mb-1 font-medium">Previous Value</div>
                    <pre className="bg-red-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                      {formatValue(entry.oldValue)}
                    </pre>
                  </div>
                )}
                {entry.newValue !== null && entry.newValue !== undefined && (
                  <div>
                    <div className="text-text-muted mb-1 font-medium">New Value</div>
                    <pre className="bg-green-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                      {formatValue(entry.newValue)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
