'use client';

import type { AnchorHTMLAttributes } from 'react';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Bell, CalendarCheck, ChevronLeft, ChevronRight, ClipboardCheck, Contact,
  Dumbbell, FileText, GalleryHorizontal, Home, Images, LayoutDashboard, ListChecks,
  Megaphone, Menu, PackageCheck, Search, Settings, ShieldCheck, Soup, Trophy, Upload,
  UserRound, UsersRound, WalletCards
} from 'lucide-react';
import { DutyScheduleManager } from './duty-schedule-manager';
import { PlayerProfilePage } from './player-profile-page';
import { MemberDutyPage } from './member-duty-page';
import { WeeklyMealManagement } from './weekly-meal-management';
import { deleteGalleryAsset, getBrowserRepository, submitPublicContact, uploadGalleryAsset, uploadHomepageAsset } from '../lib/repository';

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props}>{children}</a>;
}

type IconType = typeof Home;
type Item = { key: string; label: string; icon: IconType };

function getGreeting(hour: number) {
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
}

const memberItems: Item[] = [
  { key: '', label: '首頁總覽', icon: LayoutDashboard }, { key: 'profile', label: '球員資料', icon: UserRound },
  { key: 'attendance', label: '簽到與便當', icon: CalendarCheck },
  { key: 'duty', label: '值星資訊', icon: ClipboardCheck }, { key: 'parent-duty', label: '家長輪值表', icon: UsersRound }, { key: 'games', label: '比賽資訊', icon: Trophy },
  { key: 'meals', label: '每週便當管理', icon: Soup },
];
const coachItems: Item[] = [
  { key: '', label: '教練總覽', icon: LayoutDashboard }, { key: 'players', label: '球員管理', icon: UsersRound },
  { key: 'trainings', label: '訓練與出席', icon: Dumbbell }, { key: 'games', label: '比賽管理', icon: Trophy },
  { key: 'stats', label: '技術數據', icon: ListChecks }, { key: 'coaches', label: '教練群管理', icon: ShieldCheck },
];
const adminItems: Item[] = [
  { key: '', label: '管理總覽', icon: LayoutDashboard }, { key: 'homepage', label: '首頁內容管理', icon: Home }, { key: 'people', label: '人員與權限', icon: UsersRound },
  { key: 'team-content', label: '球隊介紹管理', icon: FileText }, { key: 'announcements', label: '公告管理', icon: Megaphone },
  { key: 'gallery', label: '精彩畫面管理', icon: Images }, { key: 'trainings', label: '訓練管理', icon: Dumbbell },
  { key: 'attendance', label: '出席管理', icon: CalendarCheck }, { key: 'duty', label: '值星管理', icon: ClipboardCheck },
  { key: 'meals', label: '便當管理', icon: Soup }, { key: 'finance', label: '財務管理', icon: WalletCards },
  { key: 'games', label: '比賽與數據', icon: Trophy }, { key: 'reports', label: '報表中心', icon: FileText },
];

const titles: Record<string, Record<string, [string, string]>> = {
  member: {
    '': ['午安，12 王柏宇', '這裡是本週球隊活動與個人事項摘要。'], profile: ['球員資料', '檢視球員基本資料與帳號綁定資訊。'],
    attendance: ['簽到與便當', '完成訓練與比賽簽到，並選擇當日餐點。'],
    duty: ['值星資訊', '查看下一次輪值；輪值當週可填寫並結算當天收支。'], 'parent-duty': ['家長輪值表', '查看每天一位值星與兩位載裝備家長的安排。'], games: ['比賽資訊', '僅供登入會員查看的球隊賽事安排。'],
    meals: ['每週值星便當管理', '當週值星球員可查看並編輯與管理後台同步的便當資料。'], settings: ['帳號設定', '管理通知偏好與目前登入裝置。'],
  },
  coach: {
    '': ['教練工作台', '掌握本週訓練、出席與待處理事項。'], players: ['球員管理', '檢視球員狀態與教練備註。'],
    trainings: ['訓練與出席', '建立訓練並完成現場點名。'], games: ['比賽管理', '維護內部比賽資料與原始紀錄。'],
    stats: ['技術數據', '記錄打擊、投球、守備資料並檢視球季統計。'], coaches: ['教練群管理', '管理教練職務、狀態與授權範圍。'], settings: ['帳號設定', '管理通知偏好與目前登入裝置。'],
  },
  admin: {
    '': ['管理後台', '今日球隊營運摘要與待處理工作。'], homepage: ['首頁內容管理', '統一管理公開網站首頁的文字、圖片、顯示狀態與區塊順序。'], people: ['人員與權限', '管理帳號、球員、教練、角色與綁定關係。'],
    'team-content': ['球隊介紹管理', '編輯內容區塊、排序並指定首頁顯示區塊。'], announcements: ['公告管理', '設定發布、置頂、上下架及有效期限。'],
    gallery: ['精彩畫面管理', '管理相簿區塊、排序與批次照片上傳。'], trainings: ['訓練管理', '建立訓練日期、內容與簽到時段。'],
    attendance: ['出席管理', '查看簽到狀態、補登並輸出明細。'], duty: ['值星管理', '安排值星與載裝備球員，追蹤確認及完成狀態。'],
    meals: ['每週便當管理', '設定餐點、期限並查看雙向訂購統計。'], finance: ['每日收支', '記錄實際收付款、退款與其他球隊支出。'],
    games: ['比賽與技術數據', '維護比賽原始紀錄與球季統計。'], reports: ['報表中心', '彙整出席、值星、便當、財務與球季報表。'], settings: ['帳號設定', '管理通知偏好與目前登入裝置。'],
  },
};

const rowsByPage: Record<string, string[][]> = {
  'member-attendance': [['09/06（六）','例行訓練','已簽到'],['08/31（日）','守備特訓','已出席'],['08/30（六）','例行訓練','請假']],
  'member-games': [['09/14（日）','秋季交流賽','河濱 B 球場','參加'],['09/28（日）','社區友誼賽','新生公園球場','請假'],['10/05（日）','隊內分組賽','河濱 B 球場','參加']],
  'coach-players': [['06 陳品睿','內野手','正常','本週加強傳接球'],['12 王柏宇','外野手','正常','跑壘反應良好'],['18 林昱辰','投手','留意','投球數需控管'],['23 吳承翰','捕手','正常','阻殺動作調整']],
  'coach-trainings': [['09/06','例行訓練','28 / 31','點名中'],['08/31','守備特訓','24 / 26','已完成'],['08/30','例行訓練','29 / 31','已完成']],
  'coach-games': [['09/14','秋季交流賽','尚未開始','建立名單'],['08/24','紅白對抗賽','8：6','紀錄完成'],['08/10','夏季友誼賽','4：5','紀錄完成']],
  'coach-coaches': [['張志明','總教練','啟用','全隊'],['林家豪','投手教練','啟用','投手群'],['陳柏廷','守備教練','啟用','全隊']],
  'admin-people': [['12 王柏宇','球員','啟用','王怡婷','09XX-XXX-678'],['06 陳品睿','球員','啟用','陳志偉','09XX-XXX-135'],['18 林昱辰','球員','啟用','林雅雯','09XX-XXX-246'],['23 吳承翰','球員','啟用','吳淑芬','09XX-XXX-357']],
  'admin-trainings': [['09/06','例行訓練','08:00–11:30','開放簽到'],['09/07','打擊特訓','08:30–10:30','草稿'],['09/13','例行訓練','08:00–11:30','草稿']],
  'admin-attendance': [['09/06 例行訓練','28','2','1'],['08/31 守備特訓','24','1','1'],['08/30 例行訓練','29','2','0']],
  'admin-duty': [['09/06–09/07','12 王柏宇／家長','飲水與場地','已確認'],['09/13–09/14','23 吳承翰／家長','器材與便當','未確認'],['09/20–09/21','06 陳品睿／家長','攝影與場復','未確認']],
  'admin-finance': [['08/29','收入','便當收款','$2,180'],['08/29','支出','場地耗材','$860'],['08/28','支出','器材維修','$1,200']],
  'admin-games': [['09/14','秋季交流賽','尚未開始','建立名單'],['08/24','紅白對抗賽','8：6','紀錄完成'],['08/10','夏季友誼賽','4：5','紀錄完成']],
  'admin-reports': [['本週','出席報表','31 位球員','可匯出'],['本月','便當統計','4 場活動','可匯出'],['本季','比賽數據','18 場比賽','可匯出']],
};

function DataTable({ rows, headers = ['日期／對象','項目','狀態','備註'] }: { rows: string[][]; headers?: string[] }) {
  const columnClass = headers.length === 5 ? ' data-columns-5' : '';
  return <div className="data-table"><div className={`data-row data-head${columnClass}`}>{headers.map(h=><span key={h}>{h}</span>)}</div>{rows.map((r,i)=><div className={`data-row${columnClass}`} key={i}>{r.map((c,j)=><span key={j}>{c}</span>)}</div>)}</div>;
}

