// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useEffect, useState } from 'react';
import { useSimVar, useArinc429Var, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { fuelForDisplay, fuelInTanksForDisplay } from '../../Common/FuelFunctions';
import { Triangle } from '../../Common/Shapes';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';

import './Fuel.scss';

export const FuelPage = () => {
  const [crossFeedPosition] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'number', 500);

  const [tankLeftOuter] = useSimVar('FUEL TANK LEFT AUX QUANTITY', 'gallons', 500);
  const [tankLeftInner] = useSimVar('FUEL TANK LEFT MAIN QUANTITY', 'gallons', 500);
  const [tankCenter] = useSimVar('FUEL TANK CENTER QUANTITY', 'gallons', 500);
  const [tankRightInner] = useSimVar('FUEL TANK RIGHT MAIN QUANTITY', 'gallons', 500);
  const [tankRightOuter] = useSimVar('FUEL TANK RIGHT AUX QUANTITY', 'gallons', 500);
  const [leftOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'bool', 500);
  const [rightOuterInnerValve] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'bool', 500);
  const [modelSelectManual] = useSimVar('L:A32NX_OVHD_FUEL_MODESEL_MANUAL', 'bool', 500);
  const [autoShutoffRequired] = useSimVar('FUELSYSTEM TRIGGER STATUS:9', 'bool', 500);

  const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

  const [leftConsumption] = useSimVar('L:A32NX_FUEL_USED:1', 'number', 1000); // Note these values are in KG
  const [rightConsumption] = useSimVar('L:A32NX_FUEL_USED:2', 'number', 1000);

  const leftFuelUsed = fuelForDisplay(leftConsumption, unit);
  const rightFuelUsed = fuelForDisplay(rightConsumption, unit);

  const [fuelWeightPerGallon] = useSimVar('FUEL WEIGHT PER GALLON', 'kilogram', 60_000);

  const [onGround] = useSimVar('SIM ON GROUND', 'bool', 1000);

  return (
    // This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM
    <EcamPage name="sd-fuel-page">
      <PageTitle x={14} y={16} text="FUEL" />

      {/* Engines */}
      <>
        <text className="FuelUsed" x={300} y={28}>
          F.USED
        </text>
        <text className="FuelUsed" x={300} y={50}>
          1+2
        </text>
        <text className="UsedQuantity" x={301} y={76}>
          {leftFuelUsed + rightFuelUsed}
        </text>
        <text className="Unit" textAnchor="middle" x={301} y={98}>
          {unit === '1' ? 'KG' : 'LBS'}
        </text>

        {/* Left engine */}
        <line className="EngineLine" x1="200" y1="31" x2="250" y2="21" />
        <EngineStatus x={160} y={41} engineNumber={1} fuelUsed={leftFuelUsed} />

        {/* Right engine */}
        <line className="EngineLine" x1="400" y1="31" x2="350" y2="21" />
        <EngineStatus x={440} y={41} engineNumber={2} fuelUsed={rightFuelUsed} />
      </>

      {/* Wings */}
      <Wings />

      {/* APU */}
      <Apu />

      {/* Left */}
      <>
        {/* Main ducts */}
        <line className="FlowShape" x1={160} y1={84} x2={160} y2={76} />

        {/* Left engine LP valve */}
        <EngineLpValve x={160} y={100} engineNumber={1} />

        {/* Ducts to left inner pumps */}
        <line className="FlowShape" x1={160} y1={215} x2={160} y2={116} />
        <line className="FlowShape" x1={160} y1={190} x2={196} y2={190} />
        <line className="FlowShape" x1={195} y1={190} x2={195} y2={215} />

        {/* Pumps */}
        <Pump x={145} y={215} pumpNumber={2} />
        <Pump x={180} y={215} onBus="DC_2" pumpNumber={5} />

        {/* Quantities */}
        <text className="TankQuantity" x={80} y={285}>
          {fuelInTanksForDisplay(tankLeftOuter, unit, fuelWeightPerGallon)}
        </text>
        <text className="TankQuantity" x={190} y={285}>
          {fuelInTanksForDisplay(tankLeftInner, unit, fuelWeightPerGallon)}
        </text>

        {leftOuterInnerValve ? <Triangle x={77} y={319} colour="Green" fill={0} orientation={90} /> : null}

        <text className="UnitTemp" x="70" y="355">
          °C
        </text>
      </>

      {/* Center */}
      <>
        {/* CrossFeed valve */}
        <CrossFeedValve x={300} y={150} />

        {crossFeedPosition === 1 && (
          <>
            {/* Center valve lines */}
            <line className="FlowShape" x1="317" y1="150" x2="440" y2="150" />
            <line className="FlowShape" x1="160" y1="150" x2="283" y2="150" />
          </>
        )}

        {/* Centre Tank Transfer Valves */}
        <CentreToInnerTransfer
          x={267}
          y={223}
          side="L"
          centreTankLevel={tankCenter}
          modeSelectManual={!!modelSelectManual}
          autoShutoffRequired={!!autoShutoffRequired}
          onGround={!!onGround}
        />
        <CentreToInnerTransfer
          x={302}
          y={223}
          side="R"
          centreTankLevel={tankCenter}
          modeSelectManual={!!modelSelectManual}
          autoShutoffRequired={!!autoShutoffRequired}
          onGround={!!onGround}
        />

        {/* Quantities */}
        <text className="TankQuantity" x={330} y={315}>
          {fuelInTanksForDisplay(tankCenter, unit, fuelWeightPerGallon)}
        </text>
      </>

      {/* Right */}
      <>
        {/* Main duct */}
        <line className="FlowShape" x1={440} y1={84} x2={440} y2={76} />

        {/* Right engine LP valve */}
        <EngineLpValve x={440} y={100} engineNumber={2} />

        {/* Ducts to right inner pumps */}
        <line className="FlowShape" x1={440} y1={215} x2={440} y2={116} />
        <line className="FlowShape" x1={440} y1={190} x2={404} y2={190} />
        <line className="FlowShape" x1={405} y1={190} x2={405} y2={215} />

        {/* Pumps */}
        <Pump x={390} y={215} pumpNumber={3} />
        <Pump x={425} y={215} onBus="DC_2" pumpNumber={6} />

        {/* Quantities */}
        <text className="TankQuantity" x={472} y={285}>
          {fuelInTanksForDisplay(tankRightInner, unit, fuelWeightPerGallon)}
        </text>
        <text className="TankQuantity" x={580} y={285}>
          {fuelInTanksForDisplay(tankRightOuter, unit, fuelWeightPerGallon)}
        </text>
        {rightOuterInnerValve && <Triangle x={522} y={319} colour="Green" fill={0} orientation={-90} />}

        <text className="UnitTemp" x="510" y="355">
          °C
        </text>
      </>

      {/* F. FLOW */}
      <FuelFlow unit={unit} />

      {/* FOB */}
      <FOB unit={unit} />
    </EcamPage>
  );
};

