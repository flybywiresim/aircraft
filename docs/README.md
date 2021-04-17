# Documentation

## ❗❗❗ IMPORTANT ❗❗❗

* Use modern flight model (legacy flight model is not supported)
* It's crucial for the Autothrust system to have properly setup detents. Ensure that you have enough dead zone around the detents.
* Typical issues when this is not done properly: constantly flashing "LVR CLB", FLX / TOGA not engaging or ATHR not holding speed correctly (the latter can also happen when in CLB/OP CLB or DES/OP DES and flying manually -> in that case you need to take care of holding speed with pitch)

## Custom Autopilot and Autothrust System incl. new Engine model

⚠️ This is work in progress, there are still issues, see section Known issues below!

### Known issues

⚠️ The engine model is not yet finished for all conditions.

⚠️ The custom autopilot and autothrust system is not yet on study level. In order to achieve this level a longer effort is needed. The system is a large improvement over the default implementation and there is no reason to hold it back longer than necessary.

ℹ️ Tuning is a large effort to be done for differnt flight conditions like speed, configuration, weight and center-of-gravity (CG). You can help by reporting issues in certain flight conditions. Please take note of important conditions mentioned before.

#### Not solved or missing (this list is not conclusive)

##### Flight Management

- ❌ Due to lack of LNAV, the flaws of the default flight plan manager still apply (bank to left or right shortly after TO etc)
- ❌ Due to lack of VNAV, DES mode is currently only using SPD/MACH
- ❌ Due to lack of VNAV, RNAV approaches are not supported yet

##### Autopilot

- ❌ Transitions might not be as they should
- ❌ AP disconnect does not trigger master warning etc.
- ❌ NAV mode being armed might show dashes in the FCU instead of selected HDG
- ❌ Engine out operations are not yet considered
- ❌ AP performance when flying turbulence might not be satisfying in all cases
- ❌ AP is not disconnected due to turbulence

##### Engines

- ❌ Realistic start-up procedure is missing
- ❌ During start, no fuel flow is shown
- ❌ Realistic Descent/ Approach idle parameters / drag.

##### Autothrust

- ❌ N1 thrust limit displayed and achieved may differ
- ❌ Thrust limits are preliminary and not finished (they are currently lacking adaptation for Mach)

#### First implementation available

- 🔸 Switched to different default input source for LNAV, transitions are now better
- 🔸 Engines can now be started, realistic start-up procedure is in work
- 🔸 first implementation of custom ATHR system is now available
- 🔸 principle go-around mode has been added but not all conditions are respected yet
- 🔸 NAV mode is for the time being using default flight plan manager until the custom is ready
- 🔸 altitude constraints seem to work with CLB and DES (there are many situations out there, so there can still be unknown bugs)
- 🔸 Fuel burn should be correct in flight
- 🔸 SPD/MACH hold might when flying in curves has been improved
- 🔸 FLEX thrust limit is still rough and is also not adapted for Mach yet
- 🔸 Pause and slew detection should be ok now
- 🔸 Fuel flow is currently always in KG
- 🔸 Thrust limits are now corrected for air-conditioning and anti-ice yet
- 🔸 LOC* has has been improved in capturing performance, might still need some tuning
- 🔸 Flare Law has been improved to handle fast raising ground before the runway; when in 200 ft RA, the ground should in the area of the runway slope, otherwise issues are to be expected

#### Considered solved

- ✔️ In case the default AP is for any reason engaged it will be automatically disconnected
- ✔️ In manual approach LOC and G/S might be lost too fast with mode reversion to HDG + V/S
- ✔️ FMA indications for ATHR system are missing
- ✔️ due to this workaround, the engine EGT can go into read area when in (OP) CLB/DES (see workaround above)
- ✔️ due to missing custom ATHR system, the (OP) CLB/DES modes might need manual thrust control
      -> a simple and hacky workaround has been added though
- ✔️ FD off/on does not deactivate all FMA items
- ✔️ Engagement of AP with FD off is incorrect
- ✔️ Flight Director (FD) guidance in pitch is not fully satisfying yet
- ✔️ Fuel used since start is not shown correctly on ECAM fuel page, it's basically 0
- ✔️ AP is disconnected due to sidestick or rudder input
- ✔️ EWD has been improved to correctly display N2 > 100

### Mapping of events to control autopilot / autothrust

⚠️ Not all events are working and it's also difficult to map all default events because there is no 100% match.

