import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TreeCanvas, type TreeCanvasHandle } from '../components/TreeCanvas';
import { TreeControls } from '../components/TreeControls';
import { TreeListView } from '../components/TreeListView';
import { TreeVisualizationContainer } from '../components/containers/TreeVisualizationContainer';
import { PersonDetailDrawer } from '@/features/persons/components/PersonDetailDrawer';
import { useTree } from '../hooks/useTree';
import { useTour } from '@/shared/hooks/useTour';
import { MousePointerClick } from 'lucide-react';

type ViewMode = 'radial' | 'top-down' | 'left-right';

interface BreadcrumbEntry {
  personId: string;
  label: string;
}

export default function TreeViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tree } = useTree(slug!);
  const { autoStartTour } = useTour();
  const [viewMode, setViewMode] = useState<ViewMode>('top-down');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showListView, setShowListView] = useState(false);
  const canvasRef = useRef<TreeCanvasHandle>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const [showOnboardingHint, setShowOnboardingHint] = useState(
    searchParams.get('tour') === '1'
  );

  const focusPersonId = searchParams.get('focus');
  const isOnboardingTour = searchParams.get('tour') === '1';

  useEffect(() => {
    if (isOnboardingTour) {
      autoStartTour();
    }
  }, [isOnboardingTour, autoStartTour]);

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

  const handlePersonClick = useCallback((personId: string) => {
    setSelectedPersonId(personId);
    setShowOnboardingHint(false);
  }, []);

  const handleDone = useCallback(() => {
    setSelectedPersonId(null);
    setShowOnboardingHint(false);
    navigate(`/trees/${slug}/overview`);
  }, [navigate, slug]);

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
          {({ persons, relationships }) => {
            const claimedPerson = persons.find((person: any) => person.claimedByUserId);

            return showListView ? (
              <div className="h-full overflow-y-auto p-4">
                <TreeListView persons={persons} onPersonClick={setSelectedPersonId} />
              </div>
            ) : (
              <div data-tour="tree-canvas" className="relative h-full">
                {showOnboardingHint && claimedPerson && (
                  <div className="absolute left-4 top-4 z-10 max-w-xs rounded-md border border-primary/20 bg-background/95 p-3 shadow-lg">
                    <div className="flex gap-2">
                      <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Click your node</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Select {claimedPerson.firstName} to add parents, spouse, children,
                          or siblings from the details panel.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute right-4 top-4 z-10 rounded-md border border-border bg-background/95 p-3 text-xs shadow-sm">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1 w-8 rounded-full bg-rose-400" />
                      <span className="font-medium text-muted-foreground">spouse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1 w-8 rounded-full bg-emerald-500" />
                      <span className="font-medium text-muted-foreground">kid</span>
                    </div>
                  </div>
                </div>
                <TreeCanvas
                  ref={canvasRef}
                  persons={persons}
                  relationships={relationships}
                  viewMode={viewMode}
                  selectedPersonId={selectedPersonId}
                  focusPersonId={focusPersonId}
                  onPersonClick={handlePersonClick}
                  onNavigateToFamily={(id) => handleNavigateToFamily(id, persons)}
                />
              </div>
            );
          }}
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
          onDone={handleDone}
        />
      )}
    </div>
  );
}
