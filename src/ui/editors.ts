import type { Editor2D } from '../editor2d/editor';
import type { Viewer3D } from '../viewer3d/viewer';

/** 编辑器实例注册表：供工具栏/快捷键调用命令 */
export const editors: { e2: Editor2D | null; v3: Viewer3D | null } = { e2: null, v3: null };
