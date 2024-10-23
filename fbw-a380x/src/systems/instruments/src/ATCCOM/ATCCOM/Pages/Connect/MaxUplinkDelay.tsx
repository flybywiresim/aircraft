import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { TextBox } from '../../../Components/Textbox';

/* TODO get delay from ATSU */

export const Page: FC = () => (
  <>
    <Layer x={0} y={140}>
      <text x={55} y={170} fontSize={22} fill="#fff">
        MODIFY ONLY ON DEMAND OF ACTIVE ATC :
      </text>
      <text x={580} y={170} fontSize={25} fill="#0f0">
        EDUU
      </text>
      <text x={55} y={220} fontSize={22} fill="#fff">
        MAX UPLINK DELAY{' '}
      </text>
      <TextBox
        x={290}
        y={190}
        width={90}
        maxLength={3}
        textAnchor="middle"
        placeholder="---"
        placeholderTextColor="cyan"
        suffix="S"
        fixFontSize={22}
        hideFixesIfEmpty
      />
      <text x={400} y={220} fontSize={22} fill="#fff">
        SECONDS
      </text>
      <text x={55} y={330} fontSize={22} fill="#fff">
        MAX UPLINK DELAY WILL BE CANCELLED
      </text>
      <text x={55} y={380} fontSize={22} fill="#fff">
        UPON NEW ACTIVE ATC
      </text>
    </Layer>
  </>
);
