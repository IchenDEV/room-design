import type { Store } from '../store/store';
import { analyzeTemplateTarget, type TemplateAnalysis, type TemplateRoom, type TemplateStyle } from './analysis';
import { applyDiningPlan, applyLivingPlan, applyMoodPlan, applyWorkPlan } from './actions';

export interface TemplatePlan {
  id: string; title: string; tag: string; summary: string; bullets: string[];
  disabled?: string; run: () => number;
}

export const TEMPLATE_STYLES: { id: TemplateStyle; name: string }[] = [
  { id: 'warm', name: '温馨' }, { id: 'minimal', name: '极简' },
  { id: 'bright', name: '通透' }, { id: 'work', name: '办公' },
];

const noRoom = '需要先画出闭合房间';
const roomLabel = (r: TemplateRoom | null) => (r ? `${r.name} · ${r.area.toFixed(1)}㎡` : '未识别房间');

function disabledPlan(id: string, title: string): TemplatePlan {
  return {
    id, title, tag: '待补全', summary: noRoom,
    bullets: ['先用矩形房间或画墙工具闭合空间', '模板会优先作用于选中的房间'],
    disabled: noRoom, run: () => 0,
  };
}

function basePlans(s: Store, r: TemplateRoom, style: TemplateStyle): TemplatePlan[] {
  const room = roomLabel(r);
  return [
    {
      id: 'mood', title: '氛围统一', tag: '材质',
      summary: `为 ${room} 统一墙面、地面、吊顶和光线。`,
      bullets: ['墙面改为低饱和色', '开启吊顶并调整太阳高度', '保留当前家具布局'],
      run: () => applyMoodPlan(s, r, style),
    },
    {
      id: 'living', title: '会客核心', tag: '客厅',
      summary: `为 ${room} 建立沙发、茶几、电视柜和软装中心。`,
      bullets: ['新增沙发与茶几轴线', '补充地毯、落地灯、绿植', '适合客厅或开放起居区'],
      run: () => applyLivingPlan(s, r, style),
    },
    {
      id: 'work', title: '高效工作角', tag: '办公',
      summary: `为 ${room} 放入桌椅、显示器和任务照明。`,
      bullets: ['靠边布置办公桌', '补充人体工学椅和屏幕', '用绿植缓和工作区'],
      run: () => applyWorkPlan(s, r, style),
    },
    {
      id: 'dining', title: '餐叙区', tag: '餐厨',
      summary: `为 ${room} 补齐餐桌、座椅、餐边柜和角落绿植。`,
      bullets: ['按面积选择四人或六人桌', '保留桌椅四周通行空间', '适合餐厅或开放厨房旁'],
      run: () => applyDiningPlan(s, r, style),
    },
  ];
}

export function buildTemplatePlans(s: Store, style: TemplateStyle): { analysis: TemplateAnalysis; plans: TemplatePlan[] } {
  const analysis = analyzeTemplateTarget(s);
  const target = analysis.target;
  if (!target) return {
    analysis,
    plans: [disabledPlan('mood', '氛围统一'), disabledPlan('living', '会客核心'), disabledPlan('work', '高效工作角')],
  };
  const plans = basePlans(s, target, style);
  return { analysis, plans: style === 'work' ? [plans[2], plans[0], plans[1], plans[3]] : plans };
}