const Apu = () => {
  // Use as a surrogate for fire valve being open or closed.
  const apuN = useArinc429Var('L:A32NX_APU_N', 500);
  const [apuFirePB] = useSimVar('L:A32NX_FIRE_BUTTON_APU', 'boolean', 1000);
  // APU fire P/B out = Amber APU only
  // White APU and triangle only if APU off
  // If APU on and powered green line and triangle
  const apuNAtOrBelow20 = apuN.valueOr(0) <= 20;
  let color = 'Green';
  if (apuFirePB) {
    color = 'Amber';
  } else if (apuNAtOrBelow20) {
    color = 'White';
  }
  const fill = apuFirePB ? 1 : 0;

  return (
    <g id="APU">
      <text className={apuFirePB ? 'Amber' : 'White'} x="122" y="150" textAnchor="end" alignmentBaseline="central">
        APU
      </text>
      {apuFirePB && apuNAtOrBelow20 ? null : <Triangle x={129} y={150} colour={color} fill={fill} orientation={-90} />}
      <path id="apuFuelLine" className={`${color}Line ${apuNAtOrBelow20 ? 'Hide' : ''}`} d="M147,150 l13,0" />
    </g>
  );
};

type FuelFlowProps = {
  unit: string;
};

const FuelFlow = ({ unit }: FuelFlowProps) => {
  const [leftFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:1', 'number', 1000); // KG/HR
  const [rightFuelFlow] = useSimVar('L:A32NX_ENGINE_FF:2', 'number', 1000);

  return (
    <>
      <text className="FuelFlowLabel" x={46} y={443}>
        F.FLOW
      </text>
      <text className="FuelFlowLabel" x={46} y={461}>
        1+2
      </text>

      <text id="FuelFlowColon" x={83} y={461}>
        :
      </text>

      <text id="FuelFlowValue" x={201} y={455}>
        {fuelForDisplay(leftFuelFlow + rightFuelFlow, unit, 60)}
      </text>

      <text id="FuelFlowUnit" x={215} y={455}>
        {unit === '1' ? 'KG' : 'LBS'}
        /MIN
      </text>
    </>
  );
};

type FOBProps = {
  unit: string;
};

const FOB = ({ unit }: FOBProps) => {
  const [fob] = useSimVar('L:A32NX_TOTAL_FUEL_QUANTITY', 'number', 1000);

  return (
    <>
      <path className="ThickShape" d="m 5 499 v -30 h 250 v 30 z" />

      <text id="FobLabel" x={18} y={491}>
        FOB
      </text>
      <text id="FobColon" x={83} y={490}>
        :
      </text>

      <text id="FobValue" x={204} y={485}>
        {fuelForDisplay(fob, unit, 1, 2)}
      </text>

      <text id="FobUnit" x={215} y={487}>
        {unit === '1' ? 'KG' : 'LBS'}
      </text>
    </>
  );
};

const Wings = () => (
  <>
    {/* Bottom line */}
    <path className="ThickShape" d="M 15, 255 l 0, 75 l 570, 0 l 0,-75" strokeLinecap="round" />

    {/* Top line */}
    <path className="ThickShape" d="M 585, 255 l -124.2, -21.6" />
    <path className="ThickShape" d="M 15,  255 l 124.2, -21.6" />
    <path className="ThickShape" d="M 245, 215 l 110, 0" />
    <path className="ThickShape" d="M 245, 215 l -29.9, 5.2" />
    <path className="ThickShape" d="M 355, 215 l 29.9, 5.2" />

    {/* Tank lines */}
    <path className="ThickShape" d="M 85,  243 L 85,  330" />
    <path className="ThickShape" d="M 245, 215 L 230, 330" />
    <path className="ThickShape" d="M 355, 215 L 370, 330" />
    <path className="ThickShape" d="M 515, 243 L 515, 330" />
  </>
);

type EngineStatusProps = {
  x: number;
  y: number;
  engineNumber: number;
  fuelUsed: number;
};

const EngineStatus = ({ x, y, engineNumber, fuelUsed }: EngineStatusProps) => {
  const [EngN2] = useSimVar(`TURB ENG N2:${engineNumber}`, 'Percent', 1000);

  return (
    <>
      <text className={EngN2 > 15 ? 'EngineNumber EngineNumberOn' : 'EngineNumber EngineNumberOff'} x={x} y={y}>
        {engineNumber}
      </text>
      <text className="UsedQuantity" x={x} y={y + 27}>
        {fuelUsed}
      </text>
    </>
  );
};

type EngineValveProps = {
  x: number;
  y: number;
  position: number;
};

const EngineLpValveLine = ({ x, y, position = 0 }: EngineValveProps) => {
  if (position === 0) {
    return <line x1={x - 15} y1={y} x2={x + 15} y2={y} />;
  }

  if (position > 0 && position < 100) {
    return <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />;
  }

  return <line x1={x} y1={y - 15} x2={x} y2={y + 15} />;
};

type EngineLpValveProps = {
  x: number;
  y: number;
  engineNumber?: number;
};

const EngineLpValve = ({ x, y, engineNumber }: EngineLpValveProps) => {
  const [position] = useSimVar(`FUELSYSTEM VALVE OPEN:${engineNumber}`, 'percent', 500);

  return (
    <g className={`ThickShape ${position < 100 ? 'ValveAmber' : 'ValveGreen'}`}>
      <circle cx={x} cy={y} r={15} />

      <EngineLpValveLine x={x} y={y} position={position} />
    </g>
  );
};

const CrossFeedValveLine = ({ x, y, position }: EngineValveProps) => {
  if (position === 0) {
    return <line x1={x} y1={y - 15} x2={x} y2={y + 15} />;
  }

  if (position > 0 && position < 100) {
    return <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />;
  }

  return <line x1={x - 15} y1={y} x2={x + 15} y2={y} />;
};

const CrossFeedValve = ({ x, y }: EngineLpValveProps) => {
  const [position] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'percent', 500);

  return (
    <g className={`ThickShape ${position > 0 && position < 100 ? 'ValveAmber' : 'ValveGreen'}`}>
      <circle cx={x} cy={y} r={15} />

      <CrossFeedValveLine x={x} y={y} position={position} />
    </g>
  );
};

