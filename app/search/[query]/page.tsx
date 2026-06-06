'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthorModal from '@/src/components/AuthorModal'; // ← 追加: モーダルの読み込み

interface ScratchProject {
  id: number;
  title: string;
  author: { id: number; username: string };
  stats: { views: number; loves: number; favorites: number };
  image: string;
}

export default function SearchResults() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawQuery = params?.query;
  const decodedQuery = typeof rawQuery === 'string' ? decodeURIComponent(rawQuery) : '';
  
  const urlPage = Number(searchParams?.get('page')) || 1;
  const urlSort = searchParams?.get('sort') || 'popular';

  const [projects, setProjects] = useState<ScratchProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(urlPage);
  const [sort, setSort] = useState(urlSort);
  const [isInitialized, setIsInitialized] = useState(false);

  // 再検索用のステート
  const [searchInput, setSearchInput] = useState(decodedQuery);

  // ↓ 追加: モーダル用のステート
  const [selectedAuthor, setSelectedAuthor] = useState<{id: number, username: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. マウント時：セッションストレージから状態だけを復元
  useEffect(() => {
    const cachedState = sessionStorage.getItem('clap_search_state');
    if (cachedState) {
      try {
        const parsed = JSON.parse(cachedState);
        if (parsed.query === decodedQuery) {
          setProjects(parsed.projects);
          setPage(parsed.page);
          setSort(parsed.sort);
          setIsInitialized(true);
          // スクロール位置はまだ消さない
          sessionStorage.removeItem('clap_search_state');
          return;
        }
      } catch (e) {
        console.error("キャッシュの復元に失敗しました", e);
      }
    }
    setIsInitialized(true);
  }, [decodedQuery]);

  // 1.5 💡 プロジェクトが画面に描画された「後」にスクロールを復元する
  useEffect(() => {
    if (isInitialized && projects.length > 0) {
      const cachedScrollY = sessionStorage.getItem('clap_search_scrollY');
      if (cachedScrollY) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: Number(cachedScrollY), left: 0, behavior: 'instant' });
        });
        sessionStorage.removeItem('clap_search_scrollY');
      }
    }
  }, [projects, isInitialized]);

  // 2. データ取得関数
  const loadProjects = async (targetPage: number, currentSort: string) => {
    setLoading(true);
    try {
      const offset = (targetPage - 1) * 40;
      const res = await fetch(`/proxy/scratch/search/projects?limit=40&offset=${offset}&mode=${currentSort}&q=${encodeURIComponent(decodedQuery)}`);
      
      if (!res.ok) throw new Error(`ネットワークエラー: ${res.status}`);
      const data = await res.json();
      
      if (targetPage === 1) {
        setProjects(data);
      } else {
        setProjects((prev) => [...prev, ...data]);
      }
      
      setPage(targetPage);
      router.replace(`/search/${encodeURIComponent(decodedQuery)}?page=${targetPage}&sort=${currentSort}`, { scroll: false });
    } catch (error) {
      console.error("検索結果の取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized || !decodedQuery || decodedQuery === 'undefined') return;
    if (projects.length === 0) {
      loadProjects(urlPage, sort);
    }
  }, [isInitialized, decodedQuery]);

  const handleSortChange = (newSort: string) => {
    if (sort === newSort) return;
    setSort(newSort);
    setProjects([]);
    loadProjects(1, newSort);
  };

  // 3. プロジェクト詳細へ行く前に状態を保存
  const saveState = () => {
    sessionStorage.setItem('clap_search_state', JSON.stringify({
      query: decodedQuery,
      projects,
      page,
      sort,
    }));
    sessionStorage.setItem('clap_search_scrollY', window.scrollY.toString());
  };

  // モバイルでの再検索処理
  const handleReSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || searchInput.trim() === decodedQuery) return;
    router.push(`/search/${encodeURIComponent(searchInput.trim())}?page=1&sort=popular`);
  };

  if (!decodedQuery || decodedQuery === 'undefined') {
    return <div className="text-center mt-10 text-gray-500">検索語句を読み込んでいます...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-0 relative">
      
      {/* 📱 モバイル表示時のみ出現する再検索ボックス */}
      <form onSubmit={handleReSearch} className="md:hidden flex items-center mb-6 gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Scratchの作品を検索..."
          className="flex-1 px-4 py-2.5 bg-gray-100 border border-transparent focus:bg-white focus:border-gray-300 rounded-full text-sm focus:outline-none transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium active:scale-95 transition-transform"
        >
          検索
        </button>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold hidden md:block">「{decodedQuery}」の検索結果</h2>
        
        {/* 人気順・新着順 */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl self-start">
          <button 
            onClick={() => handleSortChange('popular')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${sort === 'popular' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            人気順
          </button>
          <button 
            onClick={() => handleSortChange('recent')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${sort === 'recent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            新着順
          </button>
        </div>
      </div>

      {projects.length === 0 && !loading ? (
        <p className="text-center mt-20 text-gray-500">プロジェクトが見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
          {projects.map((project, index) => (
            <Link 
              href={`/${project.id}`} 
              key={`${project.id}-${index}`} // ← 修正: Math.random() を index に変更
              className="flex flex-col group"
              onClick={saveState}
            >
              <div className="overflow-hidden rounded-xl mb-2 bg-gray-100 aspect-[4/3]">
                <img 
                  src={project.image || `https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  loading="lazy"
                />
              </div>

              {/* ↓ 修正: 作者部分のクリックイベントを追加 */}
              <div 
                className="flex space-x-2.5 px-1 z-10 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors p-1 -ml-1"
                onClick={(e) => {
                  e.preventDefault();  // リンク移動をブロック
                  e.stopPropagation(); // クリック判定をストップ
                  setSelectedAuthor(project.author);
                  setIsModalOpen(true); // モーダルを開く
                }}
              >
                <img 
                  src={`https://cdn2.scratch.mit.edu/get_image/user/${project.author?.id}_32x32.png`} 
                  alt={project.author?.username} 
                  className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{project.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 hover:text-gray-800">{project.author?.username}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex space-x-2">
                    <span>👀 {project.stats?.views?.toLocaleString() || 0}</span>
                    <span>⭐ {project.stats?.favorites?.toLocaleString() || 0}</span>
                    <span>❤️ {project.stats?.loves?.toLocaleString() || 0}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={() => loadProjects(page + 1, sort)}
            disabled={loading}
            className="px-8 py-2.5 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 rounded-full text-sm font-medium transition-colors shadow-sm disabled:cursor-not-allowed"
          >
            {loading ? '読み込み中...' : 'さらに読み込む'}
          </button>
        </div>
      )}

      {/* ↓ 追加: モーダルコンポーネント */}
      <AuthorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        author={selectedAuthor} 
      />
    </div>
  );
}