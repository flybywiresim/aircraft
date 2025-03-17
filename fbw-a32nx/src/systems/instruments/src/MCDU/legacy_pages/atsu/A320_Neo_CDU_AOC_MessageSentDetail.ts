import { AtsuMessageSerializationFormat } from '@datalink/common';
import { CDUAocMessagesSent } from './A320_Neo_CDU_AOC_MessagesSent';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAocMessageSentDetail {
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
          CDUAocMessageSentDetail.ShowPage(mcdu, messages, messageIndex, offset);
        };
        up = true;
      }
      if (lines[offset - 1]) {
        mcdu.onDown = () => {
          offset -= 1;
          CDUAocMessageSentDetail.ShowPage(mcdu, messages, messageIndex, offset);
        };
        down = true;
      }
      mcdu.setArrows(up, down, false, false);
    }

    mcdu.setTemplate([
      ['AOC SENT MSG'],
      [
        `[b-text]${message.Timestamp.fmsTimestamp()} TO ${message.Station}[color]green`,
        `${messageIndex + 1}/${messages.length}${msgArrows}`,
      ],
      [`[s-text]${lines[offset] ? lines[offset] : ''}`],
      [`[b-text]${lines[offset + 1] ? lines[offset + 1] : ''}`],
      [`[s-text]${lines[offset + 2] ? lines[offset + 2] : ''}`],
      [`[b-text]${lines[offset + 3] ? lines[offset + 3] : ''}`],
      [`[s-text]${lines[offset + 4] ? lines[offset + 4] : ''}`],
      [`[b-text]${lines[offset + 5] ? lines[offset + 5] : ''}`],
      [`[s-text]${lines[offset + 6] ? lines[offset + 6] : ''}`],
      [`[b-text]${lines[offset + 7] ? lines[offset + 7] : ''}`],
      [`[s-text]${lines[offset + 8] ? lines[offset + 8] : ''}`],
      ['\xa0SENT MSGS'],
      ['<RETURN', 'PRINT*[color]cyan'],
    ]);

    mcdu.onNextPage = () => {
      const nextMesssageIndex = messageIndex + 1;
      if (nextMesssageIndex < messages.length) {
        CDUAocMessageSentDetail.ShowPage(mcdu, messages, nextMesssageIndex);
      }
    };

    mcdu.onPrevPage = () => {
      const previousMesssageIndex = messageIndex - 1;
      if (previousMesssageIndex >= 0) {
        CDUAocMessageSentDetail.ShowPage(mcdu, messages, previousMesssageIndex);
      }
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onLeftInput[5] = () => {
      CDUAocMessagesSent.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onRightInput[5] = () => {
      mcdu.atsu.printMessage(message);
    };
  }
}
