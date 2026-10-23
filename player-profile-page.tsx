'use client';

import { useEffect, useState } from 'react';
import { Plus, UserRound, X } from 'lucide-react';
import { getBrowserRepository } from '../lib/repository';

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="profile-detail-card"><div className="profile-detail-heading"><h2>{title}</h2></div>{children}</section>;
}

function DetailRow({ label, value, optional = false, locked = false, placeholder = false, boxed = false }: { label: string; value: string; optional?: boolean; locked?: boolean; placeholder?: boolean; boxed?: boolean }) {
  return <div className={`profile-detail-row${locked ? ' locked' : ''}`}><span>{label}{optional&&<small>選填</small>}</span>{placeholder ? <input className="profile-placeholder-input" aria-label={label} placeholder={value}/> : boxed ? <div className="profile-value-box">{value}</div> : <b>{value}</b>}</div>;
}

type ProfileDraft = { birthday: string; school: string; email: string; phone: string };
type ParentDraft = { name: string; relation: string; phone: string; email: string; line: string };

export function PlayerProfilePage() {
  const [showParentForm, setShowParentForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const profileDefaults = { birthday: '2014.05.18', school: '範例國民小學', email: '', phone: '0912345678' };
  const parentDefaults = { name: '', relation: '', phone: '', email: '', line: '' };
  const [secondParent, setSecondParent] = useState<ParentDraft>(parentDefaults);
  const [profile, setProfile] = useState<ProfileDraft>(profileDefaults);
  const [city, setCity] = useState('臺北市');
  const districts: Record<string, string[]> = { 臺北市: ['中正區', '信義區', '大安區', '士林區'], 新北市: ['板橋區', '新店區', '新莊區', '淡水區'], 桃園市: ['桃園區', '中壢區', '平鎮區'], 臺中市: ['西屯區', '北屯區', '豐原區'], 高雄市: ['苓雅區', '左營區', '鳳山區'] };
  const [district, setDistrict] = useState(districts['臺北市'][0]);
  async function saveProfile() {
    window.localStorage.setItem('sunshine-player-profile', JSON.stringify(profile));
    window.localStorage.setItem('sunshine-player-location', JSON.stringify({ city, district }));
    const configured = getBrowserRepository();
    if (configured) {
      try {
        await configured.repository.updateCurrentProfile({ birthday: profile.birthday.replaceAll('.', '-'), city, district, schoolName: profile.school, email: profile.email, phone: profile.phone });
      } catch { setNotice('資料已保留於畫面，但正式資料庫更新失敗，請稍後重試。'); return; }
    }
    setEditing(false);
    setNotice('球員資料已保存。');
  }
  async function saveSecondParent() {
    if (!secondParent.name || !secondParent.relation || !secondParent.phone || !secondParent.email) { setNotice('請完成第二位家長的姓名、關係、電話與電子信箱。'); return; }
    window.localStorage.setItem('sunshine-second-parent', JSON.stringify(secondParent));
    const configured = getBrowserRepository();
    if (configured) {
      try { await configured.repository.saveParentContact({ playerId: configured.userId, ...secondParent, isPrimary: false }); } catch { setNotice('第二位家長已保留於畫面，但正式資料庫更新失敗。'); return; }
    }
    setShowParentForm(false);
    setNotice('第二位家長資料已保存。');
  }
  useEffect(() => {
    const storedParent = window.localStorage.getItem('sunshine-second-parent');
    if (storedParent) { try { setSecondParent({ ...parentDefaults, ...JSON.parse(storedParent) as Partial<ParentDraft> }); } catch { window.localStorage.removeItem('sunshine-second-parent'); } }
    const storedProfile = window.localStorage.getItem('sunshine-player-profile');
    if (storedProfile) { try { setProfile({ ...profileDefaults, ...JSON.parse(storedProfile) as Partial<ProfileDraft> }); } catch { window.localStorage.removeItem('sunshine-player-profile'); } }
    const storedLocation = window.localStorage.getItem('sunshine-player-location');
    if (storedLocation) { try { const location = JSON.parse(storedLocation) as { city?: string; district?: string }; if (location.city && districts[location.city]) { setCity(location.city); setDistrict(location.district && districts[location.city].includes(location.district) ? location.district : districts[location.city][0]); } } catch { window.localStorage.removeItem('sunshine-player-location'); } }
  }, []);

  return <div className="player-profile-page">
    <div className="profile-card"><span className="jersey">12</span><div><small>球員</small><h2>王柏宇</h2></div><button type="button" onClick={() => { setEditing(value => !value); setNotice(''); }}>{editing ? '取消編輯' : '編輯聯絡資料'}</button></div>

    <div className="profile-detail-grid">
      <DetailCard title="球員基本資料">
        <DetailRow label="加入日期" value="2023年03月04日" locked/>
        {editing ? <><div className="profile-detail-row"><span>生日</span><input type="date" aria-label="生日" value={profile.birthday.replaceAll('.', '-')} onChange={event => setProfile(current => ({ ...current, birthday: event.target.value.replaceAll('-', '.') }))}/></div><div className="profile-detail-row school-row"><span>就讀學校</span><div className="school-fields"><div><select aria-label="縣市" value={city} onChange={(event) => { const nextCity = event.target.value; setCity(nextCity); setDistrict(districts[nextCity][0]); }}>{Object.keys(districts).map((name) => <option key={name}>{name}</option>)}</select><select aria-label="區域" value={district} onChange={(event) => setDistrict(event.target.value)}>{districts[city].map((name) => <option key={name}>{name}</option>)}</select></div><input aria-label="學校名稱" value={profile.school} onChange={event => setProfile(current => ({ ...current, school: event.target.value }))} placeholder="請輸入學校名稱"/></div></div><div className="profile-detail-row"><span>電子信箱</span><input type="email" aria-label="電子信箱" value={profile.email} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} placeholder="請輸入電子信箱"/></div><div className="profile-detail-row"><span>手機</span><input aria-label="手機" value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} placeholder="0912345678"/></div><div className="profile-detail-row"><span></span><button type="button" onClick={() => void saveProfile()}>保存資料</button></div></> : <><DetailRow label="生日" value={profile.birthday}/><div className="profile-detail-row school-row"><span>就讀學校</span><div className="school-fields"><div><div className="profile-value-box">{city} {district}</div></div><div className="profile-value-box">{profile.school}</div></div></div><DetailRow label="電子信箱" value={profile.email || '尚未填寫'} optional/><DetailRow label="手機" value={profile.phone || '尚未填寫'} optional/></>}
      </DetailCard>

      <DetailCard title="家長資料">
        <DetailRow label="家長姓名" value="王怡婷" boxed/>
        <DetailRow label="關係" value="母親" boxed/>
        <DetailRow label="手機" value="0912345678" placeholder/>
        <DetailRow label="電子信箱" value="wang***@example.com" boxed/>
        <DetailRow label="LINE 帳號" value="wang***" optional boxed/>
      </DetailCard>
    </div>
    {notice && <output className="profile-save-notice">{notice}</output>}

    <section className={`additional-parent-card${showParentForm?' open':''}`}>
      <div className="additional-parent-heading"><div><span><UserRound/></span><div><h2>另一位家長資料</h2><p>需要時可新增第二位家長的聯絡資料</p></div></div>{showParentForm?<button type="button" onClick={()=>setShowParentForm(false)}><X/>收合</button>:<button type="button" onClick={()=>setShowParentForm(true)}><Plus/>新增另一位家長</button>}</div>
      {showParentForm&&<div className="additional-parent-form">
        <label><span>家長姓名</span><input value={secondParent.name} onChange={event => setSecondParent(current => ({ ...current, name: event.target.value }))} placeholder="請輸入家長姓名"/></label>
        <label><span>關係</span><select value={secondParent.relation} onChange={event => setSecondParent(current => ({ ...current, relation: event.target.value }))}><option value="" disabled>請選擇</option><option>父親</option><option>母親</option><option>祖父</option><option>祖母</option><option>其他</option></select></label>
        <label><span>電話</span><input value={secondParent.phone} onChange={event => setSecondParent(current => ({ ...current, phone: event.target.value }))} placeholder="請輸入聯絡電話"/></label>
        <label><span>電子信箱</span><input type="email" value={secondParent.email} onChange={event => setSecondParent(current => ({ ...current, email: event.target.value }))} placeholder="name@example.com"/></label>
        <label className="parent-line-field"><span>LINE 帳號 <small>選填</small></span><input value={secondParent.line} onChange={event => setSecondParent(current => ({ ...current, line: event.target.value }))} placeholder="請輸入 LINE 帳號"/></label>
        <div className="additional-parent-actions"><button type="button" onClick={()=>setShowParentForm(false)}>取消</button><button type="button" onClick={() => void saveSecondParent()}>新增家長資料</button></div>
      </div>}
    </section>
  </div>;
}