The recommendation is to use a combination of default events and the custom events to trigger the FCU. This has been tested with the Honeycomb Bravo Throttle and SPAD.next and works well.

Default events:
Event | Function
--- | ---
AP_MASTER | Toggles AP 1 master
AUTOPILOT_OFF | Disconnect AP (like red button on sidestick)
AUTOPILOT_DISENGAGE_TOGGLE | Same as AP_MASTER
AP_SPD_VAR_INC | Clockwise dial Speed knob on FCU
AP_SPD_VAR_DEC | Anti-clockwise dial Speed knob on FCU
HEADING_BUG_INC | Clockwise dial Heading knob on FCU
HEADING_BUG_DEC | Anti-clockwise dial Heading knob on FCU
AP_VS_VAR_INC | Clockwise dial V/S knob on FCU
AP_VS_VAR_DEC | Anti-clockwise dial V/S knob on FCU
AP_APR_HOLD | Push APPR button on FCU
AP_LOC_HOLD | Push LOC button on FCU
AUTO_THROTTLE_ARM | Push ATHR button on FCU
AUTO_THROTTLE_DISCONNECT | Disconnect ATHR (like red button on throttle levers)
AUTO_THROTTLE_TO_GA | Apply TOGA thrust

Custom events:
Event | Function
--- | ---
A32NX.FCU_AP_1_PUSH | Push AP1 on FCU
A32NX.FCU_AP_2_PUSH | Push AP2 on FCU
A32NX.FCU_SPD_PUSH | Push Speed knob on FCU
A32NX.FCU_SPD_PULL | Pull Speed knob on FCU
A32NX.FCU_SPD_MACH_TOGGLE_PUSH | Push SPD/MACH toggle on FCU
A32NX.FCU_HDG_PUSH | Push Heading knob on FCU
A32NX.FCU_HDG_PULL | Pull Heading knob on FCU
A32NX.FCU_ALT_PUSH | Push Altitude knob on FCU
A32NX.FCU_ALT_PULL | Pull Altitude knob on FCU
A32NX.FCU_VS_PUSH | Push V/S knob on FCU
A32NX.FCU_VS_PULL | Pull V/S knob on FCU
A32NX.FCU_LOC_PUSH | Push LOC button on FCU
A32NX.FCU_APPR_PUSH | Push APPR button on FCU
A32NX.FCU_EXPED_PUSH | Push EXPED button on FCU

### Sensitivity, dead zones and throttle mapping

ℹ️ It is recommended that the sidestick uses a linear sensitivity with only dead zone set appropriately.

ℹ️ It is recommended to use a linear sensitivity for the throttle axis.

ℹ️ The throttle configuration can be adapted using the EFB.

⚠️ When throttle sensitivity is changed, the throttle configuration needs to be adapted in most cases.

## Custom Fly-By-Wire System

⚠️ This is work in progress, there are still issues, see section Known issues below!

### Known issues

⚠️ The custom fly-by-wire system is not yet on study level. In order to achieve this level a longer effort is needed. The system is a large improvement over the default implementation and there is no reason to hold it back longer than necessary.

ℹ️ Tuning is a large effort to be done for differnt flight conditions like speed, configuration, weight and center-of-gravity (CG). You can help by reporting issues in certain flight conditions. Please take note of important conditions mentioned before.

#### Not solved or missing

- ❌ High speed protection
- ❌ High angle of attack (AoA) protection
- ❌ Alternative Law
- ❌ Direct Law (in flight)
- ❌ Simulation of hydraulic system missing -> when engines are off / electric pump is off control surfaces should not work

#### Considered solved

- ✔️ Normal Law (Pitch) creates a too small pitch rate on low speed or g-load on higher speeds
- ✔️ Rotation Law including tailstrike protection
- ✔️ pitch normal law (C* law) sometimes oscillates on low speed
- ✔️ yaw damper / rudder control missing
- ✔️ pitch attitude protections can oscillate
- ✔️ nose-down pitch attitude protection sometimes kicks-in too early
- ✔️ transformation from ground to flight mode might take longer than intended (nose might drop after releasing the stick)
- ✔️ auto-trim feature locks trim wheel completely
- ✔️ flare mode might be stronger than expected, needs to be investigated
- ✔️ after landing sometimes a slight pitch up moment is introduced, needs to be investigated
- ✔️ strange interaction with default auto thrust system -> thrust lever sometimes does not move, fix is to manually disable ATHR
- ✔️ after a longer pause the fbw system goes crazy
