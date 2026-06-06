import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が無い場合に分かりやすいエラーを出す
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("⚠️ Supabaseの環境変数が設定されていません！ .env.local ファイルと再起動を確認してください。");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);