# Supabase 接線與安全規則

## 建議架構

- GitHub：只放原始碼，不放 Supabase key、服務帳號或個資匯出檔。
- Vercel／Cloudflare Pages：部署 Next/Vite 前端。
- Supabase：Auth、Postgres、Storage 與 RLS；正式資料唯一來源。
- Google 試算表：只做報表、人工檢視與備份匯出，不直接當交易資料庫。

## 環境變數

在部署平台設定：

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-anon-key>
```

`service_role` key 只能放在伺服器端秘密環境變數，不能出現在 `NEXT_PUBLIC_*`、瀏覽器 bundle、GitHub 或 Google 試算表。

## 建立順序

1. 在 Supabase SQL editor 執行 `supabase/schema.sql`，再執行 `supabase/storage-policies.sql`。
2. 在 Authentication 建立 Email/Password 或 Magic Link 登入；禁止前端自行判定 admin 身分。
3. 使用 Auth user id 建立 `profiles`，角色由管理員在受保護的後台設定。
4. `supabase/storage-policies.sql` 會建立 `homepage-assets` 與 `gallery-assets` bucket；公開圖片只存檔案路徑，管理員寫入／刪除需透過 Storage policy。
5. 會員簽到、便當訂單、值星收支、球員資料、家長資料與提醒已在有正式 session 時使用 Supabase repository；沒有設定時才使用 localStorage 預覽。後台部分表格目前仍是介面／本機資料流程，正式上線前需依相同 RLS 原則接入管理 API。

## 權限原則

- 球員只能讀寫自己的簽到與便當訂單。
- 教練可管理訓練、出席、比賽與技術數據。
- 管理員可管理人員、首頁、值星、財務與報表。
- 值星送出後由資料庫狀態鎖定，前端唯讀不是安全邊界；API/RLS 必須同時拒絕修改。
- 聯絡留言可匿名新增，但只能由 admin 讀取。
- 訂餐／簽到提醒先寫入 `notifications`，再由受保護的 server job 發送 LINE 或 Email；不要讓瀏覽器直接持有 LINE token。
- 家長電話等敏感欄位不要提供給一般球員；輪值與便當名單使用 `player_directory` view，只提供 id、背號與姓名。
- 值星暫存會先刪除目前使用者在同一草稿的舊明細，再寫入最新明細，避免重複收支；刪除權限仍受 `duty_schedule_editable` 與 `created_by` 限制。
- Storage bucket 僅允許 JPEG、PNG、WebP，單檔上限 10MB；前端驗證不能取代 Storage policy，兩者都要保留。

## 上線前驗收

- 用球員、教練、管理員三個測試帳號分別驗證 RLS，不能只用管理員帳號測試。
- 檢查匿名使用者不能讀取 `profiles`、`attendance`、`meal_orders`、`duty_settlements`。
- 檢查停止訂購與值星確認後，直接呼叫 API 也不能更新資料。
- 啟用 Supabase 備份與登入事件稽核；Google 試算表匯出檔不得包含不必要的電話與密碼資訊。
