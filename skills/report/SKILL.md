---
name: report
description: Use when Julien types /report, or asks a master what is going on, where things stand, whether something is blocked or where he should help. Gives a quick overview from the task store (what moves, what is stuck and why, what needs him, what shipped). Run it in a master (an app, platform or fleet master); it reads, it never starts work.
---

# Report: where things stand

Read the state from the task store (`task list`, `task show`), your open pull requests (`gh pr list --author @me`) and your running
workers (`herdr agent list`). Not from memory: your notes may be hours old.

Answer short, in plain words, in this order. Leave out a section with nothing in it.

1. **Moving.** Requests in `planning`, `in-progress` or `verifying`, one line each: number, title, what it is doing now, the pull
   request or worker if there is one.
2. **Stuck.** A request with no history entry for a long time, a failing check, a stopped worker, something you wait on (a
   master, a service, a deploy). Say what is wrong and why, not only that it is.
3. **Needs Julien.** Each open question or review (number, what it asks, your recommendation), each pull request waiting for his
   merge, each deploy or gate that is his. For each: what he can do to unblock it.
4. **Done.** What shipped since the last report.

Rules:

- A report reads. Do not start work, answer a question for Julien, or change a request's state because he asked for one.
- The fleet master reports on the whole fleet: add one line per master (alive, working on what, stuck or free).
- One screen. Detail goes behind the request number, which Julien can ask about.
