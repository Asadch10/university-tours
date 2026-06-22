'use client';

import { useEffect, useRef } from 'react';

/* ── Leaflet loaded from CDN at runtime ──────────────────────────────────
   We deliberately avoid `import 'leaflet'` / `import 'leaflet/dist/...css'`
   so the production build never needs the npm package resolved by the
   bundler (the map is client-only via `ssr: false`). This keeps `next build`
   working regardless of how the deploy environment installs dependencies. */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let leafletPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet needs a browser'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // Inject stylesheet once
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet', '');
      document.head.appendChild(link);
    }
    // Inject (or reuse) the script
    const existing = document.querySelector('script[data-leaflet]') as HTMLScriptElement | null;
    if (existing) {
      if (w.L) resolve(w.L);
      else existing.addEventListener('load', () => resolve(w.L));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.setAttribute('data-leaflet', '');
    script.onload = () => resolve(w.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.body.appendChild(script);
  });
  return leafletPromise;
}

export type UniversityPin = {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  image: string;
  blurb: string;
  ambassadors: number;
  ranking: string;
  href: string;
};

interface MapViewProps {
  universities: UniversityPin[];
  selectedId: string | null;
  onSelect: (u: UniversityPin) => void;
  /** Width (px) of the detail panel that overlaps the map's right edge. */
  panelWidth?: number;
}

export function MapView({ universities, selectedId, onSelect, panelWidth = 400 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const didSelectRef = useRef(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // ── Init map once on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    (async () => {
      const L = await loadLeaflet();
      if (!isMounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [38.5, -96],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 20,
        },
      ).addTo(map);

      // Custom attribution bottom-right
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);
      // Zoom top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      universities.forEach((u) => {
        const marker = L.circleMarker([u.lat, u.lng], {
          radius: 9,
          color: '#fff',
          fillColor: '#2563EB',
          fillOpacity: 1,
          weight: 2.5,
        });

        const popup = L.popup({
          closeButton: false,
          offset: L.point(0, -10),
          className: 'uni-hover-popup',
          maxWidth: 252,
          autoPan: false,
        }).setContent(
          `<div style="overflow:hidden;border-radius:12px;width:252px;">
            <img
              src="${u.image}"
              alt="${u.name}"
              style="width:252px;height:148px;object-fit:cover;display:block;"
              onerror="this.style.display='none'"
            />
            <div style="padding:10px 14px 14px;background:#fff;">
              <p style="margin:0;font-weight:700;font-size:13.5px;color:#1f1a16;line-height:1.3;">${u.name}</p>
              <p style="margin:5px 0 0;font-size:12px;color:#85725f;">${u.city}, ${u.state}</p>
            </div>
          </div>`,
        );

        marker.on('mouseover', () => {
          marker.setStyle({ radius: 12 });
          popup.setLatLng([u.lat, u.lng]).openOn(map);
        });

        marker.on('mouseout', () => {
          marker.setStyle({ radius: 9 });
          map.closePopup(popup);
        });

        marker.on('click', () => {
          map.closePopup(popup);
          onSelectRef.current(u);
        });

        marker.addTo(map);
        markersRef.current.set(u.id, marker);
      });

      mapRef.current = map;

      // Leaflet computes tile layout from the container size at init time.
      // Inside a flex/dynamic-imported layout that size can still be settling,
      // leaving gray tiles — force a recalculation once, then keep it in sync.
      setTimeout(() => map.invalidateSize(), 0);
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(containerRef.current);
        resizeObsRef.current = ro;
      }
    })();

    return () => {
      isMounted = false;
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update marker colours + pan when selection changes ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      const active = id === selectedId;
      marker.setStyle({
        fillColor: active ? '#6b1521' : '#2563EB',
        color: '#fff',
        radius: active ? 12 : 9,
      });
      if (active) marker.bringToFront();
    });

    // Map needs a valid (non-zero) size before any animated flyTo, otherwise
    // Leaflet interpolates to NaN. Recompute size first, then bail if still 0.
    map.invalidateSize();
    const size = map.getSize();
    if (!size || size.x === 0 || size.y === 0) return;

    if (selectedId) {
      didSelectRef.current = true;
      const uni = universities.find((u) => u.id === selectedId);
      if (uni && Number.isFinite(uni.lat) && Number.isFinite(uni.lng)) {
        const targetZoom = 11;
        // The detail panel covers the right side of the map, so shift the map
        // center east by half the panel width. This keeps the selected pin
        // visible in the uncovered (left) portion — matching the reference.
        const pt = map.project([uni.lat, uni.lng], targetZoom);
        const center = map.unproject(pt.add([panelWidth / 2, 0]), targetZoom);
        map.flyTo(center, targetZoom, { duration: 1.2, easeLinearity: 0.4 });
      }
    } else if (didSelectRef.current) {
      // Only reset the view if the user actually had a selection open —
      // never on the initial mount (the map already starts at this view).
      map.flyTo([38.5, -96], 4, { duration: 1 });
    }
  }, [selectedId, universities, panelWidth]);

  return <div ref={containerRef} className="h-full w-full" />;
}
