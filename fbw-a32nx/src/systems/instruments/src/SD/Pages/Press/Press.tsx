// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState, useEffect, memo } from 'react';
import { GaugeComponent, GaugeMarkerComponent, splitDecimals } from '@instruments/common/gauges';
import { MathUtils, useArinc429Var, useSimVar } from '@flybywiresim/fbw-sdk';
import { Triangle } from '../../Common/Shapes';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

import './Press.scss';

export const PressPage: FC = () => {
  const [autoMode] = useSimVar('L:A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO', 'Bool', 1000);
  const cpc1DiscreteWord = useArinc429Var('L:A32NX_PRESS_CPC_1_DISCRETE_WORD');
  const cpc2DiscreteWord = useArinc429Var('L:A32NX_PRESS_CPC_2_DISCRETE_WORD');

  const activeCpcNumber = cpc1DiscreteWord.bitValueOr(11, false) ? 1 : 2;

  const cpc1SysFault = cpc1DiscreteWord.isFailureWarning();
  const cpc2SysFault = cpc2DiscreteWord.isFailureWarning();

  // SYS is visible if the system is active or if it is failed
  const cpc1SysVisible = (autoMode && cpc1DiscreteWord.bitValueOr(11, false)) || cpc1SysFault;
  const cpc2SysVisible = (autoMode && cpc2DiscreteWord.bitValueOr(11, false)) || cpc2SysFault;

  const arincCabinAlt = useArinc429Var(`L:A32NX_PRESS_CPC_${activeCpcNumber}_CABIN_ALTITUDE`, 500);
  const [manCabinAlt] = useSimVar('L:A32NX_PRESS_MAN_CABIN_ALTITUDE', 'feet', 500);
  const cabinAlt = arincCabinAlt.isNormalOperation() ? arincCabinAlt.value : manCabinAlt;

  const arincDeltaPsi = useArinc429Var(`L:A32NX_PRESS_CPC_${activeCpcNumber}_CABIN_DELTA_PRESSURE`, 500);
  const [manDeltaPsi] = useSimVar('L:A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE', 'psi', 500);
  const deltaPsi = arincDeltaPsi.isNormalOperation() ? arincDeltaPsi.value : manDeltaPsi;

  const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);
  const [safetyValve] = useSimVar('L:A32NX_PRESS_SAFETY_VALVE_OPEN_PERCENTAGE', 'percentage', 500);

  const [cabinAltTextCss, setCabinAltTextCss] = useState('');
  const [cabinAltGaugeCss, setCabinAltGaugeCss] = useState('');

  useEffect(() => {
    if (Math.round(cabinAlt / 50) * 50 >= 8800 && Math.round(cabinAlt / 50) * 50 < 9550) {
      setCabinAltTextCss('GreenTextPulse');
      setCabinAltGaugeCss('GreenIndicatorPulse');
    } else if (Math.round(cabinAlt / 50) * 50 >= 9550) {
      setCabinAltTextCss('Red');
      setCabinAltGaugeCss('Red');
    } else {
      setCabinAltTextCss('Green');
      setCabinAltGaugeCss('Green');
    }
  }, [cabinAlt]);

  const deltaPress = splitDecimals(MathUtils.clamp(deltaPsi, -9.9, 9.9));
  // TODO: SDAC logic missing. Delta pressure is not available when the SDAC indication is not valid.
  // This happens when both the CPCs and ADRs are not sending pressure information. Here we only check
  // for CPC no computed data.
  const deltaPressNotAvail = arincDeltaPsi.isNoComputedData();
  const cax = 455;
  const dpx = 110;
  const y = 165;

  const radius = 50;

  return (
    <EcamPage name="main-press">
      <PageTitle x={6} y={18} text="CAB PRESS" />
      <PressureComponent />

      {/* System */}
      <SystemComponent id={1} x={180} y={290} visible={cpc1SysVisible} fault={cpc1SysFault} />
      <SystemComponent id={2} x={350} y={290} visible={cpc2SysVisible} fault={cpc2SysFault} />

      {/* Delta pressure gauge */}
      <g id="DeltaPressure">
        <text className="Large Center" x={dpx - 5} y="80">
          @P
        </text>
        <text className="Medium Center Cyan" x={dpx - 5} y="100">
          PSI
        </text>
        <text
          className={`Huge End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'} ${deltaPressNotAvail ? 'hide' : 'show'}`}
          x={dpx + 38}
          y={y + 25}
        >
          {deltaPress[0]}
        </text>
        <text
          className={`Huge End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'} ${deltaPressNotAvail ? 'hide' : 'show'}`}
          x={dpx + 53}
          y={y + 25}
        >
          .
        </text>
        <text
          className={`Standard End ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : 'Green'} ${deltaPressNotAvail ? 'hide' : 'show'}`}
          x={dpx + 63}
          y={y + 25}
        >
          {deltaPress[1]}
        </text>
        <text className={`Standard End Amber ${deltaPressNotAvail ? 'show' : 'hide'}`} x={dpx + 53} y={y + 25}>
          XX
        </text>
        <GaugeComponent x={dpx} y={y} radius={radius} startAngle={210} endAngle={50} visible className="Gauge">
          <GaugeComponent x={dpx} y={y} radius={radius} startAngle={40} endAngle={50} visible className="Gauge Amber" />
          <GaugeComponent
            x={dpx}
            y={y}
            radius={radius}
            startAngle={210}
            endAngle={218}
            visible
            className="Gauge Amber"
          />
          <GaugeMarkerComponent
            value={8}
            x={dpx}
            y={y}
            min={-1}
            max={9}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
            showValue
            textNudgeY={10}
          />
          <GaugeMarkerComponent
            value={4}
            x={dpx}
            y={y}
            min={-1}
            max={9}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
          />
          <GaugeMarkerComponent
            value={0}
            x={dpx}
            y={y}
            min={-1}
            max={9}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
            showValue
            textNudgeY={-10}
            textNudgeX={5}
          />
          <GaugeMarkerComponent
            value={MathUtils.clamp(MathUtils.round(deltaPsi, 0.1), -1, 9)}
            x={dpx}
            y={y}
            min={-1}
            max={9}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className={`GaugeIndicator ${deltaPsi < -0.4 || deltaPsi >= 8.5 ? 'Amber' : ''} ${deltaPressNotAvail ? 'hide' : 'show'}`}
            indicator
          />
        </GaugeComponent>
      </g>

      {/* Vertical speed gauge  */}
      <CabinVerticalSpeedComponent vsx={275} y={y} radius={radius} activeCpc={activeCpcNumber} />

      {/* Cabin altitude gauge */}
      <g id="CaIndicator">
        <text className="Large Center" x={cax + 15} y="80">
          CAB ALT
        </text>
        <text className="Medium Center Cyan" x={cax + 20} y="100">
          FT
        </text>
        <text className={`Huge End ${cabinAltTextCss}`} x={cax + 85} y={y + 25}>
          {Math.round(MathUtils.clamp(cabinAlt, -9950, 32750) / 50) * 50}
        </text>
        <GaugeComponent x={cax} y={y} radius={radius} startAngle={210} endAngle={50} visible className="Gauge">
          <GaugeComponent x={cax} y={y} radius={radius} startAngle={30} endAngle={50} visible className="Gauge Red" />
          <GaugeMarkerComponent
            value={10}
            x={cax}
            y={y}
            min={-0.625}
            max={10.625}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
            showValue
            indicator={false}
            textNudgeY={15}
          />
          <GaugeMarkerComponent
            value={5}
            x={cax}
            y={y}
            min={-0.625}
            max={10.625}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
            textNudgeY={10}
          />
          <GaugeMarkerComponent
            value={0}
            x={cax}
            y={y}
            min={-0.625}
            max={10.625}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className="GaugeText"
            showValue
            indicator={false}
            textNudgeY={-10}
            textNudgeX={5}
          />
          <GaugeMarkerComponent
            value={MathUtils.clamp((Math.round(cabinAlt / 25) * 25) / 1000, -0.625, 10.625)}
            x={cax}
            y={y}
            min={-0.625}
            max={10.625}
            radius={radius}
            startAngle={210}
            endAngle={50}
            className={`GaugeIndicator ${cabinAltGaugeCss}`}
            indicator
          />
        </GaugeComponent>
      </g>

      <SvgGroup x={-5} y={-25}>
        <polyline className="AirPressureShape" points="140,460 140,450 75,450 75,280 540,280 540,300" />
        <polyline className="AirPressureShape" points="180,457 180,450 265,450 265,457" />
        <polyline className="AirPressureShape" points="305,460 305,450 380,450" />
        <polyline className="AirPressureShape" points="453,450 540,450 540,380 550,380" />
        <line className="AirPressureShape" x1="540" y1="340" x2="547" y2="340" />
      </SvgGroup>

      {/* Safety and vent valves */}

      <text className={safetyValve < 0.2 ? 'Large White' : 'Large Amber'} x={490} y={305}>
        SAFETY
      </text>
      <GaugeMarkerComponent
        value={safetyValve < 0.2 ? 2 : 1}
        x={545}
        y={315}
        min={0}
        max={2}
        radius={34}
        startAngle={90}
        endAngle={180}
        className={safetyValve < 0.2 ? 'GreenLine' : 'AmberLine'}
        indicator
      />
      <circle className="WhiteCircle" cx={545} cy={315} r={3} />

      <text className="Large White" x={185} y={380}>
        VENT
      </text>

      <OverboardInletComponent flightPhase={flightPhase} validSDAC />
      <circle className="WhiteCircle" cx={175} cy={434} r={3} />

      {/* Overboard Outlet Valve */}
      <OverboardOutletComponent flightPhase={flightPhase} validSDAC />
      <circle className="WhiteCircle" cx={260} cy={434} r={3} />

      {/* Outflow valve */}
      <g id="OutflowValve">
        <OutflowValveComponent flightPhase={flightPhase} activeCpc={activeCpcNumber} />
        <circle className="WhiteCircle" cx={448} cy={425} r={3} />
      </g>

      {/* Packs */}

      <PackComponent id={1} x={47} y={495} />
      <PackComponent id={2} x={478} y={495} />
    </EcamPage>
  );
};

