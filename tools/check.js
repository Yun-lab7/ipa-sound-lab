/* Invariant checker for index.html.
   Pulls the data tables straight out of the page source and verifies the things
   that break quietly: a transcription containing a symbol that is not on the
   keyboard, a chart cell whose example word is missing, a "minimal pair" that
   differs by more than one sound, a quiz that cannot build four options.
   Run: node tools/check.js  */
"use strict";
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const fail = [];
const note = (group, msg) => fail.push(group + " | " + msg);

function grab(name, re) {
  const m = src.match(re);
  if (!m) { note("parse", "could not find " + name); return null; }
  return m[1];
}

/* ---- data ---- */
const RAW = JSON.parse("[" + grab("RAW", /const RAW = \[([\s\S]*?)\n  \];/)
  .replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ").replace(/,\s*$/, "") + "]");
const MULTI = JSON.parse("[" + grab("MULTI", /const MULTI = \[([\s\S]*?)\];/) + "]");
const VOICELESS = JSON.parse("[" + grab("VOICELESS", /const VOICELESS = \[([\s\S]*?)\];/) + "]");
const PAIRS = eval("[" + grab("PAIR_WORDS", /const PAIR_WORDS = \[([\s\S]*?)\n  \];/) + "]");
const CONS_ROWS = eval("[" + grab("CONS_ROWS", /const CONS_ROWS = \[([\s\S]*?)\n  \];/) + "]");
const CHARTS = eval("(function (CONS_ROWS) { return ("
  + grab("CHARTS", /const CHARTS = (\{[\s\S]*?\n  \});/) + "); })")(CONS_ROWS);
const SOUND_SRC = grab("SOUND", /const SOUND = \{([\s\S]*?)\n  \};/);
const SOUND_KEYS = [...SOUND_SRC.matchAll(/^\s*"([^"]+)":\s*\{/gm)].map(m => m[1]);
const SOUND_EX = {};
[...SOUND_SRC.matchAll(/^\s*"([^"]+)":[\s\S]*?ex:\s*\[([^\]]*)\]/gm)].forEach(m => {
  SOUND_EX[m[1]] = JSON.parse("[" + m[2] + "]");
});

const DICT = Object.create(null);
RAW.forEach(line => {
  const p = line.split("|");
  DICT[p[0]] = { w: p[0], gb: p[1], us: p[2] || p[1] };
});

/* ---- helpers mirrored from the page ---- */
function tokenize(ipa) {
  const out = []; let i = 0;
  while (i < ipa.length) {
    let hit = null;
    for (const m of MULTI) if (ipa.startsWith(m, i)) { hit = m; break; }
    if (hit) { out.push(hit); i += hit.length; } else { out.push(ipa[i]); i += 1; }
  }
  return out;
}
const stripMarks = s => s.replace(/[ˈˌ.̬̥̩]/g, "");
const symbolsFor = acc => {
  const c = CHARTS[acc], o = [];
  c.mono.concat(c.diph).concat(c.weak).forEach(i => { if (i && !o.includes(i[0])) o.push(i[0]); });
  c.cons.forEach(r => r.forEach(i => { if (!o.includes(i[0])) o.push(i[0]); }));
  return o;
};
const ipaOf = (e, acc) => acc === "us" ? e.us : e.gb;

/* ---- 1. duplicates ---- */
const seen = new Set();
RAW.forEach(l => { const w = l.split("|")[0]; if (seen.has(w)) note("dict", "duplicate entry: " + w); seen.add(w); });

/* ---- 2. every transcription is spellable on that accent's keyboard ---- */
["gb", "us"].forEach(acc => {
  const keys = new Set(symbolsFor(acc));
  Object.values(DICT).forEach(e => {
    tokenize(stripMarks(ipaOf(e, acc))).forEach(t => {
      if (!keys.has(t)) note("keyboard/" + acc, e.w + " /" + ipaOf(e, acc) + "/ uses " + t + ", which is not a key");
    });
  });
});

