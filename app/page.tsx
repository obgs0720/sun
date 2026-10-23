'use client';

import type { AnchorHTMLAttributes } from 'react';
import { useState } from 'react';
import { ArrowLeft, Eye, LayoutDashboard, LockKeyhole, LogIn, ShieldCheck, UserRound } from 'lucide-react';

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props}>{children}</a>;
}

export default function LoginPage() {
  const [notice, setNotice] = useState('');
  const supabaseUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function enterPreview(event: { preventDefault: () => void; currentTarget?: EventTarget | null }) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | undefined;
    const data = form ? new FormData(form) : null;
    const emailValue = data?.get('email');
    const passwordValue = data?.get('password');
    const email = typeof emailValue === 'string' ? emailValue : '';
    const password = typeof passwordValue === 'string' ? passwordValue : '';
    setNotice('');
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json() as { access_token?: string; refresh_token?: string; user?: unknown; msg?: string; error_description?: string };
        if (!response.ok || !result.access_token) throw new Error(result.error_description || result.msg || '登入失敗，請確認帳號與密碼。');
        window.localStorage.setItem('sunshine-auth-session', JSON.stringify(result));
        window.location.href = '/member';
      } catch (error) {
        setNotice(error instanceof Error ? error.message : '登入失敗，請稍後再試。');
      }
      return;
    }
    window.location.href = '/member';
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <img src="/baseball-hero.png" alt="夕陽下的社區棒球場" />
        <div className="login-overlay" />
        <Link href="/index.html" className="login-brand"><span>陽</span><b>陽光社區棒球隊<small>SUNSHINE BASEBALL</small></b></Link>
        <div className="login-message"><p>MEMBER PORTAL</p><h1>一起練習，<br/>也一起把球隊照顧好。</h1><span>登入後可查看球員、訓練、便當、值星及球隊內部資訊。</span></div>
      </section>
      <section className="login-panel">
        <Link href="/index.html" className="back-link"><ArrowLeft size={16}/> 返回公開網站</Link>
        <div className="login-card">
          <div className="login-title"><span><LogIn/></span><div><p>球員入口</p><h2>球員登入</h2></div></div>
          <div className="preview-notice"><ShieldCheck/><p><b>{supabaseUrl ? '正式登入模式' : '介面確認模式'}</b><br/>{supabaseUrl ? '使用球隊管理員建立的 Supabase 帳號登入。' : '目前為本機介面確認模式；接上 Supabase 後會改由正式帳號驗證。'}</p></div>
          <form onSubmit={enterPreview}>
            <label>電子信箱<div className="login-input"><UserRound/><input name="email" aria-label="電子信箱" defaultValue={supabaseUrl ? '' : 'preview@example.com'} placeholder="請輸入電子信箱" type="email" required={Boolean(supabaseUrl)} /></div></label>
            <label>密碼<div className="login-input"><LockKeyhole/><input name="password" aria-label="密碼" defaultValue={supabaseUrl ? '' : '123456'} type="password" placeholder="請輸入密碼" required={Boolean(supabaseUrl)}/><Eye/></div></label>
            <div className="login-options"><label><input type="checkbox" defaultChecked/> 記住帳號</label><button type="button" onClick={() => setNotice('請聯絡球隊管理員重新設定登入方式。')}>忘記密碼？</button></div>
            <button className="login-submit" type="submit">登入並查看內部功能 <LogIn/></button>
          </form>
          {notice && <output className="login-notice">{notice}</output>}
          <div className="login-divider"><span>或</span></div>
          {!supabaseUrl && <Link href="/admin" className="admin-direct">介面預覽：管理後台 <LayoutDashboard/></Link>}
          <div className="login-access"><small>登入後可直接切換</small><div><span>球員中心</span><span>教練專區</span><span>管理後台</span></div></div>
        </div>
        <p className="login-footnote">{supabaseUrl ? '登入資料由 Supabase Auth 驗證，頁面資料依資料庫權限顯示。' : '此版本為本機介面與流程確認，尚未連接正式會員資料。'}</p>
      </section>
    </main>
  );
}
