import React, { FC, useState } from 'react';
import { FansMode } from '@atsu/com/FutureAirNavigationSystem';
import { CpdlcMessageElement } from '@atsu/messages/CpdlcMessageElements';
import { Layer } from '@instruments/common/utils';
import { Button } from '../../Components/Button';
import { Menu as FansA } from './Request/FansA';
import { Menu as FansB } from './Request/FansB';
import { MaxRequestElements, MessageTable } from '../Messages/Registry';

export const Page: FC = () => {
  const [elements, setElements] = useState<
    { id: string; message: CpdlcMessageElement | undefined; readyToSend: boolean }[]
  >([]);
  const activeFansB = false;

  const elementSelect = (id: string) => {
    if (MessageTable[id].singleMessage || (elements.length !== 0 && MessageTable[elements[0].id].singleMessage)) {
      setElements([{ id, message: undefined, readyToSend: false }]);
    } else {
      if (MessageTable[id].exchanging !== undefined) {
        for (let i = 0; i < elements.length; ++i) {
          if (elements[i].id === MessageTable[id].exchanging) {
            const update = elements;
            update.splice(i, 1, { id, message: undefined, readyToSend: false });
            return;
          }
        }
      }

      if (MaxRequestElements > elements.length) {
        const update = elements;
        update.push({ id, message: undefined, readyToSend: false });
        setElements(update);
      }
    }
  };

  const elementDelete = (index: number) => {
    if (elements.length > index) {
      setElements(elements.filter((_item, j) => index !== j));
    }
  };

  // create the blacklist list
  const blacklistEntries: string[] = [];
  elements.forEach((element) => {
    blacklistEntries.push(element.id);
    blacklistEntries.push(...MessageTable[element.id].blacklisting);
  });

  // create the exchange entries
  const exchangeEntries: string[] = [];
  elements.forEach((element) => {
    if (MessageTable[element.id].exchanging !== undefined) {
      exchangeEntries.push(MessageTable[element.id].exchanging);
    }
  });

  // check if freetext extensions are disabled
  let disableFreetext = false;
  elements.forEach((element) => {
    if (MessageTable[element.id].singleMessage) disableFreetext = true;
  });

  // check if all message elements are ready to be sent
  let readyToSend = elements.length !== 0;
  elements.forEach((element) => {
    readyToSend &&= element.readyToSend;
  });

  /* TODO send a system message after the maximum number of elements is reached */

  return (
    <Layer x={0} y={140}>
      {elements.map(
        (
          element: { id: string; message: CpdlcMessageElement | undefined; readyToSend: boolean },
          elementIndex: number,
        ) =>
          React.createElement(MessageTable[element.id].visualization, {
            x: 0,
            y: elementIndex * 147,
            mode: FansMode.FansA,
            index: elementIndex,
            messageElements: elements,
            onDelete: () => elementDelete(elementIndex),
          }),
      )}

      {activeFansB ? (
        <FansB
          x={573}
          y={0}
          elements={elements}
          blacklist={blacklistEntries}
          exchangelist={exchangeEntries}
          disableFreetext={disableFreetext}
          onSelect={elementSelect}
        />
      ) : (
        <FansA
          x={573}
          y={0}
          elements={elements}
          blacklist={blacklistEntries}
          exchangelist={exchangeEntries}
          disableFreetext={disableFreetext}
          onSelect={elementSelect}
        />
      )}

      <Button x={3} y={744} width={184} height={64} disabled={elements.length === 0} onClick={() => setElements([])}>
        CANCEL
      </Button>
      <Button x={582} y={744} width={184} height={64} disabled={!readyToSend}>
        <tspan dy={-3}>XFR</tspan>
        <tspan dy={19}>TO MAILBOX</tspan>
      </Button>
    </Layer>
  );
};
