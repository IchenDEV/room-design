import { generateObject, generateText, stepCountIs, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const point = z.object({ x: z.number(), y: z.number() });
const wall = z.object({
  id: z.string(), a: point, b: point, thickness: z.number(), height: z.number(), color: z.string(),
  material: z.enum(['solid', 'glass']).optional(),
  texture: z.enum(['paint', 'wallpaper', 'plaster', 'brick', 'concrete', 'woodPanel', 'tile']).optional(),
  glassGap: z.number().optional(),
});
const opening = z.object({
  id: z.string(), wallId: z.string(), kind: z.enum(['door', 'window']), t: z.number(),
  width: z.number(), height: z.number(), sill: z.number(), flip: z.boolean(),
  style: z.enum(['wood', 'glass']).optional(),
  swing: z.enum(['single', 'double']).optional(),
  openDir: z.enum(['in', 'out']).optional(),
});
const item = z.object({
  id: z.string(), defId: z.string(), x: z.number(), y: z.number(), rot: z.number(),
  w: z.number(), d: z.number(), h: z.number(), color: z.string().optional(),
  texture: z.enum(['fabric', 'leather', 'wood', 'darkWood', 'metal', 'glass', 'stone', 'ceramic', 'rattan', 'felt', 'plastic', 'plant']).optional(),
  flipX: z.boolean().optional(), z: z.number().optional(),
});
const group = z.object({ id: z.string(), name: z.string(), itemIds: z.array(z.string()) });
const ceiling = z.object({
  style: z.enum(['none', 'flat', 'tray', 'cove', 'grid']).optional(),
  drop: z.number().optional(), inset: z.number().optional(), color: z.string().optional(),
});
const roomMeta = z.object({ id: z.string(), anchor: point, name: z.string(), floor: z.string(), ceiling: ceiling.optional() });
const measure = z.object({ id: z.string(), a: point, b: point });
const settings = z.object({
  wallHeight: z.number(), wallThickness: z.number(), showCeiling: z.boolean(),
  rayTracing: z.boolean().optional(), solidCollision: z.boolean().optional(),
  sunIntensity: z.number().optional(), sunAzimuth: z.number().optional(), sunElevation: z.number().optional(),
  cameraX: z.number().optional(), cameraY: z.number().optional(), cameraZ: z.number().optional(),
});
const projectSchema = z.object({
  version: z.literal(1), name: z.string(), walls: z.array(wall), openings: z.array(opening),
  items: z.array(item), groups: z.array(group).optional(), measures: z.array(measure).optional(),
  roomMetas: z.array(roomMeta), settings,
});
const responseSchema = z.object({
  summary: z.string(),
  changes: z.array(z.string()),
  project: projectSchema,
});

const modelName = () => process.env.AI_MODEL || 'gpt-5';
const model = () => openai(modelName());

function assertInput(body) {
  if (!body?.prompt || typeof body.prompt !== 'string') throw new Error('缺少设计需求');
  if (!body?.project || !Array.isArray(body.project.walls)) throw new Error('缺少当前项目描述文件');
  if (!Array.isArray(body.catalog) || body.catalog.length === 0) throw new Error('缺少家具目录');
  return {
    prompt: body.prompt.slice(0, 4000),
    project: body.project,
    catalog: body.catalog.slice(0, 240),
    images: normalizeImages(body.images),
    history: normalizeHistory(body.history),
  };
}

const compactProject = (p) => JSON.stringify(p, null, 2).slice(0, 60000);
const catalogText = (catalog) => catalog.map((d) =>
  `${d.id}: ${d.name}, ${d.cat}/${d.kind}, ${d.w}x${d.d}x${d.h}cm`).join('\n');

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 4).map((img, index) => {
    if (!img?.dataUrl || typeof img.dataUrl !== 'string') throw new Error('参考图格式不正确');
    const match = img.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i);
    if (!match) throw new Error('参考图仅支持 PNG、JPG 或 WebP');
    const bytes = Buffer.byteLength(match[2], 'base64');
    if (bytes > 5 * 1024 * 1024) throw new Error('单张参考图不能超过 5MB');
    return {
      type: 'file',
      mediaType: match[1],
      filename: img.name || `reference-${index + 1}`,
      data: { type: 'data', data: match[2] },
    };
  });
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).map((msg) => {
    const role = msg?.role === 'assistant' ? 'assistant' : 'user';
    const changes = Array.isArray(msg?.changes) && msg.changes.length
      ? `\n变更：${msg.changes.slice(0, 8).join('；')}`
      : '';
    const text = `${msg?.text || ''}${changes}`.slice(0, 2000).trim();
    return text ? { role, content: text } : null;
  }).filter(Boolean);
}

