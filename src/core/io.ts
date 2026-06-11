import type { Store } from './store/store';
import { isValidProject } from './store/persist';

/** 导出当前方案为 JSON 文件 */
export function exportProject(store: Store) {
  const data = JSON.stringify(store.project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${store.project.name || '栖居方案'}_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 从 JSON 文件导入方案（可撤销） */
export async function importProjectFile(store: Store, file: File): Promise<string | null> {
  try {
    const text = await file.text();
    return importProjectText(store, text);
  } catch {
    return '文件读取失败';
  }
}

export function importProjectText(store: Store, text: string): string | null {
  try {
    const p = JSON.parse(text);
    if (!isValidProject(p)) return '文件格式不正确：缺少必要字段';
    store.replaceProject(p);
    return null;
  } catch {
    return 'JSON 解析失败';
  }
}
