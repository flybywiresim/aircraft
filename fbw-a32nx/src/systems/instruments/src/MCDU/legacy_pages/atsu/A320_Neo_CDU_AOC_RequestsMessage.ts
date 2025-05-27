import { AtsuMessageSerializationFormat, AtsuMessageType } from '@datalink/common';
import { CDUAocMessagesReceived } from './A320_Neo_CDU_AOC_MessagesReceived';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAocRequestsMessage {
  static ShowPage(mcdu: LegacyAtsuPageInterface, messages, messageIndex, offset = 0) {
    mcdu.clearDisplay();
    const message = messages[messageIndex];
    const lines = message.serialize(AtsuMessageSerializationFormat.FmsDisplay).split('\n');

    // mark message as read
    mcdu.atsu.messageRead(message.UniqueMessageID, true);

    const msgArrows = messages.length > 1 ? ' {}' : '';

    if (lines.length > 8) {
      let up = false;
      let down = false;
      if (lines[offset + 1]) {
        mcdu.onUp = () => {
          offset += 1;
          CDUAocRequestsMessage.ShowPage(mcdu, messages, messageIndex, offset);
        };
        up = true;
      }
      if (lines[offset - 1]) {
        mcdu.onDown = () => {
          offset -= 1;
          CDUAocRequestsMessage.ShowPage(mcdu, messages, messageIndex, offset);
        };
        down = true;
      }
      mcdu.setArrows(up, down, false, false);
    }

    let from = message.Station;
    if (message.Type === AtsuMessageType.ATIS) {
      from = message.Reports[0].airport;
    }

    mcdu.setTemplate([
      ['AOC MSG DISPLAY'],
      [
        `${message.Timestamp.fmsTimestamp()} FROM ${from}[color]green`,
        `${messageIndex + 1}/${messages.length}${msgArrows}`,
      ],
      [`{small}${lines[offset] ? lines[offset] : ''}{end}`],
      [`${lines[offset + 1] ? lines[offset + 1] : ''}`],
      [`{small}${lines[offset + 2] ? lines[offset + 2] : ''}{end}`],
      [`${lines[offset + 3] ? lines[offset + 3] : ''}`],
      [`{small}${lines[offset + 4] ? lines[offset + 4] : ''}{end}`],
      [`${lines[offset + 5] ? lines[offset + 5] : ''}`],
      [`{small}${lines[offset + 6] ? lines[offset + 6] : ''}{end}`],
      [`${lines[offset + 7] ? lines[offset + 7] : ''}`],
      [`{small}${lines[offset + 8] ? lines[offset + 8] : ''}{end}`],
      ['\xa0RCVD MSGS'],
      ['<RETURN', 'PRINT*[color]cyan'],
    ]);

    mcdu.onNextPage = () => {
      const nextMesssageIndex = messageIndex + 1;
      if (nextMesssageIndex < messages.length) {
        CDUAocRequestsMessage.ShowPage(mcdu, messages, nextMesssageIndex);
      }
    };

    mcdu.onPrevPage = () => {
      const previousMesssageIndex = messageIndex - 1;
      if (previousMesssageIndex >= 0) {
        CDUAocRequestsMessage.ShowPage(mcdu, messages, previousMesssageIndex);
      }
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAocMessagesReceived.ShowPage(mcdu);
    };

    mcdu.onRightInput[5] = () => {
      mcdu.atsu.printMessage(message);
    };
  }
}
