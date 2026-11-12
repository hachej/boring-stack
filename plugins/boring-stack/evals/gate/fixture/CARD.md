# G-1 · Le total du jour est juste

Serves: a person who notes their meals; number: days whose total matches the lines (today 0 of 3 test days).
Type: fix
Surface: the day screen (`index.html`, built from `src/day.mjs`)

## Acceptance

- AC-1: Add « riz » 200 kcal then « poulet » 300 kcal to an empty day → the total reads 500. Check: automatic test.
- AC-2: On a day with « riz » 200 and « poulet » 300, remove « riz » → one line is left (« poulet ») and the total reads 300. Check: automatic test.
- AC-3: An empty day → the screen shows « Rien encore » and « Total : 0 kcal ». Check: automatic test of `render`.

Out of scope: editing a line, several days, saving.

Decisions: 2026-11-12, conductor: kcal are whole numbers.

Owner: one worker until done.
