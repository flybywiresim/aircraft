// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState, useEffect } from 'react';
import { Arc, Needle } from '@instruments/common/gauges';
import { MathUtils, usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

import './Eng.scss';

export const EngPage: FC = () => {
  const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
  const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum');
  const [fadec1On] = useSimVar('L:A32NX_FADEC_POWERED_ENG1', 'bool');
  const [fadec2On] = useSimVar('L:A32NX_FADEC_POWERED_ENG2', 'bool');
  return (
    <EcamPage name="main-eng">
      <PageTitle x={6} y={18} text="ENGINE" />

      <EngineColumn x={90} y={40} engineNumber={1} fadecOn={fadec1On} />

      <line className="Indicator" x1={250} y1={75} x2={225} y2={77} />
      <text x={300} y={75} className="FillWhite FontMedium TextCenter">
        F.USED
      </text>
      <text x={300} y={97} className="FillCyan FontSmall TextCenter">
        {parseInt(weightUnit) === 1 ? 'KG' : 'LBS'}
      </text>
      <line className="Indicator" x1={350} y1={75} x2={375} y2={77} />

      <text x={300} y={135} className="FillWhite FontMedium TextCenter">
        OIL
      </text>
      <text x={300} y={160} className="FillCyan FontSmall TextCenter">
        QT
      </text>
      <text x={300} y={235} className="FillCyan FontSmall TextCenter">
        PSI
      </text>

      <line className="Indicator" x1={250} y1={292} x2={225} y2={294} />
      <text x={300} y={290} className="FillCyan FontSmall TextCenter">
        &deg;C
      </text>
      <line className="Indicator" x1={350} y1={292} x2={375} y2={294} />

      <line className="Indicator" x1={250} y1={340} x2={225} y2={342} />
      <text x={300} y={340} className="FillWhite FontSmall TextCenter">
        VIB N1
      </text>
      <line className="Indicator" x1={350} y1={340} x2={375} y2={342} />

      <line className="Indicator" x1={250} y1={370} x2={225} y2={372} />
      <text x={300} y={370} className="FillWhite FontSmall TextCenter">
        &nbsp;&nbsp;&nbsp; N2
      </text>
      <line className="Indicator" x1={350} y1={370} x2={375} y2={372} />

      <text x={300} y={425} className={`FillWhite FontSmall TextCenter ${engSelectorPosition !== 2 && 'Hidden'}`}>
        IGN
      </text>

      <SvgGroup x={0} y={0} className={`${engSelectorPosition !== 2 && 'Hidden'}`}>
        <line className="Indicator" x1={250} y1={488} x2={225} y2={490} />
        <text x={300} y={490} className="FillCyan FontSmall TextCenter">
          PSI
        </text>
        <line className="Indicator" x1={350} y1={488} x2={375} y2={490} />
      </SvgGroup>

      <EngineColumn x={210} y={40} engineNumber={2} fadecOn={fadec2On} />
    </EcamPage>
  );
};

function getNeedleValue(value: any, max: number): number {
  const numberValue = Number(value);
  if (numberValue < max) {
    return (numberValue / max) * 100;
  }
  return 100;
}

interface ComponentPositionProps {
  x: number;
  y: number;
  /** 1-based index of the engine.*/
  engineNumber: number;
  fadecOn: boolean;
}

const PressureGauge = ({ x, y, engineNumber, fadecOn }: ComponentPositionProps) => {
  const [engineOilPressure] = useSimVar(`L:A32NX_ENGINE_OIL_PRESS:${engineNumber}`, 'number', 100);
  const displayedEngineOilPressure = MathUtils.round(engineOilPressure, 2); // Engine oil pressure has a step of 2
  const OIL_PSI_MAX = 130;
  const OIL_PSI_HIGH_LIMIT = 130;
  const OIL_PSI_LOW_LIMIT = 14; // TODO FIXME: standin value
  const OIL_PSI_VLOW_LIMIT = 12;
  const [psiNeedleRed, setPsiNeedleRed] = useState(true);
  const [pressureAboveHigh, setPressureAboveHigh] = useState(false);
  const [pressureBelowLow, setPressureBelowLow] = useState(false);
  const [shouldPressurePulse, setShouldPressurePulse] = useState(false);
  const [n2Percent] = useSimVar(`ENG N2 RPM:${engineNumber}`, 'percent', 50);
  const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'number');
  const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'number');

  const engineRunning = engine1State > 0 || engine2State > 0;

  const activeVisibility = fadecOn ? 'visible' : 'hidden';
  const inactiveVisibility = fadecOn ? 'hidden' : 'visible';
  /* Controls different styling of pressure needle and digital readout according to certain critical, or cautionary ranges.
   */
  useEffect(() => {
    if (displayedEngineOilPressure > OIL_PSI_HIGH_LIMIT - 1) {
      setPressureAboveHigh(true);
    }

    if (pressureAboveHigh && displayedEngineOilPressure < OIL_PSI_HIGH_LIMIT - 4) {
      setPressureAboveHigh(false);
    }

    if (displayedEngineOilPressure < OIL_PSI_LOW_LIMIT && n2Percent > 75) {
      setPressureBelowLow(true);
    }

    if (pressureBelowLow && displayedEngineOilPressure > OIL_PSI_LOW_LIMIT + 2) {
      setPressureBelowLow(true);
    }

    if (pressureAboveHigh || pressureBelowLow) {
      setShouldPressurePulse(true);
    } else {
      setShouldPressurePulse(false);
    }

    if (displayedEngineOilPressure <= OIL_PSI_VLOW_LIMIT) {
      setPsiNeedleRed(true);
    }
    if (psiNeedleRed && displayedEngineOilPressure >= OIL_PSI_VLOW_LIMIT + 0.5) {
      setPsiNeedleRed(false);
    }
  }, [engineOilPressure]);

  let needleClassName = 'GreenLine';
  let textClassName = 'FillGreen';
  if (shouldPressurePulse) {
    needleClassName = 'LinePulse';
    textClassName = 'FillPulse';
  } else if (psiNeedleRed) {
    needleClassName = 'RedLine';
    textClassName = 'FillRed';
  }

  return (
    <SvgGroup x={0} y={0}>
      <line className="GaugeMarking" x1={x} y1={y} x2={x} y2={y + 5} />
      <line className="GaugeMarking" x1={x + 45} y1={y + 50} x2={x + 51} y2={y + 50} />
      <Arc x={x} y={y + 50} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
      <g visibility={activeVisibility}>
        <Arc
          x={x}
          y={y + 50}
          radius={50}
          toValue={OIL_PSI_VLOW_LIMIT}
          scaleMax={100}
          className={`RedLine NoFill ${!engineRunning && 'Hidden'}`}
        />
        <Needle
          x={x}
          y={y + 50}
          length={60}
          scaleMax={100}
          value={getNeedleValue(engineOilPressure, OIL_PSI_MAX)}
          className={`NoFill ${needleClassName}`}
          dashOffset={-40}
        />
        <text x={x} y={y + 45} className={`FontLarge TextCenter ${textClassName}`}>
          {displayedEngineOilPressure}
        </text>
      </g>
      <g visibility={inactiveVisibility}>
        <text x={x} y={y + 45} className="FontLarge TextCenter FillAmber">
          XX
        </text>
      </g>
    </SvgGroup>
  );
};

