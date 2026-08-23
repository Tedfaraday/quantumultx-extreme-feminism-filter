# Quantumult X 極端女權言論關鍵詞屏蔽工具 / Extreme Feminist Speech Keyword Filter

基於 Quantumult X 的極端女權言論關鍵詞屏蔽工具，用於減少中文網路資訊流中極端女權、性別仇恨、男性貶損及暴力／滅絕性表達對使用者的影響。工具只在本機檢查回應內明確存在的貼文標題、正文／簡介與標籤；命中已啟用關鍵詞時，只從該次回應中移除相應貼文。

A Quantumult X keyword filter designed to reduce exposure to extreme feminist speech, gender-based hostility, anti-male derogatory language, and violent or eliminationist expressions in Chinese-language content feeds. It examines only explicit text fields in responses—such as post titles, bodies/descriptions, and tags—and removes matching posts from that response locally.

> [!IMPORTANT]
> 關鍵詞命中不等於立場判斷。引用、批評、反駁、新聞轉述、諷刺或學術討論同樣可能命中，請預期存在誤傷。本專案不判斷作者身分或真實立場，不建立個人名單，也不檢查帳號、使用者名稱或互動資料。
>
> A keyword match is **not** a judgment of the author's position. Quotations, criticism, rebuttals, news reports, satire, and academic discussion may also be filtered.

## 支援狀態 / Support status

目前只有小紅書適配器可用；其餘平台僅保留未來適配位置，不含未驗證或無效規則。

Only the Xiaohongshu adapter is currently available. Other platforms are placeholders for future work and do not contain unverified or non-functional rules.

| 應用 / App | 狀態 / Status | 目前範圍 / Current scope |
|---|---|---|
| 小紅書 / Xiaohongshu | ✅ 已支援 / Supported | 首頁、搜尋頁與關注頁中的貼文標題、正文／簡介及標籤 / Post titles, bodies/descriptions, and tags in Home, Search, and Following feeds |
| 知乎 / Zhihu | ⏳ 預留 / Placeholder | 尚未發佈適配器 / No adapter published |
| 微博 / Weibo | ⏳ 預留 / Placeholder | 尚未發佈適配器 / No adapter published |
| 百度貼吧 / Baidu Tieba | ⏳ 預留 / Placeholder | 尚未發佈適配器 / No adapter published |
| 抖音 / Douyin | 🔬 技術預留 / Technical placeholder | 只在能取得穩定、可改寫的明文回應時考慮適配 / Considered only if stable, rewritable plaintext responses are available |

## 安裝與自動更新 / Installation and automatic updates

### 1. 加入遠端重寫資源 / Add the remote rewrite resource

在 Quantumult X 主設定檔的 `[rewrite_remote]` 區段加入以下一行：

Add this line to the `[rewrite_remote]` section of your Quantumult X configuration:

```conf
https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/QuantumultX/xhs-keyword-filter.conf, tag=小紅書極端女權言論關鍵詞屏蔽, update-interval=86400, opt-parser=false, enabled=true
```

遠端訂閱檔網址 / Remote subscription URL:

```text
https://raw.githubusercontent.com/Tedfaraday/quantumultx-extreme-feminism-filter/main/QuantumultX/xhs-keyword-filter.conf
```

`update-interval=86400` 表示 Quantumult X 約每 24 小時檢查一次更新。你也可以在 Quantumult X 的資源頁手動更新。

`update-interval=86400` asks Quantumult X to check for updates approximately every 24 hours. You can also refresh the resource manually.

### 2. 設定 MitM / Configure MitM

將以下網域合併到主設定檔既有的 `[mitm]` `hostname` 中；**不要覆蓋原有網域**：

Merge these domains into your existing `[mitm]` `hostname` list; **do not replace your existing entries**:

```conf
[mitm]
hostname = 原有網域, edith.xiaohongshu.com, rec.xiaohongshu.com, www.xiaohongshu.com, so.xiaohongshu.com
```

Quantumult X 的 MitM 憑證必須已產生、安裝並信任。本專案不包含、也不嘗試繞過 App 的憑證校驗、私有協定或應用層加密。

Your Quantumult X MitM certificate must be generated, installed, and trusted. This project does not include or attempt to bypass certificate validation, private protocols, or application-layer encryption.

### 3. 啟用並測試 / Enable and test

啟用 Quantumult X 的「重寫」與「MitM」，完全結束小紅書後重新開啟，再重新整理首頁、搜尋頁或關注頁。首次測試時，建議暫時停用其他會改寫相同小紅書介面的腳本，避免回應腳本互相覆蓋。

