"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptPath = path.resolve(
  __dirname,
  "../Scripts/Weibo/weibo-keyword-filter.js"
);
const script = fs.readFileSync(scriptPath, "utf8");
const xhsScript = fs.readFileSync(
  path.resolve(__dirname, "../Scripts/Xiaohongshu/xhs-keyword-filter.js"),
  "utf8"
);
const conf = fs.readFileSync(
  path.resolve(__dirname, "../QuantumultX/weibo-keyword-filter.conf"),
  "utf8"
);

function run(rawBody, url, statusCode, sourceScript) {
  let doneResult;
  const logs = [];
  const context = {
    $response: {
      body: rawBody,
      statusCode: statusCode === undefined ? 200 : statusCode
    },
    $request: { url },
    $done(result) {
      assert.strictEqual(doneResult, undefined, "$done 只能调用一次");
      doneResult = result;
    },
    console: { log(message) { logs.push(message); } }
  };

  vm.runInNewContext(sourceScript || script, context, {
    filename: "weibo-keyword-filter.js"
  });
  assert(doneResult && typeof doneResult.body === "string", "脚本必须返回字符串 body");
  return { body: doneResult.body, logs };
}

function runJson(payload, url, sourceScript) {
  const result = run(JSON.stringify(payload), url, 200, sourceScript);
  return JSON.parse(result.body);
}

function runWithoutStringBody(bodyValue) {
  let doneResult;
  const response = { statusCode: 200 };
  if (bodyValue !== undefined) {
    response.body = bodyValue;
  }
  vm.runInNewContext(script, {
    $response: response,
    $request: { url: "https://api.weibo.cn/2/statuses/friends/timeline" },
    $done(result) {
      assert.strictEqual(doneResult, undefined, "$done 只能调用一次");
      doneResult = result;
    },
    console: { log() {} }
  });
  assert(doneResult && Object.keys(doneResult).length === 0, "无字符串正文时必须用 $done({}) 原样放行");
}

const timelineUrl = "https://api.weibo.cn/2/statuses/friends/timeline?page=1";

// 1. statuses：过滤可见正文与转发正文，保留分页、作者名、纯 URL 和 @账号。
const timeline = runJson(
  {
    ok: 1,
    max_id: "max-1",
    since_id: "since-1",
    total_number: 12,
    statuses: [
      { id: "1", idstr: "1", text_raw: "普通内容" },
      { id: "2", idstr: "2", text: "正文包含<b>支家哥</b>" },
      {
        id: "3",
        idstr: "3",
        text_raw: "正常正文",
        user: { screen_name: "国蝻", description: "6B4T" }
      },
      { id: "4", idstr: "4", text_raw: "链接 https://example.test/6b4t" },
      {
        id: "5",
        idstr: "5",
        text: "联系 <a href=\"/n/国蝻\">@国蝻</a> 讨论天气"
      },
      {
        id: "6",
        idstr: "6",
        text_raw: "转发",
        retweeted_status: { id: "60", idstr: "60", text_raw: "原文包含拳媛" }
      },
      { id: "7", idstr: "7", text_raw: "河童软糯剪刀脱脂小黄人" },
      { id: "8", idstr: "8", text_raw: "//@国蝻：转发普通天气内容" },
      { id: "9", idstr: "9", text_raw: "感谢@💩国蝻 今天分享天气" },
      { id: "10", idstr: "10", text_raw: "打开 sinaweibo://detail/6b4t 查看" },
      { id: "11", idstr: "11", text_raw: "备用 //example.test/6b4t 地址" },
      { id: "12", idstr: "12", text_raw: "网址 www.example.test/6b4t" }
    ]
  },
  timelineUrl
);
assert.deepStrictEqual(Array.from(timeline.statuses, item => item.id), ["1", "3", "4", "5", "7", "8", "9", "10", "11", "12"]);
assert.strictEqual(timeline.max_id, "max-1");
assert.strictEqual(timeline.since_id, "since-1");
assert.strictEqual(timeline.total_number, 12);

