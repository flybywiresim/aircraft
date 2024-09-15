import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Position } from '@instruments/common/types';
import { Triangle } from '@instruments/common/Shapes';

export const CondFan = () => {
  const [fwdCargoExtractFanIsOn] = useSimVar('L:A32NX_VENT_FWD_EXTRACTION_FAN_ON', 'bool', 1000);
  const [bulkCargoExtractFanIsOn] = useSimVar('L:A32NX_VENT_BULK_EXTRACTION_FAN_ON', 'bool', 1000);

  return (
    <g>
      <PrimaryFanGroup x={315} y={415} />

      {/* Fwd Cargo Extraction Fan */}
      <Fan x={240} y={390} css={fwdCargoExtractFanIsOn ? 'Hide' : 'Show Amber Line'} />
      {/* Bulk Cargo Extraction Fan */}
      <Fan x={540} y={390} css={bulkCargoExtractFanIsOn ? 'Hide' : 'Show Amber Line'} />
    </g>
  );
};

const PrimaryFanGroup: FC<Position> = ({ x, y }) => {
  const [cabinFansEnabled] = useSimVar('L:A32NX_VENT_PRIMARY_FANS_ENABLED', 'bool', 1000);
  // TODO: Add vars for individual fan failures
  return (
    <g id="PrimaryFanGroup" className={cabinFansEnabled ? 'Hide' : 'Show'}>
      <Fan
        x={x}
        y={y}
        css={`
          ${cabinFansEnabled ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x}
        y={y + 15}
        css={`
          ${cabinFansEnabled ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x + 120}
        y={y}
        css={`
          ${cabinFansEnabled ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x + 120}
        y={y + 15}
        css={`
          ${cabinFansEnabled ? 'Green' : 'Amber'} Line
        `}
      />

      {/* Arrows into mixer unit */}
      <path className={`${cabinFansEnabled ? 'Green' : 'Amber'} Line`} d={`M340,468 l 0,-32`} />
      <Triangle x={340} y={484} colour={cabinFansEnabled ? 'Green' : 'Amber'} fill={0} orientation={180} scale={1.1} />
      <path className={`${cabinFansEnabled ? 'Green' : 'Amber'} Line`} d={`M460,468 l 0,-32`} />
      <Triangle x={460} y={484} colour={cabinFansEnabled ? 'Green' : 'Amber'} fill={0} orientation={180} scale={1.1} />
    </g>
  );
};

interface FanProps {
  x: number;
  y: number;
  css?: string;
}

const Fan: FC<FanProps> = ({ x, y, css = 'Amber Line' }) => {
  return (
    <g id="CabinFan">
      <path className={css} d={`M${x},${y} l 50,8 l 0,-8 l -50,8 Z `} fill={'none'} />
    </g>
  );
};