Enable Rewrite and MitM in Quantumult X, fully close and reopen Xiaohongshu, and refresh Home, Search, or Following. For the first test, temporarily disable other scripts that rewrite the same Xiaohongshu endpoints.

## 運作方式

小紅書目前公開可觀察到的資訊流回應通常是 JSON。重寫規則先攔截指定回應，腳本再逐一檢查可辨識為貼文的列表項：

1. 從標題、正文／簡介和標籤欄位提取文字；
2. 對文字和詞庫做基本規範化；
3. 以「包含」方式匹配已啟用關鍵詞；
4. 只移除命中的貼文列表項，保留分頁游標、`has_more` 等其他回應欄位；
5. 若 JSON 解析失敗、回應結構無法識別或 HTTP 狀態非 2xx，則原樣放行。

搜尋建議、直播卡片與其他非貼文元件不會只因文字命中而被刪除。這是本機顯示過濾：不會刪除伺服器內容、不會改變平台推薦模型，也不會阻止透過直接連結開啟貼文。

## 詞庫與誤傷

詞庫分為兩層：

- `CORE_KEYWORDS`：較明確的複合詞、變體和完整表達；
- `BROAD_KEYWORDS`：一至三字、誤傷風險較高的強過濾詞。

短詞強過濾層目前預設開啟。若正常內容被過濾太多，可在 [`Scripts/Xiaohongshu/xhs-keyword-filter.js`](Scripts/Xiaohongshu/xhs-keyword-filter.js) 的設定區將 `includeBroadKeywords` 改為 `false`；核心詞組仍會生效。標籤匹配也可透過 `matchTags` 開關停用。

匹配採用規範化後的字串包含判斷，而不是分詞、語意分類或立場辨識。因此：

- 同一詞出現在引用、反駁、批評、新聞轉述或學術討論中，也可能被過濾；
- 圖片中存在、但回應文字欄位中不存在的文字無法識別；
- 變形字、諧音、插入符號或平台欄位變更可能造成漏過；
- App 更新介面、改用二進位或加密回應後，可能需要重新適配。

詞庫來源、分層、排除項與審查方式詳見 [`docs/KEYWORD_SOURCES.md`](docs/KEYWORD_SOURCES.md)。不考慮誤傷的維護副本位於 [`docs/keywords-full-review.md`](docs/keywords-full-review.md) 與 [`docs/keywords-full-review.txt`](docs/keywords-full-review.txt)；它們用於追蹤網路詞彙演化，不代表所有條目都已在腳本中啟用。

## 詞彙來源 / Lexicon sources

本專案的詞彙候選來自下列公開 GitHub 儲存庫中的詞表、文章、截圖文字及公開 Issues；只整理可獨立成立的短詞與短語，不再發布來源文章、截圖、影音或個人資料：

