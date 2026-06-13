import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://clap-s.vercel.app'; // ✨ リリース後に実際のURLに変更！

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // トップページは一番重要なので1.0
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`, // 先ほど作ったページ！
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // 💡 注意：/bookmarks や /account はユーザー個人のローカルな画面なので、
    // 検索エンジンに登録する必要はありません。そのためここには書きません！
  ];
}