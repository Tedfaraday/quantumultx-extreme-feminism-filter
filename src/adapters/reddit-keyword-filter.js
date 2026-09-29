/*
 * Reddit 資訊流關鍵詞屏蔽（Quantumult X）
 * 僅處理已核對的 GraphQL SDUI 貼文列表和明確可見的標題、預覽文字、貼文 flair。
 * 回應、Cookie 與 Token 均留在本機；不發起網路請求。
 */
(function () {
  "use strict";

  /* @LEXICON@ */

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