type PumpProps = {
  x: number;
  y: number;
  onBus?: string;
  pumpNumber: number;
  centreTank?: boolean;
  tankQuantity?: number;
};

const Pump = ({ x, y, onBus = 'DC_ESS', pumpNumber, centreTank, tankQuantity }: PumpProps) => {
  const [active] = useSimVar(`FUELSYSTEM PUMP ACTIVE:${pumpNumber}`, 'bool', 500);
  const [busIsPowered] = useSimVar(`L:A32NX_ELEC_${onBus}_BUS_IS_POWERED`, 'bool', 1000);
  const [centreTankGreen, setCentreTankGreen] = useState(false);
  const [pushButton] = useSimVar(`FUELSYSTEM PUMP SWITCH:${pumpNumber}`, 'bool', 500);
  const [simOnGround] = useSimVar('SIM ON GROUND', 'bool', 1000);
  // FIXME add centre tank logic once fuel system implemented
  useEffect(() => {
    if (centreTank) {
      setCentreTankGreen(pushButton && (tankQuantity === 0 || simOnGround));
    }
  }, [pushButton]);

  return (
    <g className={(active && busIsPowered) || centreTankGreen ? 'ThickShape PumpActive' : 'ThickShape PumpInactive'}>
      <rect x={x} y={y} width="30" height="30" />
      {active && busIsPowered ? <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} /> : null}
      {!active && busIsPowered ? <line x1={x + 5} y1={y + 15} x2={x + 25} y2={y + 15} /> : null}
      {busIsPowered ? null : (
        <text className="LoIndication" x={x + 15} y={y + 20}>
          LO
        </text>
      )}
      {(pumpNumber === 1 || pumpNumber === 4) && active && (
        <g className="ThickShape PumpActive">
          <line x1={x + 15} y1={y + 30} x2={x + 15} y2={y + 60} />
          <line
            x1={pumpNumber === 1 ? x + 16 : x + 14}
            y1={y + 60}
            x2={pumpNumber === 1 ? x - 8 : x + 40}
            y2={y + 60}
          />
          {pumpNumber === 1 && <Triangle x={x - 26} y={y + 60} colour="Green" fill={0} orientation={-90} />}
          {pumpNumber === 4 && <Triangle x={x + 59} y={y + 60} colour="Green" fill={0} orientation={90} />}
        </g>
      )}
    </g>
  );
};

