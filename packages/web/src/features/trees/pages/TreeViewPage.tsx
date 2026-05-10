import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TreeCanvas, type TreeCanvasHandle } from '../components/TreeCanvas';
import { TreeControls } from '../components/TreeControls';
import { TreeListView } from '../components/TreeListView';
import { TreeVisualizationContainer } from '../components/containers/TreeVisualizationContainer';
import { PersonDetailDrawer } from '@/features/persons/components/PersonDetailDrawer';
import { AddPersonForm } from '@/features/persons/components/AddPersonForm';
import { useTree, useWikiTreeMatches } from '../hooks/useTree';
import { useTour } from '@/shared/hooks/useTour';
import { ExternalLink, Globe2, Loader2, MousePointerClick, SearchCheck, UserPlus, X } from 'lucide-react';

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
  const [showAddFirstMember, setShowAddFirstMember] = useState(false);
  const [showExternalMatches, setShowExternalMatches] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(
    searchParams.get('tour') === '1'
  );
  const wikiTreeMatches = useWikiTreeMatches(slug!);

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
    navigate(`/trees/${slug}`);
  }, [navigate, slug]);

  const handleOpenExternalMatches = useCallback(() => {
    setShowExternalMatches(true);
    if (!wikiTreeMatches.data && !wikiTreeMatches.isFetching) {
      void wikiTreeMatches.refetch();
    }
  }, [wikiTreeMatches]);

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
          <button
            type="button"
            onClick={handleOpenExternalMatches}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Globe2 className="h-4 w-4" />
            WikiTree matches
          </button>
        </div>
      )}

      <div className="relative flex-1">
        <TreeVisualizationContainer slug={slug!}>
          {({ persons, relationships }) => {
            const claimedPerson = persons.find((person: any) => person.claimedByUserId);
            const showFirstRelativeHint =
              !showOnboardingHint && persons.length > 0 && relationships.length === 0;

            if (persons.length === 0) {
              return (
                <div className="flex h-full items-center justify-center px-4">
                  <div className="w-full max-w-md text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserPlus className="h-7 w-7" />
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-primary">
                      Step 1
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">
                      Add the first member
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Start with yourself or the oldest known family member. After this,
                      click their node to add parents, spouse, children, or siblings.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddFirstMember(true)}
                      className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add First Member
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <>
                {showListView ? (
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
                    {showFirstRelativeHint && (
                      <div className="absolute left-4 top-4 z-10 max-w-xs rounded-md border border-primary/20 bg-background/95 p-3 shadow-lg">
                        <div className="flex gap-2">
                          <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Select a member</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              Click the member card to add relatives like parents, spouse,
                              children, or siblings.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute right-4 top-4 z-10 rounded-md border border-border bg-background/95 p-3 text-xs shadow-sm">
                      <div className="flex flex-col gap-2">
                        <div className="font-medium text-foreground">Colors</div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-5 rounded bg-blue-100 ring-1 ring-blue-500" />
                          <span className="font-medium text-muted-foreground">male</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-5 rounded bg-pink-100 ring-1 ring-pink-500" />
                          <span className="font-medium text-muted-foreground">female</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-5 rounded bg-gray-100 ring-1 ring-gray-500" />
                          <span className="font-medium text-muted-foreground">other</span>
                        </div>
                        <div className="mt-1 border-t border-border pt-2 font-medium text-foreground">
                          Links
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-8 rounded-full bg-rose-400" />
                          <span className="font-medium text-muted-foreground">spouse</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-8 rounded-full bg-emerald-500" />
                          <span className="font-medium text-muted-foreground">parent</span>
                        </div>
                      </div>
                    </div>
                    <TreeCanvas
                      ref={canvasRef}
                      persons={persons}
                      relationships={relationships}
                      viewMode={viewMode}
                      selectedPersonId={selectedPersonId}
                      focusPersonId={focusPersonId ?? selectedPersonId}
                      onPersonClick={handlePersonClick}
                      onNavigateToFamily={(id) => handleNavigateToFamily(id, persons)}
                    />
                  </div>
                )}

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
              </>
            );
          }}
        </TreeVisualizationContainer>

        {showExternalMatches && (
          <div className="absolute inset-y-0 right-0 z-30 w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">WikiTree matches</h2>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Possible public WikiTree profiles that resemble people in this tree.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExternalMatches(false)}
                className="rounded-md p-2 hover:bg-secondary"
                aria-label="Close WikiTree matches"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {wikiTreeMatches.isFetching && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching WikiTree
                </div>
              )}

              {wikiTreeMatches.error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  Could not search WikiTree right now.
                </div>
              )}

              {!wikiTreeMatches.isFetching && wikiTreeMatches.data && (
                wikiTreeMatches.data.groups.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-center">
                    <SearchCheck className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">No close matches yet</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Add more birth years, birth places, parents, or spouses to improve matching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Searched {wikiTreeMatches.data.searchedPeople} people from this tree.
                    </p>
                    {wikiTreeMatches.data.groups.map((group) => (
                      <section key={group.personId} className="rounded-md border border-border p-3">
                        <h3 className="text-sm font-semibold">{group.personName}</h3>
                        <div className="mt-3 space-y-2">
                          {group.matches.map((match) => (
                            <div key={`${group.personId}-${match.profile.wikiTreeId}`} className="rounded-md bg-background p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {match.profile.firstName} {match.profile.lastName}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {match.profile.wikiTreeId}
                                    {match.profile.birthDate ? ` · b. ${match.profile.birthDate}` : ''}
                                  </p>
                                </div>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {match.score}%
                                </span>
                              </div>
                              {match.profile.birthLocation && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Born in {match.profile.birthLocation}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {match.reasons.map((reason) => (
                                  <span key={reason} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                                    {reason}
                                  </span>
                                ))}
                              </div>
                              {match.profile.url && (
                                <a
                                  href={match.profile.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex min-h-[36px] items-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-secondary"
                                >
                                  Explore on WikiTree
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPersonId && (
        <PersonDetailDrawer
          personId={selectedPersonId}
          treeSlug={slug!}
          onClose={() => setSelectedPersonId(null)}
          onSelectPerson={setSelectedPersonId}
          onNavigateToFamily={(id) => handleNavigateToFamily(id)}
          onDone={handleDone}
        />
      )}

      {showAddFirstMember && (
        <AddPersonForm
          treeSlug={slug!}
          prefilledRelType={null}
          relatedPersonId={null}
          title="Add the first member"
          intro="This person becomes the starting point for the tree."
          submitLabel="Create First Member"
          onClose={() => setShowAddFirstMember(false)}
        />
      )}
    </div>
  );
}
