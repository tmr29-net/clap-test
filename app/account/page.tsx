'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // パスは適宜合わせてください

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ダークモード用のステート
  const [isDarkMode, setIsDarkMode] = useState(false);
  // プレイヤー設定用のステート
  const [playerType, setPlayerType] = useState<'turbowarp' | 'scratch'>('turbowarp');

  useEffect(() => {
    // 💡 初期読み込み時にテーマをチェック
    if (document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    // 💡 プレイヤー設定を読み込み
    const savedPlayer = localStorage.getItem('player_type');
    if (savedPlayer === 'scratch') setPlayerType('scratch');

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // プロフィール情報の取得 (username等)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // 🌙 ダークモード切り替え処理
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // 🎮 プレイヤー切り替え処理
  const togglePlayerType = (type: 'turbowarp' | 'scratch') => {
    setPlayerType(type);
    localStorage.setItem('player_type', type);
  };

  // ログアウト処理
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // ホームに戻る
  };

  if (loading) return <div className="text-center mt-20 text-gray-500 dark:text-gray-400">読み込み中...</div>;

  if (!user) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-bold dark:text-white">サインインが必要です</h2>
        {/* ここにログイン・登録フォームのコンポーネントを表示 */}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">アカウント設定</h1>

      {/* プロフィール設定セクション */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">プロフィール</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">ユーザー名</label>
            <input 
              type="text" 
              defaultValue={profile?.username || ''} 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">ログインID</label>
            <input 
              type="text" 
              defaultValue={profile?.login_id || ''} 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              disabled // ログインIDは簡単に変更できないようにとりあえずdisabled
            />
          </div>
          <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity">
            プロフィールを更新
          </button>
        </div>
      </div>

      {/* アプリ設定セクション */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">アプリ設定</h2>
        
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="font-medium dark:text-white">ダークモード</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">画面を暗くして目に優しくします</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
        <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">アカウント管理</h2>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={handleSignOut}
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            サインアウト
          </button>
          <button className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            アカウントを完全に削除する
          </button>
        </div>
      </div>

    </div>
  );
}