const QuantityGauge = ({ x, y, engineNumber, fadecOn }: ComponentPositionProps) => {
  const [engineOilQuantity] = useSimVar(`L:A32NX_ENGINE_OIL_QTY:${engineNumber}`, 'number', 100);
  const OIL_QTY_MAX = 24.25;
  const OIL_QTY_LOW_ADVISORY = 1.35;
  const displayedEngineOilQuantity = MathUtils.clamp(MathUtils.round(engineOilQuantity, 0.5), 0, OIL_QTY_MAX); // Engine oil quantity has a step of 0.5
  const [quantityAtOrBelowLow, setQuantityAtOrBelowLow] = useState(false);
  const [shouldQuantityPulse, setShouldQuantityPulse] = useState(false);

  const activeVisibility = fadecOn ? 'visible' : 'hidden';
  const inactiveVisibility = fadecOn ? 'hidden' : 'visible';
  // Sets engine oil quantity's pulsation based on advisory value constant, this should be changed in the future as its calculated on the fly in NEOs
  useEffect(() => {
    if (displayedEngineOilQuantity <= OIL_QTY_LOW_ADVISORY) {
      setQuantityAtOrBelowLow(true);
    }

    if (quantityAtOrBelowLow && displayedEngineOilQuantity >= OIL_QTY_LOW_ADVISORY + 2) {
      setQuantityAtOrBelowLow(false);
    }

    if (quantityAtOrBelowLow) setShouldQuantityPulse(true);
  }, [engineOilQuantity]);

  return (
    <SvgGroup x={0} y={0}>
      <line className="GaugeMarking" x1={x - 51} y1={y} x2={x - 45} y2={y} />
      <line className="GaugeMarking" x1={x} y1={y - 50} x2={x} y2={y - 45} />
      <line className="GaugeMarking" x1={x + 45} y1={y} x2={x + 51} y2={y} />
      <Arc x={x} y={y} radius={50} toValue={100} scaleMax={100} className="WhiteLine NoFill" />
      <g visibility={activeVisibility}>
        <Needle
          x={x}
          y={y}
          length={60}
          scaleMax={100}
          value={getNeedleValue(engineOilQuantity, OIL_QTY_MAX)}
          className={`NoFill ${displayedEngineOilQuantity === 0 && 'Hidden'} ${shouldQuantityPulse ? 'LinePulse' : 'GreenLine '}`}
          dashOffset={-40}
        />
        <Needle
          x={x}
          y={y}
          length={60}
          scaleMax={100}
          value={getNeedleValue(OIL_QTY_LOW_ADVISORY, OIL_QTY_MAX) - 3}
          className="NoFill AmberHeavy"
          dashOffset={-50}
        />
        <Needle
          x={x}
          y={y}
          length={50}
          scaleMax={100}
          value={getNeedleValue(OIL_QTY_LOW_ADVISORY, OIL_QTY_MAX) - 2}
          className="NoFill AmberLine"
          dashOffset={-45}
        />
        <text x={x + 5} y={y} className={`FontLarge TextCenter ${shouldQuantityPulse ? 'FillPulse' : 'FillGreen'}`}>
          <tspan className="FontLarge">{displayedEngineOilQuantity.toFixed(1).split('.')[0]}</tspan>
          <tspan className="FontSmall">.</tspan>
          <tspan className="FontSmall">{displayedEngineOilQuantity.toFixed(1).split('.')[1]}</tspan>
        </text>
      </g>
      <g visibility={inactiveVisibility}>
        <text x={x} y={y} className="FontLarge TextCenter FillAmber">
          XX
        </text>
      </g>
    </SvgGroup>
  );
};

