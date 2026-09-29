"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const platforms = [
  ["Xiaohongshu", "xhs"], ["Weibo", "weibo"], ["Reddit", "reddit"]
];
const repository = "Tedfaraday/quantumultx-extreme-feminism-filter";
// This already published tag is a fully frozen alternative to the rolling channel.
const stableTag = "v0.3.0";
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const sha256 = text => crypto.createHash("sha256").update(text).digest("hex");
const normalized = s => s.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "")
  .replace(/\s+/g, " ").trim().toLowerCase();
const fail = message => { throw new Error(message); };
function date(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function validateLexicon(data, baseline) {
  if (data.schema_version !== 1 || !/^\d+\.\d+\.\d+$/.test(data.version) ||
      !date(data.updated_on) || !Array.isArray(data.sources) ||
      !Array.isArray(data.entries) || !data.entries.length) fail("Invalid lexicon header");
  const sources = new Map();
  for (const source of data.sources) {
    if (!source || !/^[a-z0-9-]+$/.test(source.id) || sources.has(source.id) ||
        !["documented", "legacy-catalog"].includes(source.kind) ||
        typeof source.note !== "string" || !source.note.trim()) fail("Invalid source");
    let url;
    try { url = new URL(source.url); } catch (_) { fail("Invalid source URL"); }
    if (url.protocol !== "https:" || url.username || url.password) fail("Source must be public HTTPS without credentials");
    sources.set(source.id, source);
  }
  const legacy = new Map(baseline.entries.map(e => [e.id, e]));
  const ids = new Set(), terms = new Set(), active = new Set();
  for (const entry of data.entries) {
    if (!entry || !/^term-[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id) ||
        typeof entry.term !== "string" || !entry.term.trim() || entry.term !== entry.term.trim() ||
        /[\r\n\u0000-\u001F\u200B-\u200D\uFEFF]/.test(entry.term) || terms.has(entry.term) ||
        !["core", "broad", "review"].includes(entry.tier) ||
        typeof entry.enabled !== "boolean" || !date(entry.added_on) || entry.added_on > data.updated_on ||
        !["approved", "candidate", "legacy-preserved"].includes(entry.review_status) ||
        typeof entry.risk_note !== "string" || !entry.risk_note.trim() ||
        !Array.isArray(entry.source_refs) || !entry.source_refs.length ||
        new Set(entry.source_refs).size !== entry.source_refs.length ||
        entry.source_refs.some(id => !sources.has(id))) fail("Invalid entry: " + (entry && entry.id));
    ids.add(entry.id); terms.add(entry.term);
    if (entry.review_status === "legacy-preserved") {
      const prior = legacy.get(entry.id);
      if (!prior || prior.term !== entry.term || prior.tier !== entry.tier) fail("Invalid legacy exemption: " + entry.id);
    }
    if (entry.review_status === "approved" &&
        !entry.source_refs.some(id => sources.get(id).kind === "documented")) {
      fail("Approved entry needs a documented source: " + entry.id);
    }
    if (entry.enabled) {
      if (entry.tier === "review" || entry.review_status === "candidate") fail("Unreviewed entry enabled: " + entry.id);
      const key = normalized(entry.term);
      if (!key || active.has(key)) fail("Normalized duplicate in enabled entries: " + entry.id);
      active.add(key);
    }
  }
  return data;
}
function render(data, raw) {
  const digest = sha256(raw);
  const groups = {};
  for (const tier of ["core", "broad"]) {
    groups[tier] = data.entries.filter(e => e.enabled && e.tier === tier).map(e => e.term);
  }
  const outputs = new Map();
  outputs.set("lexicon/core.txt", groups.core.join("\n") + "\n");
  outputs.set("lexicon/broad.txt", groups.broad.join("\n") + "\n");
  outputs.set("lexicon/review-all.txt", data.entries.map(e => e.term).join("\n") + "\n");
  const block = ["  // Generated from lexicon/keywords.json; edit the canonical file, not these arrays.",
    `  // Lexicon ${data.version}; source SHA-256 ${digest}`,
    "  var CORE_KEYWORDS = " + JSON.stringify(groups.core, null, 2).replace(/\n/g, "\n  ") + ";",
    "", "  var BROAD_KEYWORDS = " + JSON.stringify(groups.broad, null, 2).replace(/\n/g, "\n  ") + ";"].join("\n");
  for (const [platform, short] of platforms) {
    const scriptPath = `Scripts/${platform}/${short}-keyword-filter.js`;
    const template = read(`src/adapters/${short}-keyword-filter.js`).replace(/\r\n/g, "\n");
    if (template.split("  /* @LEXICON@ */").length !== 2) fail("Invalid adapter template: " + short);
    const script = template.replace("  /* @LEXICON@ */", block);
    outputs.set(scriptPath, script);
    const conf = read(`src/QuantumultX/${short}-keyword-filter.conf`).replace(/\r\n/g, "\n");
    if (!conf.includes("{{SCRIPT_URL}}") || !conf.includes("{{VERSION}}")) fail("Invalid CONF template");
    // Include adapter changes as well as lexicon changes in the URL cache key.
    const revision = sha256(script).slice(0, 16);
    outputs.set(`QuantumultX/${short}-keyword-filter.conf`,
      "# Generated rolling channel; do not edit.\n" +
      `# Lexicon ${data.version}; script revision ${revision}\n` +
      conf.replace(/\{\{VERSION\}\}/g, data.version).replace(/\{\{SCRIPT_URL\}\}/g,
        `https://raw.githubusercontent.com/${repository}/main/${scriptPath}?v=${revision}`));
    // Frozen rules have their own archived source; live endpoint changes must not alter them.
    const frozen = read(`src/pinned/${stableTag}/${short}-keyword-filter.conf`).replace(/\r\n/g, "\n");
    if (frozen.includes("/main/Scripts/") || !frozen.includes(`/${stableTag}/${scriptPath}`)) {
      fail("Frozen configuration must point to its published tag");
    }
    outputs.set(`QuantumultX/pinned/${stableTag}/${short}-keyword-filter.conf`, frozen);
  }
  outputs.set("lexicon/manifest.json", JSON.stringify({
    schema_version: 1, version: data.version, updated_on: data.updated_on,
    source_sha256: digest,
    counts: { core: groups.core.length, broad: groups.broad.length,
      enabled: groups.core.length + groups.broad.length, total: data.entries.length },
    files: Object.fromEntries(Array.from(outputs, ([p, body]) => [p, { sha256: sha256(body) }]))
  }, null, 2) + "\n");
  return outputs;
}
function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !["--check", "--validate"].includes(a))) fail("Usage: node tools/build.js [--check|--validate]");
  const raw = read("lexicon/keywords.json");
  const data = validateLexicon(JSON.parse(raw), JSON.parse(read("lexicon/legacy-baseline.json")));
  if (args.includes("--validate")) return console.log("PASS: lexicon schema and provenance checks");
  let stale = [];
  const outputs = render(data, raw);
  for (const [p, body] of outputs) {
    const file = path.join(root, p);
    if (args.includes("--check")) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== body) stale.push(p);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, body, "utf8");
    }
  }
  if (stale.length) fail("Generated files out of date: " + stale.join(", "));
  console.log((args.includes("--check") ? "PASS: checked " : "Built ") + outputs.size + " generated files");
}
module.exports = { validateLexicon, render, normalized };
if (require.main === module) main();
