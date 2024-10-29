import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Atis } from '../Elements/Atis';
import { Button } from '../../Components/Button';

export const Page: FC = () => (
  <>
    <Layer x={0} y={140}>
      <Atis x={0} y={0} airport="EDDF" />
      <Atis x={0} y={246} airport="KSFO" arrival />
      <Atis x={0} y={492} airport="" arrival />

      <Button x={396} y={744} width={184} height={64} disabled>
        <tspan dy={-3}>PRINT</tspan>
        <tspan dy={19}>ALL</tspan>
      </Button>
      <Button x={581} y={744} width={184} height={64} disabled>
        <tspan dy={-3}>UPDATE</tspan>
        <tspan dy={19}>ALL</tspan>
      </Button>
    </Layer>
  </>
);
