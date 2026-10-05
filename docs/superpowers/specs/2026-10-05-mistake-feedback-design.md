# Mistake-aware drill feedback — design

**Goal:** every wrong answer tells Matheus *why* it was wrong: what exactly he typed
wrong, whether it's a rule he can work out or something to memorize, and how that
rule works. Built in `les-02` first, then ported to `les-03`…`les-05` and used for
every future lesson.

## Feedback layout (wrong answer)

1. `✗ <correct answer>` + ▶/🐢 (auto-plays, as before).
2. **Your mistake** — a diagnosis of *the typed answer*, e.g. "You wrote *mak*: the
   vowel wasn't doubled."
3. **Type tag** — one of:
   - `RULE` — derivable, you can work it out;
   - `EXCEPTION` — memorize (with the reason, when there is one);
   - `IRREGULAR` — whole verb learned by heart (hebben, zijn);
   - `SOUND` — heard right, spelled a sound-alike (ei/ij, z/s, v/f, g/ch…);
   - `TYPO` — one letter off.
4. **How we get there** — step-by-step derivation (infinitive → base → form),
   open on wrong answers, collapsed on right ones.
5. **How does … work?** — collapsible explanation of the mechanism behind each
   rule involved (2–4 lines) with audio examples.

Correct answers show `✓ Goed zo!` with the derivation collapsed.

## Mistake detectors

Each drill's `check()` returns `{ ok, correct, say, mistakes: [ids], rules: [ids], steps: [html] }`.
Detection, in order:

- **Base drill:** typed infinitive / kept -en; then *rule-skipping*: re-derive the
  base with each subset of the verb's rules skipped — a match names the skipped
  rule(s); *over-application*: doubling a digraph (proeef), an unstressed -el/-er
  (wandeel) or the exception (koom).
- **Conjugation drill:** wrong person ending (ik + t, missing -t, infinitive in
  singular, base in plural), tt, short-vowel `gat`; irregular verbs: typed form
  belongs to another person (`hij hebt`); otherwise the base detector applied
  through the ending (`hij makt` → vowel doubling).
- **Listening drill:** sound-alike substitutions (ei↔ij, z↔s, v↔f, g↔ch, long vs
  short vowel, single vs double consonant).
- Fallback: edit distance 1 → `TYPO`; otherwise correct answer + rules + steps.

## Data

- Rule explanations live in one `RULES` dictionary (`id → name, kind, how, examples`)
  shared by all drills; the derivation steps are generated from each verb's
  `rules: [ids]` list (a verb may use several: praten = double + endT).
- At load, the page self-checks that every derivation reproduces the stored base
  (logs a console error otherwise).

## Session tally

Under each drill's scorebar: mistakes grouped by rule ("Vowel doubling ×3"); each
entry expands to that rule's explanation. Resets on reload.

## Constraints

Inline in each `index.html` (file:// + offline); every audio example pre-generated
with edge-tts FennaNeural at both speeds.
