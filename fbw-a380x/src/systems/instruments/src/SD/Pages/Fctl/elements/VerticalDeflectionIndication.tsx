import React, { FC } from 'react';

const SCALE_HEIGHT = 116;
export const MAX_VERTICAL_DEFLECTION = 20;
export const MIN_VERTICAL_DEFLECTION = -30;

interface VerticalDeflectionIndicationProps {
  x?: number;
  y?: number;
  powerAvail: boolean;
  deflectionInfoValid: boolean;
  deflection: number;
  showAileronDroopSymbol?: boolean;
  onGround: boolean;
}

function deflectionToYOffset(deflection: number): number {
  const normalizedDeflection =
    deflection > 0 ? deflection / MAX_VERTICAL_DEFLECTION : -deflection / MIN_VERTICAL_DEFLECTION;

  return (normalizedDeflection * SCALE_HEIGHT) / 2;
}

export const VerticalDeflectionIndication: FC<VerticalDeflectionIndicationProps> = ({
  x = 0,
  y = 0,
  powerAvail,
  deflectionInfoValid,
  deflection,
  showAileronDroopSymbol = false,
  onGround,
}) => {
  const deflectionXValue = deflectionToYOffset(deflection);

  const maxDeflectionVisible = onGround && deflectionInfoValid && powerAvail;

  const powerAvailableClass = powerAvail ? 'Green' : 'Amber';

  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="Grey Fill" d="m0,0 v 116 h15 v-116 z" />

      {showAileronDroopSymbol && deflectionInfoValid && (
        <circle className="SW2 White" cx={7.5} cy={deflectionToYOffset(5) + SCALE_HEIGHT / 2} r={3.75} />
      )}

      <path className={`Green SW2 ${maxDeflectionVisible ? '' : 'Hide'}`} d="m0,-1 h 15 M0,117 h15" />

      <path
        className={`${powerAvailableClass} Fill ${deflectionInfoValid ? '' : 'Hide'}`}
        d={`m0,58 h15 v${deflectionXValue} h-15 z`}
      />
      {/* This is the small line in the middle of the scale, when the surface is neutral. */}
      <path className={`${powerAvailableClass} SW2 ${deflectionInfoValid ? '' : 'Hide'}`} d="m0,58 h15" />

      <text x={-1} y={70} className={`Amber F32 ${!deflectionInfoValid ? '' : 'Hide'}`}>
        X
      </text>
    </g>
  );
};
