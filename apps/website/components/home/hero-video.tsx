'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The hero's rotating background video.
 *
 * Plays the six clips in `public/videos` in a random order, reshuffling after each
 * full pass so the sequence differs between visits.
 *
 * Two <video> elements are stacked and crossfaded. The one that is fading out keeps
 * playing its own clip until the fade completes — only then is it re-pointed at the
 * upcoming clip to buffer it. Re-pointing it any earlier is what made a third clip
 * flash between two others.
 *
 * The fade starts slightly BEFORE the outgoing clip ends, so both players are moving
 * during the transition rather than one freezing on its last frame.
 */

// encodeURI because one filename contains a space ("consultaion 2.mp4"). Files are
// referenced exactly as they sit on disk, so re-uploading them can't break paths.
const HERO_VIDEOS = [
  '/videos/campusTour-1.mp4',
  '/videos/CampusTour2.mp4',
  '/videos/videocall1.mp4',
  '/videos/videocall2.mp4',
  '/videos/conultantion1.mp4',
  '/videos/consultaion 2.mp4',
].map(encodeURI);

/** Crossfade length. Long enough to read as a dissolve rather than a cut. */
const FADE_MS = 1400;

/**
 * Playback speed. The clips are shot fast; a touch under 1 makes the motion calmer
 * without looking like slow motion. Also stretches each ~5s clip to ~7s, so the
 * rotation itself feels less frantic.
 */
const PLAYBACK_RATE = 0.75;

/**
 * Vertical focal point for the crop. The container is capped to the viewport height,
 * so object-cover crops vertically; every clip frames faces in the upper third, so
 * the crop is biased to come off the bottom instead.
 */
const FOCAL_Y = '28%';

/**
 * Every clip has a "PixVerse.ai" watermark burned into the top-right corner by the
 * tool that generated it — measured at x 881-995, y 28-47 of the 1024x576 source,
 * i.e. starting at 86% of the width. Scaling the player up and anchoring it to the
 * left pushes that corner outside the container, which is overflow-hidden, so the
 * mark is cropped away rather than covered up.
 *
 * 1.163 is the minimum that clears it; 1.18 leaves a margin so the mark can't creep
 * back in if a clip is ever re-exported slightly differently. The 30% vertical
 * anchor keeps most of the added crop off the BOTTOM, matching FOCAL_Y — the clips
 * frame faces in the upper third.
 *
 * If the clips are ever re-generated without a watermark, drop this back to 1 and
 * the framing returns to the original composition.
 */
const WATERMARK_ZOOM = 1.18;
const WATERMARK_ZOOM_ORIGIN = '0% 30%';

/** Fisher–Yates, optionally guaranteeing the first item isn't `avoid`. */
function shuffle(list: string[], avoid?: string): string[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  if (avoid && a.length > 1 && a[0] === avoid) [a[0], a[1]] = [a[1]!, a[0]!];
  return a;
}

