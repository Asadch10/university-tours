'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The hero's rotating background video.
 *
 * Plays the six clips in `public/videos` one after another in a random order,
 * reshuffling each time it finishes a full pass so the sequence differs on every
 * visit rather than cycling the same loop.
 *
 * Two <video> elements are stacked and crossfaded: while one plays, the other is
 * already buffering the next clip. The clips are only ~5s each, so a hard cut every
 * five seconds would read as a glitch — the fade makes the rotation feel deliberate,
 * and preloading means the swap never shows a blank frame.
 */

// encodeURI because some filenames contain spaces ("consultaion 2.mp4"). The files
// are referenced exactly as they sit on disk so re-uploading them doesn't break paths.
const HERO_VIDEOS = [
  '/videos/campusTour-1.mp4',
  '/videos/CampusTour2.mp4',
  '/videos/videocall1.mp4',
  '/videos/videocall2.mp4',
  '/videos/conultantion1.mp4',
  '/videos/consultaion 2.mp4',
].map(encodeURI);

/** Fisher–Yates, optionally guaranteeing the first item isn't `avoid`. */
function shuffle(list: string[], avoid?: string): string[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  // Stops the same clip playing twice across a cycle boundary.
  if (avoid && a.length > 1 && a[0] === avoid) {
    [a[0], a[1]] = [a[1]!, a[0]!];
  }
  return a;
}

const FADE_MS = 700;

/**
 * Vertical focal point for the crop. 50% (the browser default) centres it; lower
 * values keep more of the top of the frame. 28% keeps every subject's head in shot
 * with a little headroom, without exposing empty sky/ceiling.
 */
const FOCAL_Y = '28%';

export function HeroVideo({ poster }: { poster: string }) {
  // Deterministic on the server and for the first paint — shuffling during render
  // would produce a hydration mismatch. The randomisation happens on mount.
  const [order, setOrder] = useState<string[]>(HERO_VIDEOS);
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(0); // which of the two players is visible

  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];

  useEffect(() => {
    setOrder(shuffle(HERO_VIDEOS));
  }, []);

  const current = order[idx] ?? HERO_VIDEOS[0]!;
  const next = order[(idx + 1) % order.length] ?? HERO_VIDEOS[0]!;

  /** Advance to the next clip, reshuffling when a full pass completes. */
  const advance = useCallback(() => {
    setIdx((i) => {
      const last = order[i];
      if (i + 1 >= order.length) {
        setOrder((o) => shuffle(o, last));
        return 0;
      }
      return i + 1;
    });
    setActive((a) => 1 - a);
  }, [order]);

  // Play whichever player just became visible. Autoplay can be refused (low power
  // mode, reduced-motion settings) — the poster stays up and nothing breaks.
  useEffect(() => {
    const el = refs[active]?.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, current]);

  // A clip that fails to load (missing file, unsupported codec) must not freeze the
  // rotation — skip straight to the next one.
  const onError = useCallback(() => advance(), [advance]);

  return (
    <>
      {[0, 1].map((slot) => {
        const isActive = slot === active;
        return (
          <video
            key={slot}
            ref={refs[slot]}
            src={isActive ? current : next}
            poster={poster}
            muted
            playsInline
            autoPlay={isActive}
            preload="auto"
            aria-hidden="true"
            onEnded={isActive ? advance : undefined}
            onError={isActive ? onError : undefined}
            className="absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              // The clips are 16:9 but the container is capped to the viewport height,
              // which usually leaves it WIDER than 16:9 — so object-cover has to crop
              // vertically. Centred cropping takes an equal slice off the top, and in
              // every one of these clips the faces sit in the upper third, so heads got
              // clipped at the header edge. Biasing upward makes the crop come off the
              // bottom instead, which is only tables, laptops and torsos.
              objectPosition: `50% ${FOCAL_Y}`,
              // The hidden player must never intercept clicks on the search card.
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
}