function ManagedDataTable({ rows, headers, storageKey }: { rows: string[][]; headers: string[]; storageKey: string }) {
  const [items, setItems] = useState<string[][]>(rows);
  const [editingIndex, setEditingIndex] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  useEffect(() => {
    const stored = window.localStorage.getItem(`sunshine-table-${storageKey}`);
    if (stored) {
      try { setItems(JSON.parse(stored) as string[][]); } catch { window.localStorage.removeItem(`sunshine-table-${storageKey}`); }
    }
  }, [storageKey]);
  function persist(next: string[][]) {
    setItems(next);
    window.localStorage.setItem(`sunshine-table-${storageKey}`, JSON.stringify(next));
  }
  function openEditor(index: number | 'new') {
    setEditingIndex(index);
    setDraft(index === 'new' ? headers.map(() => '') : [...items[index]]);
  }
  function saveEditor() {
    const cells = draft.map(cell => cell.trim());
    if (cells.length !== headers.length || cells.some(cell => !cell)) return;
    persist(editingIndex === 'new' ? [...items, cells] : items.map((item, itemIndex) => itemIndex === editingIndex ? cells : item));
    setEditingIndex(null);
  }
  return <div className="data-table managed-data-table"><div className={`data-row data-head${headers.length === 5 ? ' data-columns-5' : ''}`}><>{headers.map(h => <span key={h}>{h}</span>)}</><span>操作</span></div>{items.map((row, index) => <div className={`data-row${headers.length === 5 ? ' data-columns-5' : ''}`} key={`${storageKey}-${index}`}>{row.map((cell, cellIndex) => <span key={`${index}-${cellIndex}`}>{cell}</span>)}<span><button type="button" onClick={() => openEditor(index)}>編輯</button><button type="button" onClick={() => persist(items.filter((_, itemIndex) => itemIndex !== index))}>刪除</button></span></div>)}{editingIndex !== null && <div className="managed-editor" aria-label={editingIndex === 'new' ? '新增資料' : '編輯資料'}>{headers.map((header, index) => <label key={header}>{header}<input value={draft[index] || ''} onChange={event => setDraft(current => current.map((cell, cellIndex) => cellIndex === index ? event.target.value : cell))}/></label>)}<div><button type="button" onClick={saveEditor}>保存</button><button type="button" className="outline-admin-button" onClick={() => setEditingIndex(null)}>取消</button></div></div>}{editingIndex === null && <button type="button" className="outline-admin-button" onClick={() => openEditor('new')}>＋ 新增資料</button>}</div>;
}

type HittingRow = { player: string; atBats: number; hits: number; rbi: number; errors: number };
function CoachStatsPage() {
  const initialRows = [{ player: '06 陳品睿', atBats: 12, hits: 5, rbi: 3, errors: 0 }];
  const [rows, setRows] = useState<HittingRow[]>(initialRows);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HittingRow>({ player: '', atBats: 0, hits: 0, rbi: 0, errors: 0 });
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-coach-hitting-stats');
    if (stored) { try { setRows(JSON.parse(stored) as HittingRow[]); } catch { window.localStorage.removeItem('sunshine-coach-hitting-stats'); } }
  }, []);
  function saveRow() {
    if (!draft.player.trim() || [draft.atBats, draft.hits, draft.rbi, draft.errors].some(value => value < 0)) return;
    const next = [...rows, { ...draft, player: draft.player.trim() }];
    setRows(next);
    window.localStorage.setItem('sunshine-coach-hitting-stats', JSON.stringify(next));
    setDraft({ player: '', atBats: 0, hits: 0, rbi: 0, errors: 0 });
    setEditing(false);
  }
  const atBats = rows.reduce((sum, row) => sum + row.atBats, 0);
  const hits = rows.reduce((sum, row) => sum + row.hits, 0);
  return <><div className="stats-grid three"><Stat label="球季團隊打擊率" value={atBats ? (hits / atBats).toFixed(3).replace(/^0/, '') : '.000'} note={`共 ${atBats} 打數`}/><Stat label="團隊打點" value={String(rows.reduce((sum, row) => sum + row.rbi, 0))} note="已登錄資料"/><Stat label="守備失誤" value={String(rows.reduce((sum, row) => sum + row.errors, 0))} note="已登錄資料"/></div><section className="panel-card"><div className="panel-heading"><div><h3>球員比賽打擊資料</h3><p>每筆資料保存於目前瀏覽器；接上 Supabase 後改由 player_game_stats 管理。</p></div><button type="button" onClick={() => setEditing(true)}>＋ 新增數據</button></div>{editing && <div className="managed-editor stats-editor" aria-label="新增球員比賽打擊數據"><label>球員<input value={draft.player} onChange={event => setDraft(current => ({ ...current, player: event.target.value }))}/></label>{(['atBats','hits','rbi','errors'] as const).map(key => <label key={key}>{({ atBats: '打數', hits: '安打', rbi: '打點', errors: '失誤' })[key]}<input type="number" min="0" value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: Number(event.target.value) }))}/></label>)}<div><button type="button" onClick={saveRow}>保存數據</button><button type="button" className="outline-admin-button" onClick={() => setEditing(false)}>取消</button></div></div>}<DataTable headers={['球員','打數','安打','打點','失誤']} rows={rows.map(row => [row.player, String(row.atBats), String(row.hits), String(row.rbi), String(row.errors)])}/></section></>;
}

function AdminGalleryPage() {
  const [images, setImages] = useState<string[]>(['/baseball-hero.png']);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-gallery-images');
    if (stored) { try { setImages(JSON.parse(stored) as string[]); } catch { window.localStorage.removeItem('sunshine-gallery-images'); } }
  }, []);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    const values = await Promise.all(files.map(async file => {
      const uploaded = await uploadGalleryAsset(file);
      if (uploaded) return uploaded;
      return new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : ''); reader.readAsDataURL(file); });
    }));
    {
      const next = [...images, ...values.filter(Boolean)];
      setImages(next);
      window.localStorage.setItem('sunshine-gallery-images', JSON.stringify(next));
    }
  }
  async function remove(index: number) {
    await deleteGalleryAsset(images[index]);
    const next = images.filter((_, itemIndex) => itemIndex !== index);
    setImages(next);
    window.localStorage.setItem('sunshine-gallery-images', JSON.stringify(next));
  }
  return <><div className="upload-zone"><Upload/><div><h3>批次上傳照片</h3><p>選擇多張圖片後會先保存於目前瀏覽器，接上 Storage 後改存正式圖檔路徑。</p></div><label className="solid-button">選擇照片<input type="file" accept="image/*" multiple hidden onChange={upload}/></label></div><div className="album-admin-grid">{images.map((image, index) => <div key={`${image.slice(0, 20)}-${index}`}><img src={image} alt={`相簿照片 ${index + 1}`}/><div><span>照片 {String(index + 1).padStart(2, '0')}</span><button type="button" onClick={() => remove(index)}>刪除</button></div></div>)}</div></>;
}

function AdminAnnouncementsPage() {
  const rows = [['九月份週末訓練時間調整公告', '訓練・置頂', '09/15', '已發布'], ['秋季球員裝備尺寸登記提醒', '球隊', '09/05', '已發布'], ['社區親子棒球體驗日開放報名', '活動', '09/10', '已發布'], ['夏季訓練注意事項', '訓練', '已到期', '過期']];
  return <><div className="admin-toolbar"><span>公告可新增、刪除，並可在接上資料庫後設定發布狀態與有效期限。</span></div><ManagedDataTable rows={rows} headers={['公告標題', '分類', '有效期限', '狀態']} storageKey="admin-announcements"/></>;
}

function AdminTeamContentPage() {
  const initial = [{ title: '球隊故事', body: '從一座社區球場開始，陪孩子穩定成長。', visible: true }, { title: '我們相信', body: '安全優先、團隊同行、長期成長。', visible: true }, { title: '球隊歷史', body: '2018 年成立，持續累積訓練與交流賽經驗。', visible: false }, { title: '訓練理念', body: '以基本功、品格與團隊責任為核心。', visible: true }];
  const [sections, setSections] = useState(initial);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-team-content');
    if (stored) { try { setSections(JSON.parse(stored) as typeof initial); } catch { window.localStorage.removeItem('sunshine-team-content'); } }
  }, []);
  function update(index: number, field: 'title' | 'body' | 'visible', value: string | boolean) {
    const next = sections.map((section, itemIndex) => itemIndex === index ? { ...section, [field]: value } : section);
    setSections(next);
    window.localStorage.setItem('sunshine-team-content', JSON.stringify(next));
  }
  return <><div className="admin-toolbar"><span>球隊介紹內容與首頁顯示狀態</span></div><div className="sortable-list">{sections.map((section, index) => <section key={index}><b>{String(index + 1).padStart(2, '0')}</b><label>標題<input value={section.title} onChange={event => update(index, 'title', event.target.value)}/></label><label>內容<textarea value={section.body} onChange={event => update(index, 'body', event.target.value)} rows={3}/></label><label><input type="checkbox" checked={section.visible} onChange={event => update(index, 'visible', event.target.checked)}/> 公開顯示</label></section>)}</div></>;
}

