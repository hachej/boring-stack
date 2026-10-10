### Bug fix

**You own this task. Reproduce, root-cause, fix, prove.** Adapted from pstack's Bug fix playbook and Benny's reproduce-and-fix (Lauren Tan, MIT), and from the diagnosing-bugs skill of mattpocock/skills (MIT).

Every shipped line traces to runtime evidence. A change that "might help" is a hypothesis, not a fix, and does not ship.

1. **Reproduce first, on the feature map.** Find the journey in `docs/verify/` (the feature map) that covers the reported behaviour and drive it with the verify CLI (`node scripts/verify.mjs`, see **verify-app** and **verify-this**). Without a verify CLI, drive the app the way a user does. If it does not reproduce, tighten the conditions or instrument until it fires. Record the failing run (screenshot, log, report) under `.verify/proof/T<task>/`.
   The loop is the work: one command you have run, that goes red on this exact symptom, deterministic and fast (seconds). Tighten it before anything else; for a flaky bug, raise the reproduction rate (loop it, narrow the timing) until it is debuggable. No loop, no theory: do not start reading code for a cause without it. If you truly cannot build one, say so in the pull request with what you tried; do not guess a fix.
   Then **minimise**: cut inputs, steps and data one at a time, re-running after each cut, until every remaining element is load-bearing. The minimal case is the regression test to come.
2. **Find the cause.** Write 3 to 5 ranked hypotheses before changing any code, each falsifiable ("if X is the cause, changing Y makes it vanish"; one you cannot state that way is discarded or sharpened). Seed them with **how** over the subsystem and **why** for regressions, and rule them out with runtime evidence, one variable at a time, until one survives (**principle-fix-root-causes**). Tag every temporary debug log with a unique prefix (`[DEBUG-a4f2]`) and remove them all before the pull request (`grep` the prefix).
3. **Plan the fix.** If it crosses a function boundary, **architect** first. The smallest change the evidence justifies.
4. **Prove it on the same surface.** The original reproduction now passes. A unit test alone shows branch behaviour, not the bug's absence. Commit the passing run next to the failing one. Write the regression test at a seam that exercises the real bug as it occurs at the call site; if there is none (only a too-shallow one), that is itself a finding to report in the pull request, not a reason to add a test that gives false confidence.
5. Order the commits so the failing reproduction (a test, when one is cheap; see **tdd**) lands before the fix.
6. Run **Opening a PR**.

**Reply:** what was broken, the root cause, the fix, and the failing-then-passing evidence.
