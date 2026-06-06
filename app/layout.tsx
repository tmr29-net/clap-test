import './globals.css';
import AppShell from '@/src/components/AppShell';

export const metadata = {
  title: 'Clap - Scratch Project Player',
  description: 'Scratchのプロジェクト閲覧・ブックマークサイト',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}