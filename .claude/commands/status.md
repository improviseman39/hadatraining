---
description: Report current project status in the HOW TO REPORT TO HK format, without changing any code.
---

Read `docs/STATUS.md` (the Phase 1 feature checklist) and recent repo history
(`git log --oneline -20`) for this project. Do not edit, create, or modify
any files or code as part of this command - this is a read-only report.

Using only what those two sources show, print a status report in exactly
this format (plain English, no code words):

WHERE WE ARE: X of Y Phase 1 features done (Z%) - full list: docs/STATUS.md
WHAT I JUST DID: 3-5 short bullet points, based on the most recent commits
WHAT'S NEXT: the next 3 not-yet-done features, taken from docs/STATUS.md
WHAT I NEED FROM YOU: numbered steps (where to click, what to paste), or "Nothing - type continue"
HOW TO CONTINUE: the exact thing the user should type

If `docs/STATUS.md` doesn't exist yet, or doesn't contain a Phase 1 feature
list, say so plainly in the WHERE WE ARE line instead of guessing at
numbers, and ask the user what should go in it.
