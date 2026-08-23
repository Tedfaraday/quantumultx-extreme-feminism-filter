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
  var CORE_KEYWORDS = [
    "6b4t",
    "10bt",
    "100bt",
    "1000bt",
    "womad",
    "megalian",
    "婚驴",
    "胎器",
    "国蝻",
    "蝈蝻",
    "蜾蝻",
    "蝻人",
    "仨蝻",
    "女权蝻",
    "蝈蝻之光",
    "恶臭国蝻",
    "小吊子",
    "小屌子",
    "蝻宝妈",
    "男宝妈",
    "精神蝻",
    "媚蝻",
    "平权仙",
    "平权仙子",
    "带屌跨性者",
    "女权教条",
    "女权籍",
    "女性专用价值观",
    "化粪池警告",
    "刻烟吸肺",
    "既视利益",
    "即视利益",
    "po尿",
    "po墨",
    "卖yin",
    "奴 li",
    "piao客",
    "si全家",
    "不沾吊",
    "远离男人不沾吊",
    "堕男胎",
    "不婚不育保平安",
    "三争三反",
    "争女性武力",
    "反子宫绑架",
    "独自高贵派",
    "脱腐脱宅",
    "向下自由",
    "训夫模范",
    "父权洗脑",
    "y病毒",
    "性缘分离",
    "不沾男",
    "女本位",
    "精神女人",
    "行走子宫",
    "开除女籍",
    "原谅宝",
    "扶贫怪",
    "女拳师",
    "拳媛",
    "女权媛",
    "男蛆",
    "蝻窝",
    "下头男",
    "爱屌女",
    "拜吊小作家",
    "女权妈",
    "女权b",
    "mansplaining",
    "radfem",
    "国蝻集体灭绝",
    "蝈蝻集体灭绝",
    "杀光99%蝻人",
    "中国男人就是该灭绝",
    "男人都该死绝",
    "不杀一批男人",
    "杀光中国男人",
    "杀个两亿中国男人",
    "杀光所有男人",
    "想杀男人",
    "只杀男",
    "男的垃圾",
    "男人垃圾",
    "男性之恶",
    "低等生物",
    "劣等生物",
    "地球之癌",
    "骟死他们",
    "男宝与男宝妈在天堂",
    "大郎雌激素",
    "-÷",
    "♂÷",
    "滑蝻",
    "支家哥",
    "小茶壶",
    "易碎是茶壶的天性",
    "女男关系",
    "劣等y染",
    "吊子",
    "一拳打死蝻宝",
    "小仙男",
    "骟蝻",
    "纯血激女",
    "y染屠杀",
    "劣精灭绝",
    "鉴鸡蝻",
    "支蝻",
    "劣等滑蝻",
    "吊国男宝",
    "活体蝻样本",
    "以死爆金币",
    "撕蛋剪吊暴死",
    "蝻本位",
    "男权教条主义",
    "吊缘关系",
    "男税",
    "男役",
    "女性天然主宰",
    "雌性主宰",
    "爱蝻失职",
    "双标精分蝻",
    "男本位伪女权",
    "女性润学",
    "润学女性",
    "雌润女",
    "等驴",
    "粉红驴",
    "女强驴",
    "织驴",
    "驴里驴气",
    "茶壶嘴",
    "y基因bug",
    "蝻原罪",
    "男宝潜力股",
    "沾蝻女性",
    "驴人",
    "托举蝻宝",
    "织男孽种",
    "天道图支",
    "女人天性屠y",
    "男本位寄生虫",
    "y染优越",
    "劣精全活",
    "男本位牌坊",
    "穷丑男宝",
    "妻母非母",
    "亲亲老蚣",
    "织蝻锁死",
    "老蝻人",
    "劣米青",
    "蜘蛛小黄人",
    "脚刹y染",
    "跪舔小屌",
    "润学婧髓",
    "脂蝻",
    "蜘蝻",
    "织蝻",
    "劣雄",
    "脚刹滑蝻",
    "图尽v染",
    "不踩死男人的女权",
    "蝻人最佳归宿",
    "男性最佳归宿",
    "接老公车祸",
    "接男友暴毙",
    "男本位谎言",
    "润学信条",
    "润学娇妻",
    "雄配子载体",
    "啃女利蝻",
    "娇妻英雌",
    "利男辱女",
    "织家种",
    "驴脑",
    "恋丑织",
    "雄堕驴",
    "琐男",
    "锁男",
    "让多数雄性去死",
    "吃掉雄性",
    "踩在雄性头顶",
    "女性是本体",
    "原始女利",
    "拳老师",
    "拳太祖",
    "拳大帝",
    "拳魔",
    "拳神",
    "撕蛋剪吊",
    "剪吊暴死",
    "屠y染",
    "撕烂你的蛋",
    "一剪子帮您噶掉",
    "剪下鸡儿",
    "打死对应的男性",
    "把女婿打死",
    "neng死他",
    "随便下点药给他送走",
    "男性耗材",
    "耗材的耗材",
    "男屁民",
    "真下头",
    "男疾男户",
    "大螂喝药",
    "小线头",
    "骟男"
  ];

  // 一至三字的强过滤词。它们误伤率更高，因此单独提供开关。
  // 不加入“男、女、拳、权、驴、吊”等会大面积命中普通内容的单字。
  var BROAD_KEYWORDS = [
    "蝻",
    "蛆",
    "骟",
    "屌",
    "婚女",
    "男宝",
    "女爹",
    "娇妻",
    "仙子",
    "普信男",
    "白瘦幼",
    "理中客",
    "媚男",
    "男凝",
    "厌男",
    "厌女",
    "仇女",
    "恐男",
    "雌竞",
    "反婚",
    "反育",
    "反孝",
    "脱腐",
    "脱宅",
    "父权",
    "男权",
    "女拳",
    "男拳",
    "打拳",
    "拳师",
    "爹味",
    "男德",
    "女德",
    "婵婵",
    "鉴权",
    "基女",
    "激女",
    "女利",
    "莮",
    "阉",
    "支男",
    "织男",
    "英雌",
    "大爹",
    "雄堕",
    "劣精",
    "男本位",
    "y染",
    "v染",
    "利蝻",
    "拜吊",
    "爱蝻",
    "婚人",
    "雄竞",
    "雄竟",
    "母父",
    "女伥",
    "润女",
    "滑男",
    "碰雌",
    "屠y",
    "性缘至上",
    "牌坊精",
    "老吊子",
    "性缘脑",
    "性缘女",
    "利男",
    "雌性智慧"
  ];

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
