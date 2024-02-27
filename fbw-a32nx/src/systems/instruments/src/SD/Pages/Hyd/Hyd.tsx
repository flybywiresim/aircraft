// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { SvgGroup } from '../../Common/SvgGroup';
import { Triangle } from '../../Common/Shapes';

import '../../Common/CommonStyles.scss';

const litersPerGallon = 3.79;

enum HydSystem {
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
}

export const HydPage = () => {
  // The FADEC SimVars include a test for the fire button.
  const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
  const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

  const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
  const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
  const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);

  const [yellowPumpPressurisedSwitch] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_SECTION_PRESSURE_SWITCH', 'boolean', 500);
  const [greenPumpPressurisedSwitch] = useSimVar('L:A32NX_HYD_GREEN_PUMP_1_SECTION_PRESSURE_SWITCH', 'boolean', 500);

  const [yellowFluidLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL', 'gallon', 1000);
  const [greenFluidLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL', 'gallon', 1000);

  const [greenPumpPBOn] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
  const [yellowPumpPBOn] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);
  const [bluePumpPBAuto] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);
  const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

  const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

  const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);
  const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);

  const [ACBus1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 1000);

  const [blueElecPumpOvht] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_OVHT', 'bool', 1000);

  const [engine1Running, setEngine1Running] = useState(false);
  const [engine2Running, setEngine2Running] = useState(false);

  useEffect(() => {
    setEngine1Running(Eng1N2 > 15 && greenFireValve);
    setEngine2Running(Eng2N2 > 15 && yellowFireValve);
  }, [Eng1N2, Eng2N2]);

  // PTU variables
  const [ptuControlValveOpen] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 500);

  return (
    <>
      {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
      <svg
        id="hyd-page"
        className="ecam-common-styles"
        viewBox="0 0 768 768"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginTop: '-60px' }}
      >
        <text className="Title UnderlineWhite" x="351" y="39">
          HYD
        </text>
        <text className={`${engine1Running ? '' : 'Amber '}Title`} x="187" y="404">
          1
        </text>
        <text className={`${engine2Running ? '' : 'Amber '}Title`} x="562" y="404">
          2
        </text>

        <HydSys
          system={HydSystem.GREEN}
          pressure={greenPressure}
          x={136}
          y={65}
          fireValve={greenFireValve}
          pumpPBOn={greenPumpPBOn}
        />
        <HydSys
          system={HydSystem.BLUE}
          pressure={bluePressure}
          x={383}
          y={65}
          fireValve={false}
          pumpPBOn={bluePumpPBAuto && bluePumpActive}
        />
        <HydSys
          system={HydSystem.YELLOW}
          pressure={yellowPressure}
          x={630}
          y={65}
          fireValve={yellowFireValve}
          pumpPBOn={yellowPumpPBOn}
        />

        <PTU
          x={383}
          y={216}
          yellowPressure={yellowPressure}
          greenPressure={greenPressure}
          yellowPumpLowPressure={!yellowPumpPressurisedSwitch}
          greenPumpLowPressure={!greenPumpPressurisedSwitch}
          yellowQuantity={yellowFluidLevel}
          greenQuantity={greenFluidLevel}
          ptuControlValveOff={!ptuControlValveOpen}
          yellowElecPumpOn={yellowElectricPumpStatus}
        />

        <RAT x={372} y={282} />

        <text id="ELEC-centre" className={!ACBus1IsPowered ? 'Large Amber' : 'Large'} x={420} y={384}>
          ELEC
        </text>
        <text className={blueElecPumpOvht ? 'Large Amber' : 'Hide'} x={420} y={414}>
          OVHT
        </text>

        <YellowElecPump
          pumpPushbuttonOn={yellowElectricPumpStatus}
          pressure={yellowPressure}
          enginePumpPressureLowSwitch={!yellowPumpPressurisedSwitch}
        />

        <text className="Cyan Standard" x={243} y={157}>
          PSI
        </text>
        <text className="Cyan Standard" x={481} y={157}>
          PSI
        </text>
      </svg>
    </>
  );
};

type RATProps = {
  x: number;
  y: number;
};

