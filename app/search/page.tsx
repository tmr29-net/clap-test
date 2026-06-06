'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // 入力されたキーワードの検索結果画面にジャンプ（初期状態は1ページ目・人気順）
    router.push(`/search/${encodeURIComponent(query.trim())}?page=1&sort=popular`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6">
      {/* モバイルライクなヘッダー風の検索バー */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Scratchの作品を検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-100 focus:bg-white border border-transparent focus:border-gray-300 rounded-full text-sm focus:outline-none transition-all"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors active:scale-95"
        >
          検索
        </button>
      </form>

      {/* おすすめの検索キーワード、あるいは使い方のヒント */}
      <div className="mt-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">人気のキーワード</h3>
        <div className="flex flex-wrap gap-2">
          {['アニメ', 'ゲーム', '傾向', '音楽', 'Platformer', '3D', 'Clicker'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                router.push(`/search/${encodeURIComponent(tag)}?page=1&sort=popular`);
              }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              # {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}