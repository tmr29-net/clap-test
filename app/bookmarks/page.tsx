'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// ※パスは環境に合わせて `@/src/...` や `../../...` に適宜変更してください
import { supabase } from '@/lib/supabase';
import AuthorModal from '@/src/components/AuthorModal';

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<'projects' | 'authors'>('projects');
  const [user, setUser] = useState<any>(null);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 プロジェクト絞り込み検索用のステート
  const [searchQuery, setSearchQuery] = useState('');

  // モーダル用
  const [selectedAuthor, setSelectedAuthor] = useState<{id: number, username: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('bookmarked_projects, bookmarked_authors')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        // ① プロジェクトの取得
        if (profile.bookmarked_projects?.length > 0) {
          try {
            const projectPromises = profile.bookmarked_projects.map((id: string) => 
              fetch(`/proxy/scratch/projects/${id}`).then(res => res.json())
            );
            const projectsData = await Promise.all(projectPromises);
            setProjects(projectsData.filter(p => !p.code).reverse());
          } catch (e) {
            console.error(e);
          }
        }

        // 💡 ② 作者情報と、その人の「新着プロジェクト」を同時に取得するよう強化
        if (profile.bookmarked_authors?.length > 0) {
          try {
            const authorPromises = profile.bookmarked_authors.map(async (username: string) => {
              // 作者の基本情報と、最新4件のプロジェクトを並行して取得
              const [userRes, projectsRes] = await Promise.all([
                fetch(`/proxy/scratch/users/${username}`).then(res => res.json()),
                fetch(`/proxy/scratch/users/${username}/projects?limit=4`).then(res => res.json())
              ]);
              
              // 取得したデータを合体させて返す
              return {
                ...userRes,
                recentProjects: Array.isArray(projectsRes) ? projectsRes : []
              };
            });
            
            const authorsData = await Promise.all(authorPromises);
            setAuthors(authorsData.filter(a => !a.code).reverse());
          } catch (e) {
            console.error(e);
          }
        }
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, []);

  // 💡 検索ボックスに入力された文字でプロジェクトを絞り込む
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    project.author?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center mt-20 text-gray-500 font-medium">読み込み中...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <span className="text-4xl mb-4">🔒</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">ログインが必要です</h2>
        <p className="text-gray-600 text-center mb-6">ライブラリを表示するにはログインしてください。</p>
        <Link href="/account" className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">
          アカウント画面へ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🔖</span> ライブラリ
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-2">
        <div className="flex space-x-3">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'projects' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            保存した作品 ({projects.length})
          </button>
          <button 
            onClick={() => setActiveTab('authors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'authors' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            登録した作者 ({authors.length})
          </button>
        </div>

        {/* 💡 プロジェクトタブが選ばれている時だけ検索ボックスを表示 */}
        {activeTab === 'projects' && projects.length > 0 && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="保存した作品を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-gray-100 focus:bg-white border border-transparent focus:border-gray-300 rounded-full text-sm focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'projects' ? (
        projects.length === 0 ? (
          <p className="text-center mt-10 text-gray-500">保存された作品はありません。</p>
        ) : filteredProjects.length === 0 ? (
          <p className="text-center mt-10 text-gray-500">「{searchQuery}」に一致する作品が見つかりませんでした。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
            {filteredProjects.map((project, idx) => (
              <Link href={`/${project.id}`} key={`${project.id}-${idx}`} className="flex flex-col group">
                <div className="overflow-hidden rounded-xl mb-2 bg-gray-100 aspect-[4/3]">
                  <img 
                    src={project.image || `https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  />
                </div>
                <div className="flex flex-col px-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-600">{project.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{project.author?.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* 💡 作者タブ：YouTubeのチャンネル棚のようなリッチな表示に変更 */
        authors.length === 0 ? (
          <p className="text-center mt-10 text-gray-500">登録された作者はありません。</p>
        ) : (
          <div className="flex flex-col gap-10">
            {authors.map((author, idx) => (
              <div key={`${author.id}-${idx}`} className="flex flex-col">
                
                {/* 作者のヘッダー部分 */}
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={`https://cdn2.scratch.mit.edu/get_image/user/${author.id}_60x60.png`} 
                    alt={author.username} 
                    className="w-12 h-12 rounded-full bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setSelectedAuthor(author);
                      setIsModalOpen(true);
                    }}
                  />
                  <div>
                    <h3 
                      className="font-bold text-lg text-gray-900 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedAuthor(author);
                        setIsModalOpen(true);
                      }}
                    >
                      {author.username}
                    </h3>
                    <p className="text-xs text-gray-500">最新のプロジェクト</p>
                  </div>
                </div>

                {/* その作者の最新プロジェクト4件 */}
                {author.recentProjects && author.recentProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {author.recentProjects.map((project: any) => (
                      <Link href={`/${project.id}`} key={project.id} className="flex flex-col group">
                        <div className="overflow-hidden rounded-xl mb-2 bg-gray-100 aspect-[4/3]">
                          <img 
                            src={project.image || `https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`} 
                            alt={project.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <h4 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-600">
                          {project.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1 flex space-x-2">
                          <span>👀 {project.stats?.views?.toLocaleString() || 0}</span>
                          <span>⭐ {project.stats?.favorites?.toLocaleString() || 0}</span>
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4 bg-gray-50 rounded-xl px-4">
                    プロジェクトがありません。
                  </p>
                )}

              </div>
            ))}
          </div>
        )
      )}

      <AuthorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} author={selectedAuthor} />
    </div>
  );
}