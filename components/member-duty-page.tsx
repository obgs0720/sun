'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardCheck, Plus, WalletCards, X } from 'lucide-react';
import { getBrowserRepository } from '../lib/repository';

type ExpenseRow = { item: string; amount: string; note: string; custom?: boolean };
type IncomeRow = { type: string; amount: string; note: string; player?: string; month?: string };
type DutyRecord = { expenses: ExpenseRow[]; incomes: IncomeRow[]; updatedAt: string };

const DRAFT_KEY = 'sunshine-duty-accounting-drafts';
const CONFIRMED_KEY = 'sunshine-duty-accounting-confirmed';
const dutySchedule = [
  { date: '2026-09-06', player: '12' },
  { date: '2026-09-13', player: '23' },
  { date: '2026-09-20', player: '06' },
];
const currentPlayerNumber = '12';
const today = new Date().toISOString().slice(0, 10);
const dutyDates = dutySchedule.filter(row => row.player === currentPlayerNumber && row.date <= today).map(row => row.date);
const players = ['00 林小明', '06 陳品睿', '12 王柏宇', '18 林昱辰', '23 吳承翰'];
const emptyExpenses = (): ExpenseRow[] => ['教練費', '便當', '水', '裝備', '其他'].map(item => ({ item, amount: '', note: '' }));
const emptyRecord = (): DutyRecord => ({ expenses: emptyExpenses(), incomes: [{ type: '', amount: '', note: '' }], updatedAt: '' });
const readRecords = (key: string): Record<string, DutyRecord> => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(key) || '{}') as Record<string, DutyRecord>; } catch { return {}; }
};
const formatDate = (date: string) => { const [year, month, day] = date.split('-'); return `${year}/${month}/${day}`; };
const weekday = (date: string) => ['日', '一', '二', '三', '四', '五', '六'][new Date(`${date}T00:00:00`).getDay()];

