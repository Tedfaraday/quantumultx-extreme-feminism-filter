"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "Scripts/Reddit/reddit-keyword-filter.js"), "utf8");
const xhs = fs.readFileSync(path.join(root, "Scripts/Xiaohongshu/xhs-keyword-filter.js"), "utf8");
const conf = fs.readFileSync(path.join(root, "QuantumultX/reddit-keyword-filter.conf"), "utf8");
const url = "https://gql-fed.reddit.com/";

function run(body, operation, options) {
  const opts = options || {};
  let result;
  vm.runInNewContext(opts.script || script, {
    $request: {
      url: opts.url || url,
      headers: operation ? { "x-apollo-operation-name": operation } : {}
    },
    $response: { body, statusCode: opts.status === undefined ? 200 : opts.status },
    $done(value) {
      assert.strictEqual(result, undefined, "$done must run once");
      result = value;
    },
    console: { log() {} }
  });
  assert(result && typeof result.body === "string");
  return result.body;
}

function title(value) {
  return { __typename: "TitleCell", title: value };
}
function preview(value) {
  return { __typename: "PreviewTextCell", text: value };
}
function flair(value) {
  return { __typename: "FlairCell", flair: { text: value } };
}
function edge(id, cells, extra) {
  return {
    __typename: "FeedElementEdge",
    node: Object.assign({
      __typename: "CellGroup",
      groupId: "t3_" + id,
      adPayload: null,
      cells
    }, extra || {})
  };
}
function feed(rootKey, edges) {
  return {
    data: {
      [rootKey]: {
        elements: {
          pageInfo: { endCursor: "cursor-from-server", hasNextPage: true },
          edges
        }
      }
    },
    extensions: { trace: "keep" }
  };
}
function filtered(payload, op) {
  return JSON.parse(run(JSON.stringify(payload), op));
}

// Distinct visible fields are filtered. Author names, IDs, URLs, comments,
// non-post units and ad metadata never participate in matching.
const home = feed("homeV3", [
  edge("a1", [title("普通標題"), preview("普通預覽"), flair("普通標籤")]),
  edge("a2", [title("標題含 6B4T")]),
  edge("a3", [preview("正文預覽含 女权蝻")]),
  edge("a4", [flair("標籤：拳媛")]),
  edge("a5", [{ __typename: "ClassicCell", titleCell: title("普通"),
    previewTextCell: preview("含男宝妈"), flairCell: flair("一般") }]),
  edge("a6", [{ __typename: "TitleWithThumbnailCell", titleCell: title("含支家哥") }]),
  edge("a7", [{ __typename: "MetadataCell", authorName: "6B4T" }, title("正常")]),
  edge("a8", [title("https://example.invalid/6b4t 正常")]),
  edge("a9", [title("正常")], { adPayload: { title: "6B4T" } }),
  { __typename: "FeedElementEdge", node: {
    __typename: "RecommendationUnit", title: "6B4T" } }
]);
const homeOut = filtered(home, "HomeFeedSdui");
assert.deepStrictEqual(
  Array.from(homeOut.data.homeV3.elements.edges, x => x.node.groupId || "recommendation"),
  ["t3_a1", "t3_a7", "t3_a8", "t3_a9", "recommendation"]
);
assert.strictEqual(homeOut.data.homeV3.elements.pageInfo.endCursor, "cursor-from-server");
assert.strictEqual(homeOut.data.homeV3.elements.pageInfo.hasNextPage, true);
assert.strictEqual(homeOut.extensions.trace, "keep");

for (const [operation, key] of [
  ["SubredditFeedSdui", "subredditV3"],
  ["PopularFeedSdui", "popularV3"],
  ["NewsFeedSdui", "newsV3"]
]) {
  const out = filtered(feed(key, [edge("b1", [title("普通")]),
    edge("b2", [{ __typename: "ClassicCell", flairCell: flair("含女权蝻") }])]), operation);
  assert.deepStrictEqual(Array.from(out.data[key].elements.edges, x => x.node.groupId),
    ["t3_b1"]);
}

const noMatch = JSON.stringify(feed("homeV3", [edge("c1", [title("普通")])]));
assert.strictEqual(run(noMatch, "HomeFeedSdui"), noMatch);
assert.strictEqual(run(noMatch, "PostInfoById"), noMatch);
assert.strictEqual(run(noMatch, ""), noMatch);
assert.strictEqual(run("{oops", "HomeFeedSdui"), "{oops");
assert.strictEqual(run(JSON.stringify(home), "HomeFeedSdui", { status: 500 }), JSON.stringify(home));
assert.strictEqual(run(JSON.stringify({ ...home, errors: [{ message: "error" }] }),
  "HomeFeedSdui"), JSON.stringify({ ...home, errors: [{ message: "error" }] }));
assert.strictEqual(run(JSON.stringify({ data: { homeV3: { elements: {} } } }),
  "HomeFeedSdui"), JSON.stringify({ data: { homeV3: { elements: {} } } }));
assert.strictEqual(run(JSON.stringify(home), "HomeFeedSdui",
  { url: "https://gql-fed.reddit.com/other" }), JSON.stringify(home));

const broad = feed("homeV3", [edge("d1", [title("單字蝻")]),
  edge("d2", [title("6B4T")])]);
assert.deepStrictEqual(Array.from(filtered(broad, "HomeFeedSdui").data.homeV3.elements.edges),
  []);
const broadOffScript = script.replace("includeBroadKeywords: true",
  "includeBroadKeywords: false");
assert.notStrictEqual(broadOffScript, script);
assert.deepStrictEqual(
  Array.from(JSON.parse(run(JSON.stringify(broad), "HomeFeedSdui",
    { script: broadOffScript })).data.homeV3.elements.edges, x => x.node.groupId),
  ["t3_d1"]
);
const tagsOffScript = script.replace("matchTags: true", "matchTags: false");
assert.deepStrictEqual(
  Array.from(JSON.parse(run(JSON.stringify(feed("homeV3",
    [edge("e1", [flair("6B4T")])])), "HomeFeedSdui",
    { script: tagsOffScript })).data.homeV3.elements.edges, x => x.node.groupId),
  ["t3_e1"]
);

function readKeywords(source, name) {
  const match = source.match(new RegExp("var " + name + " = \\[([\\s\\S]*?)\\];"));
  assert(match, name + " missing");
  return Array.from(match[1].matchAll(/"([^"]+)"/g), x => x[1]);
}
for (const name of ["CORE_KEYWORDS", "BROAD_KEYWORDS"]) {
  assert.deepStrictEqual(readKeywords(script, name), readKeywords(xhs, name));
}

const rule = conf.split(/\r?\n/).find(x => x.includes(" url script-response-body "));
assert(rule);
const pattern = new RegExp(rule.split(" url script-response-body ")[0]);
assert(pattern.test(url));
assert(pattern.test(url + "?operationName=HomeFeedSdui"));
assert(!pattern.test("https://gql-fed.reddit.com/comments"));
assert(!pattern.test("https://www.reddit.com/"));
assert(conf.includes("hostname = gql-fed.reddit.com"));
assert(!script.includes("$task.fetch"));
assert(!script.includes("$httpClient"));
assert(script.includes("debug: false"));

console.log("PASS: Reddit GraphQL feed filtering and fail-open cases");
