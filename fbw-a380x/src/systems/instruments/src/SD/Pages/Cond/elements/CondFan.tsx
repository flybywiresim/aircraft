import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

export const CondFan = () => {
  const vcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_VCS_DISCRETE_WORD');
  const vcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_VCS_DISCRETE_WORD');
  const vcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_VCS_DISCRETE_WORD');
  const vcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_VCS_DISCRETE_WORD');

  let vcsDiscreteWordToUse;

  if (vcsB1DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB1DiscreteWord;
  } else if (vcsB2DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB2DiscreteWord;
  } else if (vcsB3DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB3DiscreteWord;
  } else {
    vcsDiscreteWordToUse = vcsB4DiscreteWord;
  }

  const fwdCargoExtractFanIsOn = vcsDiscreteWordToUse.bitValueOr(13, false);
  const bulkCargoExtractFanIsOn = vcsDiscreteWordToUse.bitValueOr(15, false);
  const cabinFansEnabled = vcsDiscreteWordToUse.bitValueOr(17, false);
  const fan1Failure = vcsDiscreteWordToUse.bitValueOr(18, false);
  const fan2Failure = vcsDiscreteWordToUse.bitValueOr(19, false);
  const fan3Failure = vcsDiscreteWordToUse.bitValueOr(20, false);
  const fan4Failure = vcsDiscreteWordToUse.bitValueOr(21, false);

  return (
    <g>
      <PrimaryFanGroup
        x={315}
        y={415}
        cabinFansEnabled={cabinFansEnabled}
        fan1Failure={fan1Failure}
        fan2Failure={fan2Failure}
        fan3Failure={fan3Failure}
        fan4Failure={fan4Failure}
      />

      {/* Fwd Cargo Extraction Fan */}
      <Fan x={240} y={390} css={fwdCargoExtractFanIsOn ? 'Hide' : 'Show Amber Line'} />
      {/* Bulk Cargo Extraction Fan */}
      <Fan x={540} y={390} css={bulkCargoExtractFanIsOn ? 'Hide' : 'Show Amber Line'} />
    </g>
  );
};

interface PrimaryFanGroupProps {
  x: number;
  y: number;
  cabinFansEnabled: boolean;
  fan1Failure: boolean;
  fan2Failure: boolean;
  fan3Failure: boolean;
  fan4Failure: boolean;
}

const PrimaryFanGroup: FC<PrimaryFanGroupProps> = ({
  x,
  y,
  cabinFansEnabled,
  fan1Failure,
  fan2Failure,
  fan3Failure,
  fan4Failure,
}) => {
  const anyFanFailure = fan1Failure || fan2Failure || fan3Failure || fan4Failure;
  return (
    <g id="PrimaryFanGroup" className={cabinFansEnabled && !anyFanFailure ? 'Hide' : 'Show'}>
      <Fan
        x={x}
        y={y}
        css={`
          ${cabinFansEnabled && !fan1Failure ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x}
        y={y + 15}
        css={`
          ${cabinFansEnabled && !fan2Failure ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x + 120}
        y={y}
        css={`
          ${cabinFansEnabled && !fan3Failure ? 'Green' : 'Amber'} Line
        `}
      />
      <Fan
        x={x + 120}
        y={y + 15}
        css={`
          ${cabinFansEnabled && !fan4Failure ? 'Green' : 'Amber'} Line
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