type CabinVerticalSpeedComponentType = {
  vsx: number;
  y: number;
  radius: number;
  activeCpc: number;
};

const CabinVerticalSpeedComponent: FC<CabinVerticalSpeedComponentType> = ({ vsx, y, radius, activeCpc }) => {
  const arincCabinVs = useArinc429Var(`L:A32NX_PRESS_CPC_${activeCpc}_CABIN_VS`, 500);
  const [manCabinVs] = useSimVar('L:A32NX_PRESS_MAN_CABIN_VS', 'feet per minute', 500);
  const cabinVs = arincCabinVs.isNormalOperation() ? arincCabinVs.value : manCabinVs;

  return (
    <>
      <g id="VsIndicator">
        <text className="Large Center" x={vsx + 15} y="80">
          V/S
        </text>
        <text className="Medium Center Cyan" x={vsx + 20} y="100">
          FT/MIN
        </text>
        <text
          className={`Huge End ${Math.abs(Math.round(cabinVs / 50) * 50) > 1750 ? 'GreenTextPulse' : 'Green'}`}
          x={vsx + 85}
          y={y + 5}
        >
          {Math.round(MathUtils.clamp(cabinVs, -6350, 6350) / 50) * 50}
        </text>
        <GaugeComponent
          x={vsx}
          y={y}
          radius={radius}
          startAngle={170}
          endAngle={10}
          visible
          className="GaugeComponent Gauge"
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
            value={MathUtils.clamp((Math.round(cabinVs / 50) * 50) / 1000, -2.25, 2.25)}
            x={vsx}
            y={y}
            min={-2}
            max={2}
            radius={radius}
            startAngle={180}
            endAngle={0}
            className={`GaugeIndicator ${Math.abs(Math.round(cabinVs / 50) * 50) > 1750 ? 'GreenIndicatorPulse' : ''}`}
            indicator
          />
        </GaugeComponent>
      </g>
    </>
  );
};