function EmptyPanel({ icon: Icon, title, text }: { icon: IconType; title: string; text: string }) {
  const [created, setCreated] = useState(false);
  return <div className="empty-panel"><span><Icon size={24}/></span><h3>{title}</h3><p>{created ? '已建立一筆待編輯資料，請接上正式資料庫後由對應管理表單完成內容。' : text}</p>{created ? <output>已新增</output> : <button type="button" onClick={() => setCreated(true)}>＋ 新增資料</button>}</div>;
}

function PublicHeader({ active }: { active: string }) {
  return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">陽</span><span><strong>陽光社區棒球隊</strong><small>SUNSHINE BASEBALL</small></span></Link><nav className="public-nav"><Link href="/">首頁</Link><Link className={active==='team'?'active':''} href="/team">球隊介紹</Link><Link className={active==='announcements'?'active':''} href="/announcements">最新公告</Link><Link className={active==='gallery'?'active':''} href="/gallery">精彩畫面</Link><Link className={active==='contact'?'active':''} href="/contact">聯絡我們</Link></nav><Link href="/login" className="login-button">球員登入</Link></header>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');
  async function submit(event: { preventDefault: () => void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nameValue = form.get('name');
    const emailValue = form.get('email');
    const messageValue = form.get('message');
    const name = typeof nameValue === 'string' ? nameValue.trim() : '';
    const email = typeof emailValue === 'string' ? emailValue.trim() : '';
    const topicValue = form.get('topic');
    const topic = typeof topicValue === 'string' ? topicValue.trim() : '';
    const message = typeof messageValue === 'string' ? messageValue.trim() : '';
    if (!name || !email || !message) return;
    window.localStorage.setItem('sunshine-contact-message', JSON.stringify({ name, email, message, createdAt: new Date().toISOString() }));
    try { await submitPublicContact({ name, email, topic, message }); } catch { setNotice('正式留言送出失敗，已先保留在本機；請稍後再試。'); }
    setSent(true);
    formElement.reset();
  }
  return <><PublicHeader active="contact"/><div className="page-hero compact"><p>CONTACT US</p><h1>聯絡我們</h1><span>想認識球隊、參與活動或提供合作提案，歡迎與我們聯繫。</span></div><main className="contact-page"><section className="contact-info-card"><p className="section-kicker">TEAM CONTACT</p><h2>一起讓社區裡的孩子，<br/>有一座安心成長的球場。</h2><p>陽光社區棒球隊由教練、家長與社區夥伴共同運作。若有體驗活動、訓練參訪、場地合作或贊助提案，請透過以下方式聯繫。</p><div className="contact-methods"><div><b>電子郵件</b><a href="mailto:sunshine.baseball@example.org">sunshine.baseball@example.org</a></div><div><b>訓練地點</b><span>社區河濱棒球場 B 場</span></div><div><b>一般回覆時間</b><span>週一至週五 18:00–21:00</span></div></div></section><section className="contact-form-card"><h2>留言給球隊</h2><p>{sent ? '留言已送出或暫存，球隊會依留下的信箱回覆。' : '請填寫資料後送出留言。'}</p>{notice && <output className="contact-notice">{notice}</output>}<form onSubmit={submit}><label>姓名<input name="name" required placeholder="請輸入姓名"/></label><label>電子郵件<input name="email" required type="email" placeholder="name@example.com"/></label><label>聯絡主題<select name="topic" defaultValue="體驗活動"><option>體驗活動</option><option>合作提案</option><option>場地與賽事</option><option>其他</option></select></label><label>留言內容<textarea name="message" required rows={6} placeholder="請簡單說明想詢問的事項"/></label><button type="submit">送出留言</button></form></section></main><PublicFooter/></>;
}

const publicAnnouncements = [
  { date: '2026.08.27', tag: '訓練', title: '九月份週末訓練時間調整公告', pinned: true },
  { date: '2026.08.23', tag: '球隊', title: '秋季球員裝備尺寸登記提醒', pinned: false },
  { date: '2026.08.18', tag: '活動', title: '社區親子棒球體驗日開放報名', pinned: false },
  { date: '2026.08.12', tag: '行政', title: '本季家長值星輪值表已更新', pinned: false },
  { date: '2026.08.05', tag: '球隊', title: '八月份球隊重要行程整理', pinned: false },
];

function AnnouncementsPage() {
  const [filter, setFilter] = useState('全部');
  const [query, setQuery] = useState('');
  const [announcements, setAnnouncements] = useState(publicAnnouncements);
  const filters = ['全部', '訓練', '球隊', '活動', '行政'];
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-table-admin-announcements');
    if (!stored) return;
    try {
      const rows = JSON.parse(stored) as string[][];
      const mapped = rows.filter(row => row.length >= 4 && row[3] !== '過期').map(row => ({ date: row[2].includes('.') ? row[2] : `2026.${row[2]}`, tag: row[1].replace('・置頂', ''), title: row[0], pinned: row[1].includes('置頂') }));
      if (mapped.length) setAnnouncements(mapped);
    } catch { window.localStorage.removeItem('sunshine-table-admin-announcements'); }
  }, []);
  const visible = announcements.filter(item => (filter === '全部' || item.tag === filter) && (!query.trim() || item.title.includes(query.trim())));
  return <><PublicHeader active="announcements"/><div className="page-hero"><p>LATEST NEWS</p><h1>最新公告</h1><span>球隊活動、訓練與行政資訊都在這裡。</span></div><main className="public-list-page"><div className="filter-row">{filters.map(item => <button type="button" className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}<label><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜尋公告"/></label></div>{visible.length === 0 ? <div className="empty-panel"><h3>沒有符合的公告</h3><p>請更換分類或搜尋文字。</p></div> : visible.map(item => <Link href="/announcements/training-update" className={item.pinned ? 'pinned-news' : 'article-list-row'} key={item.title}>{item.pinned && <b>置頂</b>}<div><time>{item.date}</time>{!item.pinned && <span>{item.tag}</span>}<h2>{item.title}</h2>{item.pinned && <p>因應場地安排，九月份部分週末訓練時間將微調，請家長留意會員中心最新時程。</p>}</div><ChevronRight/></Link>)}<div className="expired-block"><div><h2>過期公告</h2><p>已超過有效期限的公告會自動移至此處。</p></div><button type="button" onClick={() => setQuery('過期')}>查看過期公告</button></div></main><PublicFooter/></>;
}

function PublicGalleryDetail({ slug = 'summer-training' }: { slug?: string }) {
  const [selected, setSelected] = useState(0);
  const photos = [1, 2, 3, 4, 5, 6];
  const isCommunityAlbum = slug === 'community-day';
  const title = isCommunityAlbum ? '社區交流日' : '夏季訓練日誌';
  const month = isCommunityAlbum ? '2026.07' : '2026.08';
  const total = isCommunityAlbum ? 24 : 12;
  const move = (step: number) => setSelected(current => (current + step + photos.length) % photos.length);
  return <>
    <PublicHeader active="gallery"/>
    <main className="album-detail">
      <Link href="/gallery" className="back-to-list">← 回精彩畫面</Link>
      <div className="album-detail-head"><div><p>{month}・{total} 張照片</p><h1>{title}</h1><span>{isCommunityAlbum ? '和社區夥伴一起留下的比賽與交流回憶。' : '週末晨光、紮實基本功，以及孩子們一起完成的每一次練習。'}</span></div><span aria-live="polite">第 {String(selected + 1).padStart(2, '0')} 張</span></div>
      <div className="album-cover"><img src="/baseball-hero.png" alt={`${title}照片 ${selected + 1}`}/><span>{String(selected + 1).padStart(2, '0')} / {total}</span></div>
      <div className="photo-masonry">{photos.map((number, index) => <button type="button" className={index === selected ? 'active' : ''} key={number} aria-label={`開啟第 ${number} 張照片`} onClick={() => setSelected(index)}><img src="/baseball-hero.png" alt={`${title}照片 ${number}`}/><span>{String(number).padStart(2, '0')}</span></button>)}</div>
      <div className="album-navigation"><Link href="/gallery">查看全部相簿</Link><button type="button" onClick={() => move(-1)}>上一張</button><button type="button" onClick={() => move(1)}>下一張</button></div>
    </main>
    <PublicFooter/>
  </>;
}

