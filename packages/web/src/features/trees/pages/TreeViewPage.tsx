import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TreeCanvas } from '../components/TreeCanvas';
import { TreeControls } from '../components/TreeControls';
import { TreeListView } from '../components/TreeListView';
import { TreeVisualizationContainer } from '../components/containers/TreeVisualizationContainer';
import { PersonDetailDrawer } from '@/features/persons/components/PersonDetailDrawer';
import { useTree } from '../hooks/useTree';
import { useTour } from '@/shared/hooks/useTour';

type ViewMode = 'radial' | 'top-down' | 'left-right';

export default function TreeViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: tree } = useTree(slug!);
  const { autoStartTour } = useTour();
  const [viewMode, setViewMode] = useState<ViewMode>('top-down');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showListView, setShowListView] = useState(false);

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      autoStartTour();
    }
  }, [searchParams, autoStartTour]);

  return (
    <div className="relative flex h-[calc(100vh-3.5rem-4rem)] flex-col md:h-[calc(100vh-3.5rem)]">
      {tree && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h1 className="text-lg font-semibold">{tree.name}</h1>
        </div>
      )}

      <div className="relative flex-1">
        <TreeVisualizationContainer slug={slug!}>
          {({ persons, relationships }) =>
            showListView ? (
              <div className="h-full overflow-y-auto p-4">
                <TreeListView persons={persons} onPersonClick={setSelectedPersonId} />
              </div>
            ) : (
              <div data-tour="tree-canvas" className="h-full">
                <TreeCanvas
                  persons={persons}
                  relationships={relationships}
                  viewMode={viewMode}
                  selectedPersonId={selectedPersonId}
                  onPersonClick={setSelectedPersonId}
                />
              </div>
            )
          }
        </TreeVisualizationContainer>

        <TreeControls
          data-tour="tree-controls"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onReset={() => {}}
          showListView={showListView}
          onToggleListView={() => setShowListView(!showListView)}
        />
      </div>

      {selectedPersonId && (
        <PersonDetailDrawer
          personId={selectedPersonId}
          treeSlug={slug!}
          onClose={() => setSelectedPersonId(null)}
        />
      )}
    </div>
  );
}
