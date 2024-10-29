import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../../Components/Button';

export const Page: FC = () => {
  const history = useHistory();

  /* TODO disable POSITION REPORT for FANS-B */

  return (
    <>
      <Layer x={0} y={140}>
        <line x1={0} x2={760} y1={90} y2={90} stroke="#eee" strokeWidth={1} />
        <Button x={65} y={110} width={205} height={64} onClick={() => history.push('report/auto_&_manual_position')}>
          <tspan dy={-3}>POSITION</tspan>
          <tspan dy={19}>REPORT</tspan>
        </Button>
        <Button x={65} y={195} width={205} height={64} onClick={() => history.push('report/other_reports')}>
          OTHER REPORTS
        </Button>
        <Button x={65} y={280} width={205} height={64} onClick={() => history.push('report/modify')} disabled>
          MODIFY
        </Button>
        <line x1={0} x2={760} y1={365} y2={365} stroke="#eee" strokeWidth={1} />
      </Layer>
    </>
  );
};
