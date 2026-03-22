import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TreeCanvas, type TreeCanvasHandle } from '../components/TreeCanvas';
import { TreeControls } from '../components/TreeControls';
import { TreeListView } from '../components/TreeListView';
import { TreeVisualizationContainer } from '../components/containers/TreeVisualizationContainer';
import { PersonDetailDrawer } from '@/features/persons/components/PersonDetailDrawer';
import { useTree } from '../hooks/useTree';
import { useTour } from '@/shared/hooks/useTour';

type ViewMode = 'radial' | 'top-down' | 'left-right';

interface BreadcrumbEntry {
  personId: string;
  label: string;
}

export default function TreeViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tree } = useTree(slug!);
  const { autoStartTour } = useTour();
  const [viewMode, setViewMode] = useState<ViewMode>('top-down');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showListView, setShowListView] = useState(false);
  const canvasRef = useRef<TreeCanvasHandle>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);

  const focusPersonId = searchParams.get('focus');

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      autoStartTour();
    }
  }, [searchParams, autoStartTour]);

  // Reset breadcrumbs when focus is cleared
  useEffect(() => {
    if (!focusPersonId) {
      setBreadcrumbs([]);
    }
  }, [focusPersonId]);

  const handleNavigateToFamily = useCallback((personId: string, persons?: any[]) => {
    // Find the person's name for the breadcrumb
    const person = persons?.find((p: any) => p.id === personId);
    const label = person ? `${person.firstName} ${person.lastName}` : 'Family';

    setBreadcrumbs((prev) => {
      // If navigating back to a person already in breadcrumbs, truncate
      const existingIdx = prev.findIndex((b) => b.personId === personId);
      if (existingIdx >= 0) return prev.slice(0, existingIdx);
      return [...prev, { personId, label }];
    });

    setSelectedPersonId(null);
    setSearchParams({ focus: personId });
  }, [setSearchParams]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index < 0) {
      setBreadcrumbs([]);
      setSearchParams({});
    } else {
      setBreadcrumbs((prev) => {
        const entry = prev[index];
        if (entry) setSearchParams({ focus: entry.personId });
        return prev.slice(0, index);
      });
    }
    setSelectedPersonId(null);
  }, [setSearchParams]);

  return (
    <div className="relative flex h-[calc(100vh-3.5rem-4rem)] flex-col md:h-[calc(100vh-3.5rem)]">
      {tree && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{tree.name}</h1>
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="mx-1">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="hover:text-foreground hover:underline"
                >
                  Main
                </button>
                {breadcrumbs.map((b, i) => (
                  <span key={b.personId} className="flex items-center gap-1">
                    <span className="mx-1">/</span>
                    {i < breadcrumbs.length - 1 ? (
                      <button
                        onClick={() => handleBreadcrumbClick(i)}
                        className="hover:text-foreground hover:underline"
                      >
                        {b.label}
                      </button>
                    ) : (
                      <span className="font-medium text-foreground">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
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
                  ref={canvasRef}
                  persons={persons}
                  relationships={relationships}
                  viewMode={viewMode}
                  selectedPersonId={selectedPersonId}
                  focusPersonId={focusPersonId}
                  onPersonClick={setSelectedPersonId}
                  onNavigateToFamily={(id) => handleNavigateToFamily(id, persons)}
                />
              </div>
            )
          }
        </TreeVisualizationContainer>

        <TreeControls
          data-tour="tree-controls"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onReset={() => canvasRef.current?.resetView()}
          showListView={showListView}
          onToggleListView={() => setShowListView(!showListView)}
        />
      </div>

      {selectedPersonId && (
        <PersonDetailDrawer
          personId={selectedPersonId}
          treeSlug={slug!}
          onClose={() => setSelectedPersonId(null)}
          onNavigateToFamily={(id) => handleNavigateToFamily(id)}
        />
      )}
    </div>
  );
}