- [`keyzf/Block-misuse-of-feminist-terminology`](https://github.com/keyzf/Block-misuse-of-feminist-terminology)
- [`ChinaFeminist/ChinaFeminist`](https://github.com/ChinaFeminist/ChinaFeminist)
- [`boxresskiller/boxressdata`](https://github.com/boxresskiller/boxressdata)
- [`person-without-name/AntiChinaFeminist`](https://github.com/person-without-name/AntiChinaFeminist)
- [`FemRun/FemRun`](https://github.com/FemRun/FemRun)，包括其公開 Issues

Quantumult X 的設定、重寫與遠端分發形式另參考 [`ddgksf2013/ddgksf2013`](https://github.com/ddgksf2013/ddgksf2013)；該倉庫列為技術參考，不列作本專案詞彙來源。

列出來源只表示相關字串曾在公開材料中出現，不代表來源作者認可本專案，也不代表本專案已取得來源文件的再發布授權。逐倉庫審查範圍與代表性定位見 [`docs/KEYWORD_SOURCES.md`](docs/KEYWORD_SOURCES.md)，完整來源索引與權利說明見 [`SOURCES.md`](SOURCES.md)。

## 隱私與資料處理 / Privacy and data handling

腳本在 Quantumult X 本機執行，**不會把貼文回應、命中關鍵詞、Cookie、Token、使用者資料或裝置資訊上傳到本專案或其他伺服器**。除 Quantumult X 取得規則與腳本更新外，本專案沒有遙測、統計或回傳端點。

The script runs locally in Quantumult X and **does not upload post responses, keyword matches, cookies, tokens, user data, or device information**. Apart from Quantumult X fetching rule/script updates, this project has no telemetry, analytics, or reporting endpoint.

若提交相容性問題，請勿上傳原始回應；先刪除 Cookie、Token、使用者 ID、貼文 ID、裝置資訊及圖片 URL，只提供必要的脫敏 JSON 結構與介面路徑。

When reporting compatibility issues, do not upload raw responses. Remove cookies, tokens, user IDs, post IDs, device information, and image URLs before sharing only the minimum redacted JSON structure and endpoint path required for debugging.

## 目錄

```text
QuantumultX/
  xhs-keyword-filter.conf          # Quantumult X 遠端重寫資源
Scripts/
  Xiaohongshu/
    xhs-keyword-filter.js          # 小紅書過濾邏輯與已啟用詞庫
docs/
  KEYWORD_SOURCES.md               # 詞庫來源、分層與排除說明
  keywords-full-review.md          # 全量維護副本（Markdown）
  keywords-full-review.txt         # 全量維護副本（純文字）
tests/
  test.js                          # 本機回歸測試
CHANGELOG.md
DATA_NOTICE.md
LICENSE-CODE
SOURCES.md
```

主要檔案：

- [`QuantumultX/xhs-keyword-filter.conf`](QuantumultX/xhs-keyword-filter.conf)：Quantumult X 重寫規則；
- [`Scripts/Xiaohongshu/xhs-keyword-filter.js`](Scripts/Xiaohongshu/xhs-keyword-filter.js)：過濾邏輯與關鍵詞設定；
- [`docs/KEYWORD_SOURCES.md`](docs/KEYWORD_SOURCES.md)：公開材料來源與取捨；
- [`DATA_NOTICE.md`](DATA_NOTICE.md)：資料與第三方材料聲明；
- [`SOURCES.md`](SOURCES.md)：參考來源索引；
- [`CHANGELOG.md`](CHANGELOG.md)：版本紀錄。

## 平台規劃

### 小紅書（已支援）

目前涵蓋首頁推薦流、搜尋帖子與關注頁中可識別的貼文列表。常見標題欄位包含 `note_card.display_title`；腳本亦相容 `noteCard.displayTitle`、`title`、`desc`、`tag_list[].name` 等常見別名。

### 知乎（預留）

計畫優先適配推薦資訊流、熱榜與回答列表，只匹配問題標題、回答摘要／正文及話題標籤。目前沒有已發佈規則或腳本。

### 微博（預留）

計畫優先適配首頁、分組與搜尋資訊流，只匹配微博正文、卡片標題及話題標籤。目前沒有已發佈規則或腳本。

### 百度貼吧（預留）

計畫先處理可穩定解析的 JSON 貼文列表，再評估二進位／Protobuf 介面。目前沒有已發佈適配器。

### 抖音（技術預留）

只有在目前版本存在無需繞過安全機制即可處理的穩定明文回應時，才會實作適配器。目前不提供規則、腳本或可用性承諾。

## 除錯

若要查看過濾數量，可在腳本頂部將 `debug` 改為 `true`，再查看 Quantumult X 日誌。除錯日誌只記錄列表類型與數量，不記錄貼文正文。

若完全沒有效果，依序檢查：

1. 遠端重寫資源是否已啟用並成功更新；
2. Quantumult X 的重寫與 MitM 是否開啟；
3. MitM 憑證是否已安裝並信任；
4. 所需小紅書網域是否已合併到 `hostname`；
5. 是否有其他腳本同時改寫相同介面；
6. Quantumult X 日誌是否顯示介面或回應格式已變更。

Quantumult X 對正文改寫可能存在回應大小限制；特別大的資訊流回應可能不會進入腳本。

## 授權與來源

本倉庫的原創程式碼授權見 [`LICENSE-CODE`](LICENSE-CODE)。公開材料只作詞彙樣本與技術參考；第三方內容、商標和各平台名稱仍屬其各自權利人。本專案不複製來源倉庫的文章、截圖、影音或個人資料，詳見 [`DATA_NOTICE.md`](DATA_NOTICE.md) 與 [`SOURCES.md`](SOURCES.md)。

本專案與 Quantumult X、小紅書、知乎、微博、百度貼吧或抖音官方均無隸屬或認可關係。

---

This project is independent and is not affiliated with or endorsed by Quantumult X, Xiaohongshu, Zhihu, Weibo, Baidu Tieba, or Douyin.
