import { useArinc429Var, useSimVar } from '@flybywiresim/fbw-sdk';
import { deflectionToXOffset } from 'instruments/src/SD/Pages/Fctl/elements/HorizontalDeflectionIndicator';
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
  const sec1RudderStatusWord = useArinc429Var('L:A32NX_SEC_1_RUDDER_STATUS_WORD');
  const sec3RudderStatusWord = useArinc429Var('L:A32NX_SEC_3_RUDDER_STATUS_WORD');
  const secSourceForTrim = sec1RudderStatusWord.bitValueOr(28, false) ? 1 : 3;

  const rudderTrimAvail = true;
  const rudderTrim = useArinc429Var(`L:A32NX_SEC_${secSourceForTrim}_RUDDER_ACTUAL_POSITION`).valueOr(0);

  const deflectionInfoValid = sec1RudderStatusWord.bitValueOr(28, false) || sec3RudderStatusWord.bitValueOr(28, false);
  const deflectionXValue = deflectionToXOffset(-rudderTrim);

  const powerSource1Avail = useSimVar(`L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED`, 'boolean', 1000);
  const powerSource2Avail = useSimVar(`L:A32NX_ELEC_DC_1_BUS_IS_POWERED`, 'boolean', 1000);

  const rudderTrimText = Math.abs(rudderTrim).toFixed(1).padStart(4, '\xa0');

  const powerAvailableClass = (powerSource1Avail || powerSource2Avail) && rudderTrimAvail ? 'Cyan' : 'Amber';

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
          visibility={Math.abs(rudderTrim) > 0.05 && deflectionInfoValid ? 'visible' : 'hidden'}
          className={`${powerAvailableClass} F22`}
        >
          {Math.sign(rudderTrim) === 1 ? 'L' : 'R'}
        </text>
        <text x={159} y={17} className={`${powerAvailableClass} F22 EndAlign`}>
          {rudderTrimText}
        </text>
        <text x={159} y={19} className="Cyan F22">
          °
        </text>
      </g>

      <text x={94} y={17} visibility={!deflectionInfoValid ? 'visible' : 'hidden'} className="Amber F22">
        XX
      </text>
      <text x={-7} y={18} visibility={!deflectionInfoValid ? 'visible' : 'hidden'} className="Amber F22">
        X
      </text>
    </g>
  );
};