const PressureComponent = () => {
  const cpc1DiscreteWord = useArinc429Var('L:A32NX_PRESS_CPC_1_DISCRETE_WORD');
  const cpc2DiscreteWord = useArinc429Var('L:A32NX_PRESS_CPC_2_DISCRETE_WORD');

  const activeCpcNumber = cpc1DiscreteWord.bitValueOr(11, false) ? 1 : 2;
  const cpcDiscreteWordToUse = activeCpcNumber === 1 ? cpc1DiscreteWord : cpc2DiscreteWord;

  const landingElevationIsMan = cpcDiscreteWordToUse.bitValueOr(17, false);

  const cpcLandingElevation = useArinc429Var(`L:A32NX_PRESS_CPC_${activeCpcNumber}_LANDING_ELEVATION`, 500);
  const fmLandingElevation = useArinc429Var('L:A32NX_FM1_LANDING_ELEVATION', 1000);

  let landingElevation;
  if (cpcLandingElevation.isNormalOperation()) {
    landingElevation = cpcLandingElevation.value;
  } else if (fmLandingElevation.isNormalOperation()) {
    landingElevation = fmLandingElevation.value;
  } else {
    landingElevation = -6000;
  }

  const [autoMode] = useSimVar('L:A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO', 'Bool', 1000);
  const [ldgElevMode, setLdgElevMode] = useState('AUTO');
  const [ldgElevValue, setLdgElevValue] = useState('XX');
  const [cssLdgElevName, setCssLdgElevName] = useState('green');

  useEffect(() => {
    setLdgElevMode(landingElevationIsMan ? 'MAN' : 'AUTO');
    const nearestfifty = Math.round(landingElevation / 50) * 50;

    setLdgElevValue(landingElevation > -5000 ? nearestfifty.toString() : 'XX');
    setCssLdgElevName(landingElevation > -5000 ? 'Green' : 'Amber');
  }, [landingElevationIsMan, landingElevation]);

  return (
    <>
      <g id="LandingElevation" className={autoMode ? 'show' : 'hide'}>
        <text className="Large Center" x="280" y="25">
          LDG ELEV
        </text>
        <text id="LandingElevationMode" className="Large Green" x="350" y="25">
          {ldgElevMode}
        </text>

        <text id="LandingElevation" className={`Large ${cssLdgElevName}`} x="510" y="25" textAnchor="end">
          {ldgElevValue}
        </text>
        <text className="Medium Cyan" x="525" y="25">
          FT
        </text>
      </g>
      <text className={`Large Green ${!autoMode ? 'Show' : 'Hide'}`} x="420" y="340">
        MAN
      </text>
    </>
  );
};

