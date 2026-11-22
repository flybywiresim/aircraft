# A380X virtual crew

A virtual crew member following the FBW A380X SOP, in a button mode: the user is the pilot flying (PF) in the seat
of the camera, the virtual crew member is the pilot monitoring (PM).

The user manual is [`fbw-a380x/docs/virtual-crew/README.md`](../../../../../docs/virtual-crew/README.md) (PDF built with
`tools/virtual-crew-manual`).

- The PM performs the flows of the SOP, makes the callouts (e.g. "Thrust set", "V1", "Positive climb",
  "Localizer alive", "One thousand to go", "Reverse green") and reads the checklists of the ECL.
- The **primary button** does the next thing of the SOP, shown on the Crew page of the flyPad: respond to the
  checklist item, request the available checklist, start the line-up flow at the holding point, or give the next
  order (e.g. "Takeoff", "Gear up", "Flaps one", "Gear down", "Go around, flaps"). The PM executes and confirms.
  Orders the PF executed manually are skipped.
- The **secondary button** stops the checklist being read, rejects the takeoff ("Stop") before V1, otherwise skips
  the pending order.

The buttons are sim events selected in the flyPad (Settings > Virtual Crew) and bound to a controller in the MSFS
controls, or the local variables `L:A380X_VCREW_PRIMARY_BUTTON` / `L:A380X_VCREW_SECONDARY_BUTTON` (write 1).

The items of the captain are left to the user: APU, FMS, seat belts signs, anti ice, nose and runway turnoff lights
for the taxi.

## A flight

| Phase (SOP chapter) | Started by | PM flow (automatic) | Primary button |
|---------------------|------------|---------------------|----------------|
| Preflight (optional, 40 min) | flyPad ("OK, let's get it started") | workflows of the PM seat, at their time, exterior walkaround after the fire tests (6 min outside, the countdown can be accelerated) | COCKPIT PREPARATION C/L after the takeoff briefing |
| Takeoff briefing | flyPad, without preflight | | |
| Before start | end of the preflight or briefing | transponder AUTO (SSR policy VATSIM) once BEFORE START C/L done and beacon ON | BEFORE START C/L |
| Engine start | engine mode selector IGN START | callouts: start valve open, fuel flow, engine stable | |
| After start | engine mode selector NORM | ground spoilers ARM, flaps as briefed, autobrake RTO, pitch trim to the takeoff THS of the FMS (THS FOR) | AFTER START C/L, then the flight control check: "Flight control check", the PM announces full up/down, left/right, rudder and neutral (secondary button: skip) |
| Taxi | parking brake released, moving | | brake check: "Brake check", the PM announces "pressure zero" when the brakes are pressed (secondary button: skip); then TAXI C/L (the PM presses T.O CONFIG), then the line-up flow |
| Before takeoff | primary button at the holding point | strobe ON, nose light T.O, transponder AUTO (SSR policy IVAO), TCAS TA/RA, seat belts double cycle, "Cabin crew, seats for takeoff" | LINE-UP C/L, then "Takeoff" (PM: landing and nose lights) |
| Takeoff | thrust levers FLX/TOGA | callouts up to positive climb | gear up, flaps 1, flaps 0 |
| After takeoff | flaps retracted | ground spoilers DISARM, nose and runway turnoff lights OFF | |
| Climb | after takeoff flow | "Transition" at the transition altitude, then "Altimeter standard" (PF once on STD, PM after setting theirs); landing lights and wing lights OFF passing 10000 ft, one thousand to go | |
| Cruise | FMGC cruise phase, or ALT CRZ / ALT CRZ* on the FMA | | |
| Descent preparation | approach briefing (flyPad) | autobrake as briefed | |
| Descent / Approach | FMGC | "Transition" at the transition level, then "QNH ..." (PF once set to the APPR PERF QNH, PM after setting theirs); landing lights ON, wing lights ON at night and "Cabin crew, seats for landing" passing 10000 ft; localizer and glideslope alive; speed | APPROACH C/L, then flaps 1, flaps 2, gear down (and ground spoilers ARM, runway turnoff lights ON, nose light T.O), flaps 3, flaps full, then LANDING C/L |
| Go-around | FMGC | positive climb | "Go around, flaps", gear up, flaps 1, flaps 0 |
| Landing | below 100 ft RA | callouts: spoilers, reverse green, decel, seventy knots | |
| After landing | ground spoilers disarmed, below 30 kt, turned off the runway | flaps 0, strobe AUTO, landing lights OFF, nose light TAXI, TCAS STBY, XPDR STBY (SSR policy IVAO), FD, LS and ND overlays OFF, APU start | "Taxi lights off": nose, runway turnoff (and taxi camera) and wing lights OFF |
| Parking | parking brake set after "taxi lights off" (or engines off) | APU bleed ON once the APU is available; once the engines are shut down (off or shutting down): anti ice and fuel pumps OFF, XPDR STBY (SSR policy VATSIM) | PARKING C/L once the engines are shut down |
| Securing | PARKING C/L | | SECURING THE AIRCRAFT C/L, then the flight ends |

