'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // 検索ページへ遷移（URLパラメータを使用）
      router.push(`/search/${encodeURIComponent(searchQuery)}?page=1&sort=popular`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* PC用: サイドバー */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="p-4 flex items-center h-16">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
          >
            {/* ハンバーガーアイコン */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          {isSidebarOpen && <span className="ml-4 text-xl font-bold text-blue-500">Clap</span>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <MenuLink href="/" icon="🏠" label="ホーム" isOpen={isSidebarOpen} />
          <MenuLink href="/bookmarks" icon="🔖" label="ブックマーク" isOpen={isSidebarOpen} />
          <MenuLink href="/account" icon="👤" label="アカウント" isOpen={isSidebarOpen} />
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* PC用トップヘッダー（検索ボックス） */}
        <header className="hidden md:flex items-center justify-between p-4 bg-white border-b border-gray-200 h-16">
          <div className="flex-1 flex justify-center">
            <input 
              type="text" 
              placeholder="検索 (Enterで実行)..." 
              className="w-1/2 max-w-lg p-2 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>

      {/* モバイル用: 画面下部メニュー */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 z-50">
        <Link href="/" className="p-2 flex flex-col items-center"><span className="text-xl">🏠</span><span className="text-[10px]">ホーム</span></Link>
        <Link href="/search" className="p-2 flex flex-col items-center"><span className="text-xl">🔍</span><span className="text-[10px]">検索</span></Link>
        <Link href="/bookmarks" className="p-2 flex flex-col items-center"><span className="text-xl">🔖</span><span className="text-[10px]">保存</span></Link>
        <Link href="/account" className="p-2 flex flex-col items-center"><span className="text-xl">👤</span><span className="text-[10px]">マイ</span></Link>
      </nav>
    </div>
  );
}

// サイドバー用リンクコンポーネント
function MenuLink({ href, icon, label, isOpen }: { href: string, icon: string, label: string, isOpen: boolean }) {
  return (
    <Link href={href} className="flex items-center p-3 hover:bg-gray-100 rounded-lg overflow-hidden whitespace-nowrap">
      <span className="text-xl flex-shrink-0 w-6 text-center">{icon}</span>
      {isOpen && <span className="ml-4">{label}</span>}
    </Link>
  );
}