const RAT = ({ x, y }: RATProps) => {
  const [RatStowed] = useSimVar('L:A32NX_RAT_STOW_POSITION', 'percent over 100', 500);

  return (
    <SvgGroup x={x} y={y}>
      <text className="Large" x={-78} y={10}>
        RAT
      </text>
      <line className={`GreenLine ${RatStowed > 0.1 ? '' : 'Hide'}`} x1={0} y1={0} x2={10} y2={0} />
      <Triangle
        x={0}
        y={0}
        scale={4 / 3}
        colour={RatStowed > 0.1 ? 'Green' : 'White'}
        fill={RatStowed > 0.1 ? 1 : 0}
        orientation={90}
      />
    </SvgGroup>
  );
};

type HydSysProps = {
  system: HydSystem;
  pressure: number;
  x: number;
  y: number;
  fireValve: boolean;
  pumpPBOn: boolean;
};

const HydSys = ({ system, pressure, x, y, fireValve, pumpPBOn }: HydSysProps) => {
  const lowPressure = 1450;
  const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

  const [pumpPressurisedSwitch] = useSimVar(`L:A32NX_HYD_${system}_PUMP_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);
  const [systemPressurisedSwitch] = useSimVar(`L:A32NX_HYD_${system}_SYSTEM_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);

  const [reservoirLowQuantitySwitch] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_LEVEL_IS_LOW`, 'boolean', 500);

  let hydTitleXPos: number;
  if (system === HydSystem.GREEN) {
    hydTitleXPos = -2;
  } else if (system === HydSystem.BLUE) {
    hydTitleXPos = 1;
  } else {
    hydTitleXPos = 3;
  }

  return (
    <SvgGroup x={x} y={y}>
      <Triangle x={0} y={0} colour={!systemPressurisedSwitch ? 'Amber' : 'Green'} fill={0} orientation={0} />
      <text className={`Huge Center${!systemPressurisedSwitch ? ' Amber' : ''}`} x={hydTitleXPos} y={50}>
        {system}
      </text>
      <text className={`Huge Center ${pressureNearest50 <= lowPressure ? 'Amber' : 'Green'}`} x={1} y={92}>
        {pressureNearest50}
      </text>

      <line
        className={pressureNearest50 <= lowPressure ? 'AmberLine' : 'GreenLine'}
        x1={0}
        y1={system === HydSystem.BLUE ? 217 : 151}
        x2={0}
        y2={103}
      />

      <HydEngPump
        system={system}
        pumpPBOn={pumpPBOn}
        x={0}
        y={system === HydSystem.BLUE ? 370 : 303}
        pumpSwitchLowPressure={!pumpPressurisedSwitch}
      />
      {system !== HydSystem.BLUE && (
        <HydEngValve x={0} y={372} fireValve={fireValve} lowLevel={reservoirLowQuantitySwitch} />
      )}
      {/* Reservoir */}
      <HydReservoir system={system} x={0} y={576} lowLevel={reservoirLowQuantitySwitch} />
    </SvgGroup>
  );
};

type HydEngPumpProps = {
  system: HydSystem;
  pumpPBOn: boolean;
  x: number;
  y: number;
  pumpSwitchLowPressure: boolean;
};

const HydEngPump = ({ system, pumpPBOn, x, y, pumpSwitchLowPressure }: HydEngPumpProps) => {
  let pumpLineYUpper: number;
  if (system === HydSystem.GREEN) {
    pumpLineYUpper = -151;
  } else if (system === HydSystem.BLUE) {
    pumpLineYUpper = -153;
  } else {
    pumpLineYUpper = -84;
  }

  return (
    <SvgGroup x={x} y={y}>
      <line className={pumpSwitchLowPressure ? 'AmberLine' : 'GreenLine'} x1={0} y1={-42} x2={0} y2={pumpLineYUpper} />
      <rect
        className={pumpSwitchLowPressure || !pumpPBOn ? 'AmberLine' : 'GreenLine'}
        x={-21}
        y={-42}
        width={42}
        height={42}
      />
      <line className={!pumpSwitchLowPressure && pumpPBOn ? 'GreenLine' : 'Hide'} x1={0} y1={-1} x2={0} y2={-41} />
      <line className={pumpPBOn ? 'Hide' : 'AmberLine'} x1={-12} y1={-21} x2={12} y2={-21} />
      <text className={pumpSwitchLowPressure && pumpPBOn ? 'Standard Amber' : 'Hide'} x={-13} y={-14}>
        LO
      </text>
    </SvgGroup>
  );
};

type HydEngValveProps = {
  x: number;
  y: number;
  fireValve: boolean;
  lowLevel: boolean;
};

const HydEngValve = ({ x, y, fireValve, lowLevel }: HydEngValveProps) => (
  <SvgGroup x={x} y={y}>
    <line className={fireValve && !lowLevel ? 'GreenLine' : 'AmberLine'} x1={-0} y1={0} x2={0} y2={-68} />
    <circle className={fireValve ? 'GreenLine' : 'AmberLine'} cx={0} cy={21} r="21" />
    <line className={fireValve ? 'GreenLine' : 'Hide'} x1={0} y1={42} x2={x} y2={0} />
    <line className={fireValve ? 'Hide' : 'AmberLine'} x1={-21} y1={21} x2={21} y2={21} />
  </SvgGroup>
);

type Levels = { max: number; low: number; norm: number };

const levels = {
  GREEN: { max: 14.5, low: 3.5, norm: 2.6 } as Levels,
  BLUE: { max: 6.5, low: 2.4, norm: 1.6 } as Levels,
  YELLOW: { max: 12.5, low: 3.5, norm: 2.6 } as Levels,
};

type HydReservoirProps = {
  system: HydSystem;
  x: number;
  y: number;
  lowLevel: boolean;
};

const HydReservoir = ({ system, x, y, lowLevel }: HydReservoirProps) => {
  const [fluidLevel] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_LEVEL`, 'gallon', 1000);

  const [lowAirPress] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_AIR_PRESSURE_IS_LOW`, 'boolean', 1000);

  // The overheat indication should be computed by the EIS itself from the numerical temperature value,
  // by applying a hysteresis logic. For now, we just use a boolean from the hydraulics directly.
  const [overheat] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_OVHT`, 'boolean', 1000);

  const fluidLevelInLitres = fluidLevel * litersPerGallon;

  const values = levels[system];
  const litersPerPixel = 121 / values.max;
  const reserveHeight = litersPerPixel * values.low;
  const upperReserve = -reserveHeight;
  const lowerNorm = -121 + litersPerPixel * values.norm;
  const fluidLevelPerPixel = 121 / values.max;
  const fluidHeight = -(fluidLevelPerPixel * fluidLevelInLitres);

  return (
    <SvgGroup x={x} y={y}>
      <line
        className={lowLevel ? 'AmberLine' : 'GreenLine'}
        x1={0}
        y1={-121}
        x2={0}
        y2={system === HydSystem.BLUE ? -205 : -161}
      />
      <line className={lowLevel ? 'AmberLine' : 'WhiteLine'} x1={0} y1={upperReserve.toFixed(0)} x2={0} y2={-121} />
      <line className="GreenLine" x1={0} y1={-121} x2={6} y2={-121} />
      <line className="GreenLine" x1={6} y1={lowerNorm.toFixed(0)} x2={6} y2={-121} />
      <line className="GreenLine" x1={0} y1={lowerNorm.toFixed(0)} x2={6} y2={lowerNorm.toFixed(0)} />
      <rect className="AmberLine" x={0} y={upperReserve.toFixed(0)} width={6} height={reserveHeight} />

      {/* Hydraulic level */}
      <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={0} x2={-12} y2={0} />
      <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={-12} y1={0} x2={-12} y2={fluidHeight} />
      <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={fluidHeight} x2={-12} y2={fluidHeight} />
      <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={fluidHeight} x2={-13} y2={fluidHeight - 11} />

      <text className={lowAirPress ? 'Large Amber' : 'Hide'} x={12} y={-72}>
        LO AIR
      </text>
      <text className={lowAirPress ? 'Large Amber' : 'Hide'} x={12} y={-45}>
        PRESS
      </text>

      {/* Not sure about the exact placement, have to wait for an IRL ref */}
      <text className={overheat ? 'Large Amber' : 'Hide'} x={20} y={-5}>
        OVHT
      </text>
    </SvgGroup>
  );
};