interface CentreToInnerTransferProps {
  x: number;
  y: number;
  side: 'L' | 'R';
  /** centre tank level in gallons */
  centreTankLevel: number;
  modeSelectManual: boolean;
  autoShutoffRequired: boolean;
  onGround: boolean;
}

const CentreToInnerTransfer: FC<CentreToInnerTransferProps> = ({
  side,
  centreTankLevel,
  x,
  y,
  modeSelectManual,
  autoShutoffRequired,
  onGround,
}) => {
  // the valve is actually implemented as a pair of valves in series due to the way the MSFS fuel system triggers work
  const [transferValveAuto] = useSimVar(`A:FUELSYSTEM VALVE OPEN:${side === 'R' ? 12 : 11}`, 'percent over 100', 1000);
  const [transferValveInhibit] = useSimVar(
    `A:FUELSYSTEM VALVE OPEN:${side === 'R' ? 10 : 9}`,
    'percent over 100',
    1000,
  );
  const [transferValveSwitch] = useSimVar(`A:FUELSYSTEM VALVE SWITCH:${side === 'R' ? 10 : 9}`, 'boolean', 1000);
  const [transferJunction] = useSimVar(`A:FUELSYSTEM JUNCTION SETTING:${side === 'R' ? 5 : 4}`, 'number', 1000);
  const [transferValveFullyOpen, setTransferValveFullyOpen] = useState(false);
  const [transferValveFullyClosed, setTransferValveFullyClosed] = useState(false);
  const [centreTankLowLevel, setCentreTankLowLevel] = useState(false);

  const [pumpClass, setPumpClass] = useState('GreenLine');
  const [closedClass, setClosedClass] = useState('Hide');
  const [openClass, setOpenClass] = useState('Hide');
  const [faultClass, setFaultClass] = useState('Hide');
  const [transferClass, setTransferClass] = useState('Hide');

  useEffect(() => setCentreTankLowLevel(centreTankLevel <= 42.8), [centreTankLevel]);

  useEffect(() => {
    const manualTransfer = transferJunction > 1.5;
    const autoTransfer = transferValveAuto > 0.0 && !manualTransfer;
    const valvePosition = autoTransfer || manualTransfer ? transferValveInhibit : 0;
    setTransferValveFullyOpen(valvePosition > 0.99);
    setTransferValveFullyClosed(valvePosition < 0.01);
  }, [transferValveAuto, transferValveInhibit, transferJunction]);

  // "pump" state
  useEffect(() => {
    // FIXME autoShutoffRequired is useless at the moment as FUELSYSTEM version 4 does not reflect the trigger delay in this simvar state
    // https://devsupport.flightsimulator.com/questions/15441/fuel-fuelsystem-trigger-status-simvar-unaffected-b.html
    const autoShutoffRequired = !modeSelectManual && !transferValveFullyOpen;

    const fault = transferValveFullyOpen && transferValveFullyClosed; // FIXME also data valid, or neither state for >= 6 seconds

    const amber =
      !fault &&
      ((transferValveFullyClosed && !modeSelectManual && transferValveSwitch > 0 && !autoShutoffRequired) ||
        (!transferValveFullyClosed && (transferValveSwitch === 0 || (!modeSelectManual && autoShutoffRequired))));

    const colourClass = amber ? 'AmberLine' : 'GreenLine';
    setPumpClass(colourClass);
    setClosedClass(transferValveFullyClosed && !fault ? colourClass : 'Hide');
    setOpenClass(!transferValveFullyClosed && !fault ? colourClass : 'Hide');
    setFaultClass(fault ? 'AmberLine' : 'Hide');
  }, [
    transferValveFullyOpen,
    transferValveFullyClosed,
    modeSelectManual,
    onGround,
    centreTankLowLevel,
    transferValveSwitch,
    autoShutoffRequired,
  ]);

  // transfer state
  useEffect(() => {
    // FIXME autoShutoffRequired is useless at the moment as FUELSYSTEM version 4 does not reflect the trigger delay in this simvar state
    // https://devsupport.flightsimulator.com/questions/15441/fuel-fuelsystem-trigger-status-simvar-unaffected-b.html
    const autoShutoffRequired = !modeSelectManual && !transferValveFullyOpen;

    if (transferValveFullyClosed) {
      setTransferClass('Hide'); // FIXME also data invalid
    } else if (!transferValveSwitch || (autoShutoffRequired && !modeSelectManual)) {
      setTransferClass('AmberLine');
    } else {
      setTransferClass('GreenLine');
    }
  }, [transferValveFullyClosed, transferValveSwitch, autoShutoffRequired, modeSelectManual, transferValveFullyOpen]);

  return (
    <g id={`CentreToInnerTransferValve${side}`} className="ThickShape">
      {/* "pump" symbol */}
      <rect x={x} y={y} width="30" height="30" className={pumpClass} />
      <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} className={openClass} />
      <line x1={x + 5} y1={y + 15} x2={x + 25} y2={y + 15} className={closedClass} />
      <text fontSize={16} className={faultClass} x={x + 6} y={y + 19}>
        XX
      </text>
      {/* transfer arrow */}
      <line x1={x + 15} y1={y + 30} x2={x + 15} y2={y + 60} className={transferClass} />
      <line
        x1={side === 'R' ? x + 16 : x + 14}
        y1={y + 60}
        x2={side === 'L' ? x - 8 : x + 40}
        y2={y + 60}
        className={transferClass}
      />
      <Triangle
        x={x + (side === 'L' ? -26 : 59)}
        y={y + 60}
        colour={transferClass === 'AmberLine' ? 'Amber' : 'Green'}
        fill={transferClass === 'AmberLine' ? 1 : 0}
        orientation={side === 'L' ? -90 : 90}
        hidden={transferClass === 'Hide'}
      />
    </g>
  );
};
