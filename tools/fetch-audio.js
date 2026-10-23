/* Look up one Wikimedia Commons recording per IPA symbol, then (with --download)
   save the files into audio/ and write audio/CREDITS.md.
   The recordings are other people's work, so every file keeps its author and licence.
   Run: node tools/fetch-audio.js            (check only)
        node tools/fetch-audio.js --download (check and save) */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

// symbol -> the Commons page title that holds that sound on its own
const WANTED = {
  // consonants
  "p": "Voiceless bilabial plosive.ogg",
  "b": "Voiced bilabial plosive.ogg",
  "t": "Voiceless alveolar plosive.ogg",
  "d": "Voiced alveolar plosive.ogg",
  "tʃ": "Voiceless palato-alveolar affricate.ogg",
  "dʒ": "Voiced palato-alveolar affricate.ogg",
  "k": "Voiceless velar plosive.ogg",
  "ɡ": "Voiced velar plosive.ogg",
  "f": "Voiceless labiodental fricative.ogg",
  "v": "Voiced labiodental fricative.ogg",
  "θ": "Voiceless dental fricative.ogg",
  "ð": "Voiced dental fricative.ogg",
  "s": "Voiceless alveolar sibilant.ogg",
  "z": "Voiced alveolar sibilant.ogg",
  "ʃ": "Voiceless palato-alveolar sibilant.ogg",
  "ʒ": "Voiced palato-alveolar sibilant.ogg",
  "h": "Voiceless glottal fricative.ogg",
  "m": "Bilabial nasal.ogg",
  "n": "Alveolar nasal.ogg",
  "ŋ": "Velar nasal.ogg",
  "l": "Alveolar lateral approximant.ogg",
  "r": "Alveolar approximant.ogg",
  "w": "Voiced labio-velar approximant.ogg",
  "j": "Palatal approximant.ogg",
  // vowels — the long and short English pair share one cardinal recording
  "iː": "Close front unrounded vowel.ogg",
  "ɪ": "Near-close near-front unrounded vowel.ogg",
  "e": "Open-mid front unrounded vowel.ogg",
  "æ": "Near-open front unrounded vowel.ogg",
  "ʌ": "Open-mid back unrounded vowel.ogg",
  "ɑː": "Open back unrounded vowel.ogg",
  "ɒ": "Open back rounded vowel.ogg",
  "ɔː": "Open-mid back rounded vowel.ogg",
  "ʊ": "Near-close near-back rounded vowel.ogg",
  "uː": "Close back rounded vowel.ogg",
  "ɜː": "Open-mid central unrounded vowel.ogg",
  "ə": "Mid-central vowel.ogg"
};
// symbols that reuse another symbol's recording
const ALIAS = { "i": "iː", "u": "uː", "ɝː": "ɜː", "ɚ": "ə" };

const titles = [...new Set(Object.values(WANTED))];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "sound-lab-build/1.0 (educational page; contact via repo)" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(res.headers.location));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(url + " -> HTTP " + res.statusCode)); }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

const clean = s => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