type YellowElecPumpProps = {
  pumpPushbuttonOn: boolean;
  pressure: number;
  enginePumpPressureLowSwitch: boolean;
};

const YellowElecPump = ({ pumpPushbuttonOn, pressure, enginePumpPressureLowSwitch }: YellowElecPumpProps) => {
  const [ACBus2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 1000);

  const [yellowElecPumpOvht] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_OVHT', 'bool', 1000);

  let elecHorizontalLineFormat: string;
  let verticalLineFormat: string;
  let elecTriangleFill: number;
  let elecTriangleColour: string;

  if (!pumpPushbuttonOn) {
    elecTriangleFill = 0;
    elecHorizontalLineFormat = 'Hide';
    elecTriangleColour = 'White';
  } else {
    elecTriangleFill = 1;
    elecHorizontalLineFormat = pressure <= 1450 ? 'AmberLine' : 'GreenLine';
    elecTriangleColour = pressure <= 1450 ? 'Amber' : 'Green';
  }

  if ((enginePumpPressureLowSwitch && !pumpPushbuttonOn) || pressure <= 1450) {
    verticalLineFormat = 'AmberLine';
  } else {
    verticalLineFormat = 'GreenLine';
  }

  return (
    <>
      <text id="ELEC-right" className={!ACBus2IsPowered ? 'Large Amber' : 'Large'} x={676} y={292}>
        ELEC
      </text>
      <text className={yellowElecPumpOvht ? 'Large Amber' : 'Hide'} x={676} y={322}>
        OVHT
      </text>
      <Triangle x={642} y={283} scale={4 / 3} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
      <line className={elecHorizontalLineFormat} x1={631} y1={283} x2={642} y2={283} />
      <line className={verticalLineFormat} x1={630} y1={217} x2={630} y2={283} />
    </>
  );
};