On the A380 FCU the baro knob is pushed for STD and pulled for QNH (unlike the A320). The SSR policy (flyPad setting)
selects when the transponder is set to AUTO and to STBY: VATSIM (before start / parking) or IVAO (line-up / after
landing).

Only the checklists of the ECL are read. Items whose ECL response ends with "(BOTH)" are answered by the PF, then by
the PM with the same words once verified. The items of the ECAM memo (T.O and LDG) are read as one item: "ECAM memo"
... "takeoff, no blue" / "landing, no blue", verified together. The PM verifies the items: sensed items by the FWS or in the cockpit, some
non sensed items through the aircraft state or the briefings (anti ice, autobrake, minimum of the FMS).

## Briefings

The takeoff briefing (preflight or before start) and the approach briefing (cruise) are entered in the flyPad, with
the data of the FMS as default values, and spoken by the PF when performed: "are you ready for the departure
briefing?" ... "go ahead", the briefing, "any questions?" ... "no questions". Free text entries (taxi route, engine
failure procedure, threats) are confirmed with a generic phrase. Numbers, runways, frequencies and letters are spoken
with the radiotelephony words (`speech/Phrases.ts`). The flows use the briefings: takeoff flaps, anti ice, autobrake,
landing flaps (FULL or 3).

## Cockpit controls

The controls operated by the PM are listed in `CockpitControls.ts`. They use the actions of the aircraft presets of
the flyPad and the events of the MFD SURV page, and can be tested from the flyPad (Settings > Virtual Crew).

## flyPad interface

The flyPad sends commands with `L:A380X_VCREW_COMMAND` (parameter in `L:A380X_VCREW_COMMAND_PARAM`) and reads the
state from the `L:A380X_VCREW_*` variables of `VirtualCrewStatusLocalVars` (shared/src/VirtualCrew.ts).

## Structure

| File                           | Purpose                                                                    |
|--------------------------------|----------------------------------------------------------------------------|
| `VirtualCrewCore.ts`           | The crew without simulator access: phases, flows, checklists, orders, callouts (unit tested with a complete flight) |
| `VirtualCrew.ts`               | Reads the aircraft, executes the actions, handles buttons, commands and settings |
| `FlightPhaseManager.ts`        | Flight phases, preflight countdown, preflight workflows (unit tested)      |
| `procedures/`                  | Sequences of PM callouts and PF orders: takeoff, approach, go-around      |
| `VirtualCrewEngine.ts`         | Executes a procedure (unit tested)                                         |
| `flows/`                       | Flows of the PM after the preflight and their triggers                     |
| `workflows/`                   | Preflight workflows, items performed at a human pace (unit tested)        |
| `checklists/`                  | ECL checklists, reading and ECL operation (unit tested with a model of the ECL) |
| `callouts/`                    | Engine start, altitude, approach and rollout callouts                      |
| `briefing/`                    | Briefing data and spoken briefings                                         |
| `speech/`                      | Composition of numbers, runways, frequencies and letters                   |
| `CockpitControls.ts`           | Cockpit controls operated by the PM, test actions of the flyPad            |
| `VoicePlayer.ts`               | Plays the phrases one after the other                                      |
| `voice-lines.json`             | The phrases, single source for the code and the voice generator            |
| `voice-line-durations.json`    | Generated by `tools/virtual-crew-voices`, duration of each phrase           |

The voices are generated with `tools/virtual-crew-voices`, see its README for the packaging.