const nestedTimeline = runJson(
  {
    ok: 1,
    data: {
      max_id: "nested-max",
      statuses: [
        { id: "n1", idstr: "n1", text_raw: "含女权蝻" },
        { id: "n2", idstr: "n2", text_raw: "普通嵌套时间线" }
      ]
    }
  },
  timelineUrl
);
assert.deepStrictEqual(Array.from(nestedTimeline.data.statuses, item => item.id), ["n2"]);
assert.strictEqual(nestedTimeline.data.max_id, "nested-max");

// 2. items：只删除 feed 或无 category 的强帖子包装；保留普通 card/group。
const itemsPayload = runJson(
  {
    items: [
      {
        itemid: "feed-1",
        category: "feed",
        data: { id: "i1", idstr: "i1", text_raw: "这里有女爹" }
      },
      {
        itemid: "card-1",
        category: "card",
        data: { id: "i2", idstr: "i2", text_raw: "6B4T 但它不是 feed" }
      },
      {
        itemid: "group-1",
        category: "group",
        header: { title: "支家哥" },
        items: [
          { category: "feed", data: { id: "i3", idstr: "i3", text_raw: "蝈蝻" } },
          { category: "feed", data: { id: "i4", idstr: "i4", text_raw: "正常子帖子" } }
        ]
      },
      { data: { id: "i5", idstr: "i5", text_raw: "新首页包装含女拳师" } },
      { status: { id: "i6", idstr: "i6", text_raw: "普通新首页帖子" } },
      { data: { mblog: { id: "i7", idstr: "i7", text_raw: "无分类包装含拳媛" } } }
    ],
    next_cursor: "cursor-2"
  },
  "https://mapi.weibo.com/2/statuses/container_timeline?containerid=1"
);
assert.deepStrictEqual(Array.from(itemsPayload.items, item => item.itemid || item.status.id), ["card-1", "group-1", "i6"]);
assert.strictEqual(itemsPayload.items[1].header.title, "支家哥");
assert.deepStrictEqual(Array.from(itemsPayload.items[1].items, item => item.data.id), ["i4"]);
assert.strictEqual(itemsPayload.next_cursor, "cursor-2");

// 3. cards/card_group：只识别 card_type 9/165 的 mblog，父卡片始终保留。
const cardsPayload = runJson(
  {
    cards: [
      { card_type: 9, mblog: { id: "c1", idstr: "c1", text_raw: "精神蝻" } },
      { card_type: "165", mblog: { id: "c2", idstr: "c2", text_raw: "普通微博" } },
      { card_type: 118, mblog: { id: "c3", idstr: "c3", text_raw: "6B4T" } },
      {
        card_type: 11,
        card_group: [
          { card_type: "9", mblog: { id: "c4", idstr: "c4", text_raw: "父权洗脑" } },
          { card_type: 9, mblog: { id: "c5", idstr: "c5", text_raw: "保留内容" } }
        ]
      }
    ],
    cardlistInfo: { since_id: "card-cursor" }
  },
  "https://api.weibo.cn/2/cardlist?containerid=2"
);
assert.deepStrictEqual(Array.from(cardsPayload.cards, card => String(card.card_type)), ["165", "118", "11"]);
assert.deepStrictEqual(Array.from(cardsPayload.cards[2].card_group, card => card.mblog.id), ["c5"]);
assert.strictEqual(cardsPayload.cardlistInfo.since_id, "card-cursor");

