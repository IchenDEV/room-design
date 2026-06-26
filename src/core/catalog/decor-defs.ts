import { D, type FurnDef } from './types';

const DESK = 75;

export const DECOR_DEFS: FurnDef[] = [
  D('monitor-24', '24 寸显示器', 'decor', 'whiteboard', 55, 10, 36, '#20252c', 'glass', DESK),
  D('monitor-wide', '宽屏显示器', 'decor', 'whiteboard', 78, 12, 38, '#1c2229', 'glass', DESK),
  D('monitor-dual', '双显示器', 'decor', 'whiteboard', 112, 12, 36, '#222832', 'glass', DESK),
  D('keyboard', '键盘', 'decor', 'printer', 46, 16, 4, '#30343a', 'plastic', DESK),
  D('mousepad', '鼠标垫', 'decor', 'rug', 32, 24, 1, '#53606d', 'felt', DESK),
  D('desk-lamp', '桌面台灯', 'decor', 'lamp', 28, 28, 48, '#d7c69d', 'metal', DESK),
  D('desk-plant', '桌面绿植', 'decor', 'plant', 24, 24, 34, '#5d8f62', 'plant', DESK),
  D('books-stack', '书本摆件', 'decor', 'filecabinet', 34, 22, 12, '#a88455', 'wood', DESK),
  D('vase-small', '小花瓶', 'decor', 'plant', 18, 18, 32, '#8fae9a', 'ceramic', DESK),
  D('desk-organizer', '笔筒收纳', 'decor', 'printer', 22, 16, 18, '#8b95a6', 'metal', DESK),
  D('picture-frame', '桌面相框', 'decor', 'whiteboard', 24, 8, 28, '#b99b75', 'wood', DESK),
];
