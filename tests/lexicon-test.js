"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateLexicon, render, normalized } = require("../tools/build.js");
const root = path.resolve(__dirname, "..");
const raw = fs.readFileSync(path.join(root, "lexicon/keywords.json"), "utf8");
const data = JSON.parse(raw);
const baseline = JSON.parse(fs.readFileSync(path.join(root, "lexicon/legacy-baseline.json"), "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));
assert.equal(baseline.entries.length, 275);
validateLexicon(data, baseline);
const output = render(data, raw);
assert.deepEqual(Array.from(render(data, raw)), Array.from(output));
const expected = tier => data.entries.filter(e => e.enabled && e.tier === tier).map(e => e.term);
const array = (source, name) => JSON.parse(source.match(new RegExp("var " + name + " = (\\[[\\s\\S]*?\\]);"))[1]);
for (const [file, body] of output) {
  assert.equal(fs.readFileSync(path.join(root, file), "utf8"), body, file + " stale");
  if (file.startsWith("Scripts/")) {
    assert.deepEqual(array(body, "CORE_KEYWORDS"), expected("core"));
    assert.deepEqual(array(body, "BROAD_KEYWORDS"), expected("broad"));
    assert(!body.includes("$task.fetch"));
    assert(!body.includes("$httpClient"));
  }
  if (file.startsWith("QuantumultX/pinned/")) {
    assert(body.includes("/v0.3.0/Scripts/"));
    assert(!body.includes("/main/Scripts/"));
  } else if (file.startsWith("QuantumultX/")) {
    assert(body.includes("/main/Scripts/"));
    assert(/\.js\?v=[a-f0-9]{16}/.test(body));
    assert(!body.includes("/v0.1.0/") && !body.includes("/v0.2.0/"));
  }
}
assert.equal(output.get("lexicon/core.txt"), expected("core").join("\n") + "\n");
assert.equal(output.get("lexicon/broad.txt"), expected("broad").join("\n") + "\n");
assert.equal(output.get("lexicon/review-all.txt"), data.entries.map(e => e.term).join("\n") + "\n");
assert.equal(normalized("６Ｂ４Ｔ"), "6b4t");
function reject(mutator) {
  const copy = clone(data); mutator(copy);
  assert.throws(() => validateLexicon(copy, baseline));
}
reject(d => { d.entries[0].source_refs = []; });
reject(d => { d.entries[0].source_refs = ["missing-source"]; });
reject(d => { d.entries[0].term = "changed legacy term"; });
reject(d => { d.entries[0].risk_note = ""; });
reject(d => { d.entries[0].added_on = "2026-02-31"; });
reject(d => { d.entries[0].term += "\n"; });
reject(d => { d.sources[0].url = "https://user:password@example.invalid/path"; });
reject(d => { d.entries.find(e => e.tier === "review").enabled = true; });
reject(d => { d.entries[0].review_status = "candidate"; });
reject(d => {
  const e = d.entries.find(e => e.source_refs.includes("legacy-active-catalog"));
  e.review_status = "approved";
});
const expanded = clone(data);
expanded.sources.push({ id: "unit-test-source", kind: "documented",
  url: "https://github.com/example/project/issues/1", note: "Synthetic unit-test source, never published as a term." });
expanded.entries.push({ id: "term-unit-test", term: "单元测试专用新词", tier: "core",
  enabled: true, review_status: "approved", source_refs: ["unit-test-source"],
  added_on: data.updated_on, risk_note: "Test only." });
validateLexicon(expanded, baseline);
const rebuilt = render(expanded, JSON.stringify(expanded));
for (const [file, body] of rebuilt) {
  if (file.startsWith("Scripts/")) assert(array(body, "CORE_KEYWORDS").includes("单元测试专用新词"));
  if (file.startsWith("QuantumultX/pinned/")) assert.equal(body, output.get(file));
  else if (file.startsWith("QuantumultX/")) assert.notEqual(body, output.get(file));
}
const duplicate = clone(expanded.entries[expanded.entries.length - 1]);
duplicate.id = "term-unit-test-duplicate";
duplicate.term = "６Ｂ４Ｔ";
expanded.entries.push(duplicate);
assert.throws(() => validateLexicon(expanded, baseline));
duplicate.enabled = false; duplicate.tier = "review"; duplicate.review_status = "candidate";
// Disabled spelling variants can coexist in the review inventory, not in active exports.
expanded.entries[expanded.entries.length - 1] = duplicate;
if (!data.entries.some(e => e.term === duplicate.term)) validateLexicon(expanded, baseline);
console.log("PASS: canonical lexicon, provenance guards, exports, rolling/pinned channels and rebuild propagation");
