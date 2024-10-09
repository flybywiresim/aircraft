import React, { FC } from 'react';

export enum RudderPosition {
  Upper,
  Lower,
}

interface RudderTrimProps {
  x: number;
  y: number;
}

export const RudderTrim: FC<RudderTrimProps> = ({ x, y }) => {
  const deflectionInfoValid = true;
  const rudderTrim = 0;

  const deflectionXValue = 0;

  const powerSource1Avail = true;
  const powerSource2Avail = true;

  const [pitchIntegral, pitchFractional] = Math.abs(rudderTrim).toFixed(1).split('.');

  const powerAvailableClass = powerSource1Avail || powerSource2Avail ? 'Cyan' : 'Amber';

  return (
    <g id="rudder-trim" transform={`translate(${x} ${y})`}>
      <text x={70} y={-8} className="F22 White LS1">
        RUD TRIM
      </text>

      <g visibility={deflectionInfoValid ? 'visible' : 'hidden'}>
        {/* This is to occlude part of the tail graphic. */}
        <path d="m-5,0 h8 v17 h-8 z" className="BackgroundFill" />

        <path
          d="m0,0 l6,8 l-6,8 l-6,-8 z"
          className={`${powerAvailableClass} Fill`}
          transform={`translate(${deflectionXValue} 0)`}
        />

        <text
          x={72}
          y={17}
          visibility={Math.abs(rudderTrim) > 0.05 ? 'visible' : 'hidden'}
          className={`${powerAvailableClass} F26`}
        >
          {Math.sign(rudderTrim) === 1 ? 'L' : 'R'}
        </text>
        <text x={111} y={17} className={`${powerAvailableClass} F26 EndAlign`}>
          {pitchIntegral}
        </text>
        <text x={110} y={17} className={`${powerAvailableClass} F26`}>
          .
        </text>
        <text x={128} y={17} className={`${powerAvailableClass} F26`}>
          {pitchFractional}
        </text>
        <text x={159} y={19} className="Cyan F26">
          °
        </text>
      </g>

      <text x={94} y={17} visibility={!deflectionInfoValid ? 'visible' : 'hidden'} className="Amber F26">
        XX
      </text>
      <text x={-7} y={18} visibility={!deflectionInfoValid ? 'visible' : 'hidden'} className="Amber F26">
        X
      </text>
    </g>
  );
};