enum TransferColor {
  Green = 'Green',
  Amber = 'Amber',
}

enum TransferState {
  GreenToYellow,
  YellowToGreen,
  None,
}

type PTUProps = {
  x: number;
  y: number;
  yellowPressure: number;
  greenPressure: number;
  yellowPumpLowPressure: boolean;
  greenPumpLowPressure: boolean;
  yellowQuantity: number;
  greenQuantity: number;
  ptuControlValveOff: boolean;
  yellowElecPumpOn: boolean;
};

const shouldTransferActivate = (
  lowerPressureSystemQuantity: number,
  lowerPressureSystemPressure: number,
  highPressureSystemPressure: number,
  lowerPressureSystemPumpLowPress: boolean,
  yellowElecPumpOn: boolean,
  transferDirection: TransferState,
) => {
  if (transferDirection === TransferState.None) {
    return false;
  }

  return (
    lowerPressureSystemPumpLowPress &&
    ((transferDirection === TransferState.GreenToYellow && !yellowElecPumpOn) ||
      transferDirection === TransferState.YellowToGreen) &&
    ((highPressureSystemPressure > 1450 && lowerPressureSystemQuantity * litersPerGallon < 2.5) ||
      (lowerPressureSystemPressure > 1500 && lowerPressureSystemQuantity * litersPerGallon > 2.5))
  );
};

