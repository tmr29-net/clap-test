'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthorModal from '@/src/components/AuthorModal';
import { supabase } from '@/lib/supabase'; // 💡 Supabaseの読み込みを追加

interface ScratchProject {
  id: number;
  title: string;
  author: { id: number; username: string };
  stats: { views: number; loves: number; favorites: number };
  image: string;
}

// 配列をランダムにシャッフルする便利関数
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'new'>('new');
  const [projects, setProjects] = useState<ScratchProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 💡 お気に入り作品の「全件（シャッフル済み）」を保持するステート
  const [allFavoriteProjects, setAllFavoriteProjects] = useState<ScratchProject[]>([]);
  const [user, setUser] = useState<any>(null);

  const [selectedAuthor, setSelectedAuthor] = useState<{id: number, username: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // マウント時の復元 & ログインチェック
  useEffect(() => {
    const init = async () => {
      // ログイン状態の確認
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // キャッシュの復元
      const cached = sessionStorage.getItem('clap_home_state');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setActiveTab(parsed.activeTab);
          setProjects(parsed.projects);
          setPage(parsed.page);
          if (parsed.allFavoriteProjects) {
            setAllFavoriteProjects(parsed.allFavoriteProjects);
          }
          setIsInitialized(true);
          sessionStorage.removeItem('clap_home_state');
          return;
        } catch (e) {
          console.error("キャッシュの復元に失敗しました", e);
        }
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  const loadProjects = async (targetPage: number, tab: string) => {
    setLoading(true);
    try {
      if (tab === 'new') {
        const offset = (targetPage - 1) * 20;
        const res = await fetch(`/proxy/scratch/search/projects?limit=20&offset=${offset}&mode=recent&q=*`);
        if (!res.ok) throw new Error(`ネットワークエラー: ${res.status}`);
        const data = await res.json();
        
        if (targetPage === 1) setProjects(data);
        else setProjects((prev) => [...prev, ...data]);
        
        setPage(targetPage);
      } 
      else if (tab === 'favorites') {
        // 💡 「お気に入り」タブの処理
        if (targetPage === 1) {
          if (!user) {
            setProjects([]);
            setLoading(false);
            return;
          }

          // 1. プロフィールからブックマークした作者を取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('bookmarked_authors')
            .eq('id', user.id)
            .single();

          const authors = profile?.bookmarked_authors || [];
          if (authors.length === 0) {
            setProjects([]);
            setAllFavoriteProjects([]);
            setLoading(false);
            return;
          }

          // 2. ブックマークした作者のプロジェクトを各最大20件取得
          const promises = authors.map((username: string) =>
            fetch(`/proxy/scratch/users/${username}/projects?limit=20`).then(r => r.json())
          );
          const results = await Promise.all(promises);
          
          let combined: ScratchProject[] = [];
          results.forEach(res => {
            if (Array.isArray(res)) combined = [...combined, ...res];
          });

          // 3. 全て合体させてランダムにシャッフル
          const shuffled = shuffleArray(combined);
          setAllFavoriteProjects(shuffled);
          
          // 4. 最初の20件を表示
          setProjects(shuffled.slice(0, 20));
          setPage(1);
        } else {
          // 「さらに読み込む」が押された時は、裏で保持しているリストから次の20件を切り出す
          const startIndex = (targetPage - 1) * 20;
          const endIndex = startIndex + 20;
          const nextBatch = allFavoriteProjects.slice(startIndex, endIndex);
          
          setProjects((prev) => [...prev, ...nextBatch]);
          setPage(targetPage);
        }
      }
    } catch (error) {
      console.error("データの取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    
    // 初回読み込みのトリガー
    if (activeTab === 'new' && projects.length === 0 && page === 1) {
      loadProjects(1, 'new');
    } else if (activeTab === 'favorites' && projects.length === 0 && page === 1) {
      loadProjects(1, 'favorites');
    }
  }, [activeTab, isInitialized, user]);

  const handleTabChange = (tab: 'favorites' | 'new') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setProjects([]);
    setPage(1);
    loadProjects(1, tab);
  };

  const saveState = () => {
    sessionStorage.setItem('clap_home_state', JSON.stringify({
      activeTab,
      projects,
      page,
      allFavoriteProjects // シャッフル状態を維持するためにこれも保存
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-0 relative">
      <div className="flex space-x-3 mb-6 border-b border-gray-200 pb-2">
        <button 
          onClick={() => handleTabChange('favorites')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'favorites' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          お気に入り
        </button>
        <button 
          onClick={() => handleTabChange('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'new' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          新着
        </button>
      </div>

      {projects.length === 0 && !loading ? (
        <div className="text-center mt-16 px-4">
          {activeTab === 'favorites' ? (
            !user ? (
              <p className="text-gray-500">ログインすると、お気に入り作者の作品がここに表示されます。</p>
            ) : (
              <p className="text-gray-500">お気に入りの作者がまだ登録されていないか、作品がありません。<br/>作者をブックマークしてみましょう！</p>
            )
          ) : (
            <p className="text-gray-500">プロジェクトが見つかりませんでした。</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
          {projects.map((project, index) => (
            <Link href={`/${project.id}`} key={`${project.id}-${index}`} className="flex flex-col group" onClick={saveState}>
              <div className="overflow-hidden rounded-xl mb-2 bg-gray-100 aspect-[4/3]">
                <img 
                  src={project.image || `https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  loading="lazy"
                />
              </div>

              <div 
                className="flex space-x-2.5 px-1 z-10 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors p-1 -ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedAuthor(project.author);
                  setIsModalOpen(true);
                }}
              >
                <img 
                  src={`https://cdn2.scratch.mit.edu/get_image/user/${project.author?.id}_32x32.png`} 
                  alt={project.author?.username} 
                  className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
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
      
      {/* 💡 お気に入りタブでは、allFavoriteProjectsの残数がある時だけ「さらに読み込む」を表示 */}
      {projects.length > 0 && (activeTab === 'new' || (activeTab === 'favorites' && projects.length < allFavoriteProjects.length)) && (
        <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={() => loadProjects(page + 1, activeTab)}
            disabled={loading}
            className="px-8 py-2.5 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 rounded-full text-sm font-medium transition-colors shadow-sm disabled:cursor-not-allowed"
          >
            {loading ? '読み込み中...' : 'さらに読み込む'}
          </button>
        </div>
      )}

      <AuthorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        author={selectedAuthor} 
      />
    </div>
  );
}