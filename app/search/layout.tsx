// 📄 app/〇〇/layout.tsx を新しく作る！
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '検索', // ここにページ名！
};

// 中身はこれだけでOK！（全ページ共通で使い回せます）
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}