# Threads 專用隱藏字詞庫 / Threads native Hidden Words lexicon

用於減少含本專案極端女權言論相關關鍵詞的內容在 Threads 中出現。這是 **Threads 原生「隱藏字詞 / Hidden Words」的手動複製貼上詞庫**，不是 Quantumult X 重寫規則、JS 腳本、API 適配器或官方設定備份。無需為這份詞庫安裝 MitM 憑證、修改 App 或繞過憑證校驗。

> **內容與誤傷警告：**包含侮辱性、性別對立及暴力表達。詞庫命中不代表作者的身分、立場或行為；引用、反駁、新聞和普通語境也可能命中，尤其是強過濾短詞。請先審閱並自行取捨。

## 檔案與選擇

| 檔案 | 用途 |
|---|---|
| [copy-paste.md](copy-paste.md) | **建議入口**：核心及可選強過濾詞的分批複製框，附版本、數量與來源說明 |
| [core.txt](https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/Imports/Threads/core.txt) | 核心詞，英文逗號分隔；先選這組，仍可能誤傷 |
| [broad.txt](https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/Imports/Threads/broad.txt) | 可選短詞及強過濾詞，英文逗號分隔；誤傷較高 |
| [combined.txt](https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/Imports/Threads/combined.txt) | 核心＋強過濾，等於其他適配器目前的全部已啟用詞；**不是全量審閱候選** |

首次匯出（2026-09-29）為核心 207 詞、強過濾 68 詞，合計 275 詞。最新數量以自動生成的 [copy-paste.md](copy-paste.md) 和 [manifest](../../lexicon/manifest.json) 為準。首次匯出沒有將 1180 項全量候選混入導入版，也沒有新增或額外啟用詞語。核心與強過濾是兩組不重複詞，若已使用合併版，不要再重複匯入前兩組。

## 如何手動導入

1. 在 Threads 中開啟設定，尋找「隱私 / 隱藏字詞 / Hidden Words」中的自訂詞語、短語或自訂過濾器入口；名稱與位置可能隨 App 版本及語言改變。
2. 先選 [copy-paste.md](copy-paste.md) 的核心詞，只複製某一個 `text` 程式碼框內的內容，不要複製標題、反引號、說明或檔案 URL。
3. 若介面接受逗號分隔的多個字詞，貼上後儲存，**核對它是否拆成多個獨立詞項**，而非一個長短語。若未拆分，移除剛加入的錯誤詞項並改為逐詞新增；不要清空原有個人詞庫。
4. 如果介面要求選擇套用範圍或期限，依自己的需求設定，並確認自訂過濾器已開啟。儲存後核對詞項與設定。
5. 返回資訊流重新整理，觀察是否符合需求。需要更強過濾時才追加 `broad` 批次；不想使用的短詞可單獨移除。

每批最多 25 詞只是方便複製與核對，**不是官方最大數量、長度或容量限制**。整行 TXT 供接受批量新增的介面使用；若有輸入長度限制，使用更小批次或逐詞新增。這些檔案不是官方檔案匯入格式。

## 生效範圍與驗證狀態

[Mosseri 的官方公告](https://www.threads.com/@mosseri/post/C6MTUhbvTNy)說明 Hidden Words 已擴展到資訊流、搜尋、個人頁和貼文回覆。這是功能參考，**不是本詞庫的詞彙來源**；實際可用選項以你的帳號及 App 版本為準。

匹配由 Threads 原生功能決定，本專案不控制其中文分詞、大小寫、全半形、簡繁體或語境規則，也不保證與圈X的規範化後包含匹配完全一致。字面詞項保留主詞庫原樣，不自動繁簡轉換。圖片／影片裡的文字、未命中詞庫的表達，以及未受原生功能覆蓋的介面不作過濾承諾。

自動測試驗證詞項一致、分隔格式、批次完整、來源鏈接與檢查碼，**尚未在使用者當前 Threads App 版本真機驗證導入或過濾效果**。提供詞庫不等於宣稱 Threads 的 Quantumult X 適配器已可用；目前沒有 Threads CONF 或回應重寫腳本。

## 更新：倉庫自動生成，手機手動維護

所有導入檔案從 [lexicon/keywords.json](../../lexicon/keywords.json) 中 `enabled: true` 的核心／強過濾詞生成。不要手改 TXT 或 `copy-paste.md`；已審核的主詞庫變更會經現有 GitHub Actions 重新生成它們。

**GitHub 更新不會自動同步已加入 Threads 的字詞。**本專案未找到或實作 GitHub URL 訂閱能力。更新時比較已匯入清單與最新檔案，新增需要的詞，手動移除已不想使用的詞；不要盲目重貼全部或先刪除個人清單。從匯出檔移除某詞也不會自動撤銷手機上的既有設定。

## 詞彙來源與共享邊界

本導入版是現有共享詞庫的機械匯出，不是新抓取的 Threads 用語集。逐詞來源引用、分層、誤傷說明和審核狀態保留在 [keywords.json](../../lexicon/keywords.json)；未定位到逐詞原始出處的舊項仍明確標記歷史來源彙總待補，不猜測來源作者。

歷史來源索引包含 `keyzf/Block-misuse-of-feminist-terminology`、`ChinaFeminist/ChinaFeminist`、`boxresskiller/boxressdata`、`person-without-name/AntiChinaFeminist` 和 `FemRun/FemRun`（含公開 Issues）。這是整體索引，**不表示每個導入詞都來自所有上述倉庫**。詳見 [SOURCES.md](../../SOURCES.md)、[KEYWORD_SOURCES.md](../../docs/KEYWORD_SOURCES.md)、[DATA_NOTICE.md](../../DATA_NOTICE.md) 與 [詞庫共享條件](../../lexicon/LICENSE.md)。再分發請保留來源索引、資料聲明與誤傷說明。

本專案與 Meta、Threads 或 OpenAI 官方沒有隸屬、贊助或認可關係。

---

These files are comma-separated literal terms for **manual copy/paste into Threads' native Hidden Words**, not Quantumult X rules or an official import/backup format. Use core first; broad is optional and more prone to false positives. The combined file contains only currently enabled terms, not all review candidates. Batches of 25 are an editorial convenience, not an official limit. Verify that pasted terms become separate entries; otherwise add them individually. GitHub updates do not automatically synchronize your saved Threads settings. Native matching and current-device behavior are not verified. Provenance remains in the canonical JSON; retain the linked notices when sharing.
