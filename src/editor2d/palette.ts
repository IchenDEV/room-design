import type { Theme } from '../core/types';

export interface Pal {
  paper: string; gridMinor: string; gridMajor: string; axis: string;
  wallFill: string; wallStroke: string; glassFill: string; glassStroke: string;
  sel: string; selSoft: string; hover: string;
  roomLabel: string; roomSub: string; roomEdge: string;
  dimText: string; dimPill: string; guide: string;
  ghostOk: string; ghostBad: string; handle: string;
  door: string; doorGlass: string; win: string;
}

const dark: Pal = {
  paper: '#12151a', gridMinor: '#1a1e25', gridMajor: '#222832', axis: '#2e3947',
  wallFill: '#c3ccd9', wallStroke: '#8d99ab', glassFill: 'rgba(120,190,235,0.4)', glassStroke: '#62a8d4',
  sel: '#4f8cff', selSoft: 'rgba(79,140,255,0.16)', hover: 'rgba(79,140,255,0.45)',
  roomLabel: '#e3e9f2', roomSub: '#9aa6b8', roomEdge: 'rgba(255,255,255,0.05)',
  dimText: '#cdd5e1', dimPill: 'rgba(8,10,14,0.82)', guide: '#38bdf8',
  ghostOk: 'rgba(94,201,135,0.85)', ghostBad: 'rgba(235,100,100,0.85)', handle: '#ffffff',
  door: '#d8a866', doorGlass: '#6fc0e8', win: '#7fb2d2',
};

const light: Pal = {
  paper: '#f7f8fa', gridMinor: '#eceef2', gridMajor: '#dfe3e9', axis: '#cdd3dc',
  wallFill: '#414b59', wallStroke: '#2e3742', glassFill: 'rgba(98,168,212,0.35)', glassStroke: '#4d94c4',
  sel: '#2f6fe4', selSoft: 'rgba(47,111,228,0.13)', hover: 'rgba(47,111,228,0.4)',
  roomLabel: '#39404c', roomSub: '#737d8c', roomEdge: 'rgba(0,0,0,0.06)',
  dimText: '#454d59', dimPill: 'rgba(255,255,255,0.92)', guide: '#0c93cf',
  ghostOk: 'rgba(46,160,92,0.9)', ghostBad: 'rgba(214,69,69,0.9)', handle: '#ffffff',
  door: '#b07f3e', doorGlass: '#3d9ecc', win: '#5b96b8',
};

export const palOf = (t: Theme): Pal => (t === 'dark' ? dark : light);
