import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../../Components/Button';

export const Page: FC = () => {
  const history = useHistory();

  return (
    <>
      <Layer x={0} y={140}>
        <line x1={0} x2={760} y1={90} y2={90} stroke="#eee" strokeWidth={1} />
        <Button x={65} y={140} width={205} height={64} onClick={() => history.push('msg_record/all_msg')}>
          ALL MSG
        </Button>
        <Button x={65} y={255} width={205} height={64} onClick={() => history.push('msg_record/monitored_msg')}>
          MONITORED MSG
        </Button>
        <line x1={0} x2={760} y1={365} y2={365} stroke="#eee" strokeWidth={1} />
      </Layer>
    </>
  );
};
