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

## G8. Shell task scope: H1-only pages (owner-approved)

To keep this task shell-only, each page renders just its spec H1 (needed for
focus/title behaviour). Deferred to the page-content tasks: §6.6 404 card
wrapper + home link, Home `space-y-10`, all page grids/cards. The 404 title
`CreditLens — Page not found` is an implementation choice: §3 lists five titles
but no 404 title.

## G9. Prototype needs network for screenshot fidelity

`docs/ui/creditlens_credit_risk_research_demo.html` loads Tailwind and Google
Fonts from CDNs. The screenshot tests wait for `networkidle`, but offline CI
would capture an unstyled prototype. The app itself uses local fonts/CSS and
no CDN.

## G10. Screenshots not visually reviewed by the agent

The agent cannot view PNG files, so screenshot correctness was verified by
file existence/size and passing Playwright assertions only. Owner should
eyeball `frontend/tests/e2e/__screenshots__/shell-{360,768,1280}-pair.png`.

## G11. Playwright browser install

The cached Chromium builds did not match Playwright 1.65.1; `npx playwright
install chromium` downloaded the required build (browser binary only, no npm
dependency change). CI must run the same install before e2e tests.