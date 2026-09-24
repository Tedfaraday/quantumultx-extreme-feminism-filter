/*
 * Reddit 資訊流關鍵詞屏蔽（Quantumult X）
 * 僅處理已核對的 GraphQL SDUI 貼文列表和明確可見的標題、預覽文字、貼文 flair。
 * 回應、Cookie 與 Token 均留在本機；不發起網路請求。
 */
(function () {
  "use strict";

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
    includeBroadKeywords: true,
    broadKeywords: BROAD_KEYWORDS,
    ignoreCase: true,
    collapseWhitespace: true,
    matchTags: true,
    debug: false
  };

  var FEED_ROOTS = {
    HomeFeedSdui: "homeV3",
    SubredditFeedSdui: "subredditV3",
    PopularFeedSdui: "popularV3",
    NewsFeedSdui: "newsV3"
  };

  if (typeof $response === "undefined" || typeof $response.body !== "string") {
    $done({});
    return;
  }

  var originalBody = $response.body;
  var outputBody = originalBody;

  try {
    var url = typeof $request !== "undefined" ? String($request.url || "") : "";
    if (!/^https:\/\/gql-fed\.reddit\.com\/(?:\?[^#]*)?$/.test(url)) {
      throw new Error("非已核對的 Reddit GraphQL 端點");
    }

    var statusCode = readStatusCode($response.statusCode);
    if (!originalBody || (statusCode && (statusCode < 200 || statusCode >= 300))) {
      throw new Error("無可用的成功回應正文");
    }

    var operationName = readHeader($request.headers, "X-Apollo-Operation-Name");
    if (!Object.prototype.hasOwnProperty.call(FEED_ROOTS, operationName)) {
      throw new Error("非已核對的貼文資訊流操作");
    }

    var keywords = buildKeywords(CONFIG.keywords.concat(
      CONFIG.includeBroadKeywords ? CONFIG.broadKeywords : []
    ));
    if (!keywords.length) {
      throw new Error("空詞庫");
    }

    var payload = JSON.parse(originalBody.replace(/^\uFEFF/, ""));
    if (!isObject(payload) || !isObject(payload.data) || payload.errors) {
      throw new Error("GraphQL 回應出錯或結構未知");
    }

    var feed = payload.data[FEED_ROOTS[operationName]];
    var elements = isObject(feed) && feed.elements;
    if (!isObject(elements) || !Array.isArray(elements.edges)) {
      throw new Error("未找到已核對的貼文列表");
    }

    var originalLength = elements.edges.length;
    var kept = elements.edges.filter(function (edge) {
      return !isMatchedPostEdge(edge, keywords);
    });
    var removed = originalLength - kept.length;

    if (removed > 0) {
      elements.edges = kept;
      outputBody = JSON.stringify(payload);
    }
    debugLog(operationName + "：移除 " + removed + " 篇貼文");
  } catch (error) {
    debugLog(error && error.message ? error.message : String(error));
  }

  $done({ body: outputBody });

  function readStatusCode(value) {
    var match = String(value === undefined ? "" : value).match(/\b(\d{3})\b/);
    return match ? Number(match[1]) : 0;
  }

  function readHeader(headers, name) {
    if (!isObject(headers)) return "";
    var wanted = name.toLowerCase();
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === wanted) {
        return String(headers[keys[i]] || "");
      }
    }
    return "";
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function buildKeywords(source) {
    var output = [];
    for (var i = 0; i < source.length; i++) {
      var word = normalizeText(source[i]);
      if (word && output.indexOf(word) === -1) output.push(word);
    }
    return output;
  }

  function normalizeText(value) {
    if (typeof value !== "string") return "";
    var text = value
      .replace(/https?:\/\/[^\s<>"']+/gi, " ")
      .replace(/\bwww\.[^\s<>"']+/gi, " ")
      .replace(/(?:^|[\s(])(?:u|r)\/[A-Za-z0-9_-]+/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
        return String.fromCharCode(parseInt(hex, 16));
      })
      .replace(/&#([0-9]+);/g, function (_, dec) {
        return String.fromCharCode(parseInt(dec, 10));
      });
    if (typeof text.normalize === "function") {
      try { text = text.normalize("NFKC"); } catch (_) {}
    }
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (CONFIG.collapseWhitespace) text = text.replace(/\s+/g, " ");
    text = text.replace(/^\s+|\s+$/g, "");
    return CONFIG.ignoreCase ? text.toLowerCase() : text;
  }

  function containsKeyword(value, keywords) {
    var text = normalizeText(value);
    if (!text) return false;
    for (var i = 0; i < keywords.length; i++) {
      if (text.indexOf(keywords[i]) !== -1) return true;
    }
    return false;
  }

  function isMatchedPostEdge(edge, keywords) {
    if (!isObject(edge) ||
        (edge.__typename && edge.__typename !== "FeedElementEdge")) return false;
    var node = edge.node;
    if (!isObject(node) || node.__typename !== "CellGroup" ||
        !/^t3_[a-z0-9]+$/i.test(String(node.groupId || "")) ||
        !Array.isArray(node.cells) || node.adPayload) return false;

    for (var i = 0; i < node.cells.length; i++) {
      if (matchesCell(node.cells[i], keywords)) return true;
    }
    return false;
  }

  function matchesCell(cell, keywords) {
    if (!isObject(cell)) return false;
    var type = cell.__typename;
    if (type === "TitleCell") {
      return containsKeyword(cell.title, keywords);
    }
    if (type === "PreviewTextCell") {
      return containsKeyword(cell.text, keywords);
    }
    if (type === "FlairCell") {
      return CONFIG.matchTags && matchesFlair(cell.flair, keywords);
    }
    if (type === "ClassicCell") {
      return matchesTitle(cell.titleCell, keywords) ||
        matchesPreview(cell.previewTextCell, keywords) ||
        (CONFIG.matchTags && matchesFlairCell(cell.flairCell, keywords));
    }
    if (type === "TitleWithThumbnailCell") {
      return matchesTitle(cell.titleCell, keywords) ||
        matchesPreview(cell.previewTextCell, keywords);
    }
    if (type === "TitleWithThumbnailCollapsedCell" ||
        type === "FullViewVideoCell" || type === "ConversationCell") {
      return matchesTitle(cell.titleCell, keywords);
    }
    if (type === "PinnedPostTitleCell" ||
        type === "PinnedPostTitleWithThumbnailCell") {
      return isObject(cell.post) && containsKeyword(cell.post.title, keywords);
    }
    return false;
  }

  function matchesTitle(cell, keywords) {
    return isObject(cell) && cell.__typename === "TitleCell" &&
      containsKeyword(cell.title, keywords);
  }

  function matchesPreview(cell, keywords) {
    return isObject(cell) && cell.__typename === "PreviewTextCell" &&
      containsKeyword(cell.text, keywords);
  }

  function matchesFlairCell(cell, keywords) {
    return isObject(cell) && cell.__typename === "FlairCell" &&
      matchesFlair(cell.flair, keywords);
  }

  function matchesFlair(flair, keywords) {
    return isObject(flair) && containsKeyword(flair.text, keywords);
  }

  function debugLog(message) {
    if (CONFIG.debug && typeof console !== "undefined" && console.log) {
      console.log("[Reddit keyword filter] " + message);
    }
  }
})();
