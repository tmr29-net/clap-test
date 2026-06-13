'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // 💡 ページ遷移用の Link を追加
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

type Profile = {
  username?: string;
  login_id?: string;
  [key: string]: unknown;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSignUp, setIsSignUp] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editUsername, setEditUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [playerType, setPlayerType] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('player_type') || 'turbowarp';
  }
  return 'turbowarp';
});
  const fetchUser = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
        setEditUsername(data.username || '');
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
   const loadData = async () => {
      await fetchUser();
    };
    loadData();

    if (document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    
  }, [fetchUser]);

  const togglePlayerType = (type: 'turbowarp' | 'scratch') => {
    setPlayerType(type);
    localStorage.setItem('player_type', type);
  };

  const makeDummyEmail = (id: string) => `${id.trim()}@clap.local`;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!loginId.trim() || !authPassword.trim()) return;

    const email = makeDummyEmail(loginId);
    const finalUsername = authUsername.trim() || `user-${loginId.trim()}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: authPassword });
    if (authError) return setMessage({ type: 'error', text: `登録エラー: ${authError.message}` });

    if (authData.user) {
      const { error: profError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        login_id: loginId.trim(),
        username: finalUsername,
      });
      if (profError) return setMessage({ type: 'error', text: `プロフィール作成エラー: ${profError.message}` });

      setMessage({ type: 'success', text: 'アカウントを作成しました！' });
      fetchUser();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const email = makeDummyEmail(loginId);
    const { error } = await supabase.auth.signInWithPassword({ email, password: authPassword });
    
    if (error) {
      setMessage({ type: 'error', text: 'ログインに失敗しました。IDまたはパスワードが違います。' });
      return;
    }
    fetchUser();
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);

    try {
      if (editUsername !== profile?.username) {
        const { error } = await supabase.from('profiles').update({ username: editUsername }).eq('id', user.id);
        if (error) throw error;
        setProfile(profile ? { ...profile, username: editUsername } : null);
      }

      if (newPassword.trim() !== '') {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword(''); 
      }
      alert('設定を更新しました！');
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        alert('エラーが発生しました: ' + error.message);
      } else {
        alert('予期せぬエラーが発生しました');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return;
    alert('セキュリティ上、現在アカウントの完全削除は管理者のみ可能です。サインアウトを実行します。');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return <div className="text-center mt-20 text-gray-500 dark:text-gray-400">読み込み中...</div>;

  // 💡 未ログイン時の画面
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4 flex flex-col min-h-[80vh] justify-between py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-colors">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span>👤</span> {isSignUp ? '新規アカウント作成' : 'サインイン'}
          </h1>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ログインID</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="半角英数字"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-gray-900 dark:focus:border-gray-400 transition-all"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">アカウント名</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-gray-900 dark:focus:border-gray-400 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">パスワード</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="6文字以上"
                minLength={6}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-gray-900 dark:focus:border-gray-400 transition-all"
                required
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold rounded-xl text-sm transition-colors shadow-sm">
              {isSignUp ? 'アカウントを作成してログイン' : 'サインイン'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isSignUp ? '既にアカウントをお持ちですか？ サインイン' : '初めてですか？ 新規アカウント作成'}
              </button>
            </div>
          </form>
        </div>

        {/* 💡 未ログイン画面用の最下部リンク */}
        <div className="text-center pt-8">
          <Link href="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:underline transition-colors">
            このサイトについて（免責事項）
          </Link>
        </div>
      </div>
    );
  }

  // 💡 ログイン済みの画面
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-[85vh] justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">アカウント設定</h1>

        {/* プロフィール設定セクション */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border border-gray-100 dark:border-gray-700 transition-colors">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">プロフィールとセキュリティ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">ユーザー名</label>
              <input 
                type="text" 
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">ログインID</label>
              <input 
                type="text" 
                defaultValue={profile?.login_id || ''} 
                disabled 
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">※ログインIDは変更できません</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">新しいパスワード</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="変更する場合のみ入力"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
              />
            </div>
            <button 
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 mt-2"
            >
              {isUpdating ? '更新中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {/* アプリ設定セクション */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-700 transition-colors">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">アプリ設定</h2>
          
          <div className="py-3 mt-2">
            <p className="font-medium dark:text-white mb-1">デフォルトプレイヤー</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">プロジェクト再生画面で使用するプレイヤー</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => togglePlayerType('turbowarp')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${playerType === 'turbowarp' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                TurboWarp (推奨)
              </button>
              <button 
                onClick={() => togglePlayerType('scratch')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${playerType === 'scratch' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Scratch公式
              </button>
            </div>
          </div>
        </div>

        {/* 危険な操作セクション */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">アカウント管理</h2>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleSignOut}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              サインアウト
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              アカウントを完全に削除する
            </button>
          </div>
        </div>
      </div>

      {/* 💡 ログイン画面用の最下部リンク */}
      <div className="text-center pt-12 pb-4">
        <Link href="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:underline transition-colors">
          このサイトについて（免責事項）
        </Link>
      </div>

    </div>
  );
}