function PublicGalleryPage() {
  const [album, setAlbum] = useState(0);
  const albums = [{ slug: 'summer-training', month: '2026.08', title: '夏季訓練日誌', count: '12 張照片', description: '週末晨光、紮實基本功，以及孩子們一起完成的每一次練習。' }, { slug: 'community-day', month: '2026.07', title: '社區交流日', count: '24 張照片', description: '和社區夥伴一起留下的比賽與交流回憶。' }];
  const current = albums[album];
  return <><PublicHeader active="gallery"/><div className="page-hero"><p>TEAM MOMENTS</p><h1>精彩畫面</h1><span>記錄每一次練習、比賽與一起成長的時刻。</span></div><main className="album-page"><section className="album-block"><div className="album-title"><div><small>{current.month}</small><h2>{current.title}</h2><p>{current.count}・可瀏覽完整相簿</p></div><div><button type="button" aria-label="上一個相簿" onClick={() => setAlbum(value => (value + albums.length - 1) % albums.length)}><ChevronLeft/></button><button type="button" aria-label="下一個相簿" onClick={() => setAlbum(value => (value + 1) % albums.length)}><ChevronRight/></button></div></div><Link href={`/gallery/${current.slug}`} className="album-feature"><img src="/baseball-hero.png" alt={`${current.title}封面`}/><span className="play-label">開啟相簿總覽</span></Link><p>{current.description}</p><div className="thumb-strip">{[1, 2, 3, 4].map(number => <img key={number} src="/baseball-hero.png" alt={`${current.title}縮圖 ${number}`}/>)}</div></section></main><PublicFooter/></>;
}

function TeamPublicPage() {
  const defaults = [{ title: '球隊故事', body: '從一座社區球場開始，陪孩子穩定成長。', visible: true }, { title: '我們相信', body: '安全優先、團隊同行、長期成長。', visible: true }, { title: '球隊歷史', body: '2018 年成立，持續累積訓練與交流賽經驗。', visible: false }, { title: '訓練理念', body: '以基本功、品格與團隊責任為核心。', visible: true }];
  const [sections, setSections] = useState(defaults);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-team-content');
    if (stored) { try { setSections(JSON.parse(stored) as typeof defaults); } catch { window.localStorage.removeItem('sunshine-team-content'); } }
  }, []);
  const visible = sections.filter(section => section.visible);
  return <><PublicHeader active="team"/><div className="page-hero compact"><p>ABOUT THE TEAM</p><h1>球隊介紹</h1><span>從社區出發，用棒球陪伴孩子成長。</span></div><div className="public-content"><aside className="content-index"><b>頁面區塊</b>{visible.map((section, index) => <a href={`#team-section-${index}`} key={section.title}>{String(index + 1).padStart(2, '0')} {section.title}</a>)}</aside><article className="story-content">{visible.map((section, index) => <section id={`team-section-${index}`} key={section.title}><p className="section-kicker">{section.title.toUpperCase()}</p><h2>{section.title}</h2><p>{section.body}</p></section>)}</article></div><PublicFooter/></>;
}

export function PublicPage({ section, page = '' }: { section: string; page?: string }) {
  if (section === 'announcements' && !page) return <AnnouncementsPage/>;
  if (section === 'gallery' && page) return <PublicGalleryDetail slug={page}/>;
  if (section === 'gallery' && !page) return <PublicGalleryPage/>;
  if (section === 'team') return <TeamPublicPage/>;
  if (section === 'contact') return <ContactPage/>;
  if (section === 'announcements' && page) return <><PublicHeader active="announcements"/><main className="article-detail"><Link href="/announcements" className="back-to-list">← 回最新公告</Link><div className="article-meta"><span>訓練公告</span><time>2026.08.27</time><b>置頂</b></div><h1>九月份週末訓練時間調整公告</h1><p className="article-lead">因應場地安排與夏季天候，九月份部分週末訓練時間將微調，請家長與球員依下列時程準時集合。</p><img src="/baseball-hero.png" alt="陽光社區棒球隊訓練球場"/><section><h2>調整後訓練時間</h2><div className="notice-schedule"><div><b>09/06（六）</b><span>08:00–11:30・河濱 B 球場</span></div><div><b>09/07（日）</b><span>08:30–10:30・打擊特訓區</span></div><div><b>09/13（六）</b><span>08:00–11:30・河濱 B 球場</span></div></div><h2>集合與攜帶物品</h2><p>請球員於訓練開始前 20 分鐘完成報到，穿著球隊練習服並攜帶手套、水壺及毛巾。如因故無法出席，請於會員中心完成請假。</p><div className="article-note"><b>家長提醒</b><p>如遇雨勢或場地臨時關閉，教練團會於活動前 90 分鐘發布最新公告。</p></div></section></main><PublicFooter/></>;
  if (section === 'gallery' && page) return <><PublicHeader active="gallery"/><main className="album-detail"><Link href="/gallery" className="back-to-list">← 回精彩畫面</Link><div className="album-detail-head"><div><p>2026.08・12 張照片</p><h1>夏季訓練日誌</h1><span>週末晨光、紮實基本功，以及孩子們一起完成的每一次練習。</span></div><button>自動播放</button></div><div className="album-cover"><img src="/baseball-hero.png" alt="夏季訓練日誌封面"/><span>01 / 12</span></div><div className="photo-masonry">{[1,2,3,4,5,6].map((n)=><button key={n} aria-label={`開啟第 ${n} 張照片`}><img src="/baseball-hero.png" alt={`夏季訓練照片 ${n}`}/><span>{String(n).padStart(2,'0')}</span></button>)}</div><div className="album-navigation"><Link href="/gallery">查看全部相簿</Link><button>上一張</button><button>下一張</button></div></main><PublicFooter/></>;
  if (section === 'team') return <><PublicHeader active="team"/><div className="page-hero compact"><p>ABOUT THE TEAM</p><h1>球隊介紹</h1><span>從社區出發，用棒球陪伴孩子成長。</span></div><div className="public-content"><aside className="content-index"><b>頁面區塊</b><a href="#story">01 球隊故事</a><a href="#belief">02 我們相信</a><a href="#history">03 球隊歷史</a></aside><article className="story-content"><section id="story"><p className="section-kicker">OUR STORY</p><h2>一群家長與教練，<br/>從一座社區球場開始。</h2><p>陽光成立於 2018 年，希望讓喜歡棒球的孩子，在安全、穩定且相互支持的環境中學習。我們不只看勝負，更重視每位球員是否在過程裡學會面對失敗、尊重隊友並為自己的角色負責。</p></section><section id="belief" className="belief-grid"><div><strong>01</strong><h3>安全優先</h3><p>訓練負荷、個資與影像使用，都以未成年球員安全為第一考量。</p></div><div><strong>02</strong><h3>團隊同行</h3><p>家長、教練與球員共同承擔，讓球隊成為可靠的社區夥伴。</p></div><div><strong>03</strong><h3>長期成長</h3><p>以基本功和品格為核心，陪伴孩子找到自己的節奏。</p></div></section><section id="history" className="history-block"><p className="section-kicker">TEAM HISTORY</p><h2>一起走過的里程碑</h2>{['2018｜球隊成立，12 位球員開始每週訓練','2021｜建立完整年齡分組與教練制度','2024｜完成第 100 場社區交流賽','2026｜啟動球隊數位管理與公開網站'].map(x=><p key={x}>{x}</p>)}</section></article></div><PublicFooter/></>;
  if (section === 'announcements') return <><PublicHeader active="announcements"/><div className="page-hero"><p>LATEST NEWS</p><h1>最新公告</h1><span>球隊活動、訓練與行政資訊都在這裡。</span></div><main className="public-list-page"><div className="filter-row"><button className="active">全部</button><button>訓練</button><button>球隊</button><button>活動</button><button>行政</button><label><Search size={16}/><input placeholder="搜尋公告"/></label></div><Link href="/announcements/training-update" className="pinned-news"><b>置頂</b><div><time>2026.08.27</time><h2>九月份週末訓練時間調整公告</h2><p>因應場地安排，九月份部分週末訓練時間將微調，請家長留意會員中心最新時程。</p></div><ChevronRight/></Link>{['秋季球員裝備尺寸登記提醒','社區親子棒球體驗日開放報名','本季家長值星輪值表已更新','八月份球隊重要行程整理'].map((x,i)=><Link href="/announcements/training-update" className="article-list-row" key={x}><time>2026.08.{23-i*5}</time><span>{i%2?'活動':'球隊'}</span><h3>{x}</h3><ChevronRight/></Link>)}<div className="expired-block"><div><h2>過期公告</h2><p>已超過有效期限的公告會自動移至此處。</p></div><button>展開 18 筆過期公告 <ChevronRight size={16}/></button></div></main><PublicFooter/></>;
  if (section === 'contact') return <><PublicHeader active="contact"/><div className="page-hero compact"><p>CONTACT US</p><h1>聯絡我們</h1><span>想認識球隊、參與活動或提供合作提案，歡迎與我們聯繫。</span></div><main className="contact-page"><section className="contact-info-card"><p className="section-kicker">TEAM CONTACT</p><h2>一起讓社區裡的孩子，<br/>有一座安心成長的球場。</h2><p>陽光社區棒球隊由教練、家長與社區夥伴共同運作。若有體驗活動、訓練參訪、場地合作或贊助提案，請透過以下方式聯繫。</p><div className="contact-methods"><div><b>電子郵件</b><a href="mailto:sunshine.baseball@example.org">sunshine.baseball@example.org</a></div><div><b>訓練地點</b><span>社區河濱棒球場 B 場</span></div><div><b>一般回覆時間</b><span>週一至週五 18:00–21:00</span></div></div></section><section className="contact-form-card"><h2>留言給球隊</h2><p>此為介面預覽，送出功能尚未連接。</p><label>姓名<input placeholder="請輸入姓名"/></label><label>電子郵件<input placeholder="name@example.com"/></label><label>聯絡主題<select defaultValue="體驗活動"><option>體驗活動</option><option>合作提案</option><option>場地與賽事</option><option>其他</option></select></label><label>留言內容<textarea rows={6} placeholder="請簡單說明想詢問的事項"/></label><button>送出留言</button></section></main><PublicFooter/></>;
  return <><PublicHeader active="gallery"/><div className="page-hero"><p>TEAM MOMENTS</p><h1>精彩畫面</h1><span>記錄每一次練習、比賽與一起成長的時刻。</span></div><main className="album-page"><section className="album-block"><div className="album-title"><div><small>2026.08</small><h2>夏季訓練日誌</h2><p>12 張照片・可自動輪播</p></div><div><button><ChevronLeft/></button><button><ChevronRight/></button></div></div><Link href="/gallery/summer-training" className="album-feature"><img src="/baseball-hero.png" alt="夏季訓練球場"/><span className="play-label">開啟相簿總覽</span></Link><div className="thumb-strip">{[1,2,3,4].map(n=><div key={n}><img src="/baseball-hero.png" alt={`縮圖 ${n}`}/></div>)}</div></section><section className="album-block"><div className="album-title"><div><small>2026.07</small><h2>社區交流日</h2><p>24 張照片・手動切換</p></div><div><button><ChevronLeft/></button><button><ChevronRight/></button></div></div><div className="gallery-placeholder"><GalleryHorizontal/><span>第二個精彩畫面區塊</span></div></section></main><PublicFooter/></>;
}

