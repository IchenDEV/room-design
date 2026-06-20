import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 是否已配置 Supabase（本地未配置时降级为纯本地模式） */
export const isSupabaseConfigured = !!(url && anon);

/**
 * Supabase 客户端单例。未配置时用占位地址构造，避免运行时崩溃；
 * 实际网络调用前应先检查 isSupabaseConfigured。
 */
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anon || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
);
