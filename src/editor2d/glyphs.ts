import type { FurnDef } from '../core/catalog';
import { shade } from '../core/geometry';

/**
 * 家具俯视图例。
 * 局部坐标：原点在家具中心，x 向右，y 向"后"（靠墙侧），单位 cm。
 * 调用前 ctx 已完成 平移/旋转/翻转缩放，此处直接以 cm 绘制。
 */
export function drawGlyph(ctx: CanvasRenderingContext2D, def: FurnDef, w: number, d: number, color?: string) {
  const fill = color ?? def.color;
  const line = shade(fill, -70);
  const hw = w / 2, hd = d / 2;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.fillStyle = fill;

  const rr = (x: number, y: number, ww: number, hh: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, ww, hh, Math.min(r, ww / 2, hh / 2));
  };
  const base = (r = 5) => { rr(-hw, -hd, w, d, r); ctx.fill(); ctx.stroke(); };
  const dot = (x: number, y: number, r = 2.5) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

  switch (def.kind) {
    case 'sofa': {
      base(7);
      ctx.fillStyle = shade(fill, -20);
      rr(-hw + 3, hd - 19, w - 6, 16, 5); ctx.fill();           // 靠背
      rr(-hw + 3, -hd + 3, 13, d - 6, 5); ctx.fill();           // 左扶手
      rr(hw - 16, -hd + 3, 13, d - 6, 5); ctx.fill();           // 右扶手
      const seats = w > 170 ? 3 : w > 110 ? 2 : 1;
      ctx.strokeStyle = shade(fill, -32);
      ctx.lineWidth = 1.8;
      for (let i = 1; i < seats; i++) {
        const x = -hw + 16 + ((w - 32) / seats) * i;
        ctx.beginPath(); ctx.moveTo(x, -hd + 8); ctx.lineTo(x, hd - 20); ctx.stroke();
      }
      break;
    }
    case 'bed': {
      ctx.fillStyle = '#f6f5ef';
      base(5);
      ctx.fillStyle = fill;                                      // 被子
      rr(-hw + 4, -hd + 4, w - 8, d * 0.6, 6); ctx.fill();
      ctx.strokeStyle = shade(fill, -36); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-hw + 4, -hd + d * 0.6 - 14); ctx.lineTo(hw - 4, -hd + d * 0.6 - 14); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = shade(fill, -50); ctx.lineWidth = 2;
      if (w >= 150) {                                            // 枕头
        rr(-hw + 12, hd - 32, hw - 22, 24, 7); ctx.fill(); ctx.stroke();
        rr(10, hd - 32, hw - 22, 24, 7); ctx.fill(); ctx.stroke();
      } else {
        rr(-hw + 18, hd - 32, w - 36, 24, 7); ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'table': {
      base(6);
      ctx.strokeStyle = shade(fill, -28); ctx.lineWidth = 1.8;
      rr(-hw + 6, -hd + 6, w - 12, d - 12, 4); ctx.stroke();
      break;
    }
    case 'chair': {
      rr(-hw, -hd + 5, w, d - 9, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = shade(fill, -24);
      rr(-hw + 2, hd - 11, w - 4, 9, 4); ctx.fill();
      break;
    }
    case 'tvstand': {
      base(4);
      ctx.fillStyle = '#262b33';
      rr(-w * 0.36, hd - 9, w * 0.72, 6, 2); ctx.fill();         // 电视
      break;
    }
    case 'shelf': {
      base(3);
      ctx.strokeStyle = shade(fill, -30); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, -hd + 3); ctx.lineTo(0, hd - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hw + 3, -hd + 8); ctx.lineTo(hw - 3, -hd + 8); ctx.stroke();
      break;
    }
    case 'rug': {
      ctx.globalAlpha = 0.9;
      base(14);
      ctx.strokeStyle = shade(fill, -36); ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 6]);
      rr(-hw + 9, -hd + 9, w - 18, d - 18, 9); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      break;
    }
    case 'lamp': {
      ctx.beginPath(); ctx.arc(0, 0, hw - 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = line;
      dot(0, 0, 3.5);
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a) * (hw - 5), Math.sin(a) * (hw - 5)); ctx.stroke();
      }
      break;
    }
    case 'plant': {
      ctx.beginPath(); ctx.arc(0, 0, hw, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = shade(fill, -34);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i;
        dot(Math.cos(a) * hw * 0.45, Math.sin(a) * hw * 0.45, hw * 0.22);
      }
      ctx.fillStyle = shade(fill, -55);
      dot(0, 0, hw * 0.18);
      break;
    }
    case 'wardrobe': {
      base(3);
      ctx.strokeStyle = shade(fill, -30); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, -hd + 3); ctx.lineTo(0, hd - 3); ctx.stroke();
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(-hw + 5, 0); ctx.lineTo(hw - 5, 0); ctx.stroke();  // 挂衣杆
      ctx.setLineDash([]);
      ctx.fillStyle = line;
      dot(-5, -hd + 7, 2); dot(5, -hd + 7, 2);
      break;
    }
    case 'nightstand': {
      base(4);
      ctx.fillStyle = line;
      dot(0, -hd + 8, 2.5);
      break;
    }
    case 'dresser': {
      base(3);
      ctx.strokeStyle = shade(fill, -30); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-hw + 3, 0); ctx.lineTo(hw - 3, 0); ctx.stroke();
      ctx.fillStyle = line;
      dot(-w * 0.22, -hd + 8, 2); dot(w * 0.22, -hd + 8, 2);
      break;
    }
    case 'counter': {
      base(2);
      ctx.strokeStyle = shade(fill, -26); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-hw + 4, hd - 8); ctx.lineTo(hw - 4, hd - 8); ctx.stroke();
      if (def.sub === 'stove') {
        ctx.strokeStyle = '#3a4049'; ctx.lineWidth = 2.2;
        const r = Math.min(w, d) * 0.16;
        for (const [sx, sy] of [[-w * 0.2, -d * 0.08], [w * 0.2, -d * 0.08]]) {
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (def.sub === 'sink') {
        ctx.fillStyle = '#d6dde2';
        rr(-hw + 13, -hd + 10, w - 26, d - 28, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = line;
        dot(0, hd - 13, 3);
      }
      break;
    }
    case 'fridge': {
      base(3);
      ctx.strokeStyle = shade(fill, -30); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, -hd + 3); ctx.lineTo(0, hd - 3); ctx.stroke();
      ctx.fillStyle = line;
      dot(-5, -hd + 8, 2); dot(5, -hd + 8, 2);
      break;
    }
    case 'washer': {
      base(3);
      ctx.strokeStyle = shade(fill, -36); ctx.lineWidth = 2;
      const r = Math.min(w, d) / 2 - 9;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'toilet': {
      ctx.fillStyle = shade(fill, -12);
      rr(-hw, hd - 20, w, 18, 4); ctx.fill(); ctx.stroke();      // 水箱
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -9, hw - 3, hd - 14, 0, 0, Math.PI * 2);    // 坐圈
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = shade(fill, -28); ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, -11, hw - 11, hd - 23, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'bathsink': {
      base(4);
      ctx.fillStyle = '#eef1f3';
      ctx.beginPath(); ctx.ellipse(0, -2, hw - 10, hd - 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = line;
      dot(0, hd - 9, 3);
      break;
    }
    case 'bathtub': {
      base(9);
      ctx.strokeStyle = shade(fill, -26); ctx.lineWidth = 2;
      rr(-hw + 8, -hd + 8, w - 16, d - 16, 13); ctx.stroke();
      ctx.fillStyle = shade(fill, -30);
      dot(-hw + 22, 0, 3.5);
      break;
    }
    case 'shower': {
      ctx.globalAlpha = 0.85;
      base(3);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = shade(fill, -30); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-hw + 3, -hd + 3); ctx.lineTo(hw - 3, hd - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hw - 3, -hd + 3); ctx.lineTo(-hw + 3, hd - 3); ctx.stroke();
      ctx.fillStyle = shade(fill, -40);
      dot(hw - 14, hd - 14, 5);
      break;
    }
  }
}

/** 在目录卡片小画布上渲染图例（自动适配缩放） */
export function drawThumb(canvas: HTMLCanvasElement, def: FurnDef) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || 110, ch = canvas.clientHeight || 56;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  const k = Math.min((cw - 16) / def.w, (ch - 10) / def.d);
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(k, -k);
  drawGlyph(ctx, def, def.w, def.d);
}
