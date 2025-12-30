
# 個人作品集（React + Vite）

簡介
- 這是一個純前端的個人作品集範本（React + Vite），包含：一頁式前台、模擬後台（密碼登入）、可編輯的三個區塊（關於我、作品集、聯絡我）、作品集相簿（多圖上傳、輪播）、聯絡表單與 EmailJS 寄信整合。
- 後台為模擬，資料儲存在瀏覽器的 `localStorage`（非後端儲存），適合部署到 GitHub Pages。

主要功能
- 一頁式 RWD（桌面：區塊背景滿版；手機：內容縮窄居中）
- 導覽列：`關於我`、`作品集`、`聯絡我`（桌面靠右、手機置中）
- 模擬後台：密碼 `yaipeiBB`，登入後可編輯三區塊內容（使用 Quill 富文字編輯器）
- 作品集：新增相簿、每個相簿可上傳多張圖片（轉 base64 存於 `localStorage`）、相簿可編輯標題/描述、刪除圖片或相簿、點相簿可開啟輪播預覽
- 聯絡表單：姓名 / Email / 訊息，透過 EmailJS（需自行註冊並填入 ID）寄信

重要檔案
- `src/App.jsx`：主要邏輯（前台、後台、相簿管理、編輯器、EmailJS 呼叫）
- `src/index.css` / `src/App.css`：樣式調整

本機開發
1. 安裝相依套件：

```bash
npm install
```

2. 啟動開發伺服器（Vite）：

```bash
npm run dev
```

3. 建置生產檔案：

```bash
npm run build
```

4. 本機預覽建置後內容：

```bash
npm run preview
# 或
npx serve dist
```

EmailJS（寄信）設定說明
1. 到 https://www.emailjs.com 註冊帳號。
2. 建立一個 Service（取得 `SERVICE_ID`）。
3. 建立 Template（取得 `TEMPLATE_ID`），在 Template 中加入對應變數（例如 `from_name`、`from_email`、`message`）。
4. 在 EmailJS 管理介面取得 `USER_ID` 或公開金鑰（Public Key）。
5. 在 `src/App.jsx` 中找到 `emailjs.send(...)`，將 `YOUR_SERVICE_ID` / `YOUR_TEMPLATE_ID` / `YOUR_USER_ID` 替換為你的值。

示範替換位置（`src/App.jsx`）:

```js
await emailjs.send(
	'YOUR_SERVICE_ID',
	'YOUR_TEMPLATE_ID',
	{ from_name: name, from_email: email, message: message },
	'YOUR_USER_ID'
)
```

部署到 GitHub Pages（簡易方式）
1. 安裝 `gh-pages`：

```bash
npm install --save-dev gh-pages
```

2. 在 `package.json` 新增 scripts（範例）：

```json
"scripts": {
	"build": "vite build",
	"predeploy": "npm run build",
	"deploy": "gh-pages -d dist"
}
```

3. 部署：

```bash
npm run deploy
```

備註：你也可以使用 GitHub Actions 自動部署（例如使用 `peaceiris/actions-gh-pages`）。

其他注意事項
- 圖片以 base64 儲存在 `localStorage` 會快速增加儲存空間，適合示範用途；若計畫長期使用，建議改為外部圖床或後端儲存。
- 若要重置示範內容，可在瀏覽器 DevTools 的 Application -> Local Storage 手動刪除 `yaipei_content` 與 `yaipei_albums`。
- 後台密碼 `yaipeiBB` 存於前端，若要上線正式服務請改用後端驗證與安全儲存。

需要我幫你：
- 自動把 `deploy` 腳本加入 `package.json`（我可以直接修改）
- 建立 GitHub Actions Workflow 做自動部署
- 將圖片上傳改為外部服務（需 API 與金鑰）

如果要我接著自動添加 `deploy` 腳本或建立 Actions，請回覆「幫我加 deploy」或「建立 Actions」。

