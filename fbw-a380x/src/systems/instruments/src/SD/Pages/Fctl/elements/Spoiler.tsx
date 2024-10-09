import { useSimVar } from '@flybywiresim/fbw-sdk';
import React, { FC } from 'react';

const SCALE_HEIGHT = -35;

export enum SpoilerSide {
  Left = 'LEFT',
  Right = 'RIGHT',
}

interface SpoilerProps {
  x: number;
  y: number;
  side: SpoilerSide;
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  onGround: boolean;
}

export function deflectionToYOffset(deflection: number, maxDeflection: number): number {
  const normalizedDeflection = deflection / maxDeflection;

  return normalizedDeflection * SCALE_HEIGHT;
}

export const Spoiler: FC<SpoilerProps> = ({ x, y, side, position, onGround }) => {
  const [spoilerDeflection]: [number, (v: number) => void] = useSimVar(
    `L:A32NX_HYD_SPOILER_${position}_${side}_DEFLECTION`,
    'number',
    100,
  );
  const maxDeflection = position >= 3 ? 50 : 35;

  const deflectionYVal = deflectionToYOffset(spoilerDeflection * 50, maxDeflection);

  const [hydPowerAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    'L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH',
    'boolean',
    1000,
  );
  const [elecPowerAvailable]: [boolean, (v: boolean) => void] = useSimVar(
    'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    'boolean',
    1000,
  );

  let yOffset: number;
  if (position <= 2) {
    yOffset = 0;
  } else if (position <= 4) {
    yOffset = -4;
  } else if (position <= 6) {
    yOffset = -8;
  } else {
    yOffset = -12;
  }

  // On ground, elec motors only active if G HYD system is pressurized
  const powerAvail = onGround ? hydPowerAvailable : hydPowerAvailable || elecPowerAvailable;
  const spoilersFailed = !powerAvail;
  const deflectionInfoValid = true;

  const maxDeflectionVisible = onGround && deflectionInfoValid && powerAvail && position >= 3;

  const powerAvailableClass = powerAvail ? 'Green' : 'Amber';

  return (
    <g id={`spoiler-${side}-${position}`} transform={`translate(${x} ${y + yOffset})`}>
      <path className="Grey Fill" d="m0,0 v -35 h15 v35 z" />

      {/* The max deflection line needs to be at the 45° deflection position, as this is the maximum deflection for roll spoilers.
            The 2px offset is because of the line width, the deflection indication should reach the lower border of the line. */}
      <path
        className={`Green SW2 ${maxDeflectionVisible ? '' : 'Hide'}`}
        d={`m0,${deflectionToYOffset(45, maxDeflection) - 2} h 15`}
      />

      <path
        className={`${powerAvailableClass} Fill ${deflectionInfoValid ? '' : 'Hide'}`}
        d={`m0,0 h15 v${deflectionYVal} h-16 z`}
      />

      <path className={`Amber SW4 LineRound ${spoilersFailed ? '' : 'Hide'}`} d="m1,-2 v-31 M14,-2 v-31" />

      <text x={-1} y={0} className={`Amber F32 ${!deflectionInfoValid ? '' : 'Hide'}`}>
        X
      </text>
    </g>
  );
};
