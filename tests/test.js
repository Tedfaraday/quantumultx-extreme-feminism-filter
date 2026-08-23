"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptPath = path.resolve(
  __dirname,
  "../Scripts/Xiaohongshu/xhs-keyword-filter.js"
);
const script = fs.readFileSync(scriptPath, "utf8");
const confPath = path.resolve(
  __dirname,
  "../QuantumultX/xhs-keyword-filter.conf"
);
const conf = fs.readFileSync(confPath, "utf8");

function run(rawBody, url, statusCode, sourceScript) {
  let doneResult;
  const logs = [];
  const context = {
    $response: { body: rawBody, statusCode: statusCode === undefined ? 200 : statusCode },
    $request: { url },
    $done(result) {
      assert.strictEqual(doneResult, undefined, "$done 只能调用一次");
      doneResult = result;
    },
    console: { log(message) { logs.push(message); } }
  };

  vm.runInNewContext(sourceScript || script, context, { filename: "xhs-keyword-filter.js" });
  assert(doneResult && typeof doneResult.body === "string", "脚本必须返回字符串 body");
  return { body: doneResult.body, logs };
}

function runJson(payload, url, sourceScript) {
  const result = run(JSON.stringify(payload), url, 200, sourceScript);
  return JSON.parse(result.body);
}

// 1. 首页：过滤标题、正文和标签；保留直播组件与分页字段。
const home = runJson(
  {
    cursor: "cursor-home-1",
    has_more: true,
    data: [
      { id: "n1", model_type: "note", title: "普通内容" },
      { id: "n2", model_type: "note", desc: "正文包含支家哥" },
      { id: "n3", model_type: "note", hash_tag: [{ name: "这里有莮字" }] },
      { id: "n4", model_type: "note", title: "中国男篮决赛与烤鸭炸鸡" },
      { id: "n5", model_type: "note", title: "河童软糯剪刀脱脂小黄人" },
      { id: "n6", model_type: "note", title: "这里出现-÷" },
      { id: "live1", model_type: "live_v2", title: "6B4T直播" }
    ]
  },
  "https://edith.xiaohongshu.com/api/sns/v6/homefeed?page=1"
);
assert.deepStrictEqual(Array.from(home.data, item => item.id), ["n1", "n4", "n5", "live1"]);
assert.strictEqual(home.cursor, "cursor-home-1");
assert.strictEqual(home.has_more, true);

// 2. 搜索：识别 note_card.display_title；非帖子 rec_query 即使命中也保留。
const search = runJson(
  {
    data: {
      cursor: "cursor-search-2",
      has_more: false,
      items: [
        {
          id: "s1",
          model_type: "note",
          note_card: { display_title: "这里有女爹" }
        },
        {
          id: "s2",
          model_type: "note",
          note_card: { display_title: "保留的帖子", desc: "普通正文" }
        },
        {
          id: "s3",
          model_type: "note",
          noteCard: { displayTitle: "驼峰结构也包含蝈蝻" }
        },
        {
          id: "q1",
          model_type: "rec_query",
          title: "6B4T相关搜索"
        }
      ]
    }
  },
  "https://edith.xiaohongshu.com/api/sns/v10/search/notes?keyword=test"
);
assert.deepStrictEqual(Array.from(search.data.items, item => item.id), ["s2", "q1"]);
assert.strictEqual(search.data.cursor, "cursor-search-2");
assert.strictEqual(search.data.has_more, false);

// 3. 包装结构：过滤 data[0].note_list，并保留包装对象。
const wrapped = runJson(
  {
    data: [
      {
        request_id: "req-3",
        note_list: [
          { note_id: "w1", title: "拳媛：应过滤" },
          { note_id: "w2", title: "应保留" }
        ]
      }
    ]
  },
  "https://edith.xiaohongshu.com/api/sns/v6/homefeed?cursor=next"
);
assert.strictEqual(wrapped.data[0].request_id, "req-3");
assert.deepStrictEqual(Array.from(wrapped.data[0].note_list, item => item.note_id), ["w2"]);

