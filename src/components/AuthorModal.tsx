'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // パスは環境に合わせてください
import type { User } from '@supabase/supabase-js'; // ⭕️ これを追加！

interface Author {
  id: number;
  username: string;
}

interface AuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: Author | null;
}

export default function AuthorModal({ isOpen, onClose, author }: AuthorModalProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // モーダルが開いた時にログイン状態とブックマーク状態をチェック
  useEffect(() => {
    if (!isOpen || !author) return;
    
    document.body.style.overflow = 'hidden';

    const checkBookmark = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('profiles').select('bookmarked_authors').eq('id', session.user.id).single();
        if (data && data.bookmarked_authors) {
          setIsBookmarked(data.bookmarked_authors.includes(author.username));
        }
      }
    };
    
    checkBookmark();

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, author]);

  // ブックマークの切り替え処理
  const toggleBookmark = async () => {
    if (!user) {
      alert('ブックマーク機能を使うにはログインしてください。');
      return;
    }
    setLoading(true);

    const { data } = await supabase.from('profiles').select('bookmarked_authors').eq('id', user.id).single();
    const currentBookmarks = data?.bookmarked_authors || [];
    
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = currentBookmarks.filter((name: string) => name !== (author as any).username);
    } else {
      newBookmarks = [...currentBookmarks, (author as any).username];
    }
    
    const { error } = await supabase.from('profiles').update({ bookmarked_authors: newBookmarks }).eq('id', user.id);
    
    if (!error) {
      setIsBookmarked(!isBookmarked);
    } else {
      alert('更新に失敗しました。');
    }
    setLoading(false);
  };

  if (!isOpen || !author) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div className="bg-white w-80 rounded-3xl p-6 shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center">
          <img 
            src={`https://cdn2.scratch.mit.edu/get_image/user/${author.id}_90x90.png`} 
            alt={author.username} 
            className="w-24 h-24 rounded-full bg-gray-200 mb-4 border-4 border-gray-50 shadow-sm"
          />
          <h3 className="text-xl font-bold mb-1 text-gray-900">{author.username}</h3>
          
          <div className="w-full mt-6 space-y-3">
            <button 
              onClick={toggleBookmark}
              disabled={loading}
              className={`w-full py-3 rounded-2xl font-medium transition-colors shadow-sm active:scale-95 ${
                isBookmarked 
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isBookmarked ? '⭐ ブックマーク解除' : 'ブックマークに登録'}
            </button>
            
            <a 
              href={`https://scratch.mit.edu/users/${author.username}/`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 bg-blue-50 text-blue-600 rounded-2xl font-medium text-center hover:bg-blue-100 transition-colors active:scale-95"
            >
              Scratchのプロフィールを見る
            </a>
            
            <button onClick={onClose} className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors">
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}