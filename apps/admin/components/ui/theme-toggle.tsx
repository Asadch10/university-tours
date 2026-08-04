'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Light/dark switch for the console topbar. The two icons cross-fade rather than swap so
 * the control keeps a fixed size and never reflows the topbar mid-transition.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900',
        className,
      )}
    >
      <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
        <Sun
          size={17}
          aria-hidden
          className={cn(
            'absolute transition-all duration-300 ease-premium',
            isLight ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
          )}
        />
        <Moon
          size={17}
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
