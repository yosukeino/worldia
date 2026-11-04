import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Worldia | 世界史DB × 2.5D歴史都市育成',
  description:
    '5,577語の世界史用語ネットワークを旅するほど、あなたの2.5D箱庭都市に歴史建造物が建ち、住民が息づく世界史データベース。',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
