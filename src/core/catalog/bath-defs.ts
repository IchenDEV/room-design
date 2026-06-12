import { D, type FurnDef } from './types';

export const BATH_DEFS: FurnDef[] = [
  D('toilet-wall', '壁挂马桶', 'bath', 'toilet', 40, 58, 78, '#e8eef2', 'ceramic'),
  D('toilet-smart', '智能马桶', 'bath', 'toilet', 46, 72, 78, '#edf2f5', 'ceramic'),
  D('vanity-60', '浴室柜 60', 'bath', 'bathsink', 60, 48, 85, '#cdd8de', 'ceramic'),
  D('vanity-90', '浴室柜 90', 'bath', 'bathsink', 90, 52, 85, '#c7d4dc', 'ceramic'),
  D('vanity-120', '双盆浴室柜', 'bath', 'bathsink', 120, 55, 86, '#c4d0d8', 'ceramic'),
  D('pedestal-sink', '立柱盆', 'bath', 'bathsink', 58, 48, 85, '#eef2f3', 'ceramic'),
  D('mirror-cabinet', '镜柜', 'bath', 'whiteboard', 90, 12, 72, '#c5d2d8', 'glass'),
  D('bath-shelf', '浴室置物架', 'bath', 'shelf', 45, 35, 160, '#8f989f', 'metal'),
  D('towel-rack', '毛巾架', 'bath', 'shelf', 70, 12, 110, '#a8adb2', 'metal'),
  D('btub-corner', '转角浴缸', 'bath', 'bathtub', 150, 150, 58, '#dfe9ee', 'ceramic'),
  D('btub-free', '独立浴缸', 'bath', 'bathtub', 170, 78, 62, '#edf2f3', 'ceramic'),
  D('shower-rect', '矩形淋浴房', 'bath', 'shower', 120, 90, 200, '#c2d4dc', 'glass'),
  D('shower-wide', '宽淋浴房', 'bath', 'shower', 150, 90, 200, '#bfd2db', 'glass'),
  D('shower-curtain', '浴帘淋浴区', 'bath', 'partition', 120, 8, 190, '#9db8c7', 'fabric'),
  D('washer-dryer', '洗烘一体机', 'bath', 'washer', 60, 65, 85, '#b8c0c7', 'metal'),
  D('laundry-stack', '叠放洗衣机', 'bath', 'washer', 65, 70, 170, '#adb7be', 'metal'),
  D('laundry-cabinet', '洗衣柜', 'bath', 'counter', 130, 65, 92, '#b5b8b0', 'stone'),
  D('bath-bench', '浴室凳', 'bath', 'stool', 42, 32, 45, '#b18f61', 'wood'),
  D('hamper-bath', '脏衣篮', 'bath', 'counter', 48, 42, 58, '#b0956b', 'rattan'),
  D('bath-mat', '浴室地垫', 'bath', 'rug', 80, 50, 2, '#9aa9b3', 'felt'),
];
