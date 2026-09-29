# 詞庫與適配器貢獻

本專案只維護自選本機內容過濾詞，不建立人員名單，也不依詞語判定作者立場、身份或行為。公開來源只能作字串定位，不證明內容屬實或由某群體首創。

## 提議新詞

1. 先搜尋 `lexicon/keywords.json`，檢查是否已存在或只是大小寫／全形變體。
2. 使用「詞彙新增／調整提案」Issue，提供詞語、直接公開來源、用法、建議分層與誤傷風險。
3. 不上傳原始截圖、來源全文、私人聊天、未脫敏回應、個人姓名、帳號、位置、Cookie 或 Token。
4. 維護者核對來源與權利邊界後，決定收錄為候選、啟用、拒絕或要求補證。Issue 不會被程式自動導入。

## 提交 PR

詞庫只改 `lexicon/keywords.json`。新增詞先用 `review_status: "candidate"`、`enabled: false`、`tier: "review"`，給新穩定 id、日期、誤傷說明，並在 `sources` 中加入直接出處、`kind: "documented"` 與簡短定位說明。不要把倉庫首頁或彙總表冒充逐詞原始出處。

維護者審核後才可改為 `approved`，決定 `core` 或 `broad` 及是否啟用。`legacy-preserved` 僅供原有 275 詞的遷移例外，不能用來省略新詞來源；`legacy-baseline.json` 是唯讀憑據，不隨新詞擴充。

不要手改生成的 TXT、`Scripts/`、`QuantumultX/` 或 manifest。PR CI 會以詞庫重新生成並做測試；合併到 `main` 後 bot 才提交生成檔。若希望先本機驗證，執行 `node tools/build.js` 和 `node tools/test.js`。自動檢查只保證格式及行為一致，不替代真人來源審核。

平台邏輯改 `src/adapters/`，介面規則改 `src/QuantumultX/`；新增平台應附脫敏人工樣本和原樣放行測試，不擴大到作者、帳號、互動或身份資料。

## 共享、版本與回退

- 共享使用 `lexicon/core.txt`／`broad.txt`；全量整理用 `review-all.txt`。TXT 是字串清單，不是域名規則。
- 更新 `version` 和 `updated_on`，在 CHANGELOG 記錄來源、分層或啟用狀態變動。原有普通語境和誤傷說明不要省略。
- `main/QuantumultX/*.conf` 是滾動入口；`QuantumultX/pinned/v0.3.0/*.conf` 的腳本指向已發布 tag，不跟隨詞庫改動。不要同時啟用同平台的兩種入口。
- 發布新固定版本時，先核對 Release tag 的真實存在及內容，再新增對應 pinned 目錄；不得重寫舊 tag 或宣稱未發布的 tag 已可訂閱。
- 保留 `lexicon/LICENSE.md`、`DATA_NOTICE.md` 和來源索引；不能藉本專案許可取得第三方材料權利。

來源錯誤、個人資料誤收或權利問題，請使用現有「詞彙來源糾錯／刪除請求」模板，只提交定位所需最少資料。
