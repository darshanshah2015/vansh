import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'vansh_visit_count';
const DISMISS_COUNT_KEY = 'vansh_install_dismiss_count';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Track visit count
    const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    localStorage.setItem(VISIT_COUNT_KEY, String(count + 1));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const visitCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
  const dismissCount = Number(localStorage.getItem(DISMISS_COUNT_KEY) || '0');

  const shouldShow =
    !!deferredPrompt && visitCount >= 2 && dismissCount < 2;

  const dismiss = useCallback(() => {
    const count = Number(localStorage.getItem(DISMISS_COUNT_KEY) || '0');
    localStorage.setItem(DISMISS_COUNT_KEY, String(count + 1));
  }, []);

  return {
    canInstall: !!deferredPrompt,
    shouldShow,
    promptInstall,
    dismiss,
  };
}
