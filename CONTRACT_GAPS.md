# Contract gaps

Known conflicts and unknowns between the spec, the copy hardening rules, and
the tooling. Each entry says what is blocked and who must decide.

## G1. Forbidden-wording rule removed (owner ruling, resolved)

The owner ruled that the spec's copy is the source of truth for CreditLens.
The "80%"/"confidence" forbidden-wording rule came from a different project
and does not apply here. The test was removed from
`frontend/tests/unit/copy.test.ts`; no spec wording and no copy string was
changed. G2 below was retired with it.

## G3. No lint tooling

No ESLint/Biome config or dependency exists, and the task forbids new
dependencies. "Run lint" is therefore unverified; typecheck (`tsc --noEmit`)
and the full Vitest suite are the available static checks. Owner decision:
approve adding a linter in a later task.

## G4. Placeholder values supplied; release check guards the rest (spec §11)

- `REPO_URL` = `https://github.com/Adi6tea9/Creditlens` — taken from
  `git remote -v` and approved by the owner; the footer link now resolves.
- `THIN_FILE_DEFINITION` / `THIN_FILE_SHORT` — now hold the owner's text;
  `/meta` still overrides them at runtime.
- `npm run check:placeholders` still greps `src/` and built assets for the old
  section 11 tokens and `is_sample` mock labels in production config, and now
  fails on empty config values or a `REPO_URL` that does not start with
  `https://github.com/`, lacks an owner and repo segment, or contains brackets,
  spaces or the words "your", "real", "repo-name". It exits 0 only when no
  finding remains. Do not weaken it.
- Spec §11 still lists the old `[REAL URL]` token; it was left unchanged by
  instruction and needs an owner update.

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