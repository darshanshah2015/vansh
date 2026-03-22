import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import {
  useMergeProposal,
  useAddMapping,
  useRemoveMapping,
  useResolveConflict,
  useApproveMerge,
  useAutoDetectMappings,
} from '../hooks/useMerge';
import TreeComparisonView from '../components/TreeComparisonView';
import MergeNodeMapper from '../components/MergeNodeMapper';
import ConflictResolutionPanel from '../components/ConflictResolutionPanel';
import { GitMerge, Wand2, Check } from 'lucide-react';

export default function MergeProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: proposal, isLoading } = useMergeProposal(id!);
  const addMapping = useAddMapping();
  const removeMapping = useRemoveMapping();
  const resolveConflict = useResolveConflict();
  const approveMerge = useApproveMerge();
  const autoDetect = useAutoDetectMappings();

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-[400px] animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-6">
        <p className="text-text-muted">Merge proposal not found.</p>
      </div>
    );
  }

  const isActive = proposal.status === 'proposed' || proposal.status === 'under_review';
  const selectedMapping = selectedMappingId
    ? proposal.mappings.find((m) => m.id === selectedMappingId)
    : null;

  const statusColors: Record<string, string> = {
    proposed: 'bg-blue-50 text-blue-700 border-blue-200',
    under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    completed: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Merge Proposal</h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            {proposal.sourceTree?.name} → {proposal.targetTree?.name}
            {proposal.proposer &&
              ` · Proposed by ${proposal.proposer.firstName} ${proposal.proposer.lastName}`}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[proposal.status] || ''}`}>
          {proposal.status.replace('_', ' ')}
        </span>
      </div>

      {proposal.reason && (
        <p className="text-sm text-text-muted border-l-2 border-primary/30 pl-3">
          {proposal.reason}
        </p>
      )}

      {/* Approval status */}
      {isActive && (
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            proposal.approvals?.source ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
          }`}>
            Source: {proposal.approvals?.source ? 'Approved' : 'Pending'}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            proposal.approvals?.target ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
          }`}>
            Target: {proposal.approvals?.target ? 'Approved' : 'Pending'}
          </span>
        </div>
      )}

      {/* Tree comparison */}
      <TreeComparisonView
        sourcePersons={proposal.sourcePersons}
        targetPersons={proposal.targetPersons}
        mappings={proposal.mappings}
        sourceTreeName={proposal.sourceTree?.name || 'Source Tree'}
        targetTreeName={proposal.targetTree?.name || 'Target Tree'}
        selectedSourceId={selectedSourceId}
        selectedTargetId={selectedTargetId}
        onSelectSource={setSelectedSourceId}
        onSelectTarget={setSelectedTargetId}
      />

      {/* Mapping controls */}
      {isActive && (
        <>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              onClick={() => autoDetect.mutate(proposal.id)}
              disabled={autoDetect.isPending}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              {autoDetect.isPending ? 'Detecting...' : 'Auto-detect Matches'}
            </button>
          </div>

          <MergeNodeMapper
            selectedSourceId={selectedSourceId}
            selectedTargetId={selectedTargetId}
            mappings={proposal.mappings}
            sourcePersons={proposal.sourcePersons}
            targetPersons={proposal.targetPersons}
            isLinking={addMapping.isPending}
            onLink={(sourcePersonId, targetPersonId) => {
              addMapping.mutate(
                { proposalId: proposal.id, sourcePersonId, targetPersonId },
                {
                  onSuccess: () => {
                    setSelectedSourceId(null);
                    setSelectedTargetId(null);
                  },
                }
              );
            }}
            onUnlink={(mappingId) => {
              removeMapping.mutate({ proposalId: proposal.id, mappingId });
            }}
          />
        </>
      )}

      {/* Conflict resolution */}
      {isActive && proposal.mappings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Resolve Conflicts</h3>
          <div className="flex flex-wrap gap-2">
            {proposal.mappings.map((m) => {
              const sp = proposal.sourcePersons.find((p) => p.id === m.sourcePersonId);
              return (
                <button
                  key={m.id}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
                    selectedMappingId === m.id
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedMappingId(selectedMappingId === m.id ? null : m.id)}
                >
                  {sp ? `${sp.firstName} ${sp.lastName}` : 'Unknown'}
                  {m.resolution && <Check className="h-3 w-3 ml-1" />}
                </button>
              );
            })}
          </div>
          {selectedMapping && (
            <ConflictResolutionPanel
              mapping={selectedMapping}
              sourcePerson={proposal.sourcePersons.find(
                (p) => p.id === selectedMapping.sourcePersonId
              )}
              targetPerson={proposal.targetPersons.find(
                (p) => p.id === selectedMapping.targetPersonId
              )}
              isResolving={resolveConflict.isPending}
              onResolve={(mappingId, resolution) => {
                resolveConflict.mutate({ proposalId: proposal.id, mappingId, resolution });
              }}
            />
          )}
        </div>
      )}

      {/* Approve button */}
      {isActive && user && (
        <div className="flex gap-2 pt-4 border-t border-border">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={() => approveMerge.mutate({ proposalId: proposal.id, side: 'source' })}
            disabled={approveMerge.isPending || !!proposal.approvals?.source}
          >
            {proposal.approvals?.source ? 'Source Approved' : 'Approve as Source'}
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={() => approveMerge.mutate({ proposalId: proposal.id, side: 'target' })}
            disabled={approveMerge.isPending || !!proposal.approvals?.target}
          >
            {proposal.approvals?.target ? 'Target Approved' : 'Approve as Target'}
          </button>
        </div>
      )}

      {proposal.status === 'completed' && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          This merge has been completed. All persons have been merged into{' '}
          <strong>{proposal.targetTree?.name}</strong>.
        </div>
      )}
    </div>
  );
}