function PublicFooter(){return <footer className="site-footer"><span>© 2026 陽光社區棒球隊</span><span><Link href="/">回首頁</Link>　・　<Link href="/contact">聯絡我們</Link></span></footer>}

type HomepageSettings = { first: string; second: string; summary: string; introTitle: string; introBody: string; noticeTitle: string; galleryTitle: string; galleryQuote: string; contactTitle: string; contactBody: string; footerPrimary: string; footerSecondary: string; visible: boolean[]; heroImage: string; galleryImage: string };
const homepageDefaults: HomepageSettings = { first: '在每一次揮棒裡', second: '練習成為更好的自己', summary: '我們相信棒球不只是一場比賽 更是孩子 家庭與社區一起建立的成長記憶', introTitle: '一支從社區出發，陪孩子走得更遠的球隊。', introBody: '陽光是一支由家長、教練與社區夥伴共同支持的少年棒球隊。我們重視基本功，也重視孩子在團隊裡學會負責、互助與尊重。', noticeTitle: '最新公告', galleryTitle: '精彩畫面', galleryQuote: '每一次練習，都是值得保存的成長。', contactTitle: '想更認識我們？', contactBody: '歡迎家長與社區夥伴來信，我們會儘快回覆。', footerPrimary: '© 2026 陽光社區棒球隊', footerSecondary: '以孩子的安全、成長與團隊精神為優先', visible: [true, true, true, true, true, true], heroImage: '/baseball-hero.png', galleryImage: '/baseball-hero.png' };

function AdminHomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings>(homepageDefaults);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-homepage-settings');
    if (stored) { try { setSettings({ ...homepageDefaults, ...JSON.parse(stored) as Partial<HomepageSettings> }); } catch { window.localStorage.removeItem('sunshine-homepage-settings'); } }
  }, []);
  const [notice, setNotice] = useState('');
  const sections = [
    ['01', '主視覺橫幅', '首頁標題、說明文字、按鈕與背景圖片', '1920 × 1080 px'],
    ['02', '球隊介紹摘要', '首頁簡介、成立年份與球隊介紹連結', '1200 × 800 px'],
    ['03', '最新公告', '自動顯示有效公告前 5 筆及 More 連結', '1200 × 630 px'],
    ['04', '精彩畫面', '指定首頁相簿區塊、封面與輪播模式', '1600 × 900 px'],
    ['05', '聯絡我們', '聯絡標題、說明文字、信箱與頁面連結', '1200 × 800 px'],
    ['06', '頁尾資訊', '版權文字、公開頁連結與補充說明', '800 × 800 px'],
  ];
  function save() {
    window.localStorage.setItem('sunshine-homepage-settings', JSON.stringify(settings));
    setNotice('首頁設定已儲存，公開首頁重新整理後會套用。');
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, target: 'hero' | 'gallery' = 'hero') {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const uploadedUrl = await uploadHomepageAsset(file, target);
    if (uploadedUrl) { setSettings(current => ({ ...current, [target === 'gallery' ? 'galleryImage' : 'heroImage']: uploadedUrl })); setNotice('圖片已上傳至 Supabase Storage。'); return; }
    const reader = new FileReader();
    reader.onload = () => setSettings(current => ({ ...current, [target === 'gallery' ? 'galleryImage' : 'heroImage']: typeof reader.result === 'string' ? reader.result : target === 'gallery' ? current.galleryImage : current.heroImage }));
    reader.readAsDataURL(file);
  }
  return <><div className="stats-grid three"><Stat label="首頁區塊" value="6" note="全部已設定"/><Stat label="目前顯示" value={String(settings.visible.filter(Boolean).length)} note="公開網站可見"/><Stat label="最後更新" value="本次" note="尚未同步正式資料庫"/></div><section className="hero-content-editor"><div className="hero-editor-heading"><div><p>HERO CONTENT</p><h2>首頁主視覺文字</h2><span>修改後按儲存，設定會保存在目前瀏覽器。</span></div><div><Link href="/" className="outline-admin-button">預覽首頁</Link><button type="button" className="solid-button" onClick={save}>儲存主視覺</button></div></div><div className="hero-editor-fields"><label>主標第一行<input value={settings.first} onChange={event => setSettings(current => ({ ...current, first: event.target.value }))}/></label><label>主標第二行<input value={settings.second} onChange={event => setSettings(current => ({ ...current, second: event.target.value }))}/></label><label className="wide-field">說明文字<input value={settings.summary} onChange={event => setSettings(current => ({ ...current, summary: event.target.value }))}/></label></div>{notice && <output className="editor-hint">{notice}</output>}</section><div className="homepage-admin-toolbar"><div><b>首頁區塊與顯示狀態</b><span>關閉區塊後，公開首頁不顯示該區塊。</span></div><div><Link href="/" className="outline-admin-button">預覽公開首頁</Link><button type="button" className="solid-button" onClick={save}>儲存設定</button></div></div><div className="homepage-manager"><section className="homepage-section-list">{sections.map(([order, title, description, imageSize], index) => <div className="homepage-section-card" key={title}><span className="section-order">{order}</span><div className="section-thumb">{index === 0 ? <img src={settings.heroImage} alt="主視覺縮圖"/> : <span>{index === 1 ? <FileText/> : index === 2 ? <Megaphone/> : index === 3 ? <Images/> : index === 4 ? <Contact/> : <LayoutDashboard/>}</span>}</div><div className="section-copy"><h3>{title}</h3><p>{description}</p><small>可在此頁管理</small></div>{index === 0 && <label className="section-image-upload"><span className="solid-button">重新上傳</span><input type="file" accept="image/*" onChange={upload} hidden/><small>建議 {imageSize}</small></label>}<label className="visibility-toggle"><input type="checkbox" checked={settings.visible[index]} onChange={event => setSettings(current => ({ ...current, visible: current.visible.map((value, itemIndex) => itemIndex === index ? event.target.checked : value) }))}/><span>{settings.visible[index] ? '已顯示' : '已隱藏'}</span></label></div>)}</section><aside className="homepage-preview-panel"><div className="preview-panel-head"><div><b>即時版面預覽</b><span>桌面版首頁</span></div><button type="button" onClick={() => setNotice('預覽已依目前設定更新。')}>重新整理</button></div><div className="mini-home-preview"><div className="mini-hero"><img src={settings.heroImage} alt="首頁預覽"/><strong>{settings.first}<br/>{settings.second}</strong></div><div className="mini-section"><b>球隊介紹摘要</b><span>文字與成立年份</span></div><div className="mini-section"><b>最新公告</b><span>5 筆有效公告</span></div><div className="mini-section dark"><b>精彩畫面</b><span>指定相簿封面</span></div><div className="mini-contact">聯絡我們</div></div></aside></div></>;
}

