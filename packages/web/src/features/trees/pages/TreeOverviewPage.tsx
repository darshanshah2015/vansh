import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTree, useTreeStats, useTreeActivity } from '../hooks/useTree';
import { TreeStatsCard } from '../components/TreeStatsCard';
import { TreeActivityFeed } from '../components/TreeActivityFeed';
import { AuditLogView } from '../components/AuditLogView';
import { Eye, Share2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function TreeOverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tree, isLoading: treeLoading } = useTree(slug!);
  const { data: stats } = useTreeStats(slug!);
  const { data: activity } = useTreeActivity(slug!);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'activity' | 'audit'>('activity');

  if (treeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tree?.name}</h1>
          {tree?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{tree.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/trees/${slug}`}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-secondary"
          >
            <Eye className="h-4 w-4" /> View Tree
          </Link>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex min-h-[44px] items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-secondary"
            aria-label="Share tree URL"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {stats && <TreeStatsCard stats={stats} />}

      <div className="mt-8">
        <div className="flex gap-4 border-b border-border mb-4">
          <button
            className={`pb-2 text-sm font-medium ${
              activeTab === 'activity'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            Recent Activity
          </button>
          <button
            className={`pb-2 text-sm font-medium ${
              activeTab === 'audit'
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Log
          </button>
        </div>

        {activeTab === 'activity' && (
          <TreeActivityFeed items={activity?.items || []} />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            items={activity?.items || []}
            showRevert
            onReverted={() => {
              queryClient.invalidateQueries({ queryKey: ['trees', slug] });
              queryClient.invalidateQueries({ queryKey: ['tree-activity', slug] });
            }}
          />
        )}
      </div>
    </div>
  );
}
