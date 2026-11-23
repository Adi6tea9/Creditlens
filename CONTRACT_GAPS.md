# Contract gaps

Known conflicts and unknowns between the spec, the copy hardening rules, and
the tooling. Each entry says what is blocked and who must decide.

## G1. "confidence" wording conflict (owner decision needed)

- Hardening rule: no copy string may contain "confidence" in connection with
  the range or prediction.
- Spec §7.3 mandates verbatim: `Whether the applicant counts as thin-file, and
  how that affects confidence` — stored at `copy.score.getBack[1]`.
- The §7 verbatim test requires that exact string, so both rules cannot pass.
- Resolution (owner-approved 2026-11-23): documented exception in
  `frontend/tests/unit/copy.test.ts` (`documentedExceptions`, key
  `score.getBack.1`). Wording NOT changed. Remove the exception only when the
  spec itself changes.
- No "80%" / "80 %" hits exist anywhere in copy.

## G2. "dwell range" is not a concept in this spec

The hardening task refers to a "dwell range"; the spec has no dwell concept
(its range is the risk range, §6.3). The forbidden-wording check was applied
to all copy strings, which is strictly broader. Owner should confirm the rule
was meant for this project.

## G3. No lint tooling

No ESLint/Biome config or dependency exists, and the task forbids new
dependencies. "Run lint" is therefore unverified; typecheck (`tsc --noEmit`)
and the full Vitest suite are the available static checks. Owner decision:
approve adding a linter in a later task.

## G4. Placeholder values still unknown (spec §11, by design)

- `REPO_URL` = `[YOUR REPO LINK]` — owner must supply the real URL (the
  optional task item was a literal template, not a URL).
- `THIN_FILE_DEFINITION` / `THIN_FILE_SHORT` — stay placeholders until the
  owner provides text or `/meta` supplies it.
- `npm run check:placeholders` exits 1 while these remain. Do not weaken it.

## G5. fill() leaves unknown tokens untouched (proposal, not implemented)

`fill()` in `src/content/copy.ts` silently keeps `{typo}` tokens, which would
render literally. The token-safety tests now catch typos at test time.
Proposal for a later task: throw on unknown tokens when `import.meta.env.DEV`
or in test, keep production behaviour unchanged. Not done here per task
instructions.

## G6. Task paths vs repo paths

The hardening task named `docs/FRONTEND_SPEC.md` and
`frontend/src/config/copy.ts`; the repo actually has
`docs/FRONTEND_MASTER_SPEC.md` and `frontend/src/content/copy.ts`. The real
files were used; no files were moved.

## G7. Substring matching limitation

Verbatim checks assert substring presence in the spec. Short strings
("Approve", "Retry", "—", …) match trivially and could match an unrelated
sentence; the check cannot anchor context without a richer spec format.