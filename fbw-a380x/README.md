# A380X Project Files

The project directory is structured as follows:

```text
- docs            <Specific docs for the project>
- src             <src files required for the project>
- out             <contains MSFS package folder after the build>
```

The `out` folder can be deleted as it is completely recreated during the build.
This is essentially a clean build.

## A380X INOP systems

These systems are currently not operational / these features are missing and shall thus not lead to bug reports.

This list is divided into standardized ATA chapters, if there are no noteworthy systems missing from a chapter, the chapter heading is hidden (this was different in a previous version of this list). This list is not exhaustive, there might be details missing in other systems which are not stated here.

<!-- ### ATA 20 Aircraft General / Exterior 3D Model -->

<!-- ### ATA 21 Air Con / Pressurization / Ventilation -->

<!-- ### ATA 22 Flight Envelope -->

### ATA 22 Autoflight / FCU

- FLS
- THR NOISE, DCLB

### ATA 22 Flight Management System (FMS)

- Incomplete pages see [fbw-a380x/src/systems/instruments/src/MFD/pages](https://github.com/flybywiresim/aircraft/tree/master/fbw-a380x/src/systems/instruments/src/MFD/pages)
- Full separation into three synchronized FMCs and two FMSs (currently one FMC serving one FMS)
- EO modes / EO SID
- Accurate CI, OPT and REC MAX FL computation
- NADP (see THR NOISE above)
- Fuel planning on FMS/FUEL&LOAD page
- ATC / datalink / CPDLC
- FCU BKUP

### ATA 23 Communication

- RMP: HF, TEL, MENU, SATCOM, DATALINK pages
- CIDS: CALLS buttons

<!-- ### ATA 24 Electrical -->

<!-- ### ATA 25 Equipment / Cockpit 3D Model -->

<!-- ### ATA 26 Fire and Smoke Protection -->

### ATA 27 Flight Controls

- Completely migrated SLAT/FLAP CTL implementation (adapted A32NX computers at the moment)
- Automatic THS setting on ground

### ATA 28 Fuel

- Refuel Driver/Refuel Application placeholder pseudo-FQMS implementation (pre-cursor for realistic FQMS implementation while supporting instant load)
  - CPIOM etc. not implemented yet.
- Automatic fuel transfer system - Not fully implemented yet i.e. AGT off when 2 engines on
- Manual refueling - Not supported yet
- Integrated Refuel Panel - Simulated in the systems but not modeled in the plane model, or fully connected to ELEC
- MFD entry - Not supported yet (ZFW/ZFWCG entry - Possible via EFB currently for testing)

### ATA 29 Hydraulic System

- No accumulators / LEHGS systems
- Brakes: Systems were carried over from A32NX, with adapted parameters for A380X
- Gear system: Some systems were carried over from A32NX, with adapted parameters for A380X
- Hydraulic actuation of flaps/slats not finalized
- Hydraulics Cooling

<!-- ### ATA 30 Ice and Rain Protection -->

### ATA 31 Indicating / Recording / ECAM / EFIS / Displays

- CDS / displays (automatic) reconfiguration
- PFD backup scales
- Interactive ND
- Vertical Display: Only fixed vertical range (until FL240) w/o FMS trajectory
- Independent QNH
- KCCU soft keyboard
- ECAM abnormal sensed: No navigation up/down, only CLEAR selectable for manual completion
- ECAM: Abnormal non-sensed procedures
- ECAM Deferred procedures
- ECAM ABN secondary failures
- ECAM: Completely accurate STS page implementation
- ECAM: AUTO RCL
- ECAM: Correct behavior of RCL / RCL LAST
- Video: ETACS due to sim limitation
- Latest FMA indications for landing modes (e.g. LAND3 instead of CAT3)
- SD VIDEO page

### ATA 32 Landing Gear / Braking / BTV

- Gear system not yet final
  - Wrong door sequence
- BTV simplified logic only
  - Basic braking distance calculations
  - No glide slope adaptation
  - No handling of brakes/OANS errors

<!-- ### ATA 33 Lights -->

### ATA 34 Navigation

- MMR implementation including GPIRS position
- GLS

### ATA 34 Surveillance / TCAS / TAWS / WXR / XPDR

- Weather radar / WXR
- TAWS obstacles

### ATA 34 ROW/ROP

- Automatic detection of landing runway (needs FMS to have landing runway selected)
- Shift of touchdown point according to position on glide slope

### ATA 35 Oxygen

- Oxygen masks test P/B

<!-- ### ATA 36 Bleed Air -->

### ATA 42 Avionics Network

- Communication between systems using AFDX (ARINC protocol used mostly)

<!-- ### ATA 49 APU -->

### ATA 52 Doors

- CKPT DOOR functions
- All cargo and passenger doors animated. Most of main deck done right now

### ATA 70 Engines

- Custom engine model (current model is modified LEAP-1A)
- ACUTE
- METOTS
- Reversers: Electrical system for triple lock safety system

<!-- ### Misc / Sim specifics -->
