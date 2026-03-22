import { ZoomIn, ZoomOut, RotateCcw, LayoutGrid, List } from 'lucide-react';
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
  const viewModes: { mode: ViewMode; label: string }[] = [
    { mode: 'radial', label: 'Radial' },
    { mode: 'top-down', label: 'Top-Down' },
    { mode: 'left-right', label: 'Left-Right' },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 md:bottom-6 md:right-6">
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
    </div>
  );
}
