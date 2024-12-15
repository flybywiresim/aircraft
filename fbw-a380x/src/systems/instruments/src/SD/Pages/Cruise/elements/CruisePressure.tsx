import { useArinc429Var } from '@instruments/common/arinc429';
import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

export const CruisePressure = () => {
  // TODO: Handle landing elevation invalid SSM
  const landingElev = useArinc429Var('L:A32NX_FM1_LANDING_ELEVATION', 1000);
  const [autoMode] = useSimVar('L:A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO', 'Bool', 1000);

  const cpcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_CPCS_DISCRETE_WORD');
  const cpcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_CPCS_DISCRETE_WORD');
  const cpcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_CPCS_DISCRETE_WORD');
  const cpcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_CPCS_DISCRETE_WORD');

  let cpcsToUse;

  if (cpcsB1DiscreteWord.isNormalOperation()) {
    cpcsToUse = 1;
  } else if (cpcsB2DiscreteWord.isNormalOperation()) {
    cpcsToUse = 2;
  } else if (cpcsB3DiscreteWord.isNormalOperation()) {
    cpcsToUse = 3;
  } else if (cpcsB4DiscreteWord.isNormalOperation()) {
    cpcsToUse = 4;
  } else {
    cpcsToUse = 0;
  }

  const [manCabinAlt] = useSimVar('L:A32NX_PRESS_MAN_CABIN_ALTITUDE', 'feet', 500);
  const cabinAltArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_ALTITUDE_B${cpcsToUse}`, 500);
  const cabinAlt = cabinAltArinc.isNormalOperation() ? cabinAltArinc.value : manCabinAlt;

  const [manDeltaPsi] = useSimVar('L:A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE', 'feet', 500);
  const deltaPsiArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_DELTA_PRESSURE_B${cpcsToUse}`, 500);
  const deltaPsi = deltaPsiArinc.isNormalOperation() ? deltaPsiArinc.value : manDeltaPsi;

  const [mancabinVs] = useSimVar('L:A32NX_PRESS_MAN_CABIN_VS', 'feet per minute', 500);
  const cabinVsArinc = useArinc429Var(`L:A32NX_PRESS_CABIN_VS_B${cpcsToUse}`, 500);
  const cabinVs = cabinVsArinc.isNormalOperation() ? cabinVsArinc.value : mancabinVs;

  const vsx = 440;
  const y = 385;
  const radius = 50;

  const deltaPress = splitDecimals(deltaPsi);

  const ldgElevValue = Math.round(landingElev.value / 50) * 50;

  return (
    <>
      <g id="LandingElevation" className={autoMode ? 'Show' : 'Hide'}>
        <text className="F26 MiddleAlign White LS1" x="470" y="355">
          LDG ELEVN
        </text>

        <text id="LandingElevation" className={`F29 EndAlign Green`} x="653" y="359">
          {ldgElevValue}
        </text>
        <text className="F22 Cyan" x="658" y="359">
          FT
        </text>
      </g>

      {/* Vertical speed gauge */}
      {/* TODO */}
      <g id="VsIndicator">
        <GaugeComponent
          x={vsx}
          y={y}
          radius={radius}
          startAngle={170}
          endAngle={10}
          visible={!autoMode}
          className="Gauge"
        >
          <GaugeMarkerComponent
            value={2}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeText"
            showValue
            textNudgeY={10}
          />
          <GaugeMarkerComponent
            value={1}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeText"
          />
          <GaugeMarkerComponent
            value={0}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeText"
            showValue
            textNudgeX={10}
          />
          <GaugeMarkerComponent
            value={-1}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeText"
          />
          <GaugeMarkerComponent
            value={-2}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeText"
            showValue
            textNudgeY={-10}
          />
          <GaugeMarkerComponent
            value={Math.abs(cabinVs / (50 * 50) / 1000) <= 2.25 ? cabinVs / (50 * 50) / 1000 : 2.25}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className="GaugeIndicator"
            indicator
          />
        </GaugeComponent>
      </g>

      <text className="F26 White LS1" x="175" y="425">
        DELTA P
      </text>
      <text className="F29 Green EndAlign" x="332" y="425">
        {deltaPress[0]}
      </text>
      <text className="F29 Green EndAlign" x="348" y="425">
        .
      </text>
      <text className="F29 Green" x="350" y="425">
        {deltaPress[1]}
      </text>
      <text className="F22 Cyan" x="374" y="425">
        PSI
      </text>

      <text className={`${autoMode ? '' : 'Hide'} F24 Green LS1`} x="522" y="450">
        AUTO
      </text>
      <text className="F24 White LS2" x="606" y="450">
        CAB V/S
      </text>
      <text id="CabinVerticalSpeed" className="F29 Green EndAlign" x="660" y="484">
        {!autoMode ? Math.round(cabinVs / 50) * 50 : Math.abs(Math.round(cabinVs / 50) * 50)}
      </text>
      <text className="F22 Cyan" x="664" y="484">
        FT/MIN
      </text>

      <text className={`${autoMode ? '' : 'Hide'} F24 Green LS1`} x="520" y="585">
        AUTO
      </text>
      <text className="F24 White LS2" x="605" y="585">
        CAB ALT
      </text>
      <text id="CabinAltitude" className="F29 Green EndAlign" x="652" y="616">
        {Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 : 0}
      </text>
      <text className="F22 Cyan" x="661" y="616">
        FT
      </text>

      {/* TODO */}
      {/*
            <g
                id="vsArrow"
                className={(cabinVs * 60 <= -25 || cabinVs * 60 >= 25) && autoMode ? '' : 'Hide'}
                transform={cabinVs * 60 <= -25 ? 'translate(0, 795) scale(1, -1)' : 'scale(1, 1)'}
            >
                <path d="M433,405 h7 L446,395" className="Green SW2 NoFill" strokeLinejoin="miter" />
                <polygon points="452,388 447,396 457,396" transform="rotate(38,452,388)" className="Green SW2 NoFill" />
            </g>
            */}
    </>
  );
};

export default CruisePressure;
