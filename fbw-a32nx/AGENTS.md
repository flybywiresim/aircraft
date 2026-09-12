# A32NX agent guide

This file applies to `fbw-a32nx/` and supplements the repository-root `AGENTS.md`. Follow a more specific guide if one exists deeper in the tree.

## Scope and layout

This tree builds the A320-251N (LEAP-1A) aircraft and its optional lock-highlight package.

- `src/base/flybywire-aircraft-a320-neo/`: hand-maintained MSFS package source. The build copies it to `out/flybywire-aircraft-a320-neo/`.
- `src/base/flybywire-aircraft-a320-neo-lock-highlight/`: separate compatibility package; keep its changes isolated from the aircraft package.
- `src/model/` and `src/behavior/`: model and ModelBehavior source plus generators. Edit source inputs, not generated files in `out/` or generated base-package locations.
- `src/localization/`: A32NX MSFS localization source and build scripts.
- `src/systems/`: TypeScript systems and instruments.
- `src/wasm/`: Rust systems plus C++ flight-control, FADEC, and extra-backend modules.
- `docs/a320-simvars.md`, `docs/a320-events.md`, `docs/a32nx-input-events.md`, and `docs/a320-coherent-triggers.md`: local contracts for simulator integration. Update them when a public event or simvar contract changes.

Do not treat the A32NX as a generic source template for the A380X. Move code into `fbw-common` only when its domain contract is genuinely shared; aircraft configuration, control laws, geometry, performance data, and named simulator interfaces stay here.

## TypeScript systems

The major non-WASM areas are:

- `atsu/`: ATSU common and FMS-client code.
- `fmgc/`: flight management, guidance, and flight-planning logic. Its colocated `*.spec.ts` tests are the primary regression suite for flight-plan changes.
- `tcas/`: A32NX TCAS implementation.
- `systems-host/`: non-rendered systems hosted in a simulator `BaseInstrument`; systems communicate through the MSFS EventBus.
- `extras-host/`: non-avionics/extra simulator integration.
- `failures/`, `sentry-client/`, and `simbridge-client/`: their names identify separate bundles; avoid introducing runtime coupling between bundles through module side effects.
- `shared/`: A32NX-only shared code. Cross-aircraft code belongs in `fbw-common`, not here.

Systems-host components follow the local host lifecycle: obtain the EventBus in construction, connect subscriptions in `connectedCallback`, start publishing only when requested, and update only after publishing has started. Match an existing system in `systems-host/systems/` rather than creating a second host or update loop.

Use established aliases from `src/systems/tsconfig.json`, including `@atsu`, `@fmgc`, `@shared`, `@tcas`, `@instruments`, and `@flybywiresim/*`. Do not bypass the public index of a shared package unless nearby code deliberately does so.

## A32NX instrument runtimes

The authoritative list is `mach.config.js`.

FSComponent/MSFS SDK instruments:

- `Clock`, `EWD`, `FCU`, `MCDU`, `ND`, `OANC`, `PFD`, `popup`, and `RTPI`.
- `MCDU` has the non-default entry point `McduBaseInstrument.ts`.

React instruments:

- `SD`, `DCDU`, `RMP`, `ISIS`, `BAT`, `ATC`, and `EFB`.

This assignment is intentionally different from A380X—for example, A32NX `RTPI` is FSComponent while A380X `RTPI` is React. Check the local tsconfig before sharing JSX. FSComponent instruments inherit `src/systems/instruments/tsconfig.json`; React instruments inherit `tsconfig.react.json` through their local config.

Instrument package identifiers use the `A32NX_` template namespace and normally mount into `<NAME>_CONTENT`. Preserve entry-point names, template IDs, and registrations because base-package HTML/XML refers to them. EFB also requires the shared map-instrument HTML import configured in Mach.

## WASM and package integration

- `src/wasm/systems/a320_systems/`: testable Rust aircraft systems library.
- `src/wasm/systems/a320_systems_wasm/`: thin simulator/WASM integration crate. Keep domain logic in `a320_systems` or shared `systems`, not in the wrapper.
- `src/wasm/fbw_a320/`: C++ flight-control/autopilot module.
- `src/wasm/fadec_a32nx/`: A32NX FADEC module.
- `src/wasm/extra-backend-a32nx/`: A32NX-specific extra backend.

Built WASM modules are installed under `SimObjects/AirPlanes/FlyByWire_A320_NEO/panel/` in the output package. Do not commit those `.wasm` files. Preserve the simulator-facing ABI, named variables, and unit conversions when moving logic across Rust, C++, and TypeScript boundaries.

## Build and validation

From the repository root, use the pinned development environment for the complete aircraft:

```sh
./scripts/dev-env/run.sh ./scripts/build.sh -r "a32nx"
```

Use focused commands while iterating:

```sh
# One instrument
pnpm exec mach build --config fbw-a32nx/mach.config.js --work-in-config-dir -f PFD

# Aircraft systems tests
pnpm exec vitest run fbw-a32nx/src/systems/fmgc/src/flightplanning/FlightPlan.spec.ts
cargo test -p a320_systems

# Relevant independent bundles/generators
pnpm run build-a32nx:systems-host
pnpm run build-a32nx:fmgc
pnpm run build-a32nx:model
pnpm run build-a32nx:behavior
```

Choose checks according to the changed subsystem. A base-package, model, behavior, localization, cross-bundle, or WASM integration change warrants the Igniter aircraft build. A focused instrument build is sufficient for initial UI iteration but does not replace an in-simulator check for display timing, electrical behavior, events, or simvar integration.

When changing aircraft behavior, use A320 technical documentation and cite it in the contribution. Do not add convenience behavior that is unsupported by the simulated A320 standard described in the root README.