type SystemComponentType = {
  id: number;
  visible: boolean;
  fault: boolean;
  x: number;
  y: number;
};

const SystemComponent: FC<SystemComponentType> = memo(({ id, visible, fault, x, y }) => {
  const systemColour = fault ? 'Amber' : 'Green';

  return (
    <>
      <g id="LandingElevation" className={visible ? 'Show' : 'Hide'}>
        <text className={`Large ${systemColour}`} x={x} y={y}>
          SYS {id}
        </text>
      </g>
    </>
  );
});

type PackComponentType = {
  id: number;
  x: number;
  y: number;
};

const PackComponent: FC<PackComponentType> = ({ id, x, y }) => {
  const [engN2] = useSimVar(`L:A32NX_ENGINE_N2:${id}`, 'number', 500);
  const [packOff] = useSimVar(`L:A32NX_COND_PACK_FLOW_VALVE_${id}_IS_OPEN`, 'bool', 500);
  const triangleColour = !packOff && engN2 >= 60 ? 'Amber' : 'Green';
  const packWordColour = !packOff && engN2 >= 60 ? 'Amber' : 'White';

  return (
    <>
      <Triangle x={x + 38} y={y - 45} colour={triangleColour} fill={0} orientation={0} />
      <text className={`Large ${packWordColour}`} x={x} y={y}>
        PACK {id}
      </text>
    </>
  );
};

type OutflowValveComponentType = {
  flightPhase: number;
  activeCpc: number;
};

const OutflowValveComponent: FC<OutflowValveComponentType> = memo(({ flightPhase, activeCpc }) => {
  const ofx = 448;
  const ofy = 425;
  const ofradius = 72;

  const arincOutflowValueOpenPercentage = useArinc429Var(
    `L:A32NX_PRESS_CPC_${activeCpc}_OUTFLOW_VALVE_OPEN_PERCENTAGE`,
    500,
  );
  const [manOutflowValueOpenPercentage] = useSimVar('L:A32NX_PRESS_MAN_OUTFLOW_VALVE_OPEN_PERCENTAGE', 'percent', 500);
  const outflowValueOpenPercentage = arincOutflowValueOpenPercentage.isNormalOperation()
    ? arincOutflowValueOpenPercentage.value
    : manOutflowValueOpenPercentage;

  return (
    <>
      <GaugeComponent
        x={ofx}
        y={ofy}
        radius={ofradius}
        startAngle={270 + (outflowValueOpenPercentage / 100) * 90}
        endAngle={360}
        visible
        className="Gauge"
      >
        <GaugeComponent
          x={ofx}
          y={ofy}
          radius={ofradius}
          startAngle={355.5}
          endAngle={360}
          visible
          className="Gauge Amber"
        />
        <GaugeMarkerComponent
          value={outflowValueOpenPercentage}
          x={ofx}
          y={ofy}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className={
            flightPhase >= 5 && flightPhase <= 7 && outflowValueOpenPercentage > 95 ? 'AmberLine' : 'GreenLine'
          }
          indicator
          multiplierOuter={1}
        />
        <GaugeMarkerComponent
          value={25}
          x={ofx}
          y={ofy}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
          outer
          multiplierOuter={1.1}
        />
        <GaugeMarkerComponent
          value={50}
          x={ofx}
          y={ofy}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
          outer
          multiplierOuter={1.1}
        />
        <GaugeMarkerComponent
          value={75}
          x={ofx}
          y={ofy}
          min={0}
          max={100}
          radius={ofradius}
          startAngle={270}
          endAngle={360}
          className="Gauge"
          outer
          multiplierOuter={1.1}
        />
      </GaugeComponent>
    </>
  );
});

