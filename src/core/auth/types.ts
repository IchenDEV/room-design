/** 已登录用户档案：用于账号菜单、协作光标着色 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** 协作时的光标/选区颜色（十六进制） */
  color: string;
}

/** 协作者在线感知：用于 PresenceBar 与远端光标渲染 */
export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
}
