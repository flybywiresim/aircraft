import React, { FC } from 'react';
import { useHistory } from 'react-router';
import { Layer } from '@instruments/common/utils';
import { Button } from '../Components/Button';
import { useMFDMessageManager } from './MFDMessageManager';

export const MFDMessagesList: FC = () => {
  const mfdMessageManager = useMFDMessageManager();
  const history = useHistory();

  let messageY = 80;
  return (
    <Layer x={0} y={140}>
      {mfdMessageManager.typeIIMessageList().map((message) => {
        let lineY = 0;
        const retval = (
          <>
            <line x1={70} x2={690} y1={messageY - 10} y2={messageY - 10} stroke="#eee" strokeWidth={1} />
            {message.content.map((line) => {
              const text = (
                <text fontSize={29} fill="white" x={80} y={messageY + lineY + 29}>
                  {line}
                </text>
              );
              lineY += 32;
              return text;
            })}
          </>
        );

        messageY += 90;
        return retval;
      })}
      {mfdMessageManager.typeIIMessageList().length !== 0 && (
        <line x1={70} x2={690} y1={messageY - 10} y2={messageY - 10} stroke="#eee" strokeWidth={1} />
      )}
      <Button x={7} y={765} width={127} height={40} onClick={() => history.goBack()}>
        CLOSE
      </Button>
    </Layer>
  );
};