// 4. 仅匹配白名单标题、长文与话题字段；链接结构和其他卡片文案不参与。
const fields = runJson(
  {
    statuses: [
      { id: "f1", idstr: "f1", text_raw: "普通", title: { text: "这里有娇妻" } },
      { id: "f2", idstr: "f2", text_raw: "普通", page_info: { page_title: "蝻窝卡片" } },
      { id: "f3", idstr: "f3", text_raw: "普通", topic_struct: [{ topic_title: "女权媛" }] },
      { id: "f4", idstr: "f4", text_raw: "预览", longText: { longTextContent: "长文含厌男" } },
      {
        id: "f5",
        idstr: "f5",
        text_raw: "普通",
        page_info: { content1: "6B4T" },
        url_struct: [{ url_title: "支家哥", long_url: "https://example.test/6b4t" }]
      },
      {
        id: "f6",
        idstr: "6b4t-id-only",
        text_raw: "普通正文",
        comments: [{ text: "支家哥" }]
      },
      {
        id: "f7",
        idstr: "f7",
        text_raw: "实体编码含女&#x62F3;师"
      }
    ]
  },
  timelineUrl
);
assert.deepStrictEqual(Array.from(fields.statuses, item => item.id), ["f5", "f6"]);

// 5. 搜索首页的 channelInfo.channels[].payload.items 是唯一额外包装路径。
const searchFinder = runJson(
  {
    channelInfo: {
      channels: [
        {
          id: "all",
          payload: {
            items: [
              { category: "feed", data: { id: "sf1", idstr: "sf1", text_raw: "含拳媛" } },
              { category: "feed", data: { id: "sf2", idstr: "sf2", text_raw: "安全搜索结果" } }
            ],
            since_id: "search-cursor"
          }
        }
      ]
    }
  },
  "https://api.weibo.cn/2/search/finder?q=test"
);
assert.deepStrictEqual(Array.from(searchFinder.channelInfo.channels[0].payload.items, item => item.data.id), ["sf2"]);
assert.strictEqual(searchFinder.channelInfo.channels[0].payload.since_id, "search-cursor");

// 6. 非 JSON、非 2xx、错误状态、未知结构和无命中内容都原样放行。
const malformed = "{not-json";
assert.strictEqual(run(malformed, timelineUrl, 200).body, malformed);

const serverError = JSON.stringify({ statuses: [{ id: "e1", idstr: "e1", text_raw: "6B4T" }] });
assert.strictEqual(run(serverError, timelineUrl, 500).body, serverError);

const apiError = JSON.stringify({ ok: 0, error_code: 10023, statuses: [{ id: "e2", idstr: "e2", text_raw: "6B4T" }] });
assert.strictEqual(run(apiError, timelineUrl, 200).body, apiError);

const nestedApiError = JSON.stringify({ data: { ok: 0, error_code: 10023, statuses: [{ id: "e3", idstr: "e3", text_raw: "6B4T" }] } });
assert.strictEqual(run(nestedApiError, timelineUrl, 200).body, nestedApiError);

const channelApiError = JSON.stringify({ channelInfo: { channels: [{ payload: { ok: 0, errno: 10023, items: [{ category: "feed", data: { id: "e4", idstr: "e4", text_raw: "6B4T" } }] } }] } });
assert.strictEqual(run(channelApiError, "https://api.weibo.cn/2/search/finder", 200).body, channelApiError);

const unknown = '{ "comments": [{"id":"u1","text":"6B4T"}], "cursor": "u" }';
assert.strictEqual(run(unknown, timelineUrl, 200).body, unknown);

const rootArray = '[{"idstr":"a","text_raw":"6B4T"}]';
assert.strictEqual(run(rootArray, timelineUrl, 200).body, rootArray);

const noMatch = '{ "statuses": [{"id":"n","idstr":"n","text_raw":"正常"}], "since_id": 1 }';
assert.strictEqual(run(noMatch, timelineUrl, 200).body, noMatch);

runWithoutStringBody(undefined);
runWithoutStringBody({ not: "a string" });

// 7. 短词层默认生效，也可独立关闭；核心词仍继续生效。
const broadPayload = {
  statuses: [
    { id: "b1", idstr: "b1", text_raw: "单独出现蝻字" },
    { id: "b2", idstr: "b2", text_raw: "明确写了6B4T" }
  ]
};
assert.deepStrictEqual(Array.from(runJson(broadPayload, timelineUrl).statuses, item => item.id), []);

