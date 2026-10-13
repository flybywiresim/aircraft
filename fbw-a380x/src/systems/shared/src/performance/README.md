# A380X EFB performance estimates

The EFB calculators in this directory are simulator estimates for the A380-842
with Trent 972B-84 engines. They are not Airbus performance data and must not
be used for real flight planning.

The speed estimates use the A380X `OperatingSpeeds` lookup tables. The modeled
empty weight comes from the A380X `flight_model.cfg`. The reference calculations
below came from the FlyByWire A380-842 airframe in SimBrief Dispatch on
2026-10-13. SimBrief's OFP API supplies flight and weather inputs; it does not
supply the Dispatch calculator outputs to the EFB.

| Case | Inputs | SimBrief result |
| --- | --- | --- |
| Takeoff OMDB 12R | 361,546 kg, TORA 14,157 ft, dry, 32 C, QNH 1014 hPa, wind 090/05, flaps optimum | Flaps 1, V1 143, VR 153, V2 154 kt, FLEX 75 C, stop margin 3,002 ft |
| Takeoff OMDB 30L | 361,546 kg, TORA 14,590 ft, dry, 32 C, QNH 1014 hPa, wind 090/05, flaps 2 | V1 142, VR 142, V2 144 kt, FLEX 74 C, stop margin 2,747 ft |
| Landing OMDB 30R | 354,380 kg, dry, 32 C, QNH 1014 hPa, wind 090/05, FULL, VREF +5, reverse on | VAPP 135 kt, AUTO 1 actual 6,831 ft, factored 8,614 ft |
| Landing OMDB 12R | Same mass and weather, opposite runway direction | AUTO 1 actual 6,197 ft, factored 7,804 ft |

Additional OMDB 12R dry takeoff samples with 090/06 wind and the same weather
give FLEX 75 C at 320 t, 74 C at 400 t, and 55 C at 500 t. The corresponding
stop margins are 3,395, 1,434 and 1,420 ft. At OMDB 30R, FULL/dry/reverse,
090/05 wind, the landing calculator gives 6,476 ft actual at 320 t and 7,273 ft
at 395 t. The models interpolate these samples; they do not reproduce the
underlying SimBrief performance engine.

The takeoff model estimates runway limits, speeds, FLEX and accelerate-stop
distance for dry, wet and contaminated surfaces. The landing model estimates
distances for three brake modes and a factored distance. Its correction factors
outside the listed reference cases are heuristic. Published LDA is not available
from the EFB runway data, so the calculator does not report an LDA margin.

The EFB converts runway lengths (ft/m), mass (lb/kg), temperature (F/C) and
pressure (inHg/hPa) to the model's internal units. Departure and arrival airport,
runway, weather and mass can be entered separately or imported from an OFP.
The A380X CG field uses percent MAC, can be filled from the current payload CG,
and is required for both calculations. The 23-48% MAC input guard is an
approximate envelope; it is not a validated weight-dependent certification chart.
Takeoff is capped at 510 t and landing input at 395 t. These limits and the
estimated runway limit do not replace an aircraft-specific performance chart.

Recalibrate these estimates against additional A380X reference cases before
treating results away from the reference conditions as reliable. In particular,
short or contaminated runways, high airport elevations, high temperatures,
engine-out limits, and nonstandard braking have not been validated.