function HomepageCopyEditor() {
  const [settings, setSettings] = useState<HomepageSettings>(homepageDefaults);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-homepage-settings');
    if (stored) { try { setSettings({ ...homepageDefaults, ...JSON.parse(stored) as Partial<HomepageSettings> }); } catch { window.localStorage.removeItem('sunshine-homepage-settings'); } }
  }, []);
  const update = <K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  const save = () => { window.localStorage.setItem('sunshine-homepage-settings', JSON.stringify(settings)); setNotice('首頁其他區塊內容已保存，重新整理公開首頁後會套用。'); };
  async function uploadGallery(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const uploadedUrl = await uploadHomepageAsset(file, 'gallery');
    if (uploadedUrl) { update('galleryImage', uploadedUrl); setNotice('精彩畫面圖片已上傳至 Supabase Storage。'); return; }
    const reader = new FileReader();
    reader.onload = () => update('galleryImage', typeof reader.result === 'string' ? reader.result : settings.galleryImage);
    reader.readAsDataURL(file);
  };
  return <section className="panel-card homepage-copy-editor-panel"><div className="panel-heading"><div><h3>首頁其他區塊內容</h3><p>介紹、公告標題、精彩畫面、聯絡區與頁尾都可在此修改。</p></div><button type="button" onClick={save}>保存首頁內容</button></div><div className="homepage-copy-grid"><label>球隊介紹標題<input value={settings.introTitle} onChange={event => update('introTitle', event.target.value)}/></label><label>球隊介紹內容<textarea rows={3} value={settings.introBody} onChange={event => update('introBody', event.target.value)}/></label><label>公告區塊標題<input value={settings.noticeTitle} onChange={event => update('noticeTitle', event.target.value)}/></label><label>精彩畫面區塊標題<input value={settings.galleryTitle} onChange={event => update('galleryTitle', event.target.value)}/></label><label>精彩畫面引言<input value={settings.galleryQuote} onChange={event => update('galleryQuote', event.target.value)}/></label><label>聯絡區塊標題<input value={settings.contactTitle} onChange={event => update('contactTitle', event.target.value)}/></label><label>聯絡區塊說明<textarea rows={2} value={settings.contactBody} onChange={event => update('contactBody', event.target.value)}/></label><label>頁尾主文字<input value={settings.footerPrimary} onChange={event => update('footerPrimary', event.target.value)}/></label><label>頁尾補充文字<input value={settings.footerSecondary} onChange={event => update('footerSecondary', event.target.value)}/></label><label className="homepage-image-field">精彩畫面圖片<input type="file" accept="image/*" onChange={uploadGallery}/><small>目前圖片：{settings.galleryImage.startsWith('data:') ? '已上傳本機圖片' : settings.galleryImage}</small></label></div>{notice && <output className="editor-hint">{notice}</output>}</section>;
}

export function PortalPage({ section, page }: { section: 'member'|'coach'|'admin'; page: string }) {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const productionAuth = Boolean(supabaseUrl && supabaseAnonKey);
  const [authReady, setAuthReady] = useState(!productionAuth);
  useEffect(() => {
    if (!productionAuth) return;
    const raw = window.localStorage.getItem('sunshine-auth-session');
    type AuthSession = { access_token?: string; user?: { id?: string } };
    let session: AuthSession | null = null;
    try { session = raw ? JSON.parse(raw) as AuthSession : null; } catch { session = null; }
    if (!session?.access_token || !session.user?.id) { window.location.replace('/login'); return; }
    const requiredRole = section === 'admin' ? 'admin' : section === 'coach' ? 'coach' : null;
    if (!requiredRole) { setAuthReady(true); return; }
    void fetch(`${supabaseUrl!.replace(/\/$/, '')}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(session.user.id)}&limit=1`, {
      headers: { apikey: supabaseAnonKey!, Authorization: `Bearer ${session.access_token}` },
    }).then(async response => {
      if (!response.ok) throw new Error('profile lookup failed');
      const profiles = await response.json() as Array<{ role?: string }>;
      const role = profiles[0]?.role;
      if (role !== requiredRole && !(requiredRole === 'coach' && role === 'admin')) { window.location.replace('/member'); return; }
      setAuthReady(true);
    }).catch(() => window.location.replace('/login'));
  }, [productionAuth, section, supabaseAnonKey, supabaseUrl]);
  const items = section==='member'?memberItems:section==='coach'?coachItems:adminItems;
  const [dynamicTitle, setDynamicTitle] = useState(section === 'member' && !page ? '午安，12 王柏宇' : '');
  useEffect(() => {
    if (section === 'member' && !page) setDynamicTitle(`${getGreeting(new Date().getHours())}，12 王柏宇`);
  }, [page, section]);
  if (!authReady) return <main className="portal-auth-loading"><p>正在確認登入權限…</p></main>;
  const [title, sub] = dynamicTitle ? [dynamicTitle, titles[section][page]?.[1] || '這裡是本週球隊活動與個人事項摘要。'] : titles[section][page] || ['頁面預覽','此頁為規劃中的靜態介面。'];
  const key = `${section}-${page}`;
  return <div className="portal-shell"><aside className="portal-sidebar"><Link href="/" className="portal-brand"><span>陽</span><b>陽光棒球隊<small>{section==='member'?'球員中心':section==='coach'?'教練專區':'管理後台'}</small></b></Link><nav>{items.map(({key:k,label,icon:Icon})=><Link className={k===page?'active':''} href={`/${section}${k?`/${k}`:''}`} key={k}><Icon/>{label}</Link>)}</nav><div className="sidebar-bottom"><Link href="/"><Home/>返回公開網站</Link><Link href={`/${section}/settings`}><Settings/>帳號設定</Link></div></aside><main className="portal-main"><header className="portal-top"><button className="mobile-menu" aria-label="開啟導覽"><Menu/></button><div className="mode-switch"><Link className={section==='member'?'active':''} href="/member">球員中心</Link><Link className={section==='coach'?'active':''} href="/coach">教練專區</Link><Link className={section==='admin'?'active':''} href="/admin">管理後台</Link></div><div className="user-tools"><span aria-label="12 則通知"><Bell/>12</span><b>王柏宇<small>{section==='member'?'球員':section==='coach'?'教練':'管理小組'}</small></b></div></header><div className="portal-content"><div className={`page-title${section==='member'&&page==='meals'?' meal-page-title':''}`}><div><p>STATIC INTERFACE PREVIEW</p><h1>{title}</h1><span>{sub}</span></div></div><PageBody section={section} page={page} tableRows={rowsByPage[key]}/></div></main></div>;
}

