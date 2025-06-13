import { AtsuMessageType } from '@datalink/common';
import { translateAtsuMessageType } from '../../legacy/A32NX_Core/A32NX_ATSU';
import { Keypad } from '../../legacy/A320_Neo_CDU_Keypad';
import { CDUAocMenu } from './A320_Neo_CDU_AOC_Menu';
import { CDUAocRequestsMessage } from './A320_Neo_CDU_AOC_RequestsMessage';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAocMessagesReceived {
  static ShowPage(mcdu: LegacyAtsuPageInterface, messages = null, page = 0) {
    if (!messages) {
      messages = mcdu.atsu.aocInputMessages();
    }
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AOCRcvdMsgs;

    page = Math.max(0, Math.min(Math.floor((messages.length - 1) / 5), page));

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.AOCRcvdMsgs) {
        CDUAocMessagesReceived.ShowPage(mcdu, null, page);
      }
    }, mcdu.PageTimeout.Slow);

    const offset = 5 + page * 5;

    const msgTimeHeaders = [];
    msgTimeHeaders.length = 6;
    for (let i = 5; i > 0; i--) {
      let headerLeft = '';
      let headerRight = '';

      if (messages.length > offset - i && messages[offset - i]) {
        let sender = messages[offset - i].Station;
        if (messages[offset - i].Type === AtsuMessageType.ATIS) {
          sender = messages[offset - i].Reports[0].airport;
        }
        headerLeft += `${messages[offset - i].Timestamp.fmsTimestamp()} FROM ${sender}[color]green`;
        if (!messages[offset - i].Confirmed) {
          headerRight = 'NEW[color]green';
        }
      }

      msgTimeHeaders[i] = [headerLeft, headerRight];
    }

    let left = false,
      right = false;
    if (messages.length > (page + 1) * 5) {
      mcdu.onNextPage = () => {
        CDUAocMessagesReceived.ShowPage(mcdu, messages, page + 1);
      };
      right = true;
    }
    if (page > 0) {
      mcdu.onPrevPage = () => {
        CDUAocMessagesReceived.ShowPage(mcdu, messages, page - 1);
      };
      left = true;
    }
    mcdu.setArrows(false, false, left, right);

    mcdu.setTemplate([
      ['AOC RCVD MSGS'],
      [msgTimeHeaders[5][0], msgTimeHeaders[5][1]],
      [`${messages[offset - 5] ? '<' + translateAtsuMessageType(messages[offset - 5].Type) : 'NO MESSAGES'}`],
      [msgTimeHeaders[4][0], msgTimeHeaders[4][1]],
      [`${messages[offset - 4] ? '<' + translateAtsuMessageType(messages[offset - 4].Type) : ''}`],
      [msgTimeHeaders[3][0], msgTimeHeaders[3][1]],
      [`${messages[offset - 3] ? '<' + translateAtsuMessageType(messages[offset - 3].Type) : ''}`],
      [msgTimeHeaders[2][0], msgTimeHeaders[2][1]],
      [`${messages[offset - 2] ? '<' + translateAtsuMessageType(messages[offset - 2].Type) : ''}`],
      [msgTimeHeaders[1][0], msgTimeHeaders[1][1]],
      [`${messages[offset - 1] ? '<' + translateAtsuMessageType(messages[offset - 1].Type) : ''}`],
      ['\xa0AOC MENU'],
      ['<RETURN'],
    ]);

    for (let i = 0; i < 5; i++) {
      mcdu.leftInputDelay[i] = () => {
        return mcdu.getDelaySwitchPage();
      };

      mcdu.onLeftInput[i] = (value) => {
        if (messages[offset - 5 + i]) {
          if (value === Keypad.clrValue) {
            mcdu.atsu.removeMessage(messages[offset - 5 + i].UniqueMessageID, true);
            CDUAocMessagesReceived.ShowPage(mcdu, null, page);
          } else {
            CDUAocRequestsMessage.ShowPage(mcdu, messages, offset - 5 + i);
          }
        }
      };
    }

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onLeftInput[5] = () => {
      CDUAocMenu.ShowPage(mcdu);
    };
  }
}
