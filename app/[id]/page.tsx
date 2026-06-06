'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthorModal from '@/src/components/AuthorModal';
// 💡 Supabaseをインポート（環境に合わせてパスを調整してください）
import { supabase } from '@/lib/supabase';

interface ProjectDetail {
  id: number;
  title: string;
  instructions: string;
  description: string;
  author: { id: number; username: string };
  stats: { views: number; loves: number; favorites: number; remixes: number };
  image: string;
}

const linkify = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<any[]>([]);
  const [relatedTab, setRelatedTab] = useState<'author' | 'remix'>('author');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // 💡 ブックマーク用のステートを追加
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 💡 ブックマーク状態の確認
  useEffect(() => {
    const checkBookmark = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('profiles')
          .select('bookmarked_projects')
          .eq('id', session.user.id)
          .single();
          
        if (data && data.bookmarked_projects) {
          setIsBookmarked(data.bookmarked_projects.includes(projectId));
        }
      }
    };
    if (projectId) checkBookmark();
  }, [projectId]);

  // プロジェクトデータの取得
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/proxy/scratch/projects/${projectId}`);
        
        if (!res.ok) {
          if (res.status === 404) throw new Error('プロジェクトが見つかりません。削除されたか、非共有の可能性があります。');
          if (res.status === 429) throw new Error('アクセスが集中しています。少し待ってから再度お試しください。');
          throw new Error(`エラーが発生しました (コード: ${res.status})`);
        }

        const data = await res.json();
        setProject(data);
        fetchRelated(data.author.username, 'author');
      } catch (error: any) {
        console.error(error);
        setErrorMsg(error.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const fetchRelated = async (username: string, type: 'author' | 'remix') => {
    try {
      let url = type === 'author' 
        ? `/proxy/scratch/users/${username}/projects?limit=12` 
        : `/proxy/scratch/projects/${projectId}/remixes?limit=12`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setRelatedProjects(data);
    } catch (e) {
      console.error(e);
      setRelatedProjects([]);
    }
  };

  const handleTabChange = (tab: 'author' | 'remix') => {
    setRelatedTab(tab);
    if (project) {
      fetchRelated(project.author.username, tab);
    }
  };

  // 💡 ブックマーク切り替え処理
  const toggleBookmark = async () => {
    if (!user) {
      alert('ブックマーク機能を使うにはログインしてください。');
      return;
    }
    setBookmarkLoading(true);

    // 最新の配列を取得
    const { data } = await supabase
      .from('profiles')
      .select('bookmarked_projects')
      .eq('id', user.id)
      .single();
      
    let currentBookmarks = data?.bookmarked_projects || [];
    
    // 追加か削除かを判定
    let newBookmarks = isBookmarked 
      ? currentBookmarks.filter((id: string) => id !== projectId)
      : [...currentBookmarks, projectId];
    
    // Supabaseを更新
    const { error } = await supabase
      .from('profiles')
      .update({ bookmarked_projects: newBookmarks })
      .eq('id', user.id);
      
    if (!error) {
      setIsBookmarked(!isBookmarked);
    } else {
      alert('更新に失敗しました。');
    }
    setBookmarkLoading(false);
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 font-medium">プロジェクトを読み込んでいます...</div>;
  }

  if (errorMsg || !project) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <span className="text-4xl mb-4">😿</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">読み込みエラー</h2>
        <p className="text-gray-600 text-center">{errorMsg || 'プロジェクトが見つかりません。'}</p>
        <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          前のページに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        
        <div className="w-full lg:w-[65%] xl:w-[70%]">
          
          <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-black rounded-xl overflow-hidden mb-4 shadow-md">
            <iframe 
              src={`https://turbowarp.org/${projectId}/embed?addons=pause`} 
              width="100%" 
              height="100%" 
              className="border-none"
              allowFullScreen
            ></iframe>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{project.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <img 
                  src={`https://cdn2.scratch.mit.edu/get_image/user/${project.author.id}_60x60.png`} 
                  alt={project.author.username} 
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{project.author.username}</p>
                  <p className="text-xs text-gray-500">クリックして詳細を表示</p>
                </div>
              </div>
              
              {/* 💡 PC版: ブックマーク保存ボタン */}
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`hidden sm:flex items-center gap-1.5 px-4 py-2 font-bold text-sm rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? '⭐ 保存済み' : '☆ 保存'}
              </button>

              <a 
                href={`https://scratch.mit.edu/projects/${projectId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm rounded-full transition-colors"
              >
                Scratchで見る ↗
              </a>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 self-start sm:self-auto overflow-x-auto whitespace-nowrap">
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">👀</span> {project.stats.views.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">❤️</span> {project.stats.loves.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">⭐</span> {project.stats.favorites.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">🌀</span> {project.stats.remixes.toLocaleString()}</span>
            </div>
            
            {/* 💡 モバイル版の各種ボタン */}
            <div className="sm:hidden flex gap-2">
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`px-4 py-2 font-bold text-sm rounded-full transition-colors flex-1 ${
                  isBookmarked 
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isBookmarked ? '⭐ 保存済み' : '☆ 保存'}
              </button>
              <a 
                href={`https://scratch.mit.edu/projects/${projectId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm rounded-full transition-colors"
              >
                Scratchで見る ↗
              </a>
            </div>
          </div>

          <div 
            className={`mt-4 bg-gray-100 hover:bg-gray-200 transition-colors rounded-2xl p-5 text-sm md:text-base text-gray-800 ${!isDescExpanded ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (!isDescExpanded) setIsDescExpanded(true);
            }}
          >
            <div className={!isDescExpanded ? 'line-clamp-3' : ''}>
              {project.instructions && (
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-1">使い方</h3>
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{linkify(project.instructions)}</p>
                </div>
              )}
              {project.description && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">メモとクレジット</h3>
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{linkify(project.description)}</p>
                </div>
              )}
              {!project.instructions && !project.description && (
                <p className="text-gray-500">説明はありません。</p>
              )}
            </div>
            
            {(project.instructions || project.description) && (
              <button 
                className="mt-2 font-bold text-gray-900 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation(); 
                  setIsDescExpanded(!isDescExpanded);
                }}
              >
                {isDescExpanded ? '一部を表示' : '...すべて見る'}
              </button>
            )}
          </div>
        </div>

        {/* 右側: 関連作品リスト */}
        <div className="w-full lg:w-[35%] xl:w-[30%] mt-8 lg:mt-0">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => handleTabChange('author')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${relatedTab === 'author' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              同じ作者の作品
            </button>
            <button 
              onClick={() => handleTabChange('remix')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${relatedTab === 'remix' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              リミックス
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {relatedProjects.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4 px-2">
                {relatedTab === 'author' ? '他の作品はありません。' : 'リミックスはありません。'}
              </p>
            ) : (
              relatedProjects.map((relProject) => (
                <Link href={`/${relProject.id}`} key={relProject.id} className="flex gap-3 group hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                  <div className="w-40 aspect-[4/3] flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                    <img 
                      src={relProject.image || `https://cdn2.scratch.mit.edu/get_image/project/${relProject.id}_480x360.png`} 
                      alt={relProject.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex flex-col py-1 overflow-hidden">
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1 leading-snug group-hover:text-blue-600">{relProject.title}</h4>
                    <p className="text-xs text-gray-600">{relProject.author.username}</p>
                    <p className="text-[11px] text-gray-500 mt-1 flex gap-2">
                      <span>👀 {relProject.stats.views.toLocaleString()}</span>
                      <span>⭐ {relProject.stats.favorites.toLocaleString()}</span>
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>

      <AuthorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        author={project.author} 
      />
    </div>
  );
}