function PageBody({section,page,tableRows}:{section:string;page:string;tableRows?:string[][]}) {
  if (!page) return section==='member'?<MemberDashboard/>:<Dashboard section={section}/>;
  if (section === 'admin' && page === 'homepage') return <><AdminHomepagePage/><HomepageCopyEditor/></>;
  if (section === 'admin' && page === 'gallery') return <AdminGalleryPage/>;
  if (section === 'admin' && page === 'announcements') return <AdminAnnouncementsPage/>;
  if (section === 'admin' && page === 'team-content') return <AdminTeamContentPage/>;
  if (section==='member'&&page==='attendance') return <MemberAttendancePage/>;
  if (section==='member'&&page==='profile') return <PlayerProfilePage/>;
  if (section==='member'&&page==='duty') return <MemberDutyPage/>;
  if (section==='member'&&page==='parent-duty') return <MemberParentDutyPage/>;
  if (section==='member'&&page==='meals') return <WeeklyMealManagement memberView/>;
  if (section==='admin'&&page==='homepage') {
    const sections = [
      ['01','主視覺橫幅','首頁標題、說明文字、按鈕與背景圖片','已顯示','1920 × 1080 px'],
      ['02','球隊介紹摘要','首頁簡介、成立年份與球隊介紹連結','已顯示','1200 × 800 px'],
      ['03','最新公告','自動顯示有效公告前 5 筆及 More 連結','已顯示','1200 × 630 px'],
      ['04','精彩畫面','指定首頁相簿區塊、封面與輪播模式','已顯示','1600 × 900 px'],
      ['05','聯絡我們','聯絡標題、說明文字、信箱與頁面連結','已顯示','1200 × 800 px'],
      ['06','頁尾資訊','版權文字、公開頁連結與補充說明','已顯示','800 × 800 px'],
    ];
    return <><div className="stats-grid three"><Stat label="首頁區塊" value="6" note="全部已設定"/><Stat label="目前顯示" value="6" note="公開網站可見"/><Stat label="最後更新" value="今天" note="管理小組 17:08"/></div><section className="hero-content-editor"><div className="hero-editor-heading"><div><p>HERO CONTENT</p><h2>首頁主視覺文字</h2><span>主標固定分成兩行，公開網站依下列內容顯示。</span></div><div><Link href="/" className="outline-admin-button">預覽首頁</Link><button className="solid-button">儲存主視覺</button></div></div><div className="hero-editor-fields"><label>主標第一行<input defaultValue="在每一次揮棒裡"/></label><label>主標第二行<input defaultValue="練習成為更好的自己"/></label><label className="wide-field">說明文字<input defaultValue="我們相信棒球不只是一場比賽 更是孩子 家庭與社區一起建立的成長記憶"/></label></div><p className="editor-hint">公開頁面會移除逗號與句號，主標維持兩行，說明文字在桌面版維持一行。</p></section><div className="homepage-admin-toolbar"><div><b>首頁區塊與顯示順序</b><span>拖曳排序後，公開網站會依此順序呈現。</span></div><div><Link href="/" className="outline-admin-button">預覽公開首頁</Link><button className="solid-button">儲存排序</button></div></div><div className="homepage-manager"><section className="homepage-section-list">{sections.map(([order,title,description,status,imageSize],i)=><div className="homepage-section-card" key={title}><b className="drag-handle">⋮⋮</b><span className="section-order">{order}</span><div className="section-thumb">{i===0?<img src="/baseball-hero.png" alt="主視覺縮圖"/>:<span>{[Home,FileText,Megaphone,Images,Contact,LayoutDashboard].map((Icon,index)=>index===i?<Icon key={index}/>:null)}</span>}</div><div className="section-copy"><h3>{title}</h3><p>{description}</p><small>最後更新：2026.08.{29-i}</small></div><div className="section-image-upload"><button type="button"><Upload/>重新上傳</button><small>建議 {imageSize}</small></div><label className="visibility-toggle"><input type="checkbox" defaultChecked/><span>{status}</span></label><button className="section-edit">編輯內容</button><button className="more-button">•••</button></div>)}</section><aside className="homepage-preview-panel"><div className="preview-panel-head"><div><b>即時版面預覽</b><span>桌面版首頁</span></div><button>重新整理</button></div><div className="mini-home-preview"><div className="mini-nav"><span>陽</span><b>陽光社區棒球隊</b><i>首頁　球隊介紹　最新公告</i></div><div className="mini-hero"><img src="/baseball-hero.png" alt="首頁預覽"/><strong>在每一次揮棒裡<br/>練習成為更好的自己</strong></div><div className="mini-section"><b>球隊介紹摘要</b><span>文字與成立年份</span></div><div className="mini-section"><b>最新公告</b><span>5 筆有效公告</span></div><div className="mini-section dark"><b>精彩畫面</b><span>指定相簿封面</span></div><div className="mini-contact">聯絡我們</div></div><p className="preview-note">此頁先確認完整管理介面，按鈕與儲存功能尚未連接正式資料。</p></aside></div></>;
  }
  if (section==='admin'&&page==='team-content') return <AdminTeamContentPage/>;
  if (section==='admin'&&page==='announcements') return <AdminAnnouncementsPage/>;
  if (section==='admin'&&page==='gallery') return <><div className="upload-zone"><Upload/><div><h3>批次上傳照片</h3><p>一次選擇多張照片，確認後自動壓縮成網站顯示尺寸。</p></div><button>選擇照片</button></div><div className="album-admin-grid">{['夏季訓練日誌','社區交流日','春季友誼賽'].map((x,i)=><div key={x}><img src="/baseball-hero.png" alt="相簿封面"/><div><span>區塊 {i+1}</span><h3>{x}</h3><p>{12+i*6} 張照片・{i===1?'手動切換':'自動輪播'}</p></div></div>)}</div></>;
  if (section==='admin'&&page==='meals') return <WeeklyMealManagement/>;
  if (section==='coach'&&page==='stats') return <CoachStatsPage/>;
  if (section==='admin'&&page==='duty') return <DutyScheduleManager/>;
  if (page === 'settings') return <AccountSettingsPage section={section}/>;
  if (section==='admin'&&page==='people'&&tableRows) return <ManagedDataTable rows={tableRows} headers={['球員','身分','狀態','家長','聯絡電話']} storageKey="admin-people"/>;
  if (tableRows && section !== 'member') return <ManagedDataTable rows={tableRows} headers={['日期／對象','項目','狀態','備註']} storageKey={`${section}-${page}`}/>;
  if (tableRows) return <DataTable rows={tableRows}/>;
  return <EmptyPanel icon={section==='admin'?PackageCheck:Contact} title={`${titles[section][page]?.[0]||'頁面'}介面`} text="此畫面先確認資訊層級、表格與操作區位置；功能尚未連接。"/>;
}

function AccountSettingsPage({ section }: { section: string }) {
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState(() => typeof window === 'undefined' || window.localStorage.getItem('sunshine-notifications-enabled') !== 'false');
  const save = () => {
    window.localStorage.setItem('sunshine-notifications-enabled', String(notifications));
    setNotice('帳號偏好已保存。正式環境會同步至目前登入帳號。');
  };
  const logout = () => {
    window.localStorage.removeItem('sunshine-auth-session');
    window.location.href = '/login';
  };
  return <section className="panel-card account-settings-page"><div className="panel-heading"><div><h2>帳號設定</h2><p>管理通知偏好與目前登入裝置。</p></div></div><div className="settings-field"><label><input type="checkbox" checked={notifications} onChange={event => setNotifications(event.target.checked)}/> 接收簽到、便當與公告提醒</label><small>{section === 'admin' ? '管理員可另外設定通知發送對象。' : '正式環境會依帳號權限顯示可用通知。'}</small></div><div className="settings-actions"><button type="button" onClick={save}>保存設定</button><button type="button" className="outline-admin-button" onClick={logout}>登出</button></div>{notice && <output className="editor-hint">{notice}</output>}</section>;
}

function MemberDashboard() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [meal, setMeal] = useState('');
  useEffect(() => {
    setCheckedIn(window.localStorage.getItem('sunshine-training-checkin') === '已簽到');
    setMeal(window.localStorage.getItem('sunshine-training-meal') || '');
  }, []);

  return <div className="member-home-dashboard">
    <section className="next-training-card">
      <div className="next-training-heading"><CalendarCheck/><div><span>下次訓練</span><h2>例行訓練</h2></div></div>
      <div className="next-training-date"><strong>09/06</strong><span>星期六</span></div>
      <div className="next-training-detail"><b>08:00–11:30</b><span>社區河濱棒球場 B 場</span></div>
      <div className="next-training-action"><span className="checkin-summary"><strong>{checkedIn ? '已簽到' : '尚未簽到'}</strong>{meal && <small>{meal}</small>}</span><Link href="/member/attendance">{checkedIn ? '查看簽到' : '前往簽到'}</Link></div>
    </section>
    <div className="member-assignment-title"><div><h2>下一次輪值安排</h2><p>查看即將到來的值星與載設備日期</p></div><Link className="parent-duty-link" href="/member/parent-duty">家長輪值表</Link></div>
    <section className="member-assignment-grid">
      <div className="member-assignment-card duty-assignment"><span className="assignment-icon"><ClipboardCheck/></span><div className="assignment-copy"><small>下一次值星日期</small><p>09/20　星期六</p><b>08:40 前抵達球場</b></div><Link href="/member/duty">查看內容</Link></div>
      <div className="member-assignment-card equipment-assignment"><span className="assignment-icon"><PackageCheck/></span><div className="assignment-copy"><small>下一次載裝備</small><div className="assignment-date-row"><p>09/27　星期六</p><span>18 林昱辰</span></div><b>08:25　球隊器材室集合</b></div><Link href="/member/duty">查看內容</Link></div>
    </section>
  </div>;
}

function MemberParentDutyPage() {
  const defaultRows = [
    ['2026-09-06', '12 王柏宇家長', '18 林昱辰家長', '23 吳承翰家長'],
    ['2026-09-13', '06 陳品睿家長', '12 王柏宇家長', '27 張宸睿家長'],
    ['2026-09-20', '18 林昱辰家長', '23 吳承翰家長', '12 王柏宇家長'],
  ];
  const [rows, setRows] = useState(defaultRows);
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-parent-duty');
    if (stored) { try { setRows(JSON.parse(stored) as string[][]); } catch { window.localStorage.removeItem('sunshine-parent-duty'); } }
  }, []);
  const playerName = (value: string) => value.replace('家長', '');
  const formatDate = (value: string) => `${value.slice(5, 7)}/${value.slice(8, 10)}（${['日', '一', '二', '三', '四', '五', '六'][new Date(`${value}T12:00:00`).getDay()]}）`;
  const sortedRows = [...rows].sort((a, b) => a[0].localeCompare(b[0]));
  return <div className="parent-duty-page"><section className="panel-card"><div className="panel-heading"><h3>家長輪值表</h3><Link className="outline-admin-button" href="/member">回會員首頁</Link></div><div className="data-table parent-duty-table"><div className="data-row data-head data-columns-4"><span>日期</span><span>值星</span><span>裝備一</span><span>裝備二</span></div>{sortedRows.map((row) => <div className="data-row data-columns-4" key={row[0]}><span>{formatDate(row[0])}</span><span>{playerName(row[1])}</span><span>{playerName(row[2])}</span><span>{playerName(row[3])}</span></div>)}</div></section></div>;
}

