'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Light/dark switch. The two icons are cross-faded rather than swapped so the control
 * keeps a fixed size and never reflows the navbar mid-transition.
 */
export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      className={cn(
        'group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full text-ink-600 transition-colors duration-200 hover:bg-ink-50 hover:text-brand',
        showLabel ? 'w-full justify-between px-4 py-3' : 'h-10 w-10 justify-center',
        className,
      )}
    >
      {showLabel && <span className="text-sm font-medium">{isLight ? 'Dark theme' : 'Light theme'}</span>}
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Sun
          size={18}
          aria-hidden
          className={cn(
            'absolute transition-all duration-300 ease-premium',
            isLight ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
          )}
        />
        <Moon
          size={18}
          aria-hidden
          className={cn(
            'absolute transition-all duration-300 ease-premium',
            isLight ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
        />
      </span>
    </button>
  );
}
