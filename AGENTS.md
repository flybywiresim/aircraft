# AGENTS.md

This file applies to the entire repository. More specific `AGENTS.md` files, if added below this directory, override it for their subtree.

## Repository map

- `fbw-a32nx/`: A320neo-specific package, instruments, TypeScript systems, models, behaviors, and WASM.
- `fbw-a380x/`: A380-specific package, instruments, TypeScript systems, and WASM.
- `fbw-common/`: code shared by both aircraft, including SDK utilities, instrument components, typings, tests, and common WASM crates.
- `fbw-ingamepanels-checklist-fix/`: separate in-game panel package.
- `scripts/`: setup, build, packaging, lint, and development-container entry points.
- `tools/`: standalone project utilities.
- `large-files/`: Git submodule for large binary assets. Do not modify its contents or submodule pointer unless the task explicitly concerns those assets.
- `igniter.config.mjs`: top-level build graph. `fbw-a32nx/mach.config.js` and `fbw-a380x/mach.config.js` register instrument entry points.
- `fbw-*/out/`, `build/`, `target/`, instrument bundles, and generated localization files are build products; change their source or generator rather than generated output.

Put aircraft-independent behavior in `fbw-common` when both aircraft genuinely share the same contract. Keep aircraft geometry, configuration, simvars, and system behavior in the relevant aircraft tree. Preserve existing path aliases such as `@flybywiresim/*`, `@shared/*`, and `@instruments/*` instead of adding long relative imports.

## Generated sources

- Do not modify generated behavior XML sources in `generated` folders.
- Do not modify the generated `model/` folders in the fly-by-wire WASM modules: `fbw-a32nx/src/wasm/fbw_a320/src/model/` and `fbw-a380x/src/wasm/fbw_a380/src/model/`.

## Environment and build system

The pinned Docker development environment is the source of truth for full builds and CI-equivalent validation. Initialize the submodule before building.

```sh
git submodule update --init
./scripts/dev-env/run.sh ./scripts/setup.sh
./scripts/dev-env/run.sh ./scripts/build.sh
```

On Windows, use `scripts\dev-env\run.cmd` in place of `run.sh`. Setup runs `pnpm install`; keep `pnpm-lock.yaml` synchronized and do not introduce another package manager lockfile.

**Important:** Set `FBW_TYPECHECK=1` in the environment to enable TypeScript checks. This must be done before code is considered deliverable.

Useful scoped commands:

```sh
# Full aircraft builds (the -r expression selects Igniter tasks)
./scripts/dev-env/run.sh ./scripts/build.sh -r "a32nx"
./scripts/dev-env/run.sh ./scripts/build.sh -r "a380x"

# Instrument-only development, from the selected aircraft directory
pnpm exec mach build -f PFD
pnpm exec mach watch -f PFD

# Or from the repository root
pnpm exec mach build --config fbw-a32nx/mach.config.js --work-in-config-dir -f PFD
```

Mach/esbuild contains native binaries. If dependencies were installed inside the Linux container, host-side Mach can fail; run it in a matching environment or reinstall the host binary as described in the instrument README. Full builds also require the initialized `large-files` submodule. Avoid a full two-aircraft build when a focused instrument, crate, or test validates the change.

The Rust workspace is defined by the root `Cargo.toml`, pinned by `rust-toolchain.toml`, and targets `wasm32-wasip1`. C++/WASM code is built through the root CMake configuration and `scripts/build-cmake.sh`.

## React versus FSComponent

This repository has two unrelated JSX runtimes. A `.tsx` suffix alone does not identify which one a file uses. Before editing or moving instrument code, inspect the instrument's nearest `tsconfig.json`, its entry point, and its registration in the aircraft `mach.config.js`.

### MSFS SDK FSComponent instruments

The normal instrument tsconfig uses:

```json
"jsxFactory": "FSComponent.buildComponent",
"jsxFragmentFactory": "FSComponent.Fragment"
```

Mach registers these with `msfsAvionicsInstrument(...)`. Current examples include PFD, ND, EWD, FCU, Clock, MFD, OANC, and SDv2 (the exact lists differ by aircraft).

- Use `DisplayComponent`, `FSComponent`, `VNode`, `Subject`/`MappedSubject`, event-bus publishers and subscribers, and SDK lifecycle methods.
- Keep `FSComponent` imported when JSX needs the configured factory; ESLint intentionally exempts that name from unused-variable reporting.
- Use FSComponent JSX conventions, notably `class`, subscribable attributes, and SDK refs. Do not mechanically convert them to React's `className` or React refs.
- Create subscriptions in the appropriate lifecycle phase (usually `onAfterRender`). Retain subscriptions/resources and destroy them in `destroy()`, then call `super.destroy()`.
- Mount with `FSComponent.render(...)` from the base instrument's `connectedCallback`; drive publishers/backplanes from the instrument update lifecycle.
- Do not use React hooks, React context, `ReactDOM`, or React-only libraries in an FSComponent tree.

