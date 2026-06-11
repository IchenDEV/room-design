export const ICONS: Record<string, string> = {
  select: 'M5 3l5.5 15 2.2-6.3L19 9.5z',
  wall: 'M3 16l18-9M3 20l18-9',
  rect: 'M4 6h16v12H4z',
  door: 'M6 20V4h9M15 4c4.4 1.8 6.5 5.8 6.5 10.5M4 20h16',
  window: 'M4 5h16v14H4zM12 5v14M4 12h16',
  undo: 'M8 5L3 10l5 5M3 10h10.5a6 6 0 0 1 0 12H10',
  redo: 'M16 5l5 5-5 5M21 10H10.5a6 6 0 0 0 0 12H14',
  trash: 'M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12L3 7M12 12v10',
  plan: 'M4 4h16v16H4zM4 13h9M13 13v7M13 4v5',
  walk: 'M13.5 4.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0M8 21l2.4-6.5L9 9.8 13 8l1.8 3.6 3.4 1.2M13 14.5L15 21M9.5 9.8L6 12',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M19.4 4.6l-1.7 1.7M6.3 17.7l-1.7 1.7',
  moon: 'M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a7 7 0 0 0 10 10',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  upload: 'M12 20V8M7 13l5-5 5 5M4 4h16',
  camera: 'M4 7.5h3.6l1.8-2.3h5.2l1.8 2.3H20V19H4zM12 16.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8',
  help: 'M9.2 9.2a2.9 2.9 0 1 1 4.4 2.5c-.9.6-1.6 1.1-1.6 2.3M12 17.3h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  clear: 'M18.5 3.5L11 11M8 10l6 6-3.5 4.5h-5L3 18l5-8z',
  chev: 'M6 9.5l6 6 6-6',
  fit: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
};

export function Ic({ n, size = 17 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[n] ?? ''} />
    </svg>
  );
}
