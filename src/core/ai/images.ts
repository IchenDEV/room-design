export interface AiReferenceImage {
  id: string;
  name: string;
  mediaType: string;
  dataUrl: string;
  size: number;
}

const MAX_IMAGES = 4;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_EDGE = 1280;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);

const blobAsDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('图片压缩失败'));
  reader.readAsDataURL(blob);
});

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片无法识别')); };
  img.src = url;
});

const canvasBlob = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片压缩失败')), 'image/jpeg', quality);
});

async function compressImage(file: File) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器无法处理图片');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let blob = await canvasBlob(canvas, 0.84);
  for (const q of [0.72, 0.62, 0.52]) {
    if (blob.size <= MAX_OUTPUT_BYTES) break;
    blob = await canvasBlob(canvas, q);
  }
  return { dataUrl: await blobAsDataUrl(blob), size: blob.size, mediaType: 'image/jpeg' };
}

export async function readAiImages(files: FileList | File[], existing = 0): Promise<AiReferenceImage[]> {
  const room = Math.max(0, MAX_IMAGES - existing);
  const picked = Array.from(files).slice(0, room);
  const out: AiReferenceImage[] = [];
  for (const [index, file] of picked.entries()) {
    if (!ALLOWED.has(file.type)) throw new Error('仅支持 PNG、JPG 或 WebP 图片');
    if (file.size > MAX_INPUT_BYTES) throw new Error('单张参考图不能超过 15MB');
    const compressed = await compressImage(file);
    out.push({
      id: `${file.name}-${file.size}-${file.lastModified}-${existing + index}`,
      name: file.name,
      mediaType: compressed.mediaType,
      dataUrl: compressed.dataUrl,
      size: compressed.size,
    });
  }
  return out;
}

export const imageLimitText = `最多 ${MAX_IMAGES} 张，上传后自动压缩`;
