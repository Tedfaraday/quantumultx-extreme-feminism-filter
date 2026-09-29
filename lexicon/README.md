# 共享詞庫 / Shared lexicon

**內容警告：**資料包含侮辱性、性別對立和暴力表達。僅供自選本機內容過濾與詞彙整理；命中不等於極端立場判斷，不得把清單變成人員名單或事實指控。

| 檔案 | 用途 |
|---|---|
| [`keywords.json`](keywords.json) | 唯一可編輯詞庫；含詞項、分層、來源定位、誤傷說明及審核狀態 |
| [`core.txt`](core.txt) | 已啟用核心詞，一行一詞 |
| [`broad.txt`](broad.txt) | 已啟用強過濾詞，一行一詞；誤傷較高 |
| [`review-all.txt`](review-all.txt) | 全量審閱候選，保留大小寫變體；不是預設啟用清單 |
| [`manifest.json`](manifest.json) | 詞庫版本、數量與 SHA-256 檢查碼 |
| [`../Imports/Threads/`](../Imports/Threads/README.md) | Threads 原生 Hidden Words 手動導入版：逗號分隔核心／強過濾／合併詞庫及分批複製頁；非圈X規則 |
| [`legacy-baseline.json`](legacy-baseline.json) | v0.3.0 的 275 個啟用詞遷移憑據，唯讀，不是維護入口 |

TXT 是 UTF-8 純文字，每行一詞，沒有標題或註解。它們不是 Quantumult X 的域名分流清單，不能直接放入 `[filter_remote]`；其他工具需自行實作文字包含匹配。圈X使用者仍訂閱平台 CONF。

原始下載網址以 `https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/lexicon/` 開頭，例如 [`core.txt`](https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/lexicon/core.txt)。固定快照請將 `main` 換成已存在、包含本詞庫目錄的 Release tag；v0.3.0 尚無此目錄。

## JSON 規格（schema_version 1）

- 頂層 `version` 是詞庫版本，`updated_on` 是更新日期；`sources` 定義來源索引，`entries` 列出詞項。
- 詞項 `id` 是穩定識別碼，不要因排序而重編；`term` 是字面匹配字串，無換行或零寬字元。
- `tier` 為 `core`、`broad` 或 `review`；`enabled` 明確決定是否進入腳本。`review` 不得啟用。
- `review_status` 為 `candidate`（待審核、不得啟用）、`approved`（維護者已審核）或 `legacy-preserved`（保留舊版行為，非重新審核）。
- `source_refs` 連到 `sources[].id`。`documented` 是已定位的公開來源；`legacy-catalog` 只代表歷史彙總索引，不是逐詞原始出處。
- `added_on` 記錄收錄日期，`risk_note` 說明引用、普通語境或短詞誤傷。

啟用詞會按 NFKC、忽略大小寫、去零寬字元及折疊空白檢查重複。未啟用的全量審閱項保留不同大小寫、拼寫；本次遷移沒有新增或啟用詞語。

## 來源誠實性與遷移

v0.3.0 的來源文檔只對部分詞提供直接定位。此次只沿用文檔明確列出的定位；其餘標成歷史彙總、逐詞出處待補，沒有猜測它們來自哪個倉庫或作者。連結可能失效，來源資料未於本次重新核驗。

`legacy-preserved` 只准用於 `legacy-baseline.json` 中 id、詞語與分層均一致的舊項。新項目不得借用此例外；新的 `approved` 詞必須有 `documented` 來源。工具只驗證欄位格式與一致性，不證明來源真實、用法屬實或審核已由真人完成，這些仍需維護者確認。

## 維護與生成

使用 Node.js 22，不需要第三方套件，在倉庫根目錄執行：

```text
node tools/build.js --validate
node tools/build.js
node tools/test.js
node tools/build.js --check
```

詞庫只改 `keywords.json`；平台處理邏輯改 `src/adapters/`，介面規則改 `src/QuantumultX/`。`Scripts/`、`QuantumultX/`、三份共享 TXT、Threads 的三份導入 TXT／`copy-paste.md` 與 manifest 都是生成檔，手改會在下次生成時被覆蓋。`tools/migrate-legacy.js` 是一次性遷移工具，已有詞庫時拒絕執行，不是日常更新入口。

Threads 匯出只選已啟用詞，不包含全量審閱候選。英文逗號分隔供手動複製貼上；分批大小不是官方限制。新詞若含逗號、分號或程式碼框符號，建置會拒絕，避免錯拆成多詞。倉庫可自動重新生成，但手機上的 Threads 設定不會自動同步。

GitHub Actions 在 PR 中只生成與測試，不會啟用或合併提案。在已審核變更進入 `main` 後，工作流程重新生成、測試並提交變動的生成檔；無變動不會提交。若倉庫政策禁止 bot 寫入 `main`，維護者可本機生成後提交，無需放寬帳號或分支安全設定。

圈X腳本內嵌生成的詞庫，不會在每次處理帖子時取遠端詞庫，也沒有資料回傳。滾動 CONF 的腳本網址包含內容檢查碼，詞庫或適配器變動時網址一起變更；手機仍需成功完成資源／腳本下載，尚未真機驗證所有版本的快取更新行為。

貢獻流程見 [`../CONTRIBUTING.md`](../CONTRIBUTING.md)，共享權利邊界見 [`LICENSE.md`](LICENSE.md) 和 [`../DATA_NOTICE.md`](../DATA_NOTICE.md)。