type OverboardInletComponentType = {
  validSDAC: boolean;
  flightPhase: number;
};

const OverboardInletComponent: FC<OverboardInletComponentType> = ({ validSDAC, flightPhase }) => {
  const [realInletValvePosition] = useSimVar('L:VENT_INLET_VALVE', 'percent', 500);
  let indicator = true;
  let classNameValue = 'GreenLine';
  let classNameText = 'White';
  let displayInletValvePosition = 2;

  // Simplified set - modify once pressurisation properly modeled.
  switch (true) {
    case !validSDAC: // case 1
      indicator = false;
      classNameText = 'Amber';
      break;
    case realInletValvePosition > 0.01 && realInletValvePosition < 99.9: // case 2
      classNameValue = 'AmberLine';
      displayInletValvePosition = 1;
      break;
    case realInletValvePosition > 99.9 && flightPhase >= 5 && flightPhase <= 7: // case 3
      classNameValue = 'AmberLine';
      classNameText = 'Amber';
      displayInletValvePosition = 0;
      break;
    case realInletValvePosition > 99.9: // case 4
      displayInletValvePosition = 0;
      break;
    default: // case 5
      indicator = true;
  }

  return (
    <>
      <text className={`Large ${classNameText}`} x={120} y={417}>
        INLET
      </text>
      {indicator ? (
        <GaugeMarkerComponent
          value={displayInletValvePosition}
          x={175}
          y={434}
          min={0}
          max={2}
          radius={34}
          startAngle={180}
          endAngle={270}
          className={classNameValue}
          indicator
        />
      ) : (
        <text className="Standard Amber" x={143} y={450}>
          XX
        </text>
      )}
    </>
  );
};

type OverboardOutletComponentType = {
  validSDAC: boolean;
  flightPhase: number;
};

const OverboardOutletComponent: FC<OverboardOutletComponentType> = ({ validSDAC, flightPhase }) => {
  const [realOutletValvePosition] = useSimVar('L:VENT_OUTLET_VALVE', 'percent', 500);
  let indicator = true;
  let classNameValue = 'GreenLine';
  let classNameText = 'White';
  let displayOutletValvePosition = 0;

  // Simplified set -  modify once pressurisation properly modeled.
  switch (true) {
    case !validSDAC: // case 1
      indicator = false;
      classNameText = 'Amber';
      break;
    case realOutletValvePosition > 0 && realOutletValvePosition < 0.01 && flightPhase >= 5 && flightPhase <= 7: // case 2b
      classNameValue = 'AmberLine';
      classNameText = 'Amber';
      displayOutletValvePosition = 1;
      break;
    case realOutletValvePosition > 0.01 && flightPhase < 5 && flightPhase > 7: // case 3
      displayOutletValvePosition = 1;
      break;
    case realOutletValvePosition > 95 && flightPhase < 5 && flightPhase > 7: // case 4
      classNameText = 'Amber';
      displayOutletValvePosition = 2;
      break;
    case realOutletValvePosition > 95: // case 5
      displayOutletValvePosition = 2;
      break;
    default: // case 7
      indicator = true;
  }

  return (
    <>
      <text className={`Large ${classNameText}`} x={240} y={417}>
        OUTLET
      </text>
      {indicator ? (
        <GaugeMarkerComponent
          value={displayOutletValvePosition}
          x={260}
          y={434}
          min={0}
          max={2}
          radius={34}
          startAngle={90}
          endAngle={180}
          className={classNameValue}
          indicator
        />
      ) : (
        <text className="Standard Amber" x={270} y={450}>
          XX
        </text>
      )}
    </>
  );
};
