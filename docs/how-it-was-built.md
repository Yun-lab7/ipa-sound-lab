# How this project was built

An account of the decisions, the tooling and the mistakes behind Sound Lab, written so that
anyone picking the project up later can see why it is shaped the way it is.

## The shape of it

One file does almost everything: **`index.html`**, about 1.5 MB, with no dependencies, no build
step and no backend. Inside it are

- a 302-word dictionary in Cambridge Dictionary notation, UK and US,
- 36 recordings of single phonemes, embedded as `data:` URIs,
- articulation data and plain-word instructions for 49 symbols,
- the chart, five practice modes, and the animation code.

The Android app is **not a second codebase**. `android/app/src/main/assets/index.html` is a copy of
the root `index.html`, made at build time and gitignored, so the web version and the app version
cannot drift apart. The app adds only what a WebView lacks: playback without a user gesture, and a
bridge to the device's own text-to-speech.

```
index.html                      the whole application
audio/*.ogg                     the recordings, kept for provenance
audio/CREDITS.md                author and licence for every file
tools/check.js                  data and logic invariants
tools/fetch-audio.js            licence check, download, credits
android/                        WebView wrapper (Java, AGP, no extra code)
docs/how-it-was-built.md        this file
```

## Working on it

```bash
# edit index.html, then
node tools/check.js                                   # data and logic invariants
cp index.html android/app/src/main/assets/index.html  # keep the app in step
cd android && gradle assembleDebug                    # APK, about 1.9 MB
```

`index.html` opens straight from disk, so a server is only needed for service-worker-style testing.

## Decisions, and the evidence behind them

**Cambridge notation, not a house style.** The learner is using the Cambridge Dictionary, so the
page uses its conventions exactly: a dot for the syllable break (`ˈkʌmf.tə.bəl`), a final `r` in UK
forms that is only sounded before a vowel (`car /kɑːr/` but `park /pɑːk/`), `əl` and `ən` written in
full. The US flap diacritic `t̬` is the one omission, so that the keyboard keeps one key per sound.

**The Seeing Speech videos could not be used, by anyone.** They were the reference for the
animation, and the obvious wish was to embed them. Their server sends `X-Frame-Options: SAMEORIGIN`,
so no third-party page can frame them at all, and the footage is © University of Glasgow. Linking
out with a note on which symbol to press was the only lawful and technically possible route.

**Real voices, from a source that permits reuse.** Wikimedia Commons has a recording of each IPA
sound on its own: 35 under CC BY-SA 3.0 and one in the public domain. Every panel names its
recording, its author and its licence, and links to the file. The page's code is MIT; the audio is
not, and the README says so.

**English diphthongs are played as two files.** Commons has no single recording of /eɪ/, because
diphthongs are glides rather than cardinal IPA sounds. Rather than fake one, the page plays the /e/
recording followed by the /ɪ/ recording, credits both halves, and says what it is doing. The same
honesty applies in the ear test, where diphthongs are left out of the single-sound quiz entirely:
they would be identifiable for the wrong reason.

**The recordings travel inside the page.** They were first served as separate files, which worked
on the development machine and not on another — "on its own" played nothing. The audio element reported
`readyState 4` and advanced through the file here, so the fault was delivery, not logic. Embedding
them as `data:` URIs removed every network and policy question at a cost of 1.4 MB, and as a bonus
the page now runs from a local file with no server. The separate files remain as a fallback source.

**Nonsense syllables were rejected for the word context.** `ba / da / ga` was the obvious design for
practising a sound in context, but it needs speech synthesis to read invented spellings, and nothing
reliably yields /θ/, /ð/, /ʒ/ or /ŋ/ — four of the 24 consonants would be wrong or missing. Short
real words give the same task and cover everything. The word is chosen so that it contains the
answer and none of the other options shown, so exactly one choice fits.

## The tooling, and what it caught

### `tools/check.js`

Parses the data tables out of `index.html` and checks the things that fail quietly. On its first run
it found **seven real bugs**:

