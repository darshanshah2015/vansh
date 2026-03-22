import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, LayoutGrid, List, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'radial' | 'top-down' | 'left-right';

interface TreeControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showListView?: boolean;
  onToggleListView?: () => void;
}

export function TreeControls({
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onReset,
  showListView,
  onToggleListView,
}: TreeControlsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const viewModes: { mode: ViewMode; label: string }[] = [
    { mode: 'radial', label: 'Radial' },
    { mode: 'top-down', label: 'Top-Down' },
    { mode: 'left-right', label: 'Left-Right' },
  ];

  return (
    <>
      {/* Mobile: floating toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg md:hidden"
        aria-label={mobileOpen ? 'Hide controls' : 'Show controls'}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
      </button>

      {/* Mobile: compact horizontal bar */}
      <div
        className={cn(
          'absolute bottom-14 right-3 z-10 flex flex-col gap-2 transition-all duration-200 ease-in-out md:hidden',
          mobileOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        {/* View mode */}
        <div className="flex rounded-lg border border-border bg-card shadow-md">
          {viewModes.map((vm) => (
            <button
              key={vm.mode}
              onClick={() => onViewModeChange(vm.mode)}
              className={cn(
                'px-2.5 py-2 text-[11px] font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                viewMode === vm.mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {vm.label}
            </button>
          ))}
        </div>

        {/* Zoom + list toggle row */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 py-1 shadow-md">
          <button onClick={onZoomIn} className="rounded p-1.5 hover:bg-secondary" aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={onZoomOut} className="rounded p-1.5 hover:bg-secondary" aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={onReset} className="rounded p-1.5 hover:bg-secondary" aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </button>
          {onToggleListView && (
            <button
              onClick={onToggleListView}
              className="rounded p-1.5 hover:bg-secondary"
              aria-label={showListView ? 'Tree view' : 'List view'}
            >
              {showListView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Legend */}
        {!showListView && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-[#2E7D32]" />
                <span className="text-[10px] text-muted-foreground">Parent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-[#F9A825]" />
                <span className="text-[10px] text-muted-foreground">Spouse</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded border-t-2 border-dashed border-[#0EA5E9]" />
                <span className="text-[10px] text-muted-foreground">Sibling</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: original vertical layout */}
      <div className="absolute bottom-4 right-4 z-10 hidden flex-col gap-2 md:flex md:bottom-6 md:right-6">
        {/* View mode toggle */}
        <div className="flex rounded-lg border border-border bg-card shadow-md">
          {viewModes.map((vm) => (
            <button
              key={vm.mode}
              onClick={() => onViewModeChange(vm.mode)}
              className={cn(
                'min-h-[44px] px-3 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                viewMode === vm.mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {vm.label}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex flex-col rounded-lg border border-border bg-card shadow-md">
          <button
            onClick={onZoomIn}
            className="flex min-h-[44px] items-center justify-center rounded-t-lg hover:bg-secondary"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex min-h-[44px] items-center justify-center border-y border-border hover:bg-secondary"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={onReset}
            className="flex min-h-[44px] items-center justify-center rounded-b-lg hover:bg-secondary"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {onToggleListView && (
          <button
            onClick={onToggleListView}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-card shadow-md hover:bg-secondary"
            aria-label={showListView ? 'Show tree view' : 'Show list view'}
          >
            {showListView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
        )}

        {/* Legend */}
        {!showListView && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-5 rounded bg-[#2E7D32]" />
                <span className="text-[10px] text-muted-foreground">Parent-Child</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-5 rounded bg-[#F9A825]" />
                <span className="text-[10px] text-muted-foreground">Spouse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-5 rounded border-t-2 border-dashed border-[#0EA5E9]" />
                <span className="text-[10px] text-muted-foreground">Siblings</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