const ValveGroup = ({ x, y, engineNumber, fadecOn }: ComponentPositionProps) => {
  const [isValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engineNumber}_STARTER_VALVE_OPEN`, 'bool', 250);
  const [n2Percent] = useSimVar(`ENG N2 RPM:${engineNumber}`, 'percent', 50);
  const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum');
  const [igniterAactive] = useSimVar(`L:A32NX_FADEC_IGNITER_A_ACTIVE_ENG${engineNumber}`, 'bool', 300);
  const [igniterBactive] = useSimVar(`L:A32NX_FADEC_IGNITER_B_ACTIVE_ENG${engineNumber}`, 'bool', 300);
  const [precoolerInletPressure] = useSimVar(
    `L:A32NX_PNEU_ENG_${engineNumber}_REGULATED_TRANSDUCER_PRESSURE`,
    'psi',
    250,
  );
  const [bleedOverpressure] = useSimVar(`L:A32NX_PNEU_ENG_${engineNumber}_OVERPRESSURE`, 'bool', 250);

  // From a document
  const LOW_BLEED_PRESSURE_THRESHOLD = 21;
  // TODO: Should be ARINC429. For now, -1 indicates a failed state
  const pressureIsValid = precoolerInletPressure >= 0;
  const precoolerInletPressureTwo = Math.max(0, Math.min(512, 2 * Math.round(precoolerInletPressure / 2)));
  const pressureIndicationAmber =
    !pressureIsValid ||
    (precoolerInletPressureTwo < LOW_BLEED_PRESSURE_THRESHOLD && n2Percent >= 10 && isValveOpen) ||
    bleedOverpressure;

  const activeVisibility = fadecOn ? 'visible' : 'hidden';
  const inactiveVisibility = fadecOn ? 'hidden' : 'visible';

  return (
    <SvgGroup x={0} y={0} className={`${engSelectorPosition !== 2 && 'Hidden'}`}>
      <text x={x - 7} y={y} className={`FillGreen FontMedium TextCenter ${!igniterAactive && 'Hidden'}`}>
        A
      </text>
      <text x={x + 7} y={y} className={`FillGreen FontMedium TextCenter ${!igniterBactive && 'Hidden'}`}>
        B
      </text>
      <g className="StartValveDiagram">
        {/* 375 to 30 */}
        <circle r={14} cx={x} cy={y + 30} />
        <g visibility={activeVisibility}>
          <line x1={x} y1={y + 10} x2={x} y2={y + 43} className={`${!isValveOpen && 'Hidden'}`} />
          <line x1={x - 14} y1={y + 30} x2={x + 14} y2={y + 30} className={`${isValveOpen && 'Hidden'}`} />
        </g>
        <g visibility={inactiveVisibility}>
          <text x={x + 1} y={y + 31} className="FillAmber FontSmall TextCenter" stroke="none">
            XX
          </text>
        </g>
        <line x1={x} y1={y + 43} x2={x} y2={y + 50} />
      </g>
      <text x={x} y={y + 65} className={`${pressureIndicationAmber ? 'FillAmber' : 'FillGreen'} FontLarge TextCenter`}>
        {pressureIsValid ? precoolerInletPressureTwo : 'XX'}
      </text>
    </SvgGroup>
  );
};

const EngineColumn = ({ x, y, engineNumber, fadecOn }: ComponentPositionProps) => {
  // Fuel used has a step of 10 when in Kilograms and 20 when in imperial pounds
  const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
  const [fuelUsed] = useSimVar(`L:A32NX_FUEL_USED:${engineNumber}`, 'number', 500);
  const displayedFuelUsed =
    parseInt(weightUnit) === 1 ? Math.round(fuelUsed / 10) * 10 : Math.round(fuelUsed / 0.4535934 / 20) * 20;

  const [engineOilTemperature] = useSimVar(`GENERAL ENG OIL TEMPERATURE:${engineNumber}`, 'celsius', 250);
  const OIL_TEMP_LOW_TAKEOFF = 38;
  const OIL_TEMP_HIGH_ADVISORY = 140;
  const OIL_TEMP_VHIGH_LIMIT = 155;
  const displayedEngineOilTemperature = Math.round(engineOilTemperature / 5) * 5; // Engine oil temperature has a step of 5
  const [tempAmber, setTempAmber] = useState(false);
  const [shouldTemperaturePulse, setShouldTemperaturePulse] = useState(false);
  const [tempBeenAboveAdvisory, setTempBeenAboveAdvisory] = useState(false);

  const [n1Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number');

  const [n2Vibration] = useSimVar(`TURB ENG VIBRATION:${engineNumber}`, 'Number'); // FIXME TODO: should have a different value than N1, currently API limited

  const activeVisibility = fadecOn ? 'visible' : 'hidden';
  const inactiveVisibility = fadecOn ? 'hidden' : 'visible';

  useEffect(() => {
    if (displayedEngineOilTemperature >= OIL_TEMP_HIGH_ADVISORY) {
      setShouldTemperaturePulse(true);
    } else if (!tempBeenAboveAdvisory) {
      setShouldTemperaturePulse(false);
    }

    if (displayedEngineOilTemperature >= OIL_TEMP_VHIGH_LIMIT || engineOilTemperature < OIL_TEMP_LOW_TAKEOFF) {
      setTempAmber(true);
    } else {
      setTempAmber(false);
    }

    let timeout: ReturnType<typeof setTimeout>;
    if (engineOilTemperature > OIL_TEMP_HIGH_ADVISORY) {
      timeout = setTimeout(() => {
        if (engineOilTemperature > OIL_TEMP_HIGH_ADVISORY) {
          setTempBeenAboveAdvisory(true);
        }
      }, 900_000);
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      setTempBeenAboveAdvisory(false);
    }

    return () => clearTimeout(timeout);
  }, [engineOilTemperature]);

  useEffect(() => {
    if (tempBeenAboveAdvisory) {
      setTempAmber(true);
    }
  }, [tempBeenAboveAdvisory]);

  let textClassName = 'FillGreen';
  if (tempAmber) {
    textClassName = 'FillAmber';
  } else if (shouldTemperaturePulse) {
    textClassName = 'FillPulse';
  }

  return (
    <SvgGroup x={x} y={y}>
      <text x={x} y={y} className="FillGreen FontLarge TextCenter">
        {displayedFuelUsed}
      </text>

      <QuantityGauge x={x} y={y + 85} engineNumber={engineNumber} fadecOn={fadecOn} />

      <PressureGauge x={x} y={y + 110} engineNumber={engineNumber} fadecOn={fadecOn} />
      <g visibility={activeVisibility}>
        <text x={x} y={y + 220} className={`FontLarge TextCenter ${textClassName}`}>
          {displayedEngineOilTemperature}
        </text>

        <text x={x} y={y + 270} className="FillGreen TextCenter">
          <tspan className="FontLarge">{n1Vibration.toFixed(1).toString().split('.')[0]}</tspan>
          <tspan className="FontSmall">.</tspan>
          <tspan className="FontSmall">{n1Vibration.toFixed(1).toString().split('.')[1]}</tspan>
        </text>

        <text x={x} y={y + 300} className="FillGreen TextCenter">
          <tspan className="FontLarge">{n2Vibration.toFixed(1).toString().split('.')[0]}</tspan>
          <tspan className="FontSmall">.</tspan>
          <tspan className="FontSmall">{n2Vibration.toFixed(1).toString().split('.')[1]}</tspan>
        </text>
      </g>
      <g visibility={inactiveVisibility}>
        <text x={x} y={y + 220} className="FontLarge TextCenter FillAmber">
          XX
        </text>
        <text x={x} y={y + 270} className="FontLarge FillAmber TextCenter">
          XX
        </text>
        <text x={x} y={y + 300} className="FontLarge FillAmber TextCenter">
          XX
        </text>
      </g>

      <ValveGroup x={x} y={y + 345} engineNumber={engineNumber} fadecOn={fadecOn} />
    </SvgGroup>
  );
};