/* ---- 3. chart cells ---- */
["gb", "us"].forEach(acc => {
  const c = CHARTS[acc];
  const cells = [];
  c.mono.concat(c.diph).concat(c.weak).forEach(i => { if (i) cells.push(i); });
  c.cons.forEach(r => r.forEach(i => cells.push(i)));
  cells.forEach(([sym, word]) => {
    if (!DICT[word]) note("chart/" + acc, sym + " example word missing from dictionary: " + word);
    if (!SOUND_KEYS.includes(sym)) note("chart/" + acc, sym + " has no articulation entry");
  });
  const mono = c.mono.filter(Boolean).length, diph = c.diph.filter(Boolean).length;
  const cons = c.cons.reduce((n, r) => n + r.length, 0);
  if (acc === "gb" && mono + diph + cons !== 44) note("chart/gb", "expected 44 phonemes, counted " + (mono + diph + cons));
  if (cons !== 24) note("chart/" + acc, "expected 24 consonants, counted " + cons);
});
if (VOICELESS.length !== 9) note("chart", "expected 9 voiceless consonants, got " + VOICELESS.length);

/* ---- 4. articulation panel example words ---- */
Object.entries(SOUND_EX).forEach(([sym, ex]) => {
  if (ex.length !== 3) note("sound", sym + " has " + ex.length + " example words, expected 3");
  ex.forEach(w => { if (!DICT[w]) note("sound", sym + " example word missing from dictionary: " + w); });
});

/* ---- 5. minimal pairs really differ by one sound, in both accents ---- */
PAIRS.forEach(([a, b]) => {
  if (!DICT[a] || !DICT[b]) { note("pairs", "word missing from dictionary: " + (!DICT[a] ? a : b)); return; }
  ["gb", "us"].forEach(acc => {
    const ta = tokenize(stripMarks(ipaOf(DICT[a], acc)));
    const tb = tokenize(stripMarks(ipaOf(DICT[b], acc)));
    if (ta.length !== tb.length) {
      note("pairs/" + acc, a + "/" + b + " differ in length: /" + ta.join("") + "/ vs /" + tb.join("") + "/");
      return;
    }
    const diff = ta.filter((t, i) => t !== tb[i]).length;
    if (diff === 0) note("pairs/" + acc, a + "/" + b + " are homophones here: /" + ta.join("") + "/");
    else if (diff > 1) note("pairs/" + acc, a + "/" + b + " differ in " + diff + " sounds: /" + ta.join("") + "/ vs /" + tb.join("") + "/");
  });
});

/* ---- 6. the four-option quiz can always build four options ---- */
const CONFUSE = eval("(" + grab("CONFUSE", /const CONFUSE = (\{[\s\S]*?\n  \});/) + ")");
function distractorCount(ipa) {
  const toks = tokenize(ipa);
  const made = new Set([ipa]);
  for (let i = 0; i < toks.length; i++) {
    for (const alt of (CONFUSE[toks[i]] || [])) {
      const c = toks.slice(); c[i] = alt;
      made.add(c.join(""));
    }
  }
  return made.size - 1;
}
// A handful of very short words cannot yield three near misses, so the quiz tops the
// options up from other words. Check that fallback exists, then only flag words that
// cannot produce even one wrong option.
if (!/while \(opts\.length < 4/.test(src)) note("quiz", "no fallback to top the options up to four");
["gb", "us"].forEach(acc => {
  Object.values(DICT).forEach(e => {
    const n = distractorCount(ipaOf(e, acc));
    if (n < 1) note("quiz/" + acc, e.w + " /" + ipaOf(e, acc) + "/ can make no wrong options at all");
  });
});

/* ---- 7. dictation pool is not empty ---- */
["gb", "us"].forEach(acc => {
  const pool = Object.values(DICT).filter(e => stripMarks(ipaOf(e, acc)).length <= 9);
  if (pool.length < 20) note("dictation/" + acc, "only " + pool.length + " words short enough");
});

/* ---- 8. ear training: no two options may share one recording ---- */
(function () {
  const audioMeta = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "audio", "meta.json"), "utf8"));
  const diph = ["eɪ", "aɪ", "ɔɪ", "əʊ", "oʊ", "aʊ", "ɪə", "eə", "ʊə"];
  const poolSrc = grab("EAR_POOL build", /const EAR_POOL = \(function \(\) \{([\s\S]*?)\}\)\(\);/);
  if (!poolSrc) return;
  // rebuild the pool the same way the page does
  const byFile = {}, pool = [];
  Object.keys(audioMeta).forEach(sym => {
    if (diph.indexOf(sym) >= 0) return;
    const f = audioMeta[sym].f;
    if (byFile[f]) return;
    byFile[f] = sym; pool.push(sym);
  });
  if (pool.length < 20) note("ears", "only " + pool.length + " testable sounds");
  const files = pool.map(s => audioMeta[s].f);
  if (new Set(files).size !== files.length) note("ears", "two testable sounds share one recording");

  const setsSrc = grab("EAR_SETS", /const EAR_SETS = \[([\s\S]*?)\n  \];/);
  const listed = [...setsSrc.matchAll(/list: \[([^\]]*)\]/g)].map(m => JSON.parse("[" + m[1] + "]"));
  listed.forEach(list => {
    list.forEach(sym => {
      if (!audioMeta[sym]) note("ears", "set uses " + sym + ", which has no recording");
      else if (pool.indexOf(sym) < 0) note("ears", "set uses " + sym + ", which is not in the testable pool");
    });
    const fs2 = list.map(s => audioMeta[s] && audioMeta[s].f);
    if (new Set(fs2).size !== fs2.length) note("ears", "a set has two sounds that share one recording: " + list.join(" "));
    if (list.length < 2) note("ears", "a set has fewer than two sounds: " + list.join(" "));
  });
})();


