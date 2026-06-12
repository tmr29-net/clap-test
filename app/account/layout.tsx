import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'マイページ', // ここに好きなタイトルを設定！
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  // ここは何もレイアウトを変えず、中身（page.tsx）をそのまま表示するだけ
  return <>{children}</>;
}