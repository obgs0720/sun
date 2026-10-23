'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, Pencil, X } from 'lucide-react';

type DutyRow = {
  id: number;
  date: string;
  duty: string;
  equipment1: string;
  equipment2: string;
};

const players = [
  '06 陳品睿家長',
  '09 林奕安家長',
  '12 王柏宇家長',
  '18 林昱辰家長',
  '23 吳承翰家長',
  '27 張宸睿家長',
];

const initialRows: DutyRow[] = [
  { id: 1, date: '2026-09-06', duty: '12 王柏宇家長', equipment1: '18 林昱辰家長', equipment2: '23 吳承翰家長' },
  { id: 2, date: '2026-09-13', duty: '23 吳承翰家長', equipment1: '06 陳品睿家長', equipment2: '27 張宸睿家長' },
  { id: 3, date: '2026-09-20', duty: '06 陳品睿家長', equipment1: '09 林奕安家長', equipment2: '12 王柏宇家長' },
];

function nextSaturday(date: string) {
  const current = new Date(`${date}T12:00:00`);
  const day = current.getDay();
  const daysToAdd = day === 6 ? 7 : (6 - day + 7) % 7;
  current.setDate(current.getDate() + daysToAdd);
  return current.toISOString().slice(0, 10);
}

function weekdayLabel(date: string) {
  if (!date) return '—';
  return `星期${['日', '一', '二', '三', '四', '五', '六'][new Date(`${date}T12:00:00`).getDay()]}`;
}

function PlayerSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">請選擇球員</option>{players.map((player) => <option value={player} key={player}>{player}</option>)}</select></label>;
}

export function DutyScheduleManager() {
  const [rows, setRows] = useState<DutyRow[]>(initialRows);
  const [date, setDate] = useState(nextSaturday(initialRows[initialRows.length - 1].date));
  const [duty, setDuty] = useState('');
  const [equipment1, setEquipment1] = useState('');
  const [equipment2, setEquipment2] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DutyRow | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const stored = window.localStorage.getItem('sunshine-parent-duty');
    if (stored) { try { setRows(JSON.parse(stored) as DutyRow[]); } catch { window.localStorage.removeItem('sunshine-parent-duty'); } }
  }, []);

  const canAdd = useMemo(() => Boolean(date && duty && equipment1 && equipment2), [date, duty, equipment1, equipment2]);

  function addRow() {
    if (!canAdd) return;
    if (new Set([duty, equipment1, equipment2]).size < 3) {
      setMessage('值星與兩位設備人員請選擇不同球員');
      return;
    }
    const newRow = { id: Date.now(), date, duty, equipment1, equipment2 };
    setRows((current: DutyRow[]) => {
      const next = [...current, newRow];
      window.localStorage.setItem('sunshine-parent-duty', JSON.stringify(next));
      return next;
    });
    setDate(nextSaturday(date));
    setDuty('');
    setEquipment1('');
    setEquipment2('');
    setMessage(`已新增 ${date} 的值星排程`);
  }

  function beginEdit(row: DutyRow) {
    setEditingId(row.id);
    setDraft({ ...row });
    setMessage('');
  }

  function saveEdit() {
    if (!draft) return;
    if (!draft.date || !draft.duty || !draft.equipment1 || !draft.equipment2) return;
    if (new Set([draft.duty, draft.equipment1, draft.equipment2]).size < 3) {
      setMessage('值星與兩位設備人員請選擇不同球員');
      return;
    }
    setRows((current: DutyRow[]) => {
      const next = current.map((row: DutyRow) => row.id === draft.id ? draft : row);
      window.localStorage.setItem('sunshine-parent-duty', JSON.stringify(next));
      return next;
    });
    setEditingId(null);
    setDraft(null);
    setMessage(`已更新 ${draft.date} 的值星排程`);
  }

  function exportRows() {
    const csvRows = [['日期', '值星', '裝備一', '裝備二'], ...rows.map(row => [row.date, row.duty, row.equipment1, row.equipment2])];
    const csv = `\uFEFF${csvRows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '家長輪值表.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('已匯出家長輪值表 CSV');
  }

  return <div className="duty-manager">
    <section className="duty-create-card">
      <div className="duty-create-heading"><span><CalendarPlus/></span><div><h2>新增家長輪值排程</h2><p>每天安排一位值星家長與兩位載裝備家長，日期會自動帶入下一個星期六。</p></div></div>
      <div className="duty-create-fields">
        <label><span>日期</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label>
        <PlayerSelect label="值星家長" value={duty} onChange={setDuty}/>
        <PlayerSelect label="載裝備家長一" value={equipment1} onChange={setEquipment1}/>
        <PlayerSelect label="載裝備家長二" value={equipment2} onChange={setEquipment2}/>
        <button type="button" onClick={addRow} disabled={!canAdd}>確認新增</button>
      </div>
      {message && <output className="duty-message">{message}</output>}
    </section>

    <section className="duty-list-card">
      <div className="duty-list-heading"><div><h2>家長值星與載裝備安排</h2><p>共 {rows.length} 筆排程，每天一位值星、兩位載裝備。</p></div><button type="button" onClick={exportRows}>匯出排程</button></div>
      <div className="duty-table">
        <div className="duty-table-row duty-table-head"><span>日期</span><span>星期</span><span>值星</span><span>設備一</span><span>設備二</span><span>操作</span></div>
        {rows.map((row: DutyRow) => {
          const isEditing = editingId === row.id && draft;
          return <div className={`duty-table-row${isEditing ? ' editing' : ''}`} key={row.id}>
            {isEditing ? <>
              <input aria-label="修改日期" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })}/>
              <span className="duty-weekday">{weekdayLabel(draft.date)}</span>
              <select aria-label="修改值星" value={draft.duty} onChange={(event) => setDraft({ ...draft, duty: event.target.value })}>{players.map((player) => <option key={player}>{player}</option>)}</select>
              <select aria-label="修改設備一" value={draft.equipment1} onChange={(event) => setDraft({ ...draft, equipment1: event.target.value })}>{players.map((player) => <option key={player}>{player}</option>)}</select>
              <select aria-label="修改設備二" value={draft.equipment2} onChange={(event) => setDraft({ ...draft, equipment2: event.target.value })}>{players.map((player) => <option key={player}>{player}</option>)}</select>
              <span className="duty-row-actions"><button type="button" onClick={saveEdit} aria-label="儲存修改"><Check/></button><button type="button" onClick={() => { setEditingId(null); setDraft(null); }} aria-label="取消修改"><X/></button></span>
            </> : <>
              <time>{row.date}</time><span className="duty-weekday">{weekdayLabel(row.date)}</span><strong>{row.duty}</strong><span>{row.equipment1}</span><span>{row.equipment2}</span><span className="duty-row-actions"><button type="button" onClick={() => beginEdit(row)}><Pencil/>修改</button></span>
            </>}
          </div>;
        })}
      </div>
    </section>
  </div>;
}
