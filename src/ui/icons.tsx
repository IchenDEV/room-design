export const ICONS: Record<string, string> = {
  select: 'M5 3l5.5 15 2.2-6.3L19 9.5z',
  boxSelect: 'M5 5h4M15 5h4M5 5v4M19 5v4M5 15v4M5 19h4M15 19h4M19 15v4M9 9h6v6H9z',
  wall: 'M3 16l18-9M3 20l18-9',
  rect: 'M4 6h16v12H4z',
  door: 'M6 20V4h9M15 4c4.4 1.8 6.5 5.8 6.5 10.5M4 20h16',
  window: 'M4 5h16v14H4zM12 5v14M4 12h16',
  outlet: 'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9.5 9v3M14.5 9v3M10 16h4',
  ruler: 'M4 17L17 4l3 3L7 20zM14.5 6.5l3 3M12 9l1.5 1.5M9.5 11.5l3 3M7 14l1.5 1.5',
  measure: 'M5 17h14M7 14l-3 3 3 3M17 14l3 3-3 3M8 7h8M8 4v6M16 4v6',
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
  share: 'M12 16V4M7 9l5-5 5 5M5 12v7h14v-7',
  camera: 'M4 7.5h3.6l1.8-2.3h5.2l1.8 2.3H20V19H4zM12 16.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8',
  help: 'M9.2 9.2a2.9 2.9 0 1 1 4.4 2.5c-.9.6-1.6 1.1-1.6 2.3M12 17.3h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  clear: 'M18.5 3.5L11 11M8 10l6 6-3.5 4.5h-5L3 18l5-8z',
  chev: 'M6 9.5l6 6 6-6',
  fit: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M8 8h12v12H8zM4 4h12v12',
  rotate: 'M21 12a9 9 0 1 1-2.6-6.4M21 4v8h-8',
  flip: 'M4 5v14M20 5v14M7 8l4 4-4 4M17 8l-4 4 4 4',
  group: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  ungroup: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6zM10 7h4M7 10v4M17 10v4M10 17h4',
  glass: 'M6 3h12l-2 18H8zM9 8h6M8.5 13h7',
  solid: 'M4 7h16M4 12h16M4 17h16M7 4v16M13 4v16M19 4v16',
  room: 'M4 4h16v16H4zM8 4v6h5M13 10v10',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  sample: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  label: 'M4 6v6l8 8 8-8-8-8H4zM8 8h.01',
  sofa: 'M5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 12h16v6H4zM7 18v2M17 18v2',
  bed: 'M4 11V5M4 11h16M20 11v8M4 19v-8M7 8h5v3M12 8h5v3',
  dining: 'M8 3v8M5 3v5a3 3 0 0 0 6 0V3M8 11v10M16 3v18M14 3h4',
  bath: 'M5 11h16v2a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-2h2M7 11V6a3 3 0 0 1 3-3h1M9 19l-1 2M17 19l1 2',
  chair: 'M7 4h10v8H7zM7 12v8M17 12v8M7 16h10',
  office: 'M4 7h16v13H4zM9 7V4h6v3M4 12h16',
};

export function Ic({ n, size = 17 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[n] ?? ''} />
    </svg>
  );
}
