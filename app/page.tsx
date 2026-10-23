'use client';

import { useEffect, useState } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { ArrowRight, CalendarDays, ChevronRight, LogIn, MapPin } from 'lucide-react';

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props}>{children}</a>;
}

const notices = [
  { date: '08.27', tag: '訓練', title: '九月份週末訓練時間調整公告', pinned: true },
  { date: '08.23', tag: '球隊', title: '秋季球員裝備尺寸登記提醒', pinned: false },
  { date: '08.18', tag: '活動', title: '社區親子棒球體驗日開放報名', pinned: false },
  { date: '08.12', tag: '行政', title: '本季家長值星輪值表已更新', pinned: false },
  { date: '08.05', tag: '球隊', title: '八月份球隊重要行程整理', pinned: false },
];

export default function Home() {
  const defaults = { first: '在每一次揮棒裡', second: '練習成為更好的自己', summary: '我們相信棒球不只是一場比賽 更是孩子 家庭與社區一起建立的成長記憶', introTitle: '一支從社區出發，陪孩子走得更遠的球隊。', introBody: '陽光是一支由家長、教練與社區夥伴共同支持的少年棒球隊。我們重視基本功，也重視孩子在團隊裡學會負責、互助與尊重。', noticeTitle: '最新公告', galleryTitle: '精彩畫面', galleryQuote: '每一次練習，都是值得保存的成長。', contactTitle: '想更認識我們？', contactBody: '歡迎家長與社區夥伴來信，我們會儘快回覆。', footerPrimary: '© 2026 陽光社區棒球隊', footerSecondary: '以孩子的安全、成長與團隊精神為優先', heroImage: '/baseball-hero.png', galleryImage: '/baseball-hero.png', visible: [true, true, true, true, true, true] };
  const [home, setHome] = useState(defaults);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-homepage-settings');
    if (stored) { try { setHome({ ...defaults, ...JSON.parse(stored) }); } catch { window.localStorage.removeItem('sunshine-homepage-settings'); } }
  }, []);
  return (
    <main>
      <header className="site-header">
        <Link href="/index.html" className="brand" aria-label="陽光社區棒球隊首頁">
          <span className="brand-mark">陽</span>
          <span><strong>陽光社區棒球隊</strong><small>SUNSHINE BASEBALL</small></span>
        </Link>
        <nav className="public-nav" aria-label="公開網站導覽">
        <Link className="active" href="/index.html">首頁</Link><Link href="/team">球隊介紹</Link><Link href="/announcements">最新公告</Link><Link href="/gallery">精彩畫面</Link><Link href="/contact">聯絡我們</Link>
        </nav>
        <Link href="/login" className="login-button"><LogIn size={17}/>球員登入</Link>
      </header>
      <section className="hero hero-first">
        <img src={home.heroImage} alt="夕陽下的社區棒球場與練習裝備" /><div className="hero-shade" />
        <div className="hero-copy"><p className="eyebrow">一起練習・一起成長</p><h1><span className="hero-title-line">{home.first}</span><span className="hero-title-line">{home.second}</span></h1><p className="hero-summary">{home.summary}</p><div className="hero-actions"><Link href="/team" className="primary-action">認識球隊 <ArrowRight size={18}/></Link><Link href="/announcements" className="secondary-action">查看最新公告</Link></div></div>
        <div className="hero-meta"><MapPin size={16}/> 每週六、日・社區河濱棒球場</div>
      </section>
      <section style={{ display: home.visible[1] ? undefined : 'none' }} className="intro-section section-wrap"><div><p className="section-kicker">ABOUT OUR TEAM</p><h2>{home.introTitle}</h2></div><div className="intro-copy"><p>{home.introBody}</p><Link href="/team" className="text-link">看完整球隊介紹 <ArrowRight size={16}/></Link></div><div className="number-card"><strong>2018</strong><span>球隊成立</span></div></section>
      <section style={{ display: home.visible[2] ? undefined : 'none' }} className="notice-section"><div className="section-wrap"><div className="section-heading-row"><div><p className="section-kicker">LATEST NEWS</p><h2>{home.noticeTitle}</h2></div><Link href="/announcements" className="text-link">More <ArrowRight size={16}/></Link></div><div className="notice-list">{notices.map((item)=><Link href="/announcements/training-update" className="notice-row" key={item.title}><time>{item.date}</time><span className="notice-tag">{item.tag}</span><strong>{item.pinned&&<em>置頂</em>}{item.title}</strong><ChevronRight size={18}/></Link>)}</div></div></section>
      <section style={{ display: home.visible[3] ? undefined : 'none' }} className="gallery-section section-wrap"><div className="section-heading-row"><div><p className="section-kicker">TEAM MOMENTS</p><h2>{home.galleryTitle}</h2></div><Link href="/gallery" className="text-link">More <ArrowRight size={16}/></Link></div><div className="gallery-grid"><Link href="/gallery/summer-training" className="gallery-main"><img src={home.galleryImage} alt="球場練習時光"/><span>夏季訓練日誌 <small>12 張照片</small></span></Link><div className="gallery-quote"><CalendarDays size={24}/><strong>{home.galleryQuote}</strong><p>點選相簿可瀏覽完整照片與大圖。</p></div></div></section>
      <section style={{ display: home.visible[4] ? undefined : 'none' }} className="contact-section"><div className="section-wrap contact-inner"><div><p className="section-kicker light">CONTACT US</p><h2>{home.contactTitle}</h2><p>{home.contactBody}</p></div><Link href="/contact" className="contact-button">聯絡球隊 <ArrowRight size={18}/></Link></div></section>
      <footer style={{ display: home.visible[5] ? undefined : 'none' }} className="site-footer"><span>{home.footerPrimary}</span><span>{home.footerSecondary}</span></footer>
    </main>
  );
}