// 4. 不扫描作者名，避免关键词命中作者时误删帖子。
const author = runJson(
  {
    data: {
      items: [
        {
          id: "a1",
          model_type: "note",
          note_card: {
            display_title: "正常标题",
            user: { nickname: "国蝻" }
          }
        }
      ]
    }
  },
  "https://edith.xiaohongshu.com/api/sns/v10/search/notes?q=x"
);
assert.strictEqual(author.data.items.length, 1);

// 5. 非 JSON 与非 2xx 都必须原样放行。
const malformed = "{not-json";
assert.strictEqual(
  run(malformed, "https://edith.xiaohongshu.com/api/sns/v6/homefeed", 200).body,
  malformed
);

const serverError = JSON.stringify({ data: [{ id: "e1", model_type: "note", title: "6B4T" }] });
assert.strictEqual(
  run(serverError, "https://edith.xiaohongshu.com/api/sns/v6/homefeed", 500).body,
  serverError
);

// 6. 短词层默认生效，而且可用一个开关关闭；核心词不受该开关影响。
const broadPayload = {
  data: [
    { id: "b1", model_type: "note", title: "单独出现蝻字" },
    { id: "b2", model_type: "note", title: "明确写了6B4T" }
  ]
};
const broadOn = runJson(
  broadPayload,
  "https://edith.xiaohongshu.com/api/sns/v6/homefeed"
);
assert.deepStrictEqual(Array.from(broadOn.data, item => item.id), []);

const broadOffScript = script.replace(
  "includeBroadKeywords: true",
  "includeBroadKeywords: false"
);
assert.notStrictEqual(broadOffScript, script, "测试必须能找到短词层开关");
const broadOff = runJson(
  broadPayload,
  "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
  broadOffScript
);
assert.deepStrictEqual(Array.from(broadOff.data, item => item.id), ["b1"]);

// 7. 词库两层应去重、互不重叠，并保留有意排除的高误伤普通词。
function readKeywordArray(variableName) {
  const match = script.match(new RegExp("var " + variableName + " = \\[([\\s\\S]*?)\\];"));
  assert(match, "应能读取 " + variableName);
  return Array.from(match[1].matchAll(/"([^"]+)"/g), item => item[1].toLowerCase());
}

const coreKeywords = readKeywordArray("CORE_KEYWORDS");
const broadKeywords = readKeywordArray("BROAD_KEYWORDS");
assert(coreKeywords.length >= 200, "核心层应包含本次深读结果");
assert(broadKeywords.length >= 60, "强过滤层应包含短词变体");
assert.strictEqual(new Set(coreKeywords).size, coreKeywords.length);
assert.strictEqual(new Set(broadKeywords).size, broadKeywords.length);
assert.strictEqual(coreKeywords.filter(word => broadKeywords.includes(word)).length, 0);
for (const excluded of ["男", "女", "拳", "权", "驴", "吊", "情绪价值", "软糯", "剪刀", "脱脂", "河童", "小黄人"]) {
  assert(!coreKeywords.includes(excluded) && !broadKeywords.includes(excluded), "高误伤词不应启用：" + excluded);
}

// 8. CONF 应覆盖近期公开规则出现的首页、搜索和关注页主机。
const rulePatterns = conf
  .split(/\r?\n/)
  .filter(line => line.includes(" url script-response-body "))
  .map(line => new RegExp(line.split(" url script-response-body ")[0]));

function matchesAnyRule(url) {
  return rulePatterns.some(pattern => pattern.test(url));
}

assert(matchesAnyRule("https://rec.xiaohongshu.com/api/sns/v6/homefeed?cursor=1"));
assert(matchesAnyRule("https://www.xiaohongshu.com/api/sns/v4/followfeed?page=2"));
assert(matchesAnyRule("https://edith.xiaohongshu.com/api/sns/v4/user/followings/followfeed?x=1"));
assert(matchesAnyRule("https://so.xiaohongshu.com/api/sns/v10/search/notes?keyword=test"));
assert(!matchesAnyRule("https://edith.xiaohongshu.com/api/sns/v2/note/feed?id=1"));

console.log("PASS: 8 组场景全部通过");