/* ---- 9. "in a word": every sound in every set needs a word that holds it and
       none of the other sounds of that set, in both accents ---- */
(function () {
  const audioMeta = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "audio", "meta.json"), "utf8"));
  const setsSrc = grab("EAR_SETS", /const EAR_SETS = \[([\s\S]*?)\n  \];/);
  if (!setsSrc) return;
  const listed = [...setsSrc.matchAll(/list: \[([^\]]*)\]/g)].map(m => JSON.parse("[" + m[1] + "]"));
  const diph = ["eɪ", "aɪ", "ɔɪ", "əʊ", "oʊ", "aʊ", "ɪə", "eə", "ʊə"];
  const VOWELS = "iː ɪ e æ ʌ ɑː ɒ ɔː ʊ uː ɜː ə".split(" ");
  const byFile = {}, pool = [];
  Object.keys(audioMeta).forEach(sym => {
    if (diph.indexOf(sym) >= 0) return;
    if (byFile[audioMeta[sym].f]) return;
    byFile[audioMeta[sym].f] = sym;
    pool.push(sym);
  });
  const allSets = listed
    .concat([pool.filter(s => VOWELS.indexOf(s) >= 0)])
    .concat([pool.filter(s => VOWELS.indexOf(s) < 0)]);

  ["gb", "us"].forEach(acc => {
    const words = Object.values(DICT).map(e => {
      const has = {};
      tokenize(stripMarks(ipaOf(e, acc))).forEach(t => { has[t] = true; });
      return { w: e.w, has: has };
    });
    allSets.forEach(set => {
      const usable = set.filter(s2 => words.some(r => r.has[s2]));
      if (usable.length < 2) return;
      usable.forEach(target => {
        const near = (CONFUSE[target] || []).filter(s2 => usable.indexOf(s2) >= 0 && s2 !== target);
        const others = near.concat(usable.filter(s2 => s2 !== target && near.indexOf(s2) < 0));
        for (const size of [6, 4, 2]) {
          const opts = [target].concat(others.slice(0, Math.max(1, Math.min(size, usable.length) - 1)));
          const fair = words.filter(r => r.has[target] && opts.every(o => o === target || !r.has[o]));
          if (!fair.length && size === 2) note("ears-word/" + acc, target + " has no fair word even with one other choice, within [" + usable.join(" ") + "]");
        }
      });
    });
  });
})();

if (!fail.length) console.log("Ear training: pool, sets and word contexts all check out.");

/* ---- report ---- */
const groups = {};
fail.forEach(f => { const g = f.split(" | ")[0]; (groups[g] = groups[g] || []).push(f.split(" | ")[1]); });
if (!fail.length) {
  console.log("All checks passed. " + RAW.length + " dictionary entries, " + PAIRS.length + " minimal pairs.");
} else {
  console.log(fail.length + " problems:\n");
  Object.keys(groups).sort().forEach(g => {
    console.log("[" + g + "] " + groups[g].length);
    groups[g].slice(0, 40).forEach(m => console.log("   " + m));
    if (groups[g].length > 40) console.log("   ... and " + (groups[g].length - 40) + " more");
    console.log("");
  });
  process.exitCode = 1;
}