const broadOffScript = script.replace(
  "includeBroadKeywords: true",
  "includeBroadKeywords: false"
);
assert.notStrictEqual(broadOffScript, script, "测试必须能找到短词层开关");
assert.deepStrictEqual(
  Array.from(runJson(broadPayload, timelineUrl, broadOffScript).statuses, item => item.id),
  ["b1"]
);

// 8. 微博与小红书适配器必须使用完全一致的两层词库。
function readKeywordArray(source, variableName) {
  const match = source.match(new RegExp("var " + variableName + " = \\[([\\s\\S]*?)\\];"));
  assert(match, "应能读取 " + variableName);
  return Array.from(match[1].matchAll(/"([^"]+)"/g), item => item[1].toLowerCase());
}

for (const variableName of ["CORE_KEYWORDS", "BROAD_KEYWORDS"]) {
  assert.deepStrictEqual(
    readKeywordArray(script, variableName),
    readKeywordArray(xhsScript, variableName),
    variableName + " 应与小红书适配器一致"
  );
}

// 9. CONF 只覆盖已核对的信息流路径和两个精确 API 主机。
const rulePatterns = conf
  .split(/\r?\n/)
  .filter(line => line.includes(" url script-response-body "))
  .map(line => new RegExp(line.split(" url script-response-body ")[0]));

function matchesAnyRule(url) {
  return rulePatterns.some(pattern => pattern.test(url));
}

for (const url of [
  "https://api.weibo.cn/2/statuses/container_timeline",
  "https://api.weibo.cn/2/statuses/container_timeline_hot?x=1",
  "https://api.weibo.cn/2/statuses/container_timeline_unread?x=1",
  "https://api.weibo.cn/2/statuses/friends/timeline?x=1",
  "https://api.weibo.cn/2/statuses/friends_timeline?x=1",
  "https://api.weibo.cn/2/statuses/unread_friends/timeline?x=1",
  "https://mapi.weibo.com/2/statuses/unread_friends_timeline",
  "https://mapi.weibo.com/2/statuses/unread_hot_timeline?x=1",
  "https://api.weibo.cn/2/groups/timeline?x=1",
  "https://api.weibo.cn/2/searchall?q=test",
  "https://api.weibo.cn/2/search/finder?q=test",
  "https://api.weibo.cn/2/search/container_timeline?q=test",
  "https://api.weibo.cn/2/search/container_discover?q=test",
  "https://api.weibo.cn/2/cardlist?containerid=1",
  "https://mapi.weibo.com/2/statuses/container_timeline_topic?x=1",
  "https://mapi.weibo.com/2/statuses/container_timeline_topicpage?x=1"
]) {
  assert(matchesAnyRule(url), "应匹配：" + url);
}

for (const url of [
  "https://mapi.weibo.cn/2/statuses/friends/timeline",
  "https://api.weibo.com/2/statuses/friends/timeline",
  "https://api.weibo.cn/2/comments/build_comments",
  "https://api.weibo.cn/2/messageflow",
  "https://api.weibo.cn/2/profile/me",
  "https://api.weibo.cn/2/statuses/extend",
  "https://api.weibo.cn/2/statuses/repost_timeline"
]) {
  assert(!matchesAnyRule(url), "不应匹配：" + url);
}
assert(conf.includes("hostname = api.weibo.cn, mapi.weibo.com"));
assert(!/^hostname\s*=.*\*\.weibo/m.test(conf));

// 10. 适配器不发起网络请求，调试默认关闭。
assert(!script.includes("$task.fetch"));
assert(!script.includes("$httpClient"));
assert(!/\bfetch\s*\(/.test(script));
assert(script.includes("debug: false"));

console.log("PASS: 10 组微博场景全部通过");
