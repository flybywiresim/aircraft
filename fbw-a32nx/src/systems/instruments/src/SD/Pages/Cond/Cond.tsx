// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useArinc429Var, usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { UnitType } from '@microsoft/msfs-sdk';
import { SvgGroup } from '../../Common/SvgGroup';
import Valve from './Valve';
import '../../Common/CommonStyles.scss';

export const CondPage = () => {
  // Display trim valve position for each zone
  const gaugeOffset = -43; // This the range of travel for each 'zones' respective gauge is -43->+43 degrees.
  // These gauges denote the Physical position of the valve. No relation to air temperature or set point!

  const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

  const acsc1DiscreteWord1 = useArinc429Var('L:A32NX_COND_ACSC_1_DISCRETE_WORD_1');
  const acsc2DiscreteWord1 = useArinc429Var('L:A32NX_COND_ACSC_2_DISCRETE_WORD_1');
  const acscDiscreteWord1 = !acsc1DiscreteWord1.isFailureWarning() ? acsc1DiscreteWord1 : acsc2DiscreteWord1;

  // TODO: If both Sign Status are Failure Warning or No Computed Data, the whole page should display XX's

  const [cockpitTrimAirValve] = useSimVar('L:A32NX_COND_CKPT_TRIM_AIR_VALVE_POSITION', 'number', 100);
  let [cockpitTrimTemp] = useSimVar('L:A32NX_COND_CKPT_DUCT_TEMP', 'celsius', 100);
  let [cockpitCabinTemp] = useSimVar('L:A32NX_COND_CKPT_TEMP', 'celsius', 1000);

  const [fwdTrimAirValve] = useSimVar('L:A32NX_COND_FWD_TRIM_AIR_VALVE_POSITION', 'number', 100);
  let [fwdTrimTemp] = useSimVar('L:A32NX_COND_FWD_DUCT_TEMP', 'celsius', 100);
  let [fwdCabinTemp] = useSimVar('L:A32NX_COND_FWD_TEMP', 'celsius', 1000);

  const [aftTrimAirValve] = useSimVar('L:A32NX_COND_AFT_TRIM_AIR_VALVE_POSITION', 'number', 100);
  let [aftTrimTemp] = useSimVar('L:A32NX_COND_AFT_DUCT_TEMP', 'celsius', 100);
  let [aftCabinTemp] = useSimVar('L:A32NX_COND_AFT_TEMP', 'celsius', 1000);

  const hotAirOpen = !acscDiscreteWord1.bitValueOr(20, false);
  const hotAirPositionDisagrees = acsc1DiscreteWord1.bitValueOr(27, false) && acsc2DiscreteWord1.bitValueOr(27, false);
  const hotAirSwitchPosition = acscDiscreteWord1.bitValueOr(23, false);

  const cabFanHasFault1 = acscDiscreteWord1.bitValueOr(25, false);
  const cabFanHasFault2 = acscDiscreteWord1.bitValueOr(26, false);

  if (unit === '0') {
    //  converting to F if 'lbs' selected in EFB
    cockpitTrimTemp = UnitType.CELSIUS.convertTo(cockpitTrimTemp, UnitType.FAHRENHEIT);
    cockpitCabinTemp = UnitType.CELSIUS.convertTo(cockpitCabinTemp, UnitType.FAHRENHEIT);
    fwdTrimTemp = UnitType.CELSIUS.convertTo(fwdTrimTemp, UnitType.FAHRENHEIT);
    fwdCabinTemp = UnitType.CELSIUS.convertTo(fwdCabinTemp, UnitType.FAHRENHEIT);
    aftTrimTemp = UnitType.CELSIUS.convertTo(aftTrimTemp, UnitType.FAHRENHEIT);
    aftCabinTemp = UnitType.CELSIUS.convertTo(aftCabinTemp, UnitType.FAHRENHEIT);
  }

  return (
    <svg
      id="cond-page"
      className="ecam-common-styles"
      viewBox="0 0 768 768"
      style={{ marginTop: '-60px' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Title and unit */}
      <g id="titleAndWarnings">
        <text className="Title UnderlineWhite" x="7" y="33">
          COND
        </text>
        <text className="Huge" x="630" y="32">
          TEMP
        </text>
        <text className="Huge" x="715" y="32">
          :
        </text>
        <text id="CondTempUnit" className="Standard Cyan" x="726" y="31">
          {unit === '1' ? '°C' : '°F'}
        </text>
        <text id="LeftFanWarning" className={`Large Amber ${cabFanHasFault1 ? 'Show' : 'Hide'}`} x="180" y="75">
          FAN
        </text>
        <text id="RightFanWarning" className={`Large Amber ${cabFanHasFault2 ? 'Show' : 'Hide'}`} x="510" y="75">
          FAN
        </text>
      </g>

      {/* Plane shape */}
      <path
        id="UpperPlaneSymbol"
        className="LightGreyLine"
        d="m 95,128 l 27,-9 l 11,-12 a 75 75 0 0 1 40 -13 h 430 l 12,10"
      />
      <path
        id="LowerPlaneSymbol"
        className="LightGreyLine"
        d="m 94,172 a 150 150 0 0 0 60 18 h 20 m 49,0 h 122 m 49,0 h 120 m 50,0 h 38 l 12,-10"
      />
      <path id="PlaneSeperators" className="LightGreyLine" d="m 278,94 v96 m 179,0 v-54" />

      {/* Cockpit */}
      <CondUnit
        title="CKPT"
        trimAirValve={cockpitTrimAirValve}
        cabinTemp={cockpitCabinTemp}
        trimTemp={cockpitTrimTemp}
        x={153}
        y={105}
        offset={gaugeOffset}
        hotAir={hotAirPositionDisagrees || !hotAirSwitchPosition}
      />

      {/* Fwd */}
      <CondUnit
        title="FWD"
        trimAirValve={fwdTrimAirValve}
        cabinTemp={fwdCabinTemp}
        trimTemp={fwdTrimTemp}
        x={324}
        y={105}
        offset={gaugeOffset}
        hotAir={hotAirPositionDisagrees || !hotAirSwitchPosition}
      />

      {/*  Aft */}
      <CondUnit
        title="AFT"
        trimAirValve={aftTrimAirValve}
        cabinTemp={aftCabinTemp}
        trimTemp={aftTrimTemp}
        x={494}
        y={105}
        offset={gaugeOffset}
        hotAir={hotAirPositionDisagrees || !hotAirSwitchPosition}
      />

      {/* Valve and tubes */}
      <g id="ValveAndTubes">
        <text className="MediumLarge" x="565" y="276">
          <tspan x="706" y="306" style={{ letterSpacing: '1px' }}>
            HOT
          </tspan>
          <tspan x="706" y="336" style={{ letterSpacing: '2px' }}>
            AIR
          </tspan>
        </text>
        <Valve
          x={650}
          y={312}
          radius={21}
          position={hotAirOpen ? 'H' : 'V'}
          css={hotAirPositionDisagrees || !hotAirSwitchPosition ? 'AmberLine' : 'GreenLine'}
          sdacDatum
        />
        <line
          className={hotAirPositionDisagrees || !hotAirSwitchPosition ? 'AmberLine' : 'GreenLine'}
          x1="195"
          y1="312"
          x2="627"
          y2="312"
        />
        <line
          className={hotAirPositionDisagrees || !hotAirSwitchPosition ? 'AmberLine' : 'GreenLine'}
          x1="672"
          y1="312"
          x2="696"
          y2="312"
        />
      </g>
    </svg>
  );
};

type CondUnitProps = {
  title: string;
  trimAirValve: number;
  cabinTemp: number;
  trimTemp: number;
  x: number;
  y: number;
  offset: number;
  hotAir: boolean;
};

const CondUnit = ({ title, trimAirValve, cabinTemp, trimTemp, x, y, offset, hotAir }: CondUnitProps) => {
  const rotateTemp = offset + (trimAirValve * 86) / 100;
  const overheat = trimTemp > 80;

  return (
    <SvgGroup x={x} y={y}>
      <text className="Large Center" x={47} y={23}>
        {title}
      </text>
      <text id="CkptCabinTemp" className="Large Green" x={26} y={56}>
        {cabinTemp.toFixed(0)}
      </text>
      <text id="CkptTrimTemp" className={overheat ? 'Standard Amber' : 'Standard Green'} x={29} y={106}>
        {trimTemp.toFixed(0)}
      </text>
      <text className="Standard" x={-2} y={147}>
        C
      </text>
      <text className="Standard" x={74} y={146}>
        H
      </text>
      <g id="CkptGauge" transform={`rotate(${rotateTemp.toFixed(0)} 42 158 )`}>
        <path className="GreenLine" d="m 37,137 l 10,0 l -5,-9 z" />
        <line className="GreenLine" x1={42} y1={158} x2={42} y2={138} />
      </g>
      {/* TODO: When Trim valves are failed the gauge should be replaced by amber XX */}
      <line className={hotAir ? 'AmberLine' : 'GreenLine'} x1={42} y1={207} x2={42} y2={158} />
      <g>
        <path className="WhiteLine" d="m 21,136 a 30 30 0 0 1 42 0" />
        <line className="WhiteLine" x1={42} y1={118} x2={42} y2={127} />
      </g>
    </SvgGroup>
  );
};
