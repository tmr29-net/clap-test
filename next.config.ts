/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // 画像最適化を無効化
  },
  // CORS回避のためのプロキシ設定を追加
  async rewrites() {
    return [
      {
        source: '/proxy/scratch/:path*',
        destination: 'https://api.scratch.mit.edu/:path*',
      },
    ];
  },
};

export default nextConfig;