export function MemberDutyPage() {
  const availableDates = useMemo(() => dutyDates.length ? dutyDates : [dutySchedule[0].date], []);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [drafts, setDrafts] = useState<Record<string, DutyRecord>>({});
  const [confirmed, setConfirmed] = useState<Record<string, DutyRecord>>({});
  const [record, setRecord] = useState<DutyRecord>(emptyRecord());
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');
  const [scheduleIds, setScheduleIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadedDrafts = readRecords(DRAFT_KEY);
    const loadedConfirmed = readRecords(CONFIRMED_KEY);
    setDrafts(loadedDrafts);
    setConfirmed(loadedConfirmed);
    setRecord(loadedConfirmed[availableDates[0]] || loadedDrafts[availableDates[0]] || emptyRecord());
    const configured = getBrowserRepository();
    if (configured) configured.repository.listDutySchedules(availableDates[0], availableDates[availableDates.length - 1]).then(schedules => setScheduleIds(Object.fromEntries(schedules.map(schedule => [schedule.dutyDate, schedule.id])))).catch(() => undefined);
  }, [availableDates]);

  const settled = Boolean(confirmed[selectedDate]);
  const selectDate = (date: string) => { setSelectedDate(date); setNotice(''); setRecord(confirmed[date] || drafts[date] || emptyRecord()); };
  const persist = (key: string, next: Record<string, DutyRecord>) => window.localStorage.setItem(key, JSON.stringify(next));
  const syncSettlement = async (lock: boolean) => { const configured = getBrowserRepository(); const scheduleId = scheduleIds[selectedDate]; if (!configured || !scheduleId) return true; try { await configured.repository.clearMyDutySettlements(scheduleId); for (const row of record.expenses.filter(item => Number(item.amount) > 0)) await configured.repository.saveDutySettlement({ dutyScheduleId: scheduleId, description: row.item || '其他支出', amount: Number(row.amount), direction: 'expense', createdBy: configured.userId }); for (const row of record.incomes.filter(item => Number(item.amount) > 0)) await configured.repository.saveDutySettlement({ dutyScheduleId: scheduleId, description: row.type || '其他收入', amount: Number(row.amount), direction: 'income', createdBy: configured.userId }); if (lock) await configured.repository.confirmMyDutySchedule(scheduleId); return true; } catch { setNotice('正式值星資料同步失敗，尚未鎖定本筆資料。'); return false; } };
  const saveDraft = async () => { const next = { ...drafts, [selectedDate]: { ...record, updatedAt: new Date().toISOString() } }; setDrafts(next); persist(DRAFT_KEY, next); await syncSettlement(false); setNotice('值星收支已暫存；正式環境會同步至資料庫。'); };
  const submit = async () => { if (!await syncSettlement(true)) return; const nextConfirmed = { ...confirmed, [selectedDate]: { ...record, updatedAt: new Date().toISOString() } }; const nextDrafts = { ...drafts }; delete nextDrafts[selectedDate]; setConfirmed(nextConfirmed); setDrafts(nextDrafts); setRecord(nextConfirmed[selectedDate]); persist(CONFIRMED_KEY, nextConfirmed); persist(DRAFT_KEY, nextDrafts); setConfirming(false); setNotice('已確認送出，資料已寫入確認區並鎖定為唯讀。'); };
  const updateExpense = (index: number, field: keyof ExpenseRow, value: string) => setRecord(current => ({ ...current, expenses: current.expenses.map((row, i) => i === index ? { ...row, [field]: value } : row) }));
  const updateIncome = (index: number, field: keyof IncomeRow, value: string) => setRecord(current => { const incomes = current.incomes.map((row, i) => i === index ? { ...row, [field]: value } : row); if (index === incomes.length - 1 && value && incomes.length < 6) incomes.push({ type: '', amount: '', note: '' }); return { ...current, incomes }; });
  const expenseTotal = useMemo(() => record.expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0), [record.expenses]);
  const incomeTotal = useMemo(() => record.incomes.reduce((sum, row) => sum + Number(row.amount || 0), 0), [record.incomes]);

  return <div className="member-duty-page">
    <section className="duty-date-selector"><div><small>值星日期</small><h2>值星日期</h2><p>只顯示你已在輪值表擔任值星、且日期不晚於今天的紀錄。</p></div><label><select aria-label="值星日期" value={selectedDate} onChange={event => selectDate(event.target.value)}>{availableDates.map(date => <option key={date} value={date}>{formatDate(date)} 星期{weekday(date)}</option>)}</select></label></section>
    <section className="duty-accounting-card">
      <header className="duty-accounting-head"><div><span><CalendarDays/></span><div><small>{settled ? '已確認的值星資料' : '目前選擇的值星資料'}</small><h2>{formatDate(selectedDate)} 當天收支狀況</h2><p>{settled ? '確認送出後只能查看，不能再修改。' : '填寫完成後可先暫存，確認無誤再送出。'}</p></div></div><b className={settled ? 'settled' : ''}>{settled ? '已確認・僅供查看' : '編輯中'}</b></header>
      <div className="accounting-section"><div className="accounting-title"><div><WalletCards/><span><b>支出區塊</b><small>當天實際支出</small></span></div><button type="button" disabled={settled} onClick={() => setRecord(current => ({ ...current, expenses: [...current.expenses, { item: '', amount: '', note: '', custom: true }] }))}><Plus/>新增項目</button></div><div className="accounting-table"><div className="accounting-row accounting-head"><span>項目</span><span>金額</span><span>備註</span></div>{record.expenses.map((row, index) => <div className="accounting-row" key={`${row.item}-${index}`}>{row.custom ? <input disabled={settled} value={row.item} onChange={event => updateExpense(index, 'item', event.target.value)} placeholder="請輸入其他項目"/> : <strong>{row.item}</strong>}<label><span>NT$</span><input disabled={settled} value={row.amount} onChange={event => updateExpense(index, 'amount', event.target.value)} inputMode="numeric" aria-label={`${row.item || '其他'}金額`} placeholder="0"/></label><input disabled={settled} value={row.note} onChange={event => updateExpense(index, 'note', event.target.value)} aria-label={`${row.item || '其他'}備註`} placeholder="請輸入備註"/></div>)}</div><div className="accounting-total expense-total"><span>總支出金額</span><strong>NT$ {expenseTotal.toLocaleString()}</strong></div></div>
      <div className="accounting-section income-section"><div className="accounting-title"><div><WalletCards/><span><b>收入區塊</b><small>填完一列會自動出現下一列</small></span></div></div><div className="income-list">{record.incomes.map((row, index) => <div className="income-entry" key={index}><div className="income-main-row"><label><span>項目</span><select disabled={settled} value={row.type} onChange={event => updateIncome(index, 'type', event.target.value)}><option value="">請選擇</option><option>月費</option><option>比賽費用</option><option>其他</option></select></label><label><span>金額</span><div className="money-input"><i>NT$</i><input disabled={settled} value={row.amount} onChange={event => updateIncome(index, 'amount', event.target.value)} inputMode="numeric" placeholder="0"/></div></label><label><span>備註</span><input disabled={settled} value={row.note} onChange={event => updateIncome(index, 'note', event.target.value)} placeholder="請輸入備註"/></label></div>{row.type === '月費' && <div className="monthly-fee-detail"><span>月費資料</span><select disabled={settled} value={row.player || ''} onChange={event => updateIncome(index, 'player', event.target.value)}><option value="">選擇球員</option>{players.map(player => <option key={player}>{player}</option>)}</select><select disabled={settled} value={row.month || ''} onChange={event => updateIncome(index, 'month', event.target.value)}><option value="">選擇月份</option>{Array.from({ length: 12 }, (_, month) => <option key={month}>{month + 1} 月</option>)}</select></div>}</div>)}</div><div className="accounting-total income-total"><span>總收入金額</span><strong>NT$ {incomeTotal.toLocaleString()}</strong></div></div>
      <section className="daily-settlement"><div><small>當天總結算</small><b>收入減支出</b></div><div className="settlement-amount"><span>結餘金額</span><strong>NT$ {(incomeTotal - expenseTotal).toLocaleString()}</strong></div></section>
      {notice && <p className="duty-save-notice">{notice}</p>}<footer className="duty-action-bar"><span>{settled ? '本筆資料已確認送出，只能查看。' : '本機預覽會保存暫存；正式環境由資料庫在確認後鎖定。'}</span><div><button type="button" className="save-draft" disabled={settled} onClick={() => void saveDraft()}>暫存</button><button type="button" className="settle-submit" disabled={settled} onClick={() => setConfirming(true)}>確認送出</button></div></footer>
    </section>
    {confirming && <div className="settle-dialog-backdrop" role="presentation"><dialog open className="settle-dialog" aria-labelledby="settle-title"><button className="dialog-close" onClick={() => setConfirming(false)} aria-label="關閉"><X/></button><span><ClipboardCheck/></span><h2 id="settle-title">確認送出？</h2><p>送出後「{formatDate(selectedDate)}」的值星收支資料只能查看，不能再修改。確認後會移入資料庫確認區。</p><div><button onClick={() => setConfirming(false)}>返回檢查</button><button onClick={() => void submit()}>確認送出</button></div></dialog></div>}
  </div>;
}
