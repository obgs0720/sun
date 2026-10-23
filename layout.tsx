import type { Metadata } from 'next';
import './globals.css';
import './portal.css';
import './login.css';
import './admin-bypass.css';
import './home-reorder.css';
import './public-complete.css';
import './duty-manager.css';
import './people-profile-brand.css';
import './homepage-image-upload.css';
import './member-home.css';
import './attendance-meal.css';
import './player-profile.css';
import './member-duty-accounting.css';

export const metadata: Metadata = {
  title: '陽光社區棒球隊｜網站介面原型',
  description: '社區棒球隊公開網站、球員中心、教練專區與管理後台介面原型。',
  openGraph: { title: '陽光社區棒球隊', description: '一起練習，一起成長。', images: ['/og.png'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