export function HeroVideo({ poster }: { poster: string }) {
  // Deterministic first paint — shuffling during render would give the server and
  // the client different markup and trip a hydration mismatch.
  const [srcs, setSrcs] = useState<[string, string]>([HERO_VIDEOS[0]!, HERO_VIDEOS[1]!]);
  const [active, setActive] = useState(0);
  /**
   * Both players used to carry preload="auto", so TWO clips were fetched before
   * the page had rendered anything — the single biggest item on the hero's
   * critical path. The standby now stays at preload="none" until the visible clip
   * is actually playing, which takes ~500KB out of first load. It still has the
   * full clip duration (~7s at 0.75x) to buffer before the crossfade needs it.
   */
  const [primed, setPrimed] = useState(false);

  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  /** Remaining clips in the current pass; refilled (reshuffled) when exhausted. */
  const queue = useRef<string[]>([]);
  const lastPlayed = useRef<string>('');
  /** Guards against the fade being triggered twice for the same clip. */
  const swapping = useRef(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Next clip to show, refilling and reshuffling the queue when it runs dry. */
  const pull = useCallback((): string => {
    if (queue.current.length === 0) queue.current = shuffle(HERO_VIDEOS, lastPlayed.current);
    const clip = queue.current.shift()!;
    lastPlayed.current = clip;
    return clip;
  }, []);

  // Randomise on mount: the visible player gets a random clip, the hidden one
  // preloads whatever follows it.
  useEffect(() => {
    queue.current = shuffle(HERO_VIDEOS);
    const first = pull();
    const second = pull();
    setSrcs([first, second]);
    setActive(0);
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [pull]);

  /**
   * Begin the crossfade to the hidden player, which is already buffered.
   *
   * The outgoing player is deliberately left alone until the fade finishes — the
   * whole point is that it keeps showing its own clip while dissolving.
   */
  const advance = useCallback(() => {
    if (swapping.current) return;
    swapping.current = true;

    const incoming = 1 - active;
    const el = refs[incoming]?.current;
    if (el) {
      el.currentTime = 0;
      el.playbackRate = PLAYBACK_RATE;
      void el.play().catch(() => {});
    }
    setActive(incoming);

    // Only once the dissolve is over is the now-hidden player re-pointed at the next
    // clip. Doing this immediately is what caused a third clip to flash mid-fade.
    fadeTimer.current = setTimeout(() => {
      const upcoming = pull();
      setSrcs((s) => {
        const nextSrcs: [string, string] = [...s] as [string, string];
        nextSrcs[1 - incoming] = upcoming;
        return nextSrcs;
      });
      swapping.current = false;
    }, FADE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pull]);

  // Keep the visible player at the reduced rate. playbackRate resets whenever a new
  // source loads, so it has to be reapplied rather than set once.
  useEffect(() => {
    const el = refs[active]?.current;
    if (el) {
      el.playbackRate = PLAYBACK_RATE;
      void el.play().catch(() => {});
    }
    // Hold the hidden player on its first frame: preload="auto" still buffers it, but
    // it isn't burning a second decode loop off-screen, and it's guaranteed to start
    // from the beginning when it fades in.
    const hidden = refs[1 - active]?.current;
    if (hidden && !swapping.current) {
      hidden.pause();
      hidden.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, srcs]);

  // Changing the preload attribute is advisory; browsers don't consistently act on
  // it after the element exists. An explicit load() makes the buffering deterministic.
  useEffect(() => {
    if (!primed) return;
    const standby = refs[1 - active]?.current;
    if (standby && standby.readyState === 0) standby.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primed]);

  /**
   * Start the fade FADE_MS before the clip ends so both players are still moving
   * through the transition. `onEnded` is only a backstop — if timeupdate resolution
   * misses the window (or the clip is shorter than the fade), it still advances.
   */
  const onTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      if (!el.duration || Number.isNaN(el.duration)) return;
      const remainingMs = ((el.duration - el.currentTime) / PLAYBACK_RATE) * 1000;
      if (remainingMs <= FADE_MS) advance();
    },
    [advance],
  );

  return (
    <>
      {[0, 1].map((slot) => {
        const isActive = slot === active;
        return (
          <video
            key={slot}
            ref={refs[slot]}
            src={srcs[slot]}
            poster={poster}
            muted
            playsInline
            autoPlay
            preload={isActive || primed ? 'auto' : 'none'}
            aria-hidden="true"
            // Only the first clip reaching "playing" releases the standby to buffer.
            onPlaying={isActive && !primed ? () => setPrimed(true) : undefined}
            onTimeUpdate={isActive ? onTimeUpdate : undefined}
            onEnded={isActive ? advance : undefined}
            // A clip that fails to load must not freeze the rotation.
            onError={isActive ? advance : undefined}
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = PLAYBACK_RATE;
            }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: isActive ? 1 : 0,
              // Symmetric ease so the outgoing and incoming clips cross at even
              // weight — a linear fade reads as a dip through the darker frame.
              transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.6, 1)`,
              objectPosition: `50% ${FOCAL_Y}`,
              // Crops the generator's watermark out of the top-right — see above.
              transform: `scale(${WATERMARK_ZOOM})`,
              transformOrigin: WATERMARK_ZOOM_ORIGIN,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
}
