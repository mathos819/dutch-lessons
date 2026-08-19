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
3. Drill feedback must teach: wrong answers show the correct form + which rule
   applies, pronounce the answer, and offer ▶/🐢 replay buttons.
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
