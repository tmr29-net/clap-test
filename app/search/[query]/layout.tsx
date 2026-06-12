import { Metadata } from 'next';

// 💡 1. 型定義を Promise で包む
type Props = {
  params: Promise<{ query: string }>;
};

// 💡 2. async 関数の中で await して取り出す
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ここで「待て！」をして、中身を確実に取り出す
  const resolvedParams = await params;
  
  const decodedQuery = decodeURIComponent(resolvedParams.query);
  
  return {
    title: `「${decodedQuery}」の検索結果`, 
  };
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}