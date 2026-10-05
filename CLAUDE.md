# Dutch Lessons — practice site

Matheus is learning Dutch (beginner). Each lesson he attends has a PDF in
`~/Downloads` named `Les N, DD-MM-YYYY.pdf`. For each lesson, build an
interactive practice page in its own folder. **`les-02/` is the reference
implementation — read it before building a new lesson and follow its patterns.**

## Structure (one folder per lesson)

```
les-NN/
  index.html    # self-contained page: inline CSS + JS, no build step, works via file://
  audio/        # pre-generated pronunciation clips, normal speed
  audio/slow/   # same clips, natively slowed
```

## Building a new lesson page

1. Read the whole PDF first; the page must cover **everything** in it — tables,
   rules, examples, AND any exercise printed in the PDF (turn it into a drill).
2. Standard sections (adapt names/content to the lesson): reference tables with
   audio (Leer), flashcards (Woorden), one or more typed drills with
   rule-explaining feedback, listening dictation (Luisteren).
3. Drill feedback must teach — Matheus must always know *why* he was wrong.
   les-02 is the reference (spec: `docs/superpowers/specs/2026-10-05-mistake-feedback-design.md`):
   - **diagnose the typed answer**, not just show the right one: each drill has
     detectors that name the specific mistake ("ik never takes -t", "vowel not
     doubled", "ei/ij sound the same");
   - **tag the kind**: RULE (work it out) / EXCEPTION / IRREGULAR (memorize) /
     SOUND / TYPO — never present an exception as if it were a rule, and give
     the reason behind an exception when there is one;
   - **show the steps** (e.g. infinitive → base → form) and a collapsible
     "How does X work?" with the mechanism behind the rule + ▶/🐢 examples,
     all from one shared `RULES` dictionary;
   - per-drill "mistakes this session" tally grouped by rule;
   - pronounce the answer with ▶/🐢 replay buttons.
4. Reuse the drill engine, tab system, flashcard logic, and `speak()` audio
   fallback chain from `les-02/index.html` — copy, don't reinvent.
5. New grammar builds on old: include vocabulary/verbs from earlier lessons in
   drills when relevant.

## Audio (quality bar: neural voice, never `say`)

- Generate with edge-tts, voice **nl-NL-FennaNeural** (keep the same voice
  across lessons):
  - normal: `uvx edge-tts --voice nl-NL-FennaNeural --text "ik heb" --write-media audio/ik_heb.mp3`
  - slow:   same with `--rate=-35%` into `audio/slow/`
- Filename = phrase with spaces → underscores, lowercase, `.mp3`.
- Pre-generate every static item shown on the page (vocab, conjugation tables,
  listening items), both speeds. Batch with a shell script, ~6 concurrent, and
  verify no zero-byte files at the end.
- Every audio control on the page gets both ▶ and 🐢 (slow) options.
- In-page fallback chain (already in les-02's `speak()`): slow file → normal
  file at 0.65 playbackRate → browser speechSynthesis nl-NL.
- macOS `say -v Xander` was tried and rejected as too robotic. Don't use it.

## Visual identity (consistent across all lessons)

De Stijl / Mondrian: paper `#FAF9F4`, ink `#16150F`, red `#DE3B24`, blue
`#2247B5`, yellow `#F5C518`, 3px black rules. Fonts: Archivo Black (display),
Archivo (body), IBM Plex Mono (tables/drills) via Google Fonts with system
fallbacks. Nav = Mondrian blocks. Header eyebrow: `Nederlands · Les N · date`.

## Offline (iPhone Home Screen app)

The site is an installable PWA that works in airplane mode: `sw.js` serves pages
and audio from the cache (answering Safari's audio Range requests with 206s),
and `offline.js` — the download panel on the home page — fills that cache from
`offline-files.json` (path → content hash; only changed files are re-fetched).

Every lesson page must, like les-02:
- in `<head>`: link `../manifest.json` + `../icons/apple-touch-icon.png` and the
  `apple-mobile-web-app-*` metas;
- make the eyebrow's "Nederlands" an `<a class="home" href="../">← Nederlands</a>`
  link (the Home Screen app has no back button);
- load `<script src="../offline.js"></script>` before `</body>`.

**Before every commit that adds or changes lesson files, run
`python3 tools/build-offline.py`** — otherwise the phone never downloads them.

## Deploying (GitHub Pages)

Live site: **https://mathos819.github.io/dutch-lessons/** (repo
`mathos819/dutch-lessons`, personal account — NOT the zely account).
Git remote uses the SSH alias `github.com-personal`; plain `github.com`
resolves to the work key, and `gh` normally sits on the work account
(`mzely`) — switch with `gh auth switch --user mathos819` only if API
calls are needed, then **always switch back**: git's HTTPS credentials
come from gh's active account (`gh auth setup-git`), so while switched,
work repos fail with "repository not found". Never log in with
`gh auth login` again for this — the account is already added.

To deploy: commit and `git push` — Pages serves `main` at root, live in
~1 min. When adding a lesson, also add its card to the root `index.html`
lesson list. After pushing, curl the new lesson URL (expect 200).

## Definition of done (verify before claiming complete)

- Open the page in Chrome (chrome-devtools MCP) and check:
  - no console errors; audio files load and play (test one normal + one slow);
  - each drill: answer wrong on purpose → correct answer + rule shown; the
    conjugation/answer logic produces correct Dutch for several random rounds;
  - flashcards flip and deck completes.
- Reload the page after testing so scores start clean.
- All PDF content is represented on the page (do a final pass against the PDF).