| Bug | Why it mattered |
| --- | --- |
| `cat` / `cup` offered as a minimal pair | They differ in **two** sounds (æ/ʌ and t/p) |
| `caught` / `court` offered as a minimal pair | **Homophones** in UK English; different lengths in US |
| `cut`, `we` used by the app but missing from the dictionary | Chart cells and sound panels pointed at nothing |
| `eye /aɪ/` in the four-option quiz | Too short to yield three near misses, so the quiz quietly showed three options |

Later rules were added for the ear test: no two options may share one recording (several symbols do
— iː/i, uː/u, ɜː/ɝː, ə/ɚ — and two identical-sounding buttons make a question impossible), and every
sound in every set needs a word that holds it and none of the other options, in both accents.

**The checker itself had a bug worth recording.** It printed its report before the last checks had
run, so late failures were collected and silently dropped. Moving the report to the end revealed two
real faults immediately: sets containing sounds the current accent never uses (US English has no
/ɒ/ and no /ɜː/, so no US word can carry them), and six-choice questions for which no single word can
avoid all five other options.

### `tools/fetch-audio.js`

Looks each sound up on Commons, reports the licence before anything is downloaded, fetches the files
with proper back-off, and writes `audio/CREDITS.md` from the API's own metadata rather than from
memory. Re-runnable: it skips files already present.

## How changes were verified

Three gates on every change, in this order:

1. **Syntax** — the page's script extracted and run through `node --check`.
2. **Invariants** — `node tools/check.js`.
3. **Behaviour** — the page driven in a real browser: click the controls, read the resulting DOM,
   watch for console errors and uncaught exceptions.

The third gate is the one that earns its keep, and it has to be written carefully. Several
"failures" during this project were faults in the test rather than the page:

- A tongue shape that "did not animate" was sampled twice inside the same hold phase of the loop.
- A dictation question that "did not move on" was compared by a label that reads the same before and
  after a new word.
- "Double counting" in the score was a counter carried over from an earlier page session.
- Stray 404s came from the test itself fetching files that were never meant to exist.

Each was checked before being believed. A test result that disagrees with the code is a claim about
one of them, and it is not always the code.

Rough handling found two more faults that ordinary use would not: 200 symbols typed into the
dictation box overflowed it, because the box was a flex row that never wrapped; and a link ending
`#ears` did nothing if the page was already open, because the hash was read once at startup. Things
that did **not** break: 120 tab clicks, 40 accent switches, 260 backspaces on an empty box, a
2000-word lookup, input with no English letters, and deliberately corrupted saved data, which the
page ignores and starts fresh from.

## Mistakes, and what they changed

**The sagittal diagram took four attempts.** The first versions were floating shapes that did not
read as a head. What finally worked was changing the construction, not the coordinates: the airway
became a stroked centre-line, so the cavity stays a smooth tube at any size, and the jaw became a
hinged group carrying the lower lip, the lower teeth and the tongue together.

**Three bugs were written and then found:** `hidden` set as a property on an SVG element, which is
not an IDL attribute there, so the Front/Side toggle highlighted but never switched; a malformed
path for the nasal airflow, rejected by the SVG parser on every nasal sound; and dictation comparing
the answer position by position, so leaving one sound out shifted everything after it and turned a
correct ending red. The last one showed up in ordinary use, and the fix was to align
the sequences by longest common subsequence instead.

**Two design faults, found by use rather than by testing:** changing the accent rebuilt every open
question and each rebuild played its own audio, so a settings button made a noise; and revealing the
whole transcription and then pressing Check still scored as a win. Settings are now silent, and a
word finished with help is left out of the score, in either direction.

## Known limits

- One speaker per sound. Real perceptual training uses many talkers so the ear learns the sound
  rather than a voice; freely licensed recordings do not allow that here.
- The articulation drawings are schematic, not recordings. Each panel links to Seeing Speech for MRI
  and ultrasound of the real thing.
- The audio is Ogg Vorbis, which older Safari cannot play. Playback failure falls back to speaking
  the example word and says so on screen.
- The dictionary holds about 300 words. Anything else is transcribed by letter-to-sound rules and
  tagged **guess**; English spelling has too many exceptions for rules alone.
