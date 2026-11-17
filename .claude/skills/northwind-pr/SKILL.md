---
name: northwind-pr
description: Write a pull request title and description in the Northwind team format (ticket-ID title, what changed, how I verified it, acceptance criteria, deliberately not done) from the branch diff, git log, and ticket. Use when the user invokes /northwind-pr or asks for a PR description in the Northwind or team format.
---

# /northwind-pr

Write the pull request title and description for the work on this branch, in the Northwind team format.

A reviewer reads this before the diff. Its job is to say what changed, prove it works, and be honest about what is missing.

## What to do

### 1. Read before writing anything

Do all of these before drafting a single line. Do not guess at any of it.

- `git diff main...HEAD --stat`, then `git diff main...HEAD`: what actually changed
- `git log main..HEAD --oneline`: what the commits say, in order
- The ticket in `docs/tickets/`. Take the ticket ID from the branch name (`NWP-101-export-options` → `NWP-101`) and open `docs/tickets/<TICKET-ID>.md`. If the branch name has no ticket ID, or the file does not exist, stop and ask the user which ticket this is.

If `main` is not the base, ask which branch is.

### 2. Collect the verification evidence

List every check that was **actually run** for this change, with what it printed. Evidence comes from two places only:

- Commands run earlier in this conversation, whose output you can see
- Commands you run now, such as `npm test` in `build-battle/merchant-console`

For each one, keep the exact command and the line that shows the result, for example `Tests  36 passed (36)`.

Anything you cannot point to output for was not run. Do not list it as verified. Browser checks count only if they actually happened. Say who did them: the user clicking, or a script.

### 3. Check each acceptance criterion against the code

Copy the ticket's acceptance criteria checkboxes word for word. For each one, find the code that meets it.

- Met: tick it.
- Partly met: leave it unticked and add a note saying which part is done and which is not.
- Not met: leave it unticked and say so.

Never tick a box because the work was intended. An honest unticked box is better than a ticked one the reviewer finds is false.

### 4. Write the description

Use exactly these parts, in this order:

**Title**

```
<TICKET-ID>: <what it does>
```

Short, plain, present tense, from the user's side: `NWP-101: add export options`, not `NWP-101: implemented ExportDialog component`.

**Body**

```markdown
## What changed

One paragraph in plain language. What can people do now that they could not do before, and how does it work at a high level? Not a file list; the diff already is one.

## How I verified it

- `<command>`: <what it printed>
- <what was clicked or requested, by whom or by what, and what appeared>

## Acceptance criteria

- [x] <criterion, verbatim from the ticket>
- [ ] <criterion>: partial. <what is done, what is not>

## Deliberately not done

- <out-of-scope item, or follow-up, and why it was left>
```

For **Deliberately not done**, include:

- Anything the ticket lists as out of scope that the change touches or sits near
- Bugs found but not fixed, with the file and the root cause
- Tests that were not written, and why
- Follow-up work the change makes possible or necessary

If there is genuinely nothing, write `Nothing.` Do not drop the section.

### 5. Show it, then offer to open it

Print the title and the body. Save the body to a file, then offer:

```bash
gh pr create --title "<TICKET-ID>: <what it does>" --body-file <file>
```

Ask before running it. Opening a pull request is the user's decision. If the pull request goes to a repository other than the branch's own, say which one and confirm it.

## Rules

- **Never claim a verification that was not run.** No "tests pass" without the output, no "checked in the browser" without a browser check that happened. If something was not verified, say so under How I verified it or Deliberately not done.
- **Never guess.** If the diff, log, or ticket does not tell you something, leave it out or ask. A gap is better than a made-up detail.
- **Plain language.** "Ops can choose which columns go in the export" beats "implemented configurable column selection functionality".
- **No file lists in What changed**, no emoji, no filler, no closing summary.
- **Keep it scannable.** Short paragraphs, real bullets.
