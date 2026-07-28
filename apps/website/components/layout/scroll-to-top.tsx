'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Always start a page at the top on load/reload and on route change. Without this
 * the browser restores the previous scroll position on reload (which is why some
 * tall pages came back scrolled to the footer). In-page anchors (#hash) are left
 * alone so "skip to content" and jump links still work.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    if (window.location.hash) return; // leave #anchor jumps alone

    const toTop = () => window.scrollTo(0, 0);
    let r2 = 0;
    toTop();
    // Some pages fetch data and grow after first paint; re-assert the top across
    // the next couple of frames so late layout shifts can't leave us scrolled down.
    const r1 = requestAnimationFrame(() => {
      toTop();
      r2 = requestAnimationFrame(toTop);
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pathname]);
  return null;
}
