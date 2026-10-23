'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, Plus, Soup, Trash2, UsersRound } from 'lucide-react';
import { getBrowserRepository } from '../lib/repository';

const initialMeals: string[] = [];
const dutyDates = ['2026-09-06', '2026-09-13', '2026-09-20'];
const currentPlayerDutyDate = dutyDates[0];
const formatDutyDate = (date: string) => { const [year, month, day] = date.split('-'); return `${year}/${month}/${day}`; };
const dutyWeekday = (date: string) => ['日', '一', '二', '三', '四', '五', '六'][new Date(`${date}T00:00:00`).getDay()];
const daysUntil = (date: string, today: Date) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date(today.toISOString().slice(0, 10) + 'T00:00:00').getTime()) / 86400000);
const readStaffMeals = () => {
  if (typeof window === 'undefined') return { duty: '', manager: '' };
  try {
    const value = JSON.parse(window.localStorage.getItem('sunshine-staff-meals') || 'null') as { duty?: string; manager?: string } | null;
    return { duty: value?.duty || '', manager: value?.manager || '' };
  } catch {
    return { duty: '', manager: '' };
  }
};

export function WeeklyMealManagement({ memberView = false }: { memberView?: boolean }) {
  const [meals, setMeals] = useState<string[]>(initialMeals);
  const [newMeal, setNewMeal] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [menuCompleted, setMenuCompleted] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);
  const [orderingStarted, setOrderingStarted] = useState(false);
  const [orderingStopped, setOrderingStopped] = useState(false);
  const [staffDutyMeal, setStaffDutyMeal] = useState('');
  const [staffManagerMeal, setStaffManagerMeal] = useState('');
  const [eventId, setEventId] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem('sunshine-meal-menu-draft') || 'null') as { meals?: string[] } | null;
      if (draft?.meals) setMeals(draft.meals);
    } catch { window.localStorage.removeItem('sunshine-meal-menu-draft'); }
    const staff = readStaffMeals();
    setStaffDutyMeal(staff.duty);
    setStaffManagerMeal(staff.manager);
    const configured = getBrowserRepository();
    if (configured) configured.repository.listTrainingEvents(currentPlayerDutyDate, currentPlayerDutyDate).then(events => setEventId(events[0]?.id || '')).catch(() => undefined);
  }, []);
  const today = new Date();
  const daysToDuty = daysUntil(currentPlayerDutyDate, today);
  const withinSetupWindow = !memberView || (daysToDuty >= 0 && daysToDuty <= 7);
  const mealDateLabel = `${formatDutyDate(currentPlayerDutyDate)}　星期${dutyWeekday(currentPlayerDutyDate)}`;
  const canEdit = withinSetupWindow;
  const orders = [['06 陳品睿', '經典排骨便當', '已選餐'], ['12 王柏宇', '香煎雞腿便當', '已選餐'], ['18 林昱辰', '不訂餐', '請假'], ['23 吳承翰', '田園蔬食便當', '已選餐'], ['09 林奕安', '不訂餐', '不訂餐']].sort((a, b) => Number.parseInt(a[0], 10) - Number.parseInt(b[0], 10));
  const orderColumns = [orders.slice(0, 3), orders.slice(3)];
  const mealGroups = [['經典排骨便當', '21 份', ['00 林小明', '06 陳品睿', '15 張宥翔', '另有 18 位']], ['香煎雞腿便當', '18 份', ['12 王柏宇', '19 李承恩', '21 黃冠廷', '另有 15 位']], ['田園蔬食便當', '7 份', ['08 陳思妤', '23 吳承翰', '28 林品安', '另有 4 位']], ['不訂餐', '5 位', ['09 林奕安', '18 林昱辰', '25 江凱文', '另有 2 位']]] as const;
  const addMeal = () => { const value = newMeal.trim(); if (!value || menuCompleted) return; setMeals(current => [...current, value]); setNewMeal(''); };
  const syncMealStatus = (status: 'draft' | 'open' | 'stopped') => { const configured = getBrowserRepository(); if (configured && eventId) void configured.repository.setMealOrderingStatus(eventId, status).catch(() => setNotice('正式便當狀態同步失敗，請稍後重試。')); };
  const saveMenuDraft = () => { window.localStorage.setItem('sunshine-meal-menu-draft', JSON.stringify({ meals, savedAt: new Date().toISOString() })); setMenuSaved(true); syncMealStatus('draft'); setNotice('便當清單已暫存；正式環境會同步至資料庫。'); };
  const completeMenu = () => { setMenuCompleted(true); syncMealStatus('draft'); setNotice('便當清單已完成，請按「開始訂餐」開放點餐。'); };
  const modifyMenu = () => { setMenuCompleted(false); setMenuSaved(false); setOrderingStarted(false); setOrderingStopped(false); setNotice('已開放修改便當清單。修改完成後請重新暫存並確認。'); };
  const remindOrders = async () => { const pending = orders.filter(row => row[2] !== '已選餐').map(row => row[0]); window.localStorage.setItem('sunshine-meal-order-reminder', JSON.stringify({ recipients: pending, sentAt: new Date().toISOString() })); const configured = getBrowserRepository(); if (configured && eventId) { try { const directory = await configured.repository.listPlayerDirectory(); const records = pending.map(row => directory.find(player => player.jerseyNumber === row.split(' ')[0])).filter((player): player is NonNullable<typeof player> => Boolean(player)).map(player => ({ recipientId: player.id, notificationType: 'meal_reminder' as const, title: '本週便當尚未完成', body: '請登入球員中心完成本週簽到與便當選擇。', channel: 'in_app' as const })); if (records.length) await configured.repository.createNotifications(records); } catch { setNotice('訂餐提醒已保留，但正式通知寫入失敗，請稍後重試。'); return; } } setNotice(`已產生訂餐提醒，預計通知 ${pending.length} 位尚未完成訂餐的球員。`); };
  const startOrdering = () => { if (!menuCompleted) return; setOrderingStarted(true); syncMealStatus('open'); setNotice('已開始訂餐，球員現在可以選擇餐點。'); };
  const stopOrdering = () => { setOrderingStopped(true); syncMealStatus('stopped'); setNotice('已停止訂購，以下顯示本次統計結果；球員與工作人員無法再變更餐點。'); };
  const saveStaffMeals = () => { if (!staffDutyMeal || !staffManagerMeal) return; window.localStorage.setItem('sunshine-staff-meals', JSON.stringify({ duty: staffDutyMeal, manager: staffManagerMeal, savedAt: new Date().toISOString() })); setNotice('工作人員便當已確認並保存。'); };

  return <div className="weekly-meal-management">
    {memberView && <div className={`duty-editor-banner${canEdit ? '' : ' is-locked'}`}><CheckCircle2/><div><b>{canEdit ? '你是本次值星球員，可以編輯本頁' : '目前不在值星前七天設定期間'}</b><span>{canEdit ? '此頁與管理後台的每週便當管理同步顯示' : '目前僅顯示最近一次值星日期，資料為唯讀。'}</span></div></div>}
    <section className="meal-week-banner"><span><CalendarDays/></span><div><small>{canEdit ? '本次值星便當管理' : '最近一次值星日期'}</small><h2>{mealDateLabel}</h2><p>例行訓練便當</p></div><b>{canEdit ? '設定期間' : '僅供查看'}</b></section>
    <section className="meal-summary-grid"><article><Soup/><span>本週訂購<strong>46</strong><small>份</small></span></article><article><Clock3/><span>不訂餐<strong>5</strong><small>位球員</small></span></article><article><CheckCircle2/><span>餐點種類<strong>{meals.length}</strong><small>項</small></span></article></section>

    <section className="weekly-menu-panel"><header><div><span><Soup/></span><div><small>{mealDateLabel}</small><h2>本週餐點設定</h2><p>{canEdit ? '先暫存便當清單，再完成清單並開始訂餐' : '非設定期間，餐點資料僅供查看'}</p></div></div><div className="meal-menu-actions"><button type="button" className="meal-modify-button" disabled={!canEdit || !menuCompleted} onClick={modifyMenu}>修改清單</button><button type="button" className="meal-start-button" disabled={!canEdit || !menuCompleted || orderingStarted} onClick={startOrdering}>{orderingStarted ? '訂餐進行中' : '開始訂餐'}</button><button type="button" className="meal-draft-button" disabled={!canEdit || menuCompleted} onClick={saveMenuDraft}>{menuSaved ? '已暫存清單' : '暫存便當清單'}</button><button type="button" className="meal-complete-button" disabled={!canEdit || menuCompleted} onClick={completeMenu}>{menuCompleted ? '已完成清單' : '完成便當清單'}</button><button type="button" className="meal-remind-button" disabled={!canEdit || !orderingStarted || orderingStopped} onClick={remindOrders}>提醒訂餐</button><button type="button" className="meal-stop-button" disabled={!canEdit || !orderingStarted || orderingStopped} onClick={stopOrdering}>{orderingStopped ? '已停止訂購' : '停止訂購'}</button></div></header>
      <div className={`current-meal-list${collapsed ? ' is-collapsed' : ''}`}><div className="current-meal-row head"><span>餐點名稱</span>{!collapsed && <><span>狀態</span><span></span></>}<button type="button" className="meal-collapse-button" aria-label={collapsed ? '展開餐點清單' : '摺疊餐點清單'} onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronDown/> : <ChevronUp/>}</button></div>{!collapsed && meals.map((meal, index) => <div className="current-meal-row" key={`${meal}-${index}`}><span><i>{String(index + 1).padStart(2, '0')}</i><b>{meal}</b></span><em>使用中</em><button type="button" aria-label={`刪除${meal}`} disabled={!canEdit || menuCompleted} onClick={() => setMeals(current => current.filter((_, mealIndex) => mealIndex !== index))}><Trash2/></button></div>)}{!menuCompleted && !collapsed && <div className="current-meal-row add-row"><span><i><Plus/></i><label><small>新增餐點</small><input disabled={!canEdit} value={newMeal} onChange={event => setNewMeal(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addMeal(); }} placeholder="例如：滷雞腿便當"/></label></span><button type="button" disabled={!canEdit} onClick={addMeal}><Plus/>新增餐點</button></div>}</div>
    </section>
    {notice && <p className="meal-flow-notice">{notice}</p>}

    <section className="staff-meal-panel"><header><div><span><Soup/></span><div><h2>工作人員便當訂購</h2><p>為本週值星與場地管理員各選擇一份餐點</p></div></div><b>{mealDateLabel}</b></header><div className="staff-meal-grid"><label><span><strong>值星便當</strong><small>12 王柏宇</small></span><select disabled={!canEdit || !orderingStarted || orderingStopped} value={staffDutyMeal} onChange={event => setStaffDutyMeal(event.target.value)}><option value="" disabled>請選擇餐點</option>{meals.map(meal => <option key={meal}>{meal}</option>)}<option>不訂餐</option></select></label><label><span><strong>場地管理員便當</strong><small>社區河濱球場管理員</small></span><select disabled={!canEdit || !orderingStarted || orderingStopped} value={staffManagerMeal} onChange={event => setStaffManagerMeal(event.target.value)}><option value="" disabled>請選擇餐點</option>{meals.map(meal => <option key={meal}>{meal}</option>)}<option>不訂餐</option></select></label></div><footer><span>兩份餐點會併入下方餐點數量統計</span><button type="button" disabled={!canEdit || !orderingStarted || orderingStopped || !staffDutyMeal || !staffManagerMeal} onClick={saveStaffMeals}>確認訂購</button></footer></section>

    <section className="meal-by-item-panel"><header><div><Soup/><span><h2>餐點統計</h2><p>查看各餐點數量與選擇名單</p></span></div><b>共 51 位</b></header><div className="meal-group-grid">{mealGroups.map(([meal, count, names]) => <article className={meal === '不訂餐' ? 'no-order-group' : ''} key={meal}><div><h3>{meal}</h3><strong>{count}</strong></div><p>選擇名單</p><ul>{names.map(name => <li key={name}>{name}</li>)}</ul></article>)}</div><div className="un-ordered-list"><h3>未訂餐名單 <span>5 位</span></h3><div>{['09 林奕安', '18 林昱辰', '25 江凱文', '31 陳冠宇', '33 黃子恩'].map(name => <span key={name}>{name}</span>)}</div></div></section>
    <section className="meal-management-panel"><div className="player-summary-title"><UsersRound/><div><h3>依球員統計</h3><p>{orderingStopped ? '訂購已截止，以下為本次最終統計' : '球員較多時分成左右兩欄顯示'}</p></div></div><div className="meal-order-columns">{orderColumns.map((column, columnIndex) => <div className="meal-order-column" key={columnIndex}><div className="meal-order-row head"><span>球員</span><span>已選餐點</span><span>狀態</span></div>{column.map(row => <div className="meal-order-row" key={row[0]}><b>{row[0]}</b><span className={`locked-meal ${row[1] === '不訂餐' ? 'no-order' : ''}`}>{row[1]}</span><span className={row[2] === '已選餐' ? 'ordered' : ''}>{row[2]}</span></div>)}</div>)}</div></section>
  </div>;
}
