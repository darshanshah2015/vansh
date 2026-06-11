import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

const NAV_STACK_KEY = 'vansh:navigation-stack';
const MAX_STACK_LENGTH = 25;

export function BackButton({ fallback = '/', label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const stack = readStack();
    if (stack[stack.length - 1] !== currentPath) {
      stack.push(currentPath);
      sessionStorage.setItem(
        NAV_STACK_KEY,
        JSON.stringify(stack.slice(-MAX_STACK_LENGTH))
      );
    }
  }, [currentPath]);

  const handleBack = () => {
    const stack = readStack();
    if (stack[stack.length - 1] === currentPath) {
      stack.pop();
    }
    const previousPath = stack[stack.length - 1];
    sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack));

    if (previousPath && previousPath !== currentPath) {
      navigate(previousPath);
      return;
    }
    navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'inline-flex min-h-[40px] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={label || 'Go back'}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </button>
  );
}

function readStack(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(NAV_STACK_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