function userContent(text, images) {
  return images.length ? [{ type: 'text', text }, ...images] : text;
}

function normalizeProject(next, current, catalogIds) {
  const project = { ...next, version: 1 };
  project.groups ??= [];
  project.measures ??= [];
  project.items = project.items.filter((it) => catalogIds.has(it.defId));
  project.items = project.items.map((it, i) => ({ ...it, id: it.id || `ai_${i}`, rot: ((it.rot % 360) + 360) % 360 }));
  project.settings = { ...current.settings, ...project.settings };
  return project;
}

export async function handleAiDesignBody(body) {
  const { prompt, project, catalog, images, history } = assertInput(body);
  const catalogIds = new Set(catalog.map((d) => d.id));
  const catalogList = catalogText(catalog);
  const system = [
    '你是栖居设计的室内设计 agent。',
    '单位统一使用厘米。输出必须是完整 Project JSON 描述文件，不是局部 diff。',
    '保留现有墙体/门窗/房间结构，除非用户明确要求改户型。',
    '家具 item.defId 必须来自家具目录；不要发明 defId。',
    '如果用户提供参考图，提取其风格、配色、材质、家具密度和空间氛围作为设计参考。',
    '如果存在历史对话，延续用户之前认可的方向，并重点处理本轮新增或修正的要求。',
    '优先优化动线、采光、收纳、家具尺度和房间功能命名。',
  ].join('\n');

  const planning = await generateText({
    model: model(),
    system,
    messages: [...history, {
      role: 'user',
      content: userContent(`本轮用户需求：${prompt}\n先调用工具读取当前项目和家具目录，再结合历史对话和参考图给出执行计划。`, images),
    }],
    tools: {
      readProject: tool({
        description: '读取当前 Project JSON 描述文件和约束',
        inputSchema: z.object({}),
        execute: async () => ({ project, constraints: ['cm 坐标', '完整 JSON', '可被前端 importProjectText 导入'] }),
      }),
      readCatalog: tool({
        description: '读取可用家具目录，可按类别过滤',
        inputSchema: z.object({ cat: z.string().optional() }),
        execute: async ({ cat }) => ({ catalog: cat ? catalog.filter((d) => d.cat === cat) : catalog }),
      }),
    },
    stopWhen: stepCountIs(3),
    maxOutputTokens: 1200,
  });

  const result = await generateObject({
    model: model(),
    schema: responseSchema,
    system,
    messages: [...history, {
      role: 'user',
      content: userContent([
      `本轮用户需求：${prompt}`,
      `agent 工具分析：${planning.text}`,
      `当前 Project JSON：\n${compactProject(project)}`,
      `家具目录：\n${catalogList}`,
      '返回 summary、changes 和新的完整 project。changes 用中文短句。',
    ].join('\n\n'), images),
    }],
    maxOutputTokens: 12000,
  });

  return {
    ...result.object,
    project: normalizeProject(result.object.project, project, catalogIds),
    model: modelName(),
  };
}

export function formatAiError(e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('API key') || msg.includes('OPENAI_API_KEY')) {
    return 'AI 服务未配置：请在服务端设置 OPENAI_API_KEY，可选设置 AI_MODEL。';
  }
  return msg;
}
