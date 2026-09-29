/*
 * 小紅書極端女權言論關鍵詞屏蔽工具（Quantumult X）
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

    // 标签往往比标题更宽泛；如果误过滤较多，可以只把这一项改成 false。
    matchTags: true,

    // 默认关闭；开启后只在 Quantumult X 日志中记录过滤数量，不记录帖子正文。
    debug: false
  };

  var TEXT_KEYS = {
    title: true,
    display_title: true,
    displayTitle: true,
    desc: true,
    description: true,
    content: true,
    note_text: true,
    noteText: true,
    note_desc: true,
    noteDesc: true,
    summary: true,
    caption: true,
    subtitle: true
  };

  var TAG_CONTAINER_KEYS = {
    tags: true,
    tag_list: true,
    tagList: true,
    hash_tag: true,
    hashTag: true,
    hash_tags: true,
    hashTags: true,
    hashtags: true,
    topic_list: true,
    topicList: true,
    topics: true,
    topic_info: true,
    topicInfo: true,
    tag_info: true,
    tagInfo: true
  };

  var NOTE_CONTAINER_KEYS = {
    note_card: true,
    noteCard: true,
    note: true,
    note_info: true,
    noteInfo: true
  };

  var LIST_KEYS = [
    "items",
    "notes",
    "feeds",
    "note_list",
    "recommend_items",
    "recommend_list"
  ];

  var NON_POST_MODELS = {
    rec_query: true,
    hot_query: true,
    query: true,
    live: true,
    live_v2: true,
    user: true,
    topic: true,
    banner: true,
    ad: true,
    ads: true
  };

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
    var targets = findPostLists(payload);
    var removedTotal = 0;

    for (var i = 0; i < targets.length; i++) {
      removedTotal += filterOneList(targets[i], keywords);
    }

    if (removedTotal > 0) {
      outputBody = JSON.stringify(payload);
    }

    debugLog("完成：识别列表 " + targets.length + " 个，过滤帖子 " + removedTotal + " 篇");
  } catch (error) {
    // 任何解析或结构异常都返回原响应，避免影响小红书正常加载。
    debugLog(error && error.message ? error.message : String(error));
  }

  $done({ body: outputBody });

  function getOriginalBody() {
    if (typeof $response === "undefined" || typeof $response.body !== "string") {
      return "";
    }
    return $response.body;
  }

  function readStatusCode() {
    if (typeof $response === "undefined" || $response.statusCode === undefined) {
      return 0;
    }
    var match = String($response.statusCode).match(/\b(\d{3})\b/);
    return match ? Number(match[1]) : 0;
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

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function addTarget(targets, holder, key, label) {
    if (!holder || !Array.isArray(holder[key])) {
      return;
    }

    for (var i = 0; i < targets.length; i++) {
      if (targets[i].holder === holder && targets[i].key === key) {
        return;
      }
    }

    targets.push({ holder: holder, key: key, label: label });
  }

  function addKnownLists(targets, holder, label) {
    if (!isObject(holder)) {
      return;
    }

    for (var i = 0; i < LIST_KEYS.length; i++) {
      addTarget(targets, holder, LIST_KEYS[i], label + "." + LIST_KEYS[i]);
    }
  }

  function inspectWrapperArray(targets, list, label) {
    if (!Array.isArray(list)) {
      return;
    }

    for (var i = 0; i < list.length; i++) {
      if (isObject(list[i])) {
        // 公开的详情/媒体响应只确认了包装对象内的 note_list。
        // 不递归扫描任意 items 数组，避免把图片、组件或互动列表当作帖子列表。
        addTarget(targets, list[i], "note_list", label + "[" + i + "].note_list");
        if (isObject(list[i].module)) {
          addTarget(targets, list[i].module, "note_list", label + "[" + i + "].module.note_list");
        }
      }
    }
  }

  function findPostLists(root) {
    var targets = [];
    if (!isObject(root)) {
      return targets;
    }

    addKnownLists(targets, root, "root");

    if (Array.isArray(root.data)) {
      addTarget(targets, root, "data", "root.data");
      inspectWrapperArray(targets, root.data, "root.data");
    } else if (isObject(root.data)) {
      addKnownLists(targets, root.data, "root.data");

      if (Array.isArray(root.data.data)) {
        addTarget(targets, root.data, "data", "root.data.data");
        inspectWrapperArray(targets, root.data.data, "root.data.data");
      } else if (isObject(root.data.data)) {
        addKnownLists(targets, root.data.data, "root.data.data");
      }
    }

    return targets;
  }

  function filterOneList(target, keywords) {
    var source = target.holder[target.key];
    var kept = [];
    var removed = 0;

    for (var i = 0; i < source.length; i++) {
      var item = source[i];
      if (looksLikePost(item) && matchesKeyword(item, keywords)) {
        removed += 1;
      } else {
        kept.push(item);
      }
    }

    if (removed > 0) {
      target.holder[target.key] = kept;
      debugLog(target.label + "：过滤 " + removed + "/" + source.length);
    }
    return removed;
  }

  function looksLikePost(item) {
    if (!isObject(item)) {
      return false;
    }

    var model = item.model_type || item.modelType || "";
    model = String(model).toLowerCase();
    if (model && NON_POST_MODELS[model]) {
      return false;
    }
    if (model === "note" || model === "normal") {
      return true;
    }

    if (isObject(item.note_card) || isObject(item.noteCard) || isObject(item.note) || isObject(item.note_info) || isObject(item.noteInfo)) {
      return true;
    }

    var hasId = item.note_id !== undefined || item.noteId !== undefined || item.id !== undefined;
    return hasId && hasKnownContentField(item);
  }

  function hasKnownContentField(item) {
    var keys = Object.keys(item);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (TEXT_KEYS[key] || TAG_CONTAINER_KEYS[key] || NOTE_CONTAINER_KEYS[key]) {
        return true;
      }
    }
    return false;
  }

  function matchesKeyword(item, keywords) {
    var texts = [];
    collectNoteText(item, texts, [], 0);

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

  function collectNoteText(node, output, seen, depth) {
    if (!isObject(node) || depth > 5 || seen.indexOf(node) !== -1) {
      return;
    }
    seen.push(node);

    var keys = Object.keys(node);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = node[key];

      if (TEXT_KEYS[key]) {
        collectTextValue(value, output, 0);
      } else if (CONFIG.matchTags && TAG_CONTAINER_KEYS[key]) {
        collectTagValue(value, output, 0);
      } else if (NOTE_CONTAINER_KEYS[key] && isObject(value)) {
        collectNoteText(value, output, seen, depth + 1);
      }
    }
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
      var richTextKeys = ["text", "title", "content", "desc", "description"];
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
      var tagKeys = ["name", "text", "title", "tag_name", "topic_name", "keyword"];
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
    var url = typeof $request !== "undefined" && $request.url ? $request.url : "unknown-url";
    console.log("[XHS关键词过滤] " + message + " | " + url);
  }
})();