const PTU = ({
  x,
  y,
  yellowPressure,
  greenPressure,
  yellowPumpLowPressure,
  greenPumpLowPressure,
  yellowQuantity,
  greenQuantity,
  ptuControlValveOff,
  yellowElecPumpOn,
}: PTUProps) => {
  const [transferState, setTransferState] = useState(TransferState.None);

  useEffect(() => {
    let newTransferState;

    if (ptuControlValveOff) {
      newTransferState = TransferState.None;
    } else if (transferState === TransferState.None) {
      if (yellowPressure - greenPressure > 200) {
        newTransferState = TransferState.YellowToGreen;
      } else if (greenPressure - yellowPressure > 200) {
        newTransferState = TransferState.GreenToYellow;
      }
    } else if (transferState === TransferState.GreenToYellow && greenPressure - yellowPressure < -300) {
      newTransferState = TransferState.YellowToGreen;
    } else if (transferState === TransferState.YellowToGreen && yellowPressure - greenPressure < -300) {
      newTransferState = TransferState.GreenToYellow;
    } else {
      newTransferState = transferState;
    }

    let lowPressureSystemPressure: number;
    let highPressureSystemPressure: number;
    let lowPressureSystemQuantity: number;
    let lowerPressureSystemPumpLowPress: boolean;
    if (newTransferState === TransferState.GreenToYellow) {
      highPressureSystemPressure = greenPressure;
      lowPressureSystemPressure = yellowPressure;
      lowPressureSystemQuantity = yellowQuantity;
      lowerPressureSystemPumpLowPress = yellowPumpLowPressure;
    } else if (newTransferState === TransferState.YellowToGreen) {
      highPressureSystemPressure = yellowPressure;
      lowPressureSystemPressure = greenPressure;
      lowPressureSystemQuantity = greenQuantity;
      lowerPressureSystemPumpLowPress = greenPumpLowPressure;
    } else {
      highPressureSystemPressure = 0;
      lowPressureSystemPressure = 0;
      lowPressureSystemQuantity = 0;
      lowerPressureSystemPumpLowPress = false;
    }

    if (
      shouldTransferActivate(
        lowPressureSystemQuantity,
        lowPressureSystemPressure,
        highPressureSystemPressure,
        lowerPressureSystemPumpLowPress,
        yellowElecPumpOn,
        newTransferState,
      )
    ) {
      setTransferState(newTransferState);
    } else {
      setTransferState(TransferState.None);
    }
  }, [
    yellowPressure,
    greenPressure,
    yellowPumpLowPressure,
    greenPumpLowPressure,
    yellowQuantity,
    greenQuantity,
    ptuControlValveOff,
    yellowElecPumpOn,
  ]);

  // Should also be amber if PTU fault
  let transferColor: TransferColor;
  if (ptuControlValveOff) {
    transferColor = TransferColor.Amber;
  } else {
    transferColor = TransferColor.Green;
  }

  const triangleFill = transferState !== TransferState.None ? 1 : 0;
  const triangle1Orientation = transferState !== TransferState.GreenToYellow ? -90 : 90;
  const triangle2Orientation = transferState !== TransferState.GreenToYellow ? -90 : 90;
  const triangle3Orientation = transferState !== TransferState.YellowToGreen ? 90 : -90;

  return (
    <SvgGroup x={x} y={y}>
      <line
        id="ptu1"
        className={`${transferState === TransferState.None ? 'Hide ' : ''}${transferColor}Line`}
        x1={-132}
        y1={0}
        x2={-246}
        y2={0}
      />
      <line id="ptu2" className={`${transferColor}Line`} x1={-107} y1={0} x2={-20} y2={0} />
      <path id="ptu3" className={`${transferColor}Line`} d="M-20 0 A20 20 0 0 0 20 0" />
      <line id="ptu4" className={`${transferColor}Line`} x1={20} y1={0} x2={56} y2={0} />
      <line
        id="ptu5"
        className={`${transferState === TransferState.None ? 'Hide ' : ''}${transferColor}Line`}
        x1={177}
        y1={0}
        x2={246}
        y2={0}
      />
      <text className="Large" x={92} y={10}>
        PTU
      </text>
      <Triangle
        scale={4 / 3}
        x={triangle1Orientation < 0 ? -131 : -107}
        y={0}
        colour={transferColor}
        fill={triangleFill}
        orientation={triangle1Orientation}
      />
      <Triangle
        scale={4 / 3}
        x={triangle2Orientation > 0 ? 80 : 56}
        y={0}
        colour={transferColor}
        fill={triangleFill}
        orientation={triangle2Orientation}
      />
      <Triangle
        scale={4 / 3}
        x={triangle3Orientation > 0 ? 177 : 153}
        y={0}
        colour={transferColor}
        fill={triangleFill}
        orientation={triangle3Orientation}
      />
    </SvgGroup>
  );
};
