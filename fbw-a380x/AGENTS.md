# A380X agent guide

This file applies to `fbw-a380x/` and supplements the repository-root `AGENTS.md`. Follow a more specific guide if one exists deeper in the tree.

## Scope and layout

This tree builds the A380-842 (Trent 972B-84) aircraft for the MSFS 2024 package layout.

- `src/base/flybywire-aircraft-a380-842/`: hand-maintained MSFS package source, copied to `out/flybywire-aircraft-a380-842/` during a local build.
- `src/localization/`: A380X MSFS localization source and generator.
- `src/systems/`: TypeScript avionics, hosted systems, failures, and instruments.
- `src/wasm/`: Rust systems plus C++ flight-control, FADEC, and extra-backend modules.
- `docs/a380-simvars.md`, `docs/a380x-input-events.md`, and `docs/a380x-private-local-vars.md`: local simulator-interface contracts. Update the appropriate document when a public or private interface changes.
- `README.md`: current known-INOP and simplified-system inventory. Check it before diagnosing or expanding incomplete behavior.

The current filesystem, not the preliminary layout shown in `src/README.md`, is authoritative; this tree does not presently have the A32NX-style top-level model or behavior generator directories.

A380 systems are not enlarged A320 systems. Some areas are temporarily adapted from A32NX and are explicitly listed as incomplete. Do not copy A32NX constants, laws, display logic, or naming into A380X without an A380-specific source. Extract into `fbw-common` only when the contract is aircraft-independent.

## TypeScript systems

The major non-WASM areas are:

- `systems-host/CpiomC`, `CpiomD`, and `CpiomF`: CPIOM-hosted avionics behavior grouped by IMA partition role.
- `systems-host/Misc` and `systems-host/PseudoPRIM`: other host modules and temporary integration. Preserve explicit pseudo/placeholder boundaries; do not present provisional behavior as a completed aircraft system.
- `systems-host/CpiomC/FlightWarningSystem`: large FWS implementation. Keep ATA/system ownership, event-bus inputs, flight-phase logic, and output ordering clear; avoid unrelated bulk reformatting in generated or table-like sections.
- `extras-host/`: simulator integration outside the primary avionics host.
- `failures/`: failure bundle.
- `shared/src/publishers/`: A380X-only publishers. Put a publisher in `fbw-common` only if its topic contract and semantics are shared.

Hosted systems use the MSFS EventBus and the local base-instrument lifecycle. Reuse existing publishers and backplanes instead of polling the same simvar independently in multiple displays. A new update path must have an explicit rate and power/lifecycle owner.

Use aliases from `src/systems/tsconfig.json`, especially `@shared`, `@instruments`, and `@flybywiresim/*`. Preserve CPIOM and ATA terminology in names; it conveys runtime ownership, not merely folder organization.

## A380X instrument runtimes

The authoritative list is `mach.config.js`.

FSComponent/MSFS SDK instruments:

- `Clock`, `EWD`, `FCU`, `MFD`, `ND`, `OIT`, `PFD`, `RMP`, `SDv2`, and `popup`.
- `FCU` has the non-default entry point `FcuBaseInstrument.ts`.

React instruments:

- `BAT`, `EFB`, `ISISlegacy`, `OITlegacy`, `RTPI`, and `SD`.

`ATCCOM` exists in the source tree but is not currently registered as a standalone Mach instrument. Do not infer build inclusion from the presence of a folder; trace its imports and owning entry point. Likewise, `SD` and `SDv2`, or `OITlegacy` and `OIT`, are distinct runtime generations. Make changes in the active owner and avoid adding new dependencies from FSComponent code back into legacy React code.

Instrument package identifiers use the `A380X_` template namespace and normally mount into `<NAME>_CONTENT`. Preserve registrations and base-package references. EFB requires the additional shared map-instrument HTML import configured in Mach.

Do not normalize existing A380X simvar names based only on prefixes. Some integrations retain legacy or shared names; the docs, publisher definitions, and all call sites together define the contract.

## WASM and package integration

- `src/wasm/systems/a380_systems/`: testable Rust aircraft systems library.
- `src/wasm/systems/a380_systems_wasm/`: thin simulator/WASM integration crate. Keep domain behavior out of the wrapper where possible.
- `src/wasm/fbw_a380/`: C++ flight-control/autopilot module.
- `src/wasm/fadec_a380x/`: active CMake-built A380X FADEC module. A separate `fadec_a380/` tree also exists; verify its build ownership before editing it rather than assuming both are packaged.
- `src/wasm/extra-backend-a380x/`: A380X-specific extra backend.

The MSFS 2024 aircraft installs panel WASM under `SimObjects/AirPlanes/FlyByWire_A380X/attachments/flybywire/Part_Interior_Cockpit/panel/`, not the shorter A32NX panel path. Treat this attachment path as a package contract and do not commit generated `.wasm` output.

Many Rust systems depend on shared simulation abstractions from `fbw-common`. Keep aircraft dimensions, tank topology, actuator counts, engine counts, and A380 scheduling in `a380_systems`; only generic simulation machinery belongs in the common crate.

## Build and validation

From the repository root, use the pinned development environment for the complete aircraft:

```sh
./scripts/dev-env/run.sh ./scripts/build.sh -r "a380x"
```

Use focused commands while iterating:

```sh
# One instrument
pnpm exec mach build --config fbw-a380x/mach.config.js --work-in-config-dir -f MFD

# Targeted TypeScript and Rust tests
pnpm exec vitest run fbw-a380x/src/systems/instruments/src/MFD/shared/QnhUtils.spec.ts
cargo test -p a380_systems

# Relevant independent bundles
pnpm run build-a380x:systems-host
pnpm run build-a380x:extras-host
```

Run the full A380X Igniter build for base-package, localization, shared instrument, systems-host/WASM integration, or packaging changes. For an instrument change, build the affected FSComponent or React entry point and check it in the simulator when behavior depends on display-unit index, power, event timing, input routing, or package attachments.

Use A380 technical documentation for behavioral changes and distinguish implemented, simplified, placeholder, and INOP behavior in code and review notes. Do not close a known gap with speculative behavior merely because a comparable A32NX implementation exists.
