import { Layer } from '@instruments/common/utils';
import React, { FC, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { Button } from '../Components/Button';
import { useMFDMessageManager } from './MFDMessageManager';

type MFDMessageAreaProps = {
  path: string;
};

export const MFDMessageArea: FC<MFDMessageAreaProps> = ({ path }) => {
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>('#fff');
  const mfdMessageManager = useMFDMessageManager();
  const history = useHistory();
  const firstLineRef = useRef<SVGTextElement>(null);
  const [firstLineBbox, setFirstLineBbox] = useState<DOMRect>();
  const secondLineRef = useRef<SVGTextElement>(null);
  const [secondLineBbox, setSecondLineBbox] = useState<DOMRect>();
  const [messageUid, setMessageUid] = useState<number>(-1);
  const messageUidRef = useRef<number>();
  messageUidRef.current = messageUid;

  useEffect(() => {
    setFirstLineBbox(firstLineRef.current?.getBBox());
    setSecondLineBbox(secondLineRef.current?.getBBox());
  }, [firstLineRef, secondLineRef]);

  let message: string[] = [];
  if (mfdMessageManager.typeIMessage() !== undefined) {
    message = mfdMessageManager.typeIMessage()?.content || [];

    if (messageUid !== mfdMessageManager.typeIMessage()?.uid)
      setMessageUid(mfdMessageManager.typeIMessage()?.uid || -1);
    if (backgroundColor !== '#fff') setBackgroundColor('#fff');
  } else {
    let hasOpenMessages = false;
    mfdMessageManager.typeIIMessageList().every((msg) => {
      if (msg.cleared === false) {
        if (backgroundColor !== '#f48244') setBackgroundColor('#f48244');
        if (messageUid !== msg.uid) setMessageUid(msg.uid);

        hasOpenMessages = true;
        message = msg.content;
      }

      return msg.cleared !== false;
    });

    if (hasOpenMessages === false && messageUid !== -1) setMessageUid(-1);
  }

  const onButtonClick = () => {
    if (messageUidRef.current !== undefined) {
      // no shown message
      if (messageUidRef.current === -1) {
        history.push(`${path}/messages_list`);
      } else {
        mfdMessageManager.markFmsMessageAsCleared(messageUidRef.current);
      }
    }
  };

  let buttonText = <></>;
  if (messageUid !== -1) {
    buttonText = (
      <>
        <tspan dy={-3}>CLEAR</tspan>
        <tspan dy={19}>INFO</tspan>
      </>
    );
  } else {
    buttonText = (
      <>
        <tspan dy={-3}>MSG</tspan>
        <tspan dy={19}>LIST</tspan>
      </>
    );
  }

  return (
    <Layer x={0} y={950}>
      <Button x={4} y={4} width={100} height={60} onClick={onButtonClick}>
        {buttonText}
      </Button>

      {backgroundColor && message.length >= 1 && (
        <rect
          x={firstLineBbox?.x! - 2}
          y={firstLineBbox?.y! - 2}
          width={firstLineBbox?.width! + 3}
          height={firstLineBbox?.height! + 2}
          fill={backgroundColor}
        />
      )}
      {backgroundColor && message.length > 1 && (
        <rect
          x={secondLineBbox?.x! - 2}
          y={secondLineBbox?.y! - 2}
          width={secondLineBbox?.width! + 3}
          height={secondLineBbox?.height! + 2}
          fill={backgroundColor}
        />
      )}

      {message.length >= 1 && (
        <text fontSize={29} fill="black" x={109} y={29} ref={firstLineRef}>
          {message[0]}
        </text>
      )}
      {message.length > 1 && (
        <text fontSize={29} fill="black" x={109} y={61} ref={secondLineRef}>
          {message[1]}
        </text>
      )}
    </Layer>
  );
};
