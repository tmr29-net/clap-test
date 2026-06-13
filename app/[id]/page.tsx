'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthorModal from '@/src/components/AuthorModal';
import ReportModal from '@/src/components/ReportModal';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

interface ProjectDetail {
  id: number;
  title: string;
  instructions: string;
  description: string;
  author: { id: number; username: string };
  stats: { views: number; loves: number; favorites: number; remixes: number };
  image: string;
}

interface CommentData {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    image: string;
  };
  datetime_created: string;
  reply_count: number;
  replies?: CommentData[];
  repliesLoading?: boolean;
  repliesVisible?: boolean;
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
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors break-all"
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
  const [relatedProjects, setRelatedProjects] = useState<ProjectDetail[]>([]);
  const [relatedTab, setRelatedTab] = useState<'author' | 'remix'>('author');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 💡 スマホ用の独自フルスクリーン管理ステート
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  const [comments, setComments] = useState<CommentData[]>([]);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [playerType] = useState<'turbowarp' | 'scratch'>(() => {
    if (typeof window !== 'undefined') {
      const savedPlayer = localStorage.getItem('player_type');
      if (savedPlayer === 'scratch') return 'scratch';
    }
    return 'turbowarp';
  });

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

  const fetchRelated = useCallback(async (username: string, type: 'author' | 'remix') => {
    try {
      const url = type === 'author' 
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
  }, [projectId]);
  
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data: blacklisted } = await supabase
          .from('blacklists')
          .select('project_id')
          .eq('project_id', projectId)
          .maybeSingle();

        if (blacklisted) {
          throw new Error('この作品は管理者の設定により閲覧できません。');
        }

        const res = await fetch(`/proxy/scratch/projects/${projectId}`);
        
        if (!res.ok) {
          if (res.status === 404) throw new Error('プロジェクトが見つかりません。削除されたか、非共有の可能性があります。');
          if (res.status === 429) throw new Error('アクセスが集中しています。少し待ってから再度お試しください。');
          throw new Error(`エラーが発生しました (コード: ${res.status})`);
        }

        const data = await res.json();
        setProject(data);
        fetchRelated(data.author.username, 'author');
      } catch (error: unknown) {
        console.error(error);
        if (error instanceof Error) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg('データの取得に失敗しました');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, fetchRelated]);

  const fetchComments = async () => {
    if (commentsLoading || !hasMoreComments || !project) return;
    setCommentsLoading(true);
    setCommentError(null);
    try {
      const limit = 20; 
      const res = await fetch(`/proxy/scratch/users/${project.author.username}/projects/${projectId}/comments?offset=${commentsOffset}&limit=${limit}`);
      
      if (!res.ok) throw new Error('コメントの取得に失敗しました');
      
      const data = await res.json();
      
      if (!Array.isArray(data) || data.length < limit) {
        setHasMoreComments(false);
      }
      
      if (Array.isArray(data)) {
        setComments(prev => [...prev, ...data]);
        setCommentsOffset(prev => prev + limit);
      }
    } catch (error) {
      console.error(error);
      setCommentError('コメントの読み込みに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleShowComments = () => {
    setIsCommentsVisible(true);
    fetchComments();
  };

  const toggleReplies = async (commentId: number) => {
    const targetComment = comments.find(c => c.id === commentId);
    if (targetComment?.replies) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, repliesVisible: !c.repliesVisible } : c));
      return;
    }

    if (!project) return;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, repliesLoading: true } : c));

    try {
      const res = await fetch(`/proxy/scratch/users/${project.author.username}/projects/${projectId}/comments/${commentId}/replies`);
      if (!res.ok) throw new Error('返信の取得に失敗しました');
      
      const data = await res.json();
      
      setComments(prev => prev.map(c => c.id === commentId ? { 
        ...c, 
        replies: data, 
        repliesVisible: true, 
        repliesLoading: false 
      } : c));
    } catch (error) {
      console.error(error);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, repliesLoading: false } : c));
      alert('返信の読み込みに失敗しました。');
    }
  };

  const handleTabChange = (tab: 'author' | 'remix') => {
    setRelatedTab(tab);
    if (project) {
      fetchRelated(project.author.username, tab);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      alert('ブックマーク機能を使うにはログインしてください。');
      return;
    }
    setBookmarkLoading(true);

    const { data } = await supabase.from('profiles').select('bookmarked_projects').eq('id', user.id).single();
    const currentBookmarks = data?.bookmarked_projects || [];
    
    const newBookmarks = isBookmarked 
      ? currentBookmarks.filter((id: string) => id !== projectId)
      : [...currentBookmarks, projectId];
    
    const { error } = await supabase.from('profiles').update({ bookmarked_projects: newBookmarks }).eq('id', user.id);
      
    if (!error) setIsBookmarked(!isBookmarked);
    else alert('更新に失敗しました。');
    
    setBookmarkLoading(false);
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 dark:text-gray-400 font-medium">プロジェクトを読み込んでいます...</div>;
  }

  if (errorMsg || !project) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 px-4">
        <span className="text-4xl mb-4">😿</span>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">読み込みエラー</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center">{errorMsg || 'プロジェクトが見つかりません。'}</p>
        <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          前のページに戻る
        </button>
      </div>
    );
  }

  const iframeSrc = playerType === 'scratch' 
    ? `https://scratch.mit.edu/projects/${projectId}/embed`
    : `https://turbowarp.org/${projectId}/embed?addons=pause`;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 relative">
      <div className="flex flex-col lg:flex-row gap-6">
        
        <div className="w-full lg:w-[65%] xl:w-[70%]">
          
          {/* 💡 変更部分：フルスクリーン状態に応じて見た目を切り替える */}
          <div 
            className={
              isFakeFullscreen 
                ? "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center w-full h-[100dvh]" 
                : "w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-2 shadow-md relative"
            }
          >
            <iframe 
              src={iframeSrc} 
              width="100%" 
              height="100%" 
              className="border-none w-full h-full"
              allowFullScreen
            ></iframe>

            {/* フルスクリーン解除ボタン（フルスクリーン時のみ表示、縦横対応で余裕を持たせた配置） */}
            {isFakeFullscreen && (
              <button 
                onClick={() => setIsFakeFullscreen(false)}
                className="absolute top-8 right-6 sm:top-10 sm:right-8 bg-gray-900/80 text-white px-5 py-2.5 rounded-full font-bold z-[110] hover:bg-gray-700 backdrop-blur-md shadow-lg border border-gray-600/50 flex items-center gap-2 transition-transform active:scale-95"
              >
                ✕ 閉じる
              </button>
            )}
          </div>

          {/* スマホ用：独自の全画面ボタン（通常時のみ表示） */}
          {!isFakeFullscreen && (
            <div className="flex justify-end mb-4 sm:hidden">
              <button 
                onClick={() => setIsFakeFullscreen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                全画面
              </button>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{project.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://cdn2.scratch.mit.edu/get_image/user/${project.author.id}_60x60.png`} 
                  alt={project.author.username} 
                  className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{project.author.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">クリックして詳細を表示</p>
                </div>
              </div>
              
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`hidden sm:flex items-center gap-1.5 px-4 py-2 font-bold text-sm rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {isBookmarked ? '⭐ 保存済み' : '☆ 保存'}
              </button>

              <a 
                href={`https://scratch.mit.edu/projects/${projectId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-sm rounded-full transition-colors"
              >
                Scratchで見る ↗
              </a>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 self-start sm:self-auto overflow-x-auto whitespace-nowrap text-gray-800 dark:text-gray-200">
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">👀</span> {project.stats.views.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">❤️</span> {project.stats.loves.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">⭐</span> {project.stats.favorites.toLocaleString()}</span>
              <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <span className="text-sm font-medium flex items-center gap-1.5"><span className="text-lg">🌀</span> {project.stats.remixes.toLocaleString()}</span>
            </div>
            
            <div className="sm:hidden flex gap-2">
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`px-4 py-2 font-bold text-sm rounded-full transition-colors flex-1 ${
                  isBookmarked 
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {isBookmarked ? '⭐ 保存済み' : '☆ 保存'}
              </button>
              <a 
                href={`https://scratch.mit.edu/projects/${projectId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-sm rounded-full transition-colors"
              >
                Scratchで見る ↗
              </a>
            </div>
          </div>

          <div 
            className={`mt-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-2xl p-5 text-sm md:text-base text-gray-800 dark:text-gray-200 ${!isDescExpanded ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (!isDescExpanded) setIsDescExpanded(true);
            }}
          >
            <div className={!isDescExpanded ? 'line-clamp-3' : ''}>
              {project.instructions && (
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">使い方</h3>
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{linkify(project.instructions)}</p>
                </div>
              )}
              {project.description && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">メモとクレジット</h3>
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{linkify(project.description)}</p>
                </div>
              )}
              {!project.instructions && !project.description && (
                <p className="text-gray-500 dark:text-gray-400">説明はありません。</p>
              )}
            </div>
            
            {(project.instructions || project.description) && (
              <button 
                className="mt-2 font-bold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation(); 
                  setIsDescExpanded(!isDescExpanded);
                }}
              >
                {isDescExpanded ? '一部を表示' : '...すべて見る'}
              </button>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <button 
              onClick={() => setIsReportModalOpen(true)} 
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 font-medium"
            >
              ⚠️ このプロジェクトを報告する
            </button>
          </div>

          {/* コメントセクション */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">コメント</h3>
            
            {!isCommentsVisible ? (
              <button 
                onClick={handleShowComments}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors"
              >
                コメントを表示する
              </button>
            ) : (
              <div className="flex flex-col gap-6">
                {commentError && (
                  <p className="text-red-500 text-sm text-center py-2 font-medium">{commentError}</p>
                )}

                {comments.length === 0 && !commentsLoading && !commentError ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">コメントはありません。</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={comment.author.image || `https://cdn2.scratch.mit.edu/get_image/user/${comment.author.id || 0}_60x60.png`} 
                        alt={comment.author.username} 
                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{comment.author.username}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.datetime_created).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                          {linkify(comment.content)}
                        </p>

                        {comment.reply_count > 0 && (
                          <button 
                            onClick={() => toggleReplies(comment.id)}
                            disabled={comment.repliesLoading}
                            className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                          >
                            {comment.repliesLoading ? (
                              '読み込み中...'
                            ) : comment.repliesVisible ? (
                              '▲ 返信を閉じる'
                            ) : (
                              `▼ 返信 ${comment.reply_count} 件を表示`
                            )}
                          </button>
                        )}

                        {comment.repliesVisible && comment.replies && (
                          <div className="mt-4 flex flex-col gap-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 ml-1">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={reply.author.image || `https://cdn2.scratch.mit.edu/get_image/user/${reply.author.id || 0}_60x60.png`} 
                                  alt={reply.author.username} 
                                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">{reply.author.username}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {new Date(reply.datetime_created).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                    {linkify(reply.content)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {commentsLoading && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-2">読み込み中...</p>
                )}

                {hasMoreComments && !commentsLoading && comments.length > 0 && (
                  <button 
                    onClick={fetchComments}
                    className="mt-2 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors self-center"
                  >
                    さらに読み込む
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="w-full lg:w-[35%] xl:w-[30%] mt-8 lg:mt-0">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => handleTabChange('author')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${relatedTab === 'author' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              同じ作者の作品
            </button>
            <button 
              onClick={() => handleTabChange('remix')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${relatedTab === 'remix' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              リミックス
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {relatedProjects.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 px-2">
                {relatedTab === 'author' ? '他の作品はありません。' : 'リミックスはありません。'}
              </p>
            ) : (
              relatedProjects.map((relProject) => (
                <Link href={`/${relProject.id}`} key={relProject.id} className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-xl transition-colors">
                  <div className="w-40 aspect-[4/3] flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={relProject.image || `https://cdn2.scratch.mit.edu/get_image/project/${relProject.id}_480x360.png`} 
                      alt={relProject.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex flex-col py-1 overflow-hidden">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{relProject.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{relProject.author.username}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1 flex gap-2">
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

      {project && (
        <AuthorModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          author={project.author} 
        />
      )}

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        projectId={projectId} 
        userId={user?.id} 
      />

    </div>
  );
}