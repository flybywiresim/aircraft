import React, { createContext, FC, useContext, useRef, useState } from 'react';
import { MFDMessage, MFDMessageId, MFDMessageType } from './MFDMessage';
import { MFDMessageTranslation } from './MFDMessageTranslation';

type MFDMessageManagerType = {
  setFmsMessage: (id: MFDMessageId, content?: string) => number;
  markFmsMessageAsCleared: (uid: number) => void;
  typeIMessage: () => MFDMessage | undefined;
  typeIIMessageList: () => MFDMessage[];
};

export const MFDMessageManagerContext = createContext<MFDMessageManagerType>({
  setFmsMessage: () => -1,
  markFmsMessageAsCleared: () => null,
  typeIMessage: () => undefined,
  typeIIMessageList: () => [],
});

export const useMFDMessageManager = (): MFDMessageManagerType => useContext(MFDMessageManagerContext);

const MaxMessageCount = 5;

export const MFDMessageManagerProvider: FC = ({ children }) => {
  const [typeIMessage, setTypeIMessage] = useState<MFDMessage | undefined>(undefined);
  const [typeIIMessages, setTypeIIMessages] = useState<MFDMessage[]>([]);
  const typeIMessageRef = useRef<MFDMessage | undefined>();
  const typeIIMessagesRef = useRef<MFDMessage[]>();
  typeIIMessagesRef.current = typeIIMessages;
  typeIMessageRef.current = typeIMessage;

  return (
    <MFDMessageManagerContext.Provider
      value={{
        setFmsMessage: (id: MFDMessageId, content?: string | string[]): number => {
          const lutEntry = MFDMessageTranslation.find((entry) => entry.id === id);
          if (lutEntry === undefined) return -1;

          // create the new UID
          const uid = new Date().getTime();

          // create the message
          const messageContent = lutEntry.lines;
          if (content !== undefined) {
            if (Array.isArray(content)) {
              content.forEach((entry) => {
                messageContent.forEach((line) => {
                  line.replace('%', entry);
                });
              });
            } else {
              messageContent.forEach((line) => {
                line.replace('%', content);
              });
            }
          }

          if (lutEntry.type === MFDMessageType.TypeI) {
            setTypeIMessage({
              uid,
              messageId: id,
              type: lutEntry !== undefined ? lutEntry.type : MFDMessageType.TypeII,
              cleared: false,
              content: messageContent,
            });
          } else {
            let newList: MFDMessage[] = [];
            if (typeIIMessagesRef.current) {
              newList = new Array<MFDMessage>(...typeIIMessagesRef.current);
            }

            while (newList.length >= MaxMessageCount && newList.length > 0) {
              newList.pop();
            }

            newList.unshift({
              uid,
              messageId: id,
              type: lutEntry !== undefined ? lutEntry.type : MFDMessageType.TypeII,
              cleared: false,
              content: messageContent,
            });

            setTypeIIMessages(newList);
          }

          return uid;
        },
        markFmsMessageAsCleared: (uid: number): void => {
          // check if it is a type I message
          if (typeIMessageRef.current) {
            if (typeIMessageRef.current.uid === uid) {
              setTypeIMessage(undefined);
              return;
            }
          }

          if (typeIIMessagesRef.current) {
            const index = typeIIMessagesRef.current.findIndex((msg) => msg.uid === uid);
            if (index >= 0) {
              const newList = new Array<MFDMessage>(...typeIIMessagesRef.current);
              newList[index].cleared = true;
              setTypeIIMessages(newList);
            }
          }
        },
        typeIMessage: (): MFDMessage | undefined => typeIMessageRef.current,
        typeIIMessageList: (): MFDMessage[] => {
          if (typeIIMessagesRef.current) return typeIIMessagesRef.current;
          return [];
        },
      }}
    >
      {children}
    </MFDMessageManagerContext.Provider>
  );
};
