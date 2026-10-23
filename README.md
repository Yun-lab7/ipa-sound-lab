# Sound Lab

An IPA practice page for the 44 phonemes of English, in **Cambridge Dictionary notation**. One static HTML file, no dependencies, no build step, no backend.

**Live site**: once GitHub Pages is on, `https://<your-account>.github.io/ipa-sound-lab/`

## What it does

| Mode | What you do |
| --- | --- |
| **Chart** | The phonemic chart in the printed layout: monophthongs in a 4×3 block, diphthongs beside them, consonants in three rows. Tap any cell to hear the sound itself and open its articulation. |
| **Hear one sound** | Ear training on single phonemes, in the spirit of [English Accent Coach](https://www.englishaccentcoach.com/). Pick the sound from 2, 4 or 6 choices, in one of two contexts. **On its own** plays a real recording with no word around it. **In a word** plays a short word, chosen so that it holds the answer and none of the other choices. Choose all vowels, all consonants, or a confusable set such as *θ s f* or *l r*. A wrong answer offers **Hear both**, which replays your guess and then the right answer. |
| **Dictation** | Hear a word and spell every sound with the IPA keyboard. Reveal the next sound, show the spelling, or check — wrong symbols are underlined. |
| **Word lookup** | Type a word or a whole sentence and get a transcription per word, with each symbol tappable. |
| **Pick the transcription** | Hear a word, choose between four transcriptions that differ by one phoneme. |
| **Minimal pairs** | ship/sheep, thin/sin, cold/gold — tell apart two words one phoneme apart. |

## Which sounds your ear misses

The ear-training mode keeps a score for every sound, not just a total. Under the question it shows your hardest sounds as bars — the ones you pick wrong most often. The set list has **My weak sounds**, which drills only those. Scores are stored in your browser and can be cleared from the panel.

This is what makes single-sound practice worth doing: a whole-word test hides the problem, because context lets you guess. With one sound and no context there is nothing to guess from. The **in a word** context is the next step up — the sound is back in a real word, but the word is picked so that no other choice appears in it, so guessing still does not work.

Nonsense syllables such as *ba da ga* would be the classic middle step, but they need speech synthesis to read made-up spellings, and no spelling reliably produces /θ/, /ð/, /ʒ/ or /ŋ/. Real short words give the same task and cover every sound.

A **UK / US** switch drives everything: the chart inventory, the dictionary forms, the quiz answers, and the speech-synthesis voice.

## Real voices for every sound

Tapping a chart cell plays a **recording of a person saying that sound on its own** — not a word containing it, and not speech synthesis. The files come from Wikimedia Commons and are stored in `audio/`, used unchanged.

English diphthongs have no single recording on Commons, because they are glides rather than cardinal IPA sounds. They are played as their two parts, one after the other: /eɪ/ is the /e/ recording followed by the /ɪ/ recording. Both halves are credited.

Every sound panel names its own recording, its author, and its licence, and links to the file on Commons. The full list is in [audio/CREDITS.md](audio/CREDITS.md).

**Licensing:** the page code is MIT. The recordings are **not** — 35 of the 36 are CC BY-SA 3.0 and one is public domain. If you reuse them, keep the attribution and the share-alike terms. Example words are still spoken by the browser's speech synthesis, which needs no licence.

To refresh or extend the audio:

```bash
node tools/fetch-audio.js            # check which files exist and their licences
node tools/fetch-audio.js --download # save them and rewrite CREDITS.md
```

## Animated mouth shapes

Every phoneme opens a panel with two animated views, looping from rest into the articulation and back:

- **Front** — a lifelike mouth seen as if in a mirror: lip rounding and spreading, jaw opening, teeth on the lip for /f v/, tongue between the teeth for /θ ð/. This is the shape to copy.
- **Side** — a schematic cross-section: tongue position, the soft palate raising or lowering for nasals, the closure and release of a plosive, friction for fricatives, and whether the vocal folds are vibrating.

Both are drawn from one parametric state, so the timeline differs per manner: plosives close, hold and burst; fricatives hold a constriction; nasals drop the velum and route air through the nose; diphthongs glide from one tongue position to the next. Animation is skipped when the browser reports `prefers-reduced-motion`.

The drawings are schematic, not recordings. Every sound panel therefore links straight to the real thing on [Seeing Speech](https://www.seeingspeech.ac.uk/ipa-charts/) — animation, MRI and ultrasound of that sound, with the chart opened on the right tab.

Their footage cannot be embedded here: it is © University of Glasgow, and the site sends `X-Frame-Options: SAMEORIGIN`, so no other page can frame it. Linking out is the only lawful and technically possible route.

Other real-speaker resources worth knowing about:

- [eNunciate! (UBC)](https://enunciate.arts.ubc.ca/) — 91 ultrasound-overlay videos of a real speaker, one per IPA sound, under CC BY-NC-ND 4.0, so they may be shared unmodified, with attribution, for non-commercial use.
- [Wikimedia Commons IPA recordings](https://commons.wikimedia.org/wiki/Category:International_Phonetic_Alphabet) — human recordings of individual phonemes under CC BY-SA 3.0, which could replace speech synthesis for isolated sounds.

## The 44 phonemes

- **12 monophthongs** — iː ɪ ʊ uː e ə ɜː ɔː æ ʌ ɑː ɒ
- **8 diphthongs** — ɪə eɪ ʊə ɔɪ əʊ eə aɪ aʊ
- **24 consonants** — p b t d tʃ dʒ k ɡ · f v θ ð s z ʃ ʒ · m n ŋ h l r w j

The first eight consonant pairs differ only in voicing, so voiceless cells are drawn pale and voiced cells in full colour. Cambridge also writes the weak vowels /i/ (happ**y**) and /u/ (sit**u**ation); they sit in their own row outside the 44.

US English merges /ɒ/ into /ɑː/, has no /ɪə eə ʊə/, and adds the r-coloured /ɚ ɝː/.

## Cambridge conventions used here

- A dot marks a syllable break: `comfortable /ˈkʌmf.tə.bəl/`
- UK transcriptions print a final `r` that is only sounded before a vowel: `car /kɑːr/`, but `park /pɑːk/`
- `əl` and `ən` are written in full rather than as syllabic consonants: `table /ˈteɪ.bəl/`
- The US flap diacritic `t̬` is left out to keep the keyboard to one symbol per sound

## Running it

No build. Open `index.html`, or serve the folder:

```bash
python -m http.server 8000
```

## Publishing to GitHub Pages

Settings → Pages → Source → **Deploy from a branch**, branch `main`, folder `/ (root)`. The URL appears after about a minute.

## Known limits

- Single sounds play from real recordings. Example words still use the browser's built-in `speechSynthesis`, so UK and US voices depend on the operating system. On Windows, add them under Settings → Time & language → Speech.
- The recordings are Ogg Vorbis, which some older browsers (notably older Safari) cannot play. When playback fails the page falls back to speaking the example word.
- The dictionary holds about 300 common words. Anything else is transcribed by letter-to-sound rules and tagged **guess**. To add words, edit the `RAW` array in `index.html`: `word|UK|US`, with the third field left out when the two match.

## Credits

- [Cambridge Dictionary phonetics key](https://dictionary.cambridge.org/zht/help/phonetics.html) — the symbol set and conventions
- [British Council · Sounds Right](https://www.britishcouncil.org.tw/teach/courses-resources/sounds-right) — chart layout
- [Seeing Speech](https://www.seeingspeech.ac.uk/ipa-charts/) — real articulation imaging

## Licence

MIT — see [LICENSE](LICENSE).
