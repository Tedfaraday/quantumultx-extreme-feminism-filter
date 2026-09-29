/*
 * 微博極端女權言論關鍵詞屏蔽工具（Quantumult X）
 *
 * 作用范围：仅检查帖子标题、正文/简介和标签；不检查作者名、URL、互动数据。
 * 隐私说明：脚本完全在本机处理响应，不发起任何网络请求。
 *
 * 關鍵詞分成「核心詞組」和「短詞強過濾層」。來源、取捨與誤傷說明見
 * ../../docs/KEYWORD_SOURCES.md。
 */

(function () {
  "use strict";

  // 较明确的复合词、变体和完整表达。英文字母会按 ignoreCase 处理。
  /* @LEXICON@ */

  var CONFIG = {
    keywords: CORE_KEYWORDS,

    // 按你的要求默认启用短词；误过滤较多时只需改为 false。
    includeBroadKeywords: true,

    broadKeywords: BROAD_KEYWORDS,

    // 英文字母是否忽略大小写。
    ignoreCase: true,

    // 是否折叠换行和连续空格，避免正文换行影响匹配。
    collapseWhitespace: true,

    // 话题标签往往比正文更宽泛；如果误过滤较多，可以只把这一项改成 false。
    matchTags: true,

    // 检查微博所附页面卡片的展示标题，不读取链接本身。
    matchCardTitles: true,

    // 默认关闭；开启后只在 Quantumult X 日志中记录过滤数量，不记录帖子正文。
    debug: false
  };

  var STATUS_LIST_KEYS = ["statuses"];

  if (!hasStringResponseBody()) {
    $done({});
    return;
  }

  var originalBody = getOriginalBody();
  var outputBody = originalBody;

  try {
    var statusCode = readStatusCode();
    if (!originalBody) {
      throw new Error("响应正文为空，原样放行");
    }
    if (statusCode && (statusCode < 200 || statusCode >= 300)) {
      throw new Error("非成功响应，原样放行：" + statusCode);
    }

    var keywordSource = CONFIG.keywords.slice();
    if (CONFIG.includeBroadKeywords) {
      keywordSource = keywordSource.concat(CONFIG.broadKeywords);
    }
    var keywords = buildKeywords(keywordSource);
    if (!keywords.length) {
      throw new Error("关键词列表为空，原样放行");
    }

    var payload = JSON.parse(originalBody.replace(/^\uFEFF/, ""));
    if (hasKnownErrorPayload(payload)) {
      throw new Error("微博返回错误状态，原样放行");
    }
    var stats = filterKnownPayload(payload, keywords);

    if (stats.removed > 0) {
      outputBody = JSON.stringify(payload);
    }

    debugLog("完成：识别列表 " + stats.lists + " 个，过滤微博 " + stats.removed + " 篇");
  } catch (error) {
    // 任何解析或结构异常都返回原响应，避免影响微博正常加载。
    debugLog(error && error.message ? error.message : String(error));
  }

  $done({ body: outputBody });

  function getOriginalBody() {
    return $response.body;
  }

  function hasStringResponseBody() {
    return typeof $response !== "undefined" && typeof $response.body === "string";
  }

  function readStatusCode() {
    if (typeof $response === "undefined" || $response.statusCode === undefined) {
      return 0;
    }
    var match = String($response.statusCode).match(/\b(\d{3})\b/);
    return match ? Number(match[1]) : 0;
  }

  function isErrorPayload(payload) {
    if (!isObject(payload)) {
      return false;
    }
    if (payload.ok !== undefined && Number(payload.ok) !== 1) {
      return true;
    }
    var errorKeys = ["error_code", "errno"];
    for (var i = 0; i < errorKeys.length; i++) {
      var value = payload[errorKeys[i]];
      if (value !== undefined && value !== null && Number(value) !== 0) {
        return true;
      }
    }
    return false;
  }

  function hasKnownErrorPayload(payload) {
    if (isErrorPayload(payload)) {
      return true;
    }
    if (isObject(payload) && isObject(payload.data)) {
      if (isErrorPayload(payload.data)) {
        return true;
      }
      if (isObject(payload.data.data) && isErrorPayload(payload.data.data)) {
        return true;
      }
    }
    if (isObject(payload) && isObject(payload.channelInfo) && Array.isArray(payload.channelInfo.channels)) {
      for (var i = 0; i < payload.channelInfo.channels.length; i++) {
        var channel = payload.channelInfo.channels[i];
        if (isObject(channel) && isErrorPayload(channel.payload)) {
          return true;
        }
      }
    }
    return false;
  }

  function buildKeywords(source) {
    var output = [];
    if (!Array.isArray(source)) {
      return output;
    }

    for (var i = 0; i < source.length; i++) {
      var keyword = normalizeText(source[i]);
      if (keyword && output.indexOf(keyword) === -1) {
        output.push(keyword);
      }
    }
    return output;
  }

  function normalizeText(value) {
    var text = value === null || value === undefined ? "" : String(value);

    text = stripHtmlAndDecode(text);

    if (typeof text.normalize === "function") {
      try {
        text = text.normalize("NFKC");
      } catch (_) {
        // 旧版 JavaScriptCore 不支持 normalize 时继续使用原文本。
      }
    }

    text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (CONFIG.collapseWhitespace) {
      text = text.replace(/\s+/g, " ");
    }
    text = text.replace(/^\s+|\s+$/g, "");

    if (CONFIG.ignoreCase) {
      text = text.toLowerCase();
    }
    return text;
  }

  function stripHtmlAndDecode(text) {
    return String(text)
      .replace(/<a\b[^>]*>\s*@[^<]*<\/a>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&(nbsp|#160);/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/(&#39;|&apos;)/gi, "'")
      .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, decodeNumericEntity)
      .replace(/<[^>]*>/g, " ")
      .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>]+/gi, " ")
      .replace(/(^|[\s（(])\/\/[^\s<>]+/g, "$1")
      .replace(/\bwww\.[^\s<>]+/gi, " ")
      .replace(/@[^\s，。！？；：、,.!?;:()（）#<>]+/g, " ");
  }

  function decodeNumericEntity(match, hex, decimal) {
    var codePoint = parseInt(hex || decimal, hex ? 16 : 10);
    if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF) {
      return " ";
    }
    if (codePoint <= 0xFFFF) {
      return String.fromCharCode(codePoint);
    }
    codePoint -= 0x10000;
    return String.fromCharCode(0xD800 + (codePoint >> 10), 0xDC00 + (codePoint & 0x3FF));
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function createStats() {
    return { removed: 0, lists: 0 };
  }

  function mergeStats(target, source) {
    target.removed += source.removed;
    target.lists += source.lists;
  }

  function filterKnownPayload(root, keywords) {
    var stats = createStats();
    if (!isObject(root)) {
      return stats;
    }

    mergeStats(stats, filterKnownHolder(root, keywords, "root"));

    // 只检查微博公开规则中常见的 root.data 与 root.data.data 包装。
    // 不递归遍历任意对象，避免误扫作者资料、评论、私信或其他组件。
    if (isObject(root.data)) {
      mergeStats(stats, filterKnownHolder(root.data, keywords, "root.data"));
      if (isObject(root.data.data)) {
        mergeStats(stats, filterKnownHolder(root.data.data, keywords, "root.data.data"));
      }
    }

    // 搜索首页已知包装：channelInfo.channels[].payload.items。
    if (isObject(root.channelInfo) && Array.isArray(root.channelInfo.channels)) {
      for (var i = 0; i < root.channelInfo.channels.length; i++) {
        var channel = root.channelInfo.channels[i];
        if (isObject(channel) && isObject(channel.payload)) {
          mergeStats(stats, filterKnownHolder(channel.payload, keywords, "root.channelInfo.channels[" + i + "].payload"));
        }
      }
    }

    return stats;
  }

  function filterKnownHolder(holder, keywords, label) {
    var stats = createStats();
    if (!isObject(holder)) {
      return stats;
    }

    for (var i = 0; i < STATUS_LIST_KEYS.length; i++) {
      var statusKey = STATUS_LIST_KEYS[i];
      if (Array.isArray(holder[statusKey])) {
        mergeStats(stats, filterStatusList(holder, statusKey, keywords, label + "." + statusKey));
      }
    }

    if (Array.isArray(holder.items)) {
      mergeStats(stats, filterItemList(holder, "items", keywords, label + ".items", 0));
    }
    if (Array.isArray(holder.cards)) {
      mergeStats(stats, filterCardList(holder, "cards", keywords, label + ".cards", 0));
    }

    return stats;
  }

  function filterStatusList(holder, key, keywords, label) {
    var stats = createStats();
    var source = holder[key];
    var kept = [];
    stats.lists = 1;

    for (var i = 0; i < source.length; i++) {
      var status = source[i];
      if (looksLikeExplicitStatus(status) && matchesStatusKeyword(status, keywords)) {
        stats.removed += 1;
      } else {
        kept.push(status);
      }
    }

    if (stats.removed > 0) {
      holder[key] = kept;
      debugLog(label + "：过滤 " + stats.removed + "/" + source.length);
    }
    return stats;
  }

  function filterItemList(holder, key, keywords, label, depth) {
    var stats = createStats();
    var source = holder[key];
    var kept = [];
    stats.lists = 1;

    for (var i = 0; i < source.length; i++) {
      var item = source[i];
      var status = getStatusFromItem(item);

      if (status && matchesStatusKeyword(status, keywords)) {
        stats.removed += 1;
        continue;
      }

      if (isObject(item) && depth < 3) {
        if (Array.isArray(item.items)) {
          mergeStats(stats, filterItemList(item, "items", keywords, label + "[" + i + "].items", depth + 1));
        }
        if (Array.isArray(item.card_group)) {
          mergeStats(stats, filterCardList(item, "card_group", keywords, label + "[" + i + "].card_group", depth + 1));
        }
      }
      kept.push(item);
    }

    if (kept.length !== source.length) {
      holder[key] = kept;
      debugLog(label + "：过滤 " + (source.length - kept.length) + "/" + source.length);
    }
    return stats;
  }

  function filterCardList(holder, key, keywords, label, depth) {
    var stats = createStats();
    var source = holder[key];
    var kept = [];
    stats.lists = 1;

    for (var i = 0; i < source.length; i++) {
      var card = source[i];
      var status = getStatusFromCard(card);

      if (status && matchesStatusKeyword(status, keywords)) {
        stats.removed += 1;
        continue;
      }

      if (isObject(card) && depth < 3) {
        if (Array.isArray(card.card_group)) {
          mergeStats(stats, filterCardList(card, "card_group", keywords, label + "[" + i + "].card_group", depth + 1));
        }
        if (Array.isArray(card.items)) {
          mergeStats(stats, filterItemList(card, "items", keywords, label + "[" + i + "].items", depth + 1));
        }
      }
      kept.push(card);
    }

    if (kept.length !== source.length) {
      holder[key] = kept;
      debugLog(label + "：过滤 " + (source.length - kept.length) + "/" + source.length);
    }
    return stats;
  }

  function looksLikeStatus(status) {
    if (!isObject(status)) {
      return false;
    }

    var hasId = status.id !== undefined || status.idstr !== undefined || status.mid !== undefined ||
      status.mblogid !== undefined || status.bid !== undefined;
    var hasStatusMarker = status.idstr !== undefined || status.mid !== undefined || status.mblogid !== undefined ||
      status.created_at !== undefined || status.reposts_count !== undefined || status.comments_count !== undefined ||
      status.attitudes_count !== undefined || status.retweeted_status !== undefined;

    return hasId && hasStatusMarker && hasStatusText(status);
  }

  function hasStatusText(status) {
    return status.text !== undefined || status.text_raw !== undefined || status.textRaw !== undefined ||
      status.longText !== undefined || status.long_text !== undefined || status.longTextContent !== undefined ||
      status.title !== undefined || status.retweeted_status !== undefined;
  }

  function looksLikeExplicitStatus(status) {
    if (!isObject(status) || !hasStatusText(status)) {
      return false;
    }
    return status.id !== undefined || status.idstr !== undefined || status.mid !== undefined ||
      status.mblogid !== undefined || status.bid !== undefined;
  }

  function getStatusFromItem(item) {
    if (!isObject(item)) {
      return null;
    }

    var category = String(item.category || item.type || "").toLowerCase();
    if (!category) {
      if (looksLikeStatus(item.status)) {
        return item.status;
      }
      if (looksLikeStatus(item.data)) {
        return item.data;
      }
      if (isObject(item.data) && looksLikeExplicitStatus(item.data.mblog)) {
        return item.data.mblog;
      }
      if (isObject(item.data) && looksLikeExplicitStatus(item.data.status)) {
        return item.data.status;
      }
    }
    if (category !== "feed") {
      return null;
    }
    if (looksLikeExplicitStatus(item.status)) {
      return item.status;
    }
    if (!isObject(item.data)) {
      return null;
    }
    if (looksLikeExplicitStatus(item.data)) {
      return item.data;
    }
    if (looksLikeExplicitStatus(item.data.mblog)) {
      return item.data.mblog;
    }
    if (looksLikeExplicitStatus(item.data.status)) {
      return item.data.status;
    }
    return null;
  }

  function getStatusFromCard(card) {
    if (!isObject(card)) {
      return null;
    }
    var cardType = String(card.card_type === undefined ? "" : card.card_type);
    if ((cardType === "9" || cardType === "165") && looksLikeExplicitStatus(card.mblog)) {
      return card.mblog;
    }
    return getStatusFromItem(card);
  }

  function matchesStatusKeyword(status, keywords) {
    var texts = [];
    collectStatusText(status, texts, 0);

    for (var i = 0; i < texts.length; i++) {
      var normalized = normalizeText(texts[i]);
      if (!normalized) {
        continue;
      }
      for (var j = 0; j < keywords.length; j++) {
        if (normalized.indexOf(keywords[j]) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  function collectStatusText(status, output, retweetDepth) {
    if (!isObject(status) || retweetDepth > 2) {
      return;
    }

    collectTextValue(status.text_raw, output, 0);
    collectTextValue(status.textRaw, output, 0);
    collectTextValue(status.text, output, 0);
    collectTextValue(status.longTextContent, output, 0);
    collectLongText(status.longText, output);
    collectLongText(status.long_text, output);
    collectTextValue(status.title, output, 0);

    if (CONFIG.matchCardTitles && isObject(status.page_info)) {
      collectTextValue(status.page_info.page_title, output, 0);
      collectTextValue(status.page_info.pageTitle, output, 0);
    }

    if (CONFIG.matchTags) {
      collectTagValue(status.topic_struct, output, 0);
      collectTagValue(status.topicStruct, output, 0);
      collectTagValue(status.topics, output, 0);
    }

    if (isObject(status.retweeted_status)) {
      collectStatusText(status.retweeted_status, output, retweetDepth + 1);
    }
  }

  function collectLongText(value, output) {
    if (!isObject(value)) {
      collectTextValue(value, output, 0);
      return;
    }
    collectTextValue(value.longTextContent, output, 0);
    collectTextValue(value.content, output, 0);
    collectTextValue(value.text, output, 0);
  }

  function collectTextValue(value, output, depth) {
    if (depth > 3 || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      output.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        collectTextValue(value[i], output, depth + 1);
      }
      return;
    }
    if (isObject(value)) {
      var richTextKeys = ["text", "title", "content", "longTextContent"];
      for (var j = 0; j < richTextKeys.length; j++) {
        if (value[richTextKeys[j]] !== undefined) {
          collectTextValue(value[richTextKeys[j]], output, depth + 1);
        }
      }
    }
  }

  function collectTagValue(value, output, depth) {
    if (depth > 4 || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      output.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        collectTagValue(value[i], output, depth + 1);
      }
      return;
    }
    if (isObject(value)) {
      var tagKeys = ["topic_title", "topicTitle", "topic_name", "topicName", "title"];
      for (var j = 0; j < tagKeys.length; j++) {
        if (value[tagKeys[j]] !== undefined) {
          collectTagValue(value[tagKeys[j]], output, depth + 1);
        }
      }
    }
  }

  function debugLog(message) {
    if (!CONFIG.debug || typeof console === "undefined" || typeof console.log !== "function") {
      return;
    }
    console.log("[微博关键词过滤] " + message);
  }
})();
