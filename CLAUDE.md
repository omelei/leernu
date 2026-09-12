# Working agreements

## Sources, and which one wins

The product has four sources. When they disagree, the higher one wins, and the
resolution is recorded in an ADR in `docs/DECISIONS.md`:

1. The private business documents — decision document above business plan.
2. The styleguide.
3. The design (`docs/*.dc.html`).
4. The code.

## Public and private

This repository is public, deliberately (ADR-014). The business documents live
in a private companion repository, cloned into `prive/`, which `.gitignore`
excludes and CI checks.

- Never copy figures, pricing rationale, competitor analysis, funnel
  assumptions or validation results from `prive/` into this repository — not
  into code, comments, ADRs, commit messages or pull requests.
- A public ADR records what the app does. Where the reason is a business
  decision, it cites the private register by its ID (for example "register
  R-03") and nothing more.
- If `prive/` is absent, as in a Codespace, say so. Do not guess a business
  decision.

## Plan, design and code move together

A change is not done until the business documents, the design and the code
agree.

- Before changing behaviour, check `prive/REGISTER.md` for the business decision
  it touches and its status.
- After the change, update the register row: the ADR, the design artboard and
  the code location.
- Every pull request says whether the register was updated.
- A decision marked "voorgesteld" in the register is not built.
