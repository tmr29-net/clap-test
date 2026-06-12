import { Metadata } from 'next';
import './globals.css';
import AppShell from '@/src/components/AppShell';

// 💡 ここを template を使った形に変更しました
export const metadata: Metadata = {
  title: {
    default: 'Clap - Scratch Project Player',
    template: '%s | Clap - Scratch Project Player',
  },
  description: 'Scratchのプロジェクト閲覧・ブックマークサイト',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          `
        }} />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}