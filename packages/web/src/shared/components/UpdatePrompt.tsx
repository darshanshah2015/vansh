import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:w-80">
      <p className="text-sm font-medium">Update Available</p>
      <p className="mt-1 text-xs text-muted-foreground">A new version of Vansh is available.</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Update Now
      </button>
    </div>
  );
}
