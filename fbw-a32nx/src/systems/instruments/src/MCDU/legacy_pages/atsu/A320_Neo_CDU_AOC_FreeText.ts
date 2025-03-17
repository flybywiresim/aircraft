import { AtsuMessageNetwork, AtsuStatusCodes, FreetextMessage } from '@datalink/common';
import { Keypad } from '../../legacy/A320_Neo_CDU_Keypad';
import { CDUAocMenu } from './A320_Neo_CDU_AOC_Menu';
import { NXSystemMessages } from '../../messages/NXSystemMessages';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAocFreeText {
  static ShowPage(
    mcdu: LegacyAtsuPageInterface,
    store = {
      msg_to: '',
      reqID: SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 0 ? 0 : 1,
      msg_line1: '',
      msg_line2: '',
      msg_line3: '',
      msg_line4: '',
      sendStatus: '',
    },
  ) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AOCFreeText;
    const networkTypes = ['HOPPIE', 'FBW'];

    const updateView = () => {
      let oneLineFilled = false;
      if (
        store['msg_line1'] !== '' ||
        store['msg_line2'] !== '' ||
        store['msg_line3'] !== '' ||
        store['msg_line4'] !== ''
      ) {
        oneLineFilled = true;
      }
      let sendValid = oneLineFilled === true && store['msg_to'] !== '';
      if (store['sendStatus'] === 'SENDING' || store['sendStatus'] === 'SENT') {
        sendValid = false;
      }

      mcdu.setTemplate([
        ['AOC FREE TEXT'],
        ['\xa0TO', 'NETWORK\xa0'],
        [
          `${store['msg_to'] !== '' ? store['msg_to'] + '[color]cyan' : '________[color]amber'}`,
          `↓${networkTypes[store['reqID']]}[color]cyan`,
        ],
        [''],
        [
          `${store['msg_line1'] !== '' ? store['msg_line1'] : '['}[color]cyan`,
          `${store['msg_line1'] != '' ? '' : ']'}[color]cyan`,
        ],
        [''],
        [
          `${store['msg_line2'] !== '' ? store['msg_line2'] : '['}[color]cyan`,
          `${store['msg_line2'] != '' ? '' : ']'}[color]cyan`,
        ],
        [''],
        [
          `${store['msg_line3'] !== '' ? store['msg_line3'] : '['}[color]cyan`,
          `${store['msg_line3'] != '' ? '' : ']'}[color]cyan`,
        ],
        [''],
        [
          `${store['msg_line4'] !== '' ? store['msg_line4'] : '['}[color]cyan`,
          `${store['msg_line4'] != '' ? '' : ']'}[color]cyan`,
        ],
        ['\xa0RETURN TO', `${store['sendStatus']}\xa0`],
        ['<AOC MENU', (sendValid === true ? 'SEND*' : 'SEND') + '[color]cyan'],
      ]);
    };
    updateView();

    mcdu.onLeftInput[0] = (value) => {
      if (value === Keypad.clrValue) {
        store['msg_to'] = '';
      } else {
        store['msg_to'] = value;
      }
      CDUAocFreeText.ShowPage(mcdu, store);
    };

    mcdu.onLeftInput[1] = (value) => {
      if (value === Keypad.clrValue) {
        store['msg_line1'] = '';
      } else {
        store['msg_line1'] = value;
      }
      CDUAocFreeText.ShowPage(mcdu, store);
    };

    mcdu.onLeftInput[2] = (value) => {
      if (value === Keypad.clrValue) {
        store['msg_line2'] = '';
      } else {
        store['msg_line2'] = value;
      }
      CDUAocFreeText.ShowPage(mcdu, store);
    };

    mcdu.onLeftInput[3] = (value) => {
      if (value === Keypad.clrValue) {
        store['msg_line3'] = '';
      } else {
        store['msg_line3'] = value;
      }
      CDUAocFreeText.ShowPage(mcdu, store);
    };

    mcdu.onLeftInput[4] = (value) => {
      if (value === Keypad.clrValue) {
        store['msg_line4'] = '';
      } else {
        store['msg_line4'] = value;
      }
      CDUAocFreeText.ShowPage(mcdu, store);
    };

    mcdu.rightInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[0] = () => {
      store['reqID'] = (store['reqID'] + 1) % 2;
      updateView();
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = async () => {
      // do not send two times
      if (store['sendStatus'] === 'SENDING' || store['sendStatus'] === 'SENT') {
        return;
      }

      let oneLineFilled = false;
      if (
        store['msg_line1'] !== '' ||
        store['msg_line2'] !== '' ||
        store['msg_line3'] !== '' ||
        store['msg_line4'] !== ''
      ) {
        oneLineFilled = true;
      }
      const sendValid = oneLineFilled === true && store['msg_to'] !== '';

      if (sendValid === false) {
        mcdu.setScratchpadMessage(NXSystemMessages.mandatoryFields);
        return;
      }

      store['sendStatus'] = 'SENDING';
      if (mcdu.page.Current === mcdu.page.AOCFreeText) {
        updateView();
      }

      // create the message
      const message = new FreetextMessage();
      if (store['reqID'] === 0) {
        message.Network = AtsuMessageNetwork.Hoppie;
      } else {
        message.Network = AtsuMessageNetwork.FBW;
      }
      message.Station = store['msg_to'];
      if (store['msg_line1'] !== '') {
        message.Message += store['msg_line1'] + '\n';
      }
      if (store['msg_line2'] !== '') {
        message.Message += store['msg_line2'] + '\n';
      }
      if (store['msg_line3'] !== '') {
        message.Message += store['msg_line3'] + '\n';
      }
      if (store['msg_line4'] !== '') {
        message.Message += store['msg_line4'] + '\n';
      }
      message.Message = message.Message.substring(0, message.Message.length - 1);

      // send the message
      mcdu.atsu.sendMessage(message).then((code) => {
        if (code === AtsuStatusCodes.Ok) {
          store['sendStatus'] = 'SENT';
          store['msg_line1'] = '';
          store['msg_line2'] = '';
          store['msg_line3'] = '';
          store['msg_line4'] = '';

          setTimeout(() => {
            store['sendStatus'] = '';
            if (mcdu.page.Current === mcdu.page.AOCFreeText) {
              CDUAocFreeText.ShowPage(mcdu, store);
            }
          }, 5000);
        } else {
          store['sendStatus'] = 'FAILED';
          mcdu.addNewAtsuMessage(code);
        }
        if (mcdu.page.Current === mcdu.page.AOCFreeText) {
          updateView();
        }
      });
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onLeftInput[5] = () => {
      CDUAocMenu.ShowPage(mcdu);
    };
  }
}
