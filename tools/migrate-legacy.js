// One-off mechanical migration of the v0.3.0 local files; never overwrites a lexicon.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const write = (p, text) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), text, "utf8");
};
if (fs.existsSync(path.join(root, "lexicon/keywords.json"))) {
  throw new Error("Canonical lexicon exists; migration must not overwrite it.");
}
const adapters = [
  ["Xiaohongshu", "xhs"], ["Weibo", "weibo"], ["Reddit", "reddit"]
];
const xhs = read("Scripts/Xiaohongshu/xhs-keyword-filter.js");
function array(source, name) {
  const found = source.match(new RegExp("var " + name + " = (\\[[\\s\\S]*?\\]);"));
  if (!found) throw new Error("Missing " + name);
  return JSON.parse(found[1]);
}
const core = array(xhs, "CORE_KEYWORDS");
const broad = array(xhs, "BROAD_KEYWORDS");
const review = read("docs/keywords-full-review.txt").split("\n").slice(4)
  .filter(x => x.trim() !== "");
if (core.length + broad.length !== 275 || review.length !== 1180 ||
    new Set(review).size !== review.length ||
    [...core, ...broad].some(x => !review.includes(x))) {
  throw new Error("Unexpected legacy inventory; inspect before migrating.");
}
const base = "https://github.com/Tedfaraday/quantumultx-extreme-feminism-filter/blob/v0.3.0/";
const sources = [
  { id: "legacy-active-catalog", url: base + "docs/KEYWORD_SOURCES.md",
    kind: "legacy-catalog", note: "舊版已啟用詞庫的來源彙總；非逐詞原始出處，缺失定位待補。" },
  { id: "legacy-review-catalog", url: base + "docs/keywords-full-review.md",
    kind: "legacy-catalog", note: "舊版全量審閱副本；非逐詞原始出處，不能據此認定作者或群體。" }
];
const mapped = new Map();
for (const line of read("docs/KEYWORD_SOURCES.md").split("\n")) {
  if (!line.startsWith("- ")) continue;
  const link = line.match(/\]\((https:\/\/[^\s]+?)\)[：:]/);
  if (!link) continue;
  const words = Array.from(line.matchAll(/`([^`]+)`/g), m => m[1])
    .filter(w => review.includes(w));
  if (!words.length) continue;
  let source = sources.find(s => s.url === link[1]);
  if (!source) {
    source = { id: "documented-" + String(sources.length - 1).padStart(2, "0"),
      url: link[1], kind: "documented",
      note: "沿用 v0.3.0 來源說明中明確列出的詞項定位；此次未重新核驗原材料。" };
    sources.push(source);
  }
  for (const word of words) {
    if (!mapped.has(word)) mapped.set(word, []);
    if (!mapped.get(word).includes(source.id)) mapped.get(word).push(source.id);
  }
}
const entries = review.map((term, i) => {
  const tier = core.includes(term) ? "core" : broad.includes(term) ? "broad" : "review";
  return {
    id: "term-" + String(i + 1).padStart(4, "0"), term, tier,
    enabled: tier !== "review",
    review_status: tier === "review" ? "candidate" : "legacy-preserved",
    source_refs: mapped.get(term) || [tier === "review" ?
      "legacy-review-catalog" : "legacy-active-catalog"],
    added_on: "2026-08-23",
    risk_note: tier === "review" ? "全量維護候選，可能為普通、學術或引用文字；未啟用。" :
      tier === "broad" ? "短詞包含匹配，誤傷風險高；引用、反駁及普通討論也可能命中。" :
      "包含匹配不判斷立場；引用、反駁或普通語境也可能命中。"
  };
});
write("lexicon/keywords.json", JSON.stringify({
  schema_version: 1, version: "0.4.0", updated_on: "2026-09-29", sources, entries
}, null, 2) + "\n");
write("lexicon/legacy-baseline.json", JSON.stringify({
  origin_tag: "v0.3.0", note: "唯讀遷移憑據，不是詞庫維護入口。",
  entries: entries.filter(e => e.enabled).map(({ id, term, tier }) => ({ id, term, tier }))
}, null, 2) + "\n");
for (const [platform, short] of adapters) {
  const source = read(`Scripts/${platform}/${short}-keyword-filter.js`);
  if (JSON.stringify(array(source, "CORE_KEYWORDS")) !== JSON.stringify(core) ||
      JSON.stringify(array(source, "BROAD_KEYWORDS")) !== JSON.stringify(broad)) {
    throw new Error("Legacy adapters disagree: " + platform);
  }
  const first = source.indexOf("  var CORE_KEYWORDS = [");
  const last = source.indexOf("  var CONFIG = {");
  if (first < 0 || last < first) throw new Error("Adapter markers missing");
  write(`src/adapters/${short}-keyword-filter.js`, source.slice(0, first) +
    "  /* @LEXICON@ */\n\n" + source.slice(last));
  let conf = read(`QuantumultX/${short}-keyword-filter.conf`)
    .replace(/#!version=[^\n]+/, "#!version={{VERSION}}")
    .replace(/https:\/\/raw\.githubusercontent\.com\/Tedfaraday\/quantumultx-extreme-feminism-filter\/[^\s]+\.js/g,
      "{{SCRIPT_URL}}");
  write(`src/QuantumultX/${short}-keyword-filter.conf`, conf);
}
console.log("Migrated 275 enabled / 1180 total entries; platform logic preserved.");