function MemberAttendancePage() {
  const [checkin, setCheckin] = useState('');
  const [trainingSaved, setTrainingSaved] = useState(false);
  const [meal, setMeal] = useState('');
  const [gameCheckin, setGameCheckin] = useState('');
  const [gameSaved, setGameSaved] = useState(false);
  const [trainingEventId, setTrainingEventId] = useState('');
  const [gameEventId, setGameEventId] = useState('');
  const [notice, setNotice] = useState('');
  const meals = ['經典排骨便當','香煎雞腿便當','田園蔬食便當','不訂餐'];
  useEffect(() => {
    const storedStatus = window.localStorage.getItem('sunshine-training-checkin');
    const storedChoice = window.localStorage.getItem('sunshine-training-checkin-choice');
    setCheckin(storedChoice || storedStatus || '');
    setTrainingSaved(Boolean(storedStatus));
    setMeal(window.localStorage.getItem('sunshine-training-meal') || '');
    const storedGame = window.localStorage.getItem('sunshine-game-checkin') || '';
    setGameCheckin(storedGame);
    setGameSaved(Boolean(storedGame));
    const configured = getBrowserRepository();
    if (configured) {
      configured.repository.listTrainingEvents('2026-09-06', '2026-09-14').then(events => {
        setTrainingEventId(events.find(event => event.eventDate === '2026-09-06' && event.eventType === 'training')?.id || '');
        setGameEventId(events.find(event => event.eventDate === '2026-09-14' && event.eventType === 'game')?.id || '');
      }).catch(() => setNotice('正式資料讀取失敗，目前僅保留本機畫面狀態。'));
    }
  }, []);
  const saveAttendance = async (eventId: string, choice: string) => {
    const configured = getBrowserRepository();
    if (!configured || !eventId) return;
    try {
      await configured.repository.saveAttendance({ eventId, playerId: configured.userId, status: choice === '請假' ? 'leave' : 'attended', submittedAt: new Date().toISOString() });
    } catch {
      setNotice('正式簽到資料寫入失敗，請稍後重試；畫面狀態未清除。');
    }
  };
  const saveMealOrder = async (value: string) => {
    const configured = getBrowserRepository();
    if (!configured || !trainingEventId) return;
    try {
      await configured.repository.saveMealOrder({ eventId: trainingEventId, playerId: configured.userId, status: value === '不訂餐' ? 'no_meal' : 'ordered', orderedAt: new Date().toISOString() });
    } catch {
      setNotice('正式便當資料寫入失敗，請確認訂餐是否仍在開放期間。');
    }
  };
  const history = [
    ['2026/08/31（日）','訓練','守備特訓','已出席','—'],
    ['2026/08/30（六）','訓練','例行訓練','請假','家庭活動'],
    ['2026/08/24（日）','比賽','紅白對抗賽','已參加','—'],
    ['2026/08/17（日）','訓練','打擊特訓','已出席','3 點提早離開'],
  ];
  return <div className="attendance-meal-page">
    <section className="checkin-section training-checkin-section">
      <div className="section-title-row"><div><span>01</span><h2>訓練簽到</h2></div><b>最近一次</b></div>
      <div className="checkin-form-row">
        <div className="checkin-event"><time>2026/09/06　星期六</time><strong>例行訓練</strong><small>08:00–11:30　社區河濱棒球場 B 場</small></div>
        <label><span>簽到</span><select value={checkin} disabled={trainingSaved} onChange={(event) => setCheckin(event.target.value)}><option value="" disabled>請選擇</option><option>參加</option><option>上午請假、中午到</option><option>中午到</option><option>請假</option><option>已簽到</option></select></label>
        <label className="checkin-note"><span>備註</span><input placeholder="例如：晚點到、3 點提早離開"/></label>
        <button type="button" disabled={!checkin || trainingSaved} onClick={() => { const choice = checkin; const status = choice === '請假' ? '請假' : '已簽到'; window.localStorage.setItem('sunshine-training-checkin', status); window.localStorage.setItem('sunshine-training-checkin-choice', choice); setTrainingSaved(true); if (status === '請假') { window.localStorage.removeItem('sunshine-training-meal'); setMeal(''); } setCheckin(status); void saveAttendance(trainingEventId, choice); setNotice(status === '已簽到' ? '已完成簽到' : '已記錄請假'); }}>{trainingSaved ? (checkin === '請假' ? '已記錄請假' : '已簽到') : '確認簽到'}</button>
      </div>
    </section>

    <section className="checkin-section meal-order-section">
      <div className="section-title-row"><div><span>02</span><h2>便當訂購</h2></div><b>每位球員限選一項</b></div>
      <p className="meal-order-note">簽到選擇「請假」時不需選餐，其餘簽到狀態皆可選擇一個餐點。</p>
      <div className="simple-meal-list">{meals.map((item,i)=><label key={item} className={i===meals.length-1?'no-meal':''}><input type="radio" name="meal-choice" disabled={!trainingSaved || checkin === '請假'} checked={meal === item} onChange={() => setMeal(item)}/><span>{item}</span></label>)}</div>
      <div className="meal-order-footer"><span>{meal ? `已選擇：${meal}` : checkin === '請假' ? '請假免訂餐' : trainingSaved ? '尚未選擇餐點' : '完成簽到後才能選餐'}</span><button type="button" disabled={!trainingSaved || !meal || checkin === '請假'} onClick={() => { if (!meal) return; window.localStorage.setItem('sunshine-training-meal', meal); void saveMealOrder(meal); setNotice(`已記錄餐點：${meal}`); }}>確認餐點</button></div>
      {notice && <p className="meal-order-note">{notice}</p>}
    </section>

    <section className="checkin-section game-checkin-section">
      <div className="section-title-row"><div><span>03</span><h2>比賽簽到</h2></div><b>即將到來</b></div>
      <div className="checkin-form-row">
        <div className="checkin-event"><time>2026/09/14　星期日</time><strong>秋季交流賽</strong><small>07:30 集合　社區河濱棒球場 B 場</small></div>
        <label><span>簽到</span><select value={gameCheckin} disabled={gameSaved} onChange={(event) => setGameCheckin(event.target.value)}><option value="" disabled>請選擇</option><option>參加</option><option>請假</option></select></label>
        <label className="checkin-note"><span>備註</span><input placeholder="例如：晚點到、3 點提早離開"/></label>
        <button type="button" disabled={!gameCheckin || gameSaved} onClick={() => { window.localStorage.setItem('sunshine-game-checkin', gameCheckin); setGameSaved(true); void saveAttendance(gameEventId, gameCheckin); setNotice(gameCheckin === '請假' ? '已記錄比賽請假' : '已完成比賽簽到'); }}>{gameSaved ? '已記錄' : '確認簽到'}</button>
      </div>
    </section>

    <section className="checkin-section attendance-history-section">
      <div className="section-title-row"><div><span>04</span><h2>過期簽到</h2></div><b>依日期由新到舊</b></div>
      <div className="attendance-history-table"><div className="attendance-history-row head"><span>日期</span><span>類型</span><span>項目</span><span>簽到狀態</span><span>備註</span></div>{history.map((row)=><div className="attendance-history-row" key={row[0]+row[2]}>{row.map((cell)=><span key={cell}>{cell}</span>)}</div>)}</div>
    </section>
  </div>;
}

function Dashboard({section}:{section:string}) {return <><div className="stats-grid"><Stat label="本週訓練" value="3" note="場活動"/><Stat label={section==='admin'?'待確認值星':'本月出席率'} value={section==='admin'?'4':'94%'} note={section==='admin'?'位家長':'穩定出席'}/><Stat label={section==='admin'?'未付款':'待處理事項'} value={section==='admin'?'$1,260':'2'} note={section==='admin'?'便當款項':'項提醒'}/><Stat label="球員人數" value="31" note="目前啟用"/></div><div className="dashboard-grid"><div className="panel-card wide"><div className="panel-heading"><div><h3>本週行程</h3><p>球隊活動與重要提醒</p></div><Link href={section==='admin'?'/admin/trainings':'/coach/trainings'}>查看全部</Link></div>{[['09/06','例行訓練','08:00–11:30'],['09/07','打擊特訓','08:30–10:30'],['09/14','秋季交流賽','07:30 集合']].map(x=><div className="schedule-row" key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><small>{x[2]}</small></div>)}</div><div className="panel-card"><div className="panel-heading"><div><h3>待辦提醒</h3><p>需要留意的工作</p></div></div>{['確認本週便當訂購','查看下一次值星內容','完成訓練出席紀錄'].map((x,i)=><label className="todo-row" key={x}><input type="checkbox" defaultChecked={i===2}/><span>{x}</span></label>)}</div></div></>}
function Stat({label,value,note}:{label:string;value:string;note:string}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
