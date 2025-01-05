// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { useSimVar } from '@flybywiresim/fbw-sdk';
import React, { FC } from 'react';
import { Triangle } from '../../../Common/Shapes';
import BleedGauge from './BleedGauge';
import Valve from './Valve';

interface EngineBleedProps {
  x: number;
  y: number;
  engine: 1 | 2;
  sdacDatum: boolean;
  enginePRValveOpen: boolean;
  packFlowValveOpen: boolean;
  onGround: boolean;
  wingAntiIceOn: boolean;
  wingAntiIceTimer: number;
}

const EngineBleed: FC<EngineBleedProps> = ({
  x,
  y,
  engine,
  sdacDatum,
  enginePRValveOpen,
  packFlowValveOpen,
  onGround,
  wingAntiIceOn,
  wingAntiIceTimer,
}) => {
  // TODO: Should come from ECU
  const [engineN1] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
  const [engineN1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 500);
  const engineN1BelowIdle = engineN1 + 2 < engineN1Idle;
  const [engineN1BelowIdleValid] = useSimVar(`L:A32NX_FADEC_POWERED_ENG${engine}`, 'bool', 500);

  const [engineHPValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_HP_VALVE_OPEN`, 'bool', 500);
  const [precoolerOutletTemp] = useSimVar(
    `L:A32NX_PNEU_ENG_${engine}_BLEED_TEMPERATURE_SENSOR_TEMPERATURE`,
    'celsius',
    100,
  );

  const precoolerOutletTempFive = Math.round(precoolerOutletTemp / 5) * 5;
  const isPrecoolerOutletTempValid = precoolerOutletTemp > -100;
  const [precoolerOutletLowTemperature] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_LOW_TEMPERATURE`, 'bool', 100);
  const [precoolerOutletOverheat] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_OVERHEAT`, 'bool', 100);

  const [precoolerInletPress] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_REGULATED_TRANSDUCER_PRESSURE`, 'psi', 100);
  const precoolerInletPressTwo = Math.round(precoolerInletPress / 2) * 2;
  const [precoolerInletOverpressure] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_OVERPRESSURE`, 'bool', 100);

  const [wingAntiIceValveClosed] = useSimVar(`L:A32NX_PNEU_WING_ANTI_ICE_${engine}_VALVE_CLOSED`, 'bool', 500);
  const [wingAntiIceHighPressure] = useSimVar(`L:A32NX_PNEU_WING_ANTI_ICE_${engine}_HIGH_PRESSURE`, 'bool', 500);
  const [wingAntiIceLowPressure] = useSimVar(`L:A32NX_PNEU_WING_ANTI_ICE_${engine}_LOW_PRESSURE`, 'bool', 500);

  /* When onGround, it should become AMBER after 10s that it's open */
  const WingAntiIceTriangleColour =
    (onGround && wingAntiIceTimer >= 10 && !wingAntiIceValveClosed) ||
    wingAntiIceValveClosed === wingAntiIceOn ||
    wingAntiIceHighPressure === 1 ||
    wingAntiIceLowPressure === 1
      ? 'Amber'
      : 'Green';
  const ShowWingAntiIceTriangle = wingAntiIceOn || !wingAntiIceValveClosed;

  return (
    <g id={`bleed-${engine}`}>
      {/* Air Cond shape and labels */}
      <path className="GreyStroke Stroke2" d={`M ${x},${y} l -47,10 l 0,123 l 14,0`} />
      <path className="GreyStroke Stroke2" d={`M ${x - 47},${y + 64} l 14,0`} />
      <path className="GreyStroke Stroke2" d={`M ${x},${y} l +47,10 l 0,123 l -14,0`} />
      <path className="GreyStroke Stroke2" d={`M ${x + 47},${y + 64} l -14,0`} />
      <text x={x - 56} y={y + 64} className="White Standard End">
        C
      </text>
      <text x={x + 58} y={y + 64} className="White Standard">
        H
      </text>
      <text x={x - 55} y={y + 132} className="White Standard End">
        LO
      </text>
      <text x={x + 61} y={y + 132} className="White Standard">
        HI
      </text>

      {/* Pack inlet Flow */}
      <BleedGauge x={x} y={y + 150} sdacDatum={sdacDatum} packFlowValveOpen={packFlowValveOpen} engine={engine} />

      {/* Anti-ice */}
      {/* When switch is ON, but command is to turn WAI OFF (i.e. ground), hide EngineBleed from the BLEED page. */}
      <g id={`anti-ice-engine-${engine}`}>
        <Triangle
          x={engine === 1 ? x - 41 : x + 41}
          y={y + 206}
          colour={ShowWingAntiIceTriangle ? `Show ${WingAntiIceTriangleColour}` : `Hide ${WingAntiIceTriangleColour}`}
          orientation={engine === 1 ? -90 : 90}
          fill={0}
          scale={0.75}
        />
        <text
          className={`Medium White ${wingAntiIceOn ? 'Show' : 'Hide'}`}
          x={engine === 1 ? x - 80 : x + 42}
          y={y + 195}
        >
          ANTI
        </text>
        <text
          className={`Medium White ${wingAntiIceOn ? 'Show' : 'Hide'}`}
          x={engine === 1 ? x - 80 : x + 52}
          y={y + 215}
        >
          ICE
        </text>
      </g>
      <g className={!sdacDatum ? 'Show' : 'Hide'}>
        <text className="Standard Amber" x={engine === 1 ? x - 75 : x + 55} y={y + 205}>
          XX
        </text>
        <text className="Standard Amber" x={engine === 1 ? x - 50 : x + 30} y={y + 215}>
          XX
        </text>
      </g>

      {/* Engine Bleed temp */}
      <path className="GreyStroke Stroke2" d={`M ${x},${y + 247} l -27,0 l 0,54 l 54,0 l 0,-54 l -27,0`} />
      <text x={engine === 1 ? x + 40 : x - 70} y={y + 270} className="Cyan Standard">
        PSI
      </text>
      <text x={engine === 1 ? x + 40 : x - 70} y={y + 298} className="Cyan Standard">
        °C
      </text>
      {/* Precooler outlet pressure */}
      <text
        x={x}
        y={y + 270}
        className={`Large Center ${!sdacDatum || precoolerInletPressTwo <= 4 || precoolerInletOverpressure ? 'Amber' : 'Green'}`}
      >
        {!sdacDatum ? 'XX' : precoolerInletPressTwo}
      </text>
      {/* Precooler outlet temperature */}
      <text
        x={sdacDatum ? x + 20 : x + 14}
        y={y + 295}
        className={`Large End ${!sdacDatum || !isPrecoolerOutletTempValid || precoolerOutletLowTemperature || precoolerOutletOverheat ? 'Amber' : 'Green'}`}
      >
        {!sdacDatum || !isPrecoolerOutletTempValid ? 'XX' : precoolerOutletTempFive}
      </text>

      {/* Pressure regulating valve */}
      <path
        className={!engineN1BelowIdle && enginePRValveOpen ? 'GreenLine' : 'Hide'}
        d={`M ${x},${y + 340} l 0,-37`}
      />
      <Valve
        x={x}
        y={y + 355}
        radius={15}
        css="GreenLine"
        position={enginePRValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path className={engineN1BelowIdle ? 'AmberLine' : 'GreenLine'} d={`M ${x},${y + 415} l 0,-45`} />
      <text x={x + 2} y={y + 433} className="White Center Standard">
        IP
      </text>

      {/* High pressure valve */}
      <Valve
        x={engine === 1 ? x + 47 : x - 47}
        y={y + 398}
        radius={15}
        css="GreenLine"
        position={engineHPValveOpen === 1 ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <path
        className={engineN1BelowIdle ? 'AmberLine' : 'GreenLine'}
        d={`M ${engine === 1 ? x + 92 : x - 92},${y + 415} l 0,-17 l ${engine === 1 ? '-29' : '29'},0`}
      />
      <text x={engine === 1 ? x + 95 : x - 90} y={y + 433} className="White Center Standard">
        HP
      </text>
      <path
        className={engineHPValveOpen === 1 || !sdacDatum ? 'GreenLine' : 'Hide'}
        d={`M ${engine === 1 ? x + 33 : x - 33},${y + 398} l ${engine === 1 ? '-33' : '33'},0`}
      />

      <text
        x={engine === 1 ? x - 61 : x + 58}
        y={423}
        className={`Huge ${engineN1BelowIdle && engineN1BelowIdleValid ? 'Amber' : 'White'}`}
      >
        {engine}
      </text>
    </g>
  );
};

export default EngineBleed;
