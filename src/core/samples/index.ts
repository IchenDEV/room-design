import type { Project } from '../types';
import { makeHomeA } from './home-a';
import { makeHomeB } from './home-b';
import { makeOffice } from './office';

export interface SampleDef { id: string; name: string; make: () => Project }

export const SAMPLES: SampleDef[] = [
  { id: 'home-a', name: '温馨两居 74㎡', make: makeHomeA },
  { id: 'home-b', name: '开放一居 LOFT 40㎡', make: makeHomeB },
  { id: 'office', name: '现代办公室 112㎡', make: makeOffice },
];

export const sampleOf = (id: string): SampleDef | undefined => SAMPLES.find((s) => s.id === id);
export const defaultSample = (): Project => makeHomeA();
