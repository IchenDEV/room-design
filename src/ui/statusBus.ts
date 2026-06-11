// 高频状态（坐标/缩放）走命令式更新，避免 React 每次 mousemove 重渲染
let coordEl: HTMLElement | null = null;
let zoomEl: HTMLElement | null = null;

export function bindStatus(coord: HTMLElement | null, zoom: HTMLElement | null) {
  coordEl = coord;
  zoomEl = zoom;
}

export function setStatus(coords: string, zoom: string) {
  if (coordEl) coordEl.textContent = coords;
  if (zoomEl) zoomEl.textContent = zoom;
}
