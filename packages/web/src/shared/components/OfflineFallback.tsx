import { WifiOff } from 'lucide-react';

export function OfflineFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <WifiOff className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">You are Offline</h1>
        <p className="mt-2 text-muted-foreground">
          Please check your internet connection and try again.
        </p>
      </div>
      <img src="/logo.png" alt="Vansh" className="h-10 w-auto" />
    </div>
  );
}