### React instruments

React instruments extend `tsconfig.react.json`, whose JSX factory is `React.createElement`, and Mach registers them with `reactInstrument(...)`. Examples include EFB and BAT plus legacy or aircraft-specific instruments such as A32NX SD and A380X SD/RTPI.

- Use React 17 conventions: `className`, React refs, hooks, context/providers, and the existing React render helper.
- Use `@flybywiresim/fbw-sdk-react` hooks where established. Clean up timers, listeners, and subscriptions in the `useEffect` cleanup function.
- Follow the Rules of Hooks even though the root ESLint configuration cannot yet enforce every React rule.
- Do not pass React elements or hooks into an FSComponent subtree. Share framework-neutral data/model code when logic is needed by both runtimes.
- New instruments should use FSComponent; the instrument README explicitly says to avoid React for new instruments unless the development team agrees otherwise.

When adding an instrument, update the appropriate `mach.config.js`, choose the correct helper, add the matching local tsconfig inheritance, and follow a neighboring instrument's base-instrument registration and package layout.

## TypeScript and JavaScript conventions

- TypeScript is preferred in `src/systems`; JavaScript is mainly for build/config scripts and legacy exceptions.
- The simulator runtime targets ES2017/Coherent GT. Do not assume Node.js APIs or modern browser APIs are available in shipped instrument code.
- Use 2 spaces, single quotes, trailing commas where Prettier emits them, and a 120-column print width. Let repository ESLint/Prettier rules decide formatting.
- The TypeScript strictness plugin is incremental. Do not add `// @ts-strict-ignore` to new files or broaden an existing exemption merely to silence errors; keep new and modified code strictly typed where practical.
- Prefix intentionally unused parameters or locals with `_`. Do not add blanket ESLint disables when a narrow line-level exception is sufficient.
- Preserve the copyright/SPDX header style used by neighboring files. When modifying a file with a copyright header, extend its ending year to the current calendar year; retain existing holders and SPDX identifiers.
- Keep simulator reads/writes, event-bus topics, ARINC validity handling, units, and update frequency explicit. Avoid polling faster than the source data requires.
- Follow local naming and file organization. Instrument folders contain domain-specific conventions that are more authoritative than distant examples.

## Rust and C++ conventions

- Format Rust with `cargo fmt`; keep Clippy warning-free under the flags in `scripts/lint-rust.sh`.
- Add Rust unit tests close to the module under test. Use package-scoped commands during iteration, then workspace validation when warranted.
- Follow the root `.clang-format` (Chromium base, two-space indentation, 140-column limit) or a closer subtree override for C/C++.
- Preserve physical units and simulation update semantics. Prefer the existing typed-unit and simulation-element abstractions over raw numeric values.

## Changelog

Treat `.github/CHANGELOG.md` as the list of user-visible differences from the previous stable release, not as a record of every change merged to the development branch.

- Add an entry only when the change affects something users can observe and that difference exists relative to the previous stable release.
- Do not add entries for backend-only refactors, maintenance, or improvements with no user-visible effect.
- Do not add an entry for a fix to a regression introduced after the previous stable release: if stable users never had the bug, the fix is not a stable-to-current change.
- Before adding an entry, use the previous stable release as the baseline rather than assuming every user-visible pull request qualifies.
- Add new entries at the end of the current release's list. The current release is the first release section at the top of the file; append immediately before the next release heading, without reordering existing entries.
- Follow the format documented in the comments at the top of `.github/CHANGELOG.md`, including starting each item with `1.`.

## Tests and validation

Run the smallest relevant checks first, followed by the broader checks justified by the change.

```sh
# TypeScript/JavaScript
pnpm lint
pnpm test
pnpm exec vitest run path/to/file.spec.ts

# Rust (CI-equivalent scripts)
./scripts/dev-env/run.sh scripts/lint-rust.sh
./scripts/dev-env/run.sh scripts/test-rust.sh

# Faster scoped Rust iteration
cargo test -p <package>
cargo clippy -p <package> --all-targets --all-features -- -D warnings -A clippy::too_many_arguments -A deprecated
```

TypeScript tests are colocated as `*.spec.ts`/`*.spec.tsx`; Vitest uses `jsdom` and `fbw-common/src/jest/setupJestMock.ts`. Add regression tests for pure logic and system behavior where feasible. UI or simulator-coupled changes should also receive a focused Mach build and an in-simulator check when behavior cannot be covered outside MSFS. Report which checks ran and which could not run.

Before handing off a change:

1. Review `git diff` and do not include build products, secrets, `.env` changes, or unrelated user modifications.
2. Run lint/tests for touched languages and a focused build for affected instruments or aircraft.
3. Keep `pnpm-lock.yaml` and `Cargo.lock` changes intentional.
4. For contributions, follow `.github/Contributing.md`: realism changes need supporting documentation, commits/PR titles use Conventional Commits, and qualifying user-visible changes require an entry in `.github/CHANGELOG.md` as described above.