(async function () {
  const api = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo"
    + "&iiprop=url%7Cextmetadata%7Csize%7Cuser&titles="
    + titles.map(t => encodeURIComponent("File:" + t)).join("%7C");
  const data = JSON.parse((await get(api)).toString("utf8"));
  const pages = Object.values(data.query.pages);

  const found = {};
  const missing = [];
  pages.forEach(p => {
    const title = p.title.replace(/^File:/, "");
    if (p.missing !== undefined || !p.imageinfo) { missing.push(title); return; }
    const info = p.imageinfo[0];
    const meta = info.extmetadata || {};
    found[title] = {
      url: info.url,
      bytes: info.size,
      licence: clean(meta.LicenseShortName && meta.LicenseShortName.value) || "unknown",
      licenceUrl: clean(meta.LicenseUrl && meta.LicenseUrl.value) || "",
      author: clean(meta.Artist && meta.Artist.value)
        || (info.user ? info.user + " (Wikimedia Commons)" : "Wikimedia Commons contributors"),
      page: "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(title.replace(/ /g, "_"))
    };
  });

  console.log("found " + Object.keys(found).length + " of " + titles.length + " recordings");
  if (missing.length) console.log("MISSING:\n  " + missing.join("\n  "));
  const licences = {};
  Object.values(found).forEach(f => { licences[f.licence] = (licences[f.licence] || 0) + 1; });
  console.log("licences: " + JSON.stringify(licences));
  const freeish = /^(CC BY-SA|CC BY|CC0|Public domain|GFDL)/i;
  const nonFree = Object.entries(found).filter(([, f]) => !freeish.test(f.licence));
  if (nonFree.length) console.log("NOT CLEARLY FREE:\n  " + nonFree.map(([t, f]) => t + " — " + f.licence).join("\n  "));

  const dirEarly = path.join(__dirname, "..", "audio");
  if (process.argv.includes("--list")) {
    // Print "url<TAB>destination" so a downloader with proper back-off can fetch them.
    fs.mkdirSync(dirEarly, { recursive: true });
    const done = new Set();
    Object.values(WANTED).forEach(title => {
      const f = found[title];
      if (!f || done.has(title)) return;
      done.add(title);
      const name = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-ogg$/, "") + ".ogg";
      console.log(f.url.split("?")[0] + "\t" + path.join(dirEarly, name));
    });
    return;
  }
  if (!process.argv.includes("--download")) {
    console.log("\n(dry run — pass --download to save the files)");
    return;
  }

  const dir = path.join(__dirname, "..", "audio");
  fs.mkdirSync(dir, { recursive: true });
  const slug = {};
  const rows = [];
  for (const [sym, title] of Object.entries(WANTED)) {
    const f = found[title];
    if (!f) continue;
    const name = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-ogg$/, "") + ".ogg";
    const dest = path.join(dir, name);
    if (!fs.existsSync(dest)) {
      // Commons rate-limits bursts, so go slowly and back off on 429.
      const plain = f.url.split("?")[0];
      let buf = null;
      for (let tryN = 0; tryN < 5 && !buf; tryN++) {
        try { buf = await get(plain); }
        catch (err) {
          if (!/429/.test(err.message) || tryN === 4) throw err;
          await new Promise(r => setTimeout(r, 2000 * (tryN + 1)));
        }
      }
      fs.writeFileSync(dest, buf);
      process.stdout.write(".");
      await new Promise(r => setTimeout(r, 500));
    }
    slug[sym] = name;
    if (!rows.some(r => r.file === name)) {
      rows.push({ file: name, title: title, author: f.author, licence: f.licence, licenceUrl: f.licenceUrl, page: f.page });
    }
  }
  Object.entries(ALIAS).forEach(([a, b]) => { if (slug[b]) slug[a] = slug[b]; });
  console.log("\nsaved " + rows.length + " files for " + Object.keys(slug).length + " symbols");

  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(slug, null, 1));
  const meta = {};
  Object.entries(WANTED).forEach(([sym, title]) => {
    const f = found[title]; if (!f || !slug[sym]) return;
    meta[sym] = { f: slug[sym], t: title.replace(/.ogg$/, ""), a: f.author, l: f.licence, u: f.page };
  });
  Object.entries(ALIAS).forEach(([a, b]) => { if (meta[b]) meta[a] = meta[b]; });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
  const credits = "# Audio credits\n\n"
    + "Each recording below is one IPA sound spoken by a person. The files come from\n"
    + "Wikimedia Commons and are **not** original to this project. They are included unchanged, and each\n"
    + "keeps its own licence: the page code is MIT, the audio is not.\n\n"
    + "| File | Commons page | Author | Licence |\n| --- | --- | --- | --- |\n"
    + rows.map(r => "| `" + r.file + "` | [" + r.title + "](" + r.page + ") | " + r.author
      + " | [" + r.licence + "](" + r.licenceUrl + ") |").join("\n") + "\n";
  fs.writeFileSync(path.join(dir, "CREDITS.md"), credits);
  console.log("wrote audio/index.json and audio/CREDITS.md");
})().catch(e => { console.error("FAILED: " + e.message); process.exitCode = 1; });
