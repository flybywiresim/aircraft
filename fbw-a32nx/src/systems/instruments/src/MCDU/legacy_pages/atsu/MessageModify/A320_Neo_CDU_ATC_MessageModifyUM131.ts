// @ts-strict-ignore
import { AtsuStatusCodes, FansMode, InputValidation } from '@datalink/common';
import { Keypad } from '../../../legacy/A320_Neo_CDU_Keypad';
import { CDUAtcMenu } from '../A320_Neo_CDU_ATC_Menu';
import { CDUAtcTextFansA } from '../FansA/A320_Neo_CDU_ATC_Text';
import { CDUAtcTextFansB } from '../FansB/A320_Neo_CDU_ATC_Text';
import { LegacyAtsuPageInterface, setKeyNotActiveLskActions } from '../../../legacy/LegacyAtsuPageInterface';

export class CDUAtcMessageModifyUM131 {
  static CreateDataBlock(message) {
    return {
      personsOnBoard:
        message.Response.Content[0].Content[1].Value !== '' ? message.Response.Content[0].Content[1].Value : null,
      endurance:
        message.Response.Content[0].Content[0].Value !== '' ? message.Response.Content[0].Content[0].Value : null,
    };
  }

  static CanUpdateMessage(data) {
    return data.personsOnBoard && data.endurance;
  }

  static UpdateResponseMessage(message, data) {
    message.Response.Content[0].Content[0].Value = data.endurance;
    message.Response.Content[0].Content[1].Value = data.personsOnBoard;
  }

  static ShowPage(mcdu: LegacyAtsuPageInterface, message, data = CDUAtcMessageModifyUM131.CreateDataBlock(message)) {
    let cancel = '\xa0CANCEL';
    let addText = 'ADD TEXT\xa0';
    let transfer = 'DCDU\xa0';
    mcdu.page.Current = mcdu.page.ATCMessageModifyUM131;
    if (CDUAtcMessageModifyUM131.CanUpdateMessage(data)) {
      cancel = '*CANCEL';
      addText = 'ADD TEXT>';
      transfer = 'DCDU*';
    }

    let personsOnBoard = '{cyan}[ ]{end}';
    let endurance = '{cyan}[   ]{end}';
    if (data.personsOnBoard) {
      personsOnBoard = `{cyan}${data.personsOnBoard}{end}`;
    }
    if (data.endurance) {
      endurance = `{cyan}${data.endurance}{end}`;
    }

    mcdu.setTemplate([
      ['MODIFY'],
      [''],
      [''],
      ['\xa0POB', 'ENDURANCE\xa0'],
      [personsOnBoard, endurance],
      [''],
      [''],
      [''],
      [''],
      ['{cyan}\xa0PAGE{end}'],
      [`{cyan}${cancel}{end}`, `{white}${addText}{end}`],
      ['\xa0ATC MENU', '{cyan}XFR TO\xa0{end}'],
      ['<RETURN', `{cyan}${transfer}{end}`],
    ]);

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = (value) => {
      if (value === Keypad.clrValue) {
        data.personsOnBoard = null;
      } else {
        const error = InputValidation.validateScratchpadPersonsOnBoard(value);
        if (error === AtsuStatusCodes.Ok) {
          data.personsOnBoard = parseInt(value);
        } else {
          mcdu.addNewAtsuMessage(error);
        }
      }
      CDUAtcMessageModifyUM131.ShowPage(mcdu, message, data);
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      if (CDUAtcMessageModifyUM131.CanUpdateMessage(data)) {
        mcdu.atsu.updateMessage(message);
        CDUAtcMenu.ShowPage(mcdu);
      }
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtcMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = (value) => {
      if (value === Keypad.clrValue) {
        data.endurance = null;
      } else {
        const error = InputValidation.validateScratchpadEndurance(value);
        if (error === AtsuStatusCodes.Ok) {
          data.endurance = InputValidation.formatScratchpadEndurance(value);
        } else {
          mcdu.addNewAtsuMessage(error);
        }
      }
      CDUAtcMessageModifyUM131.ShowPage(mcdu, message, data);
    };

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      if (CDUAtcMessageModifyUM131.CanUpdateMessage(data)) {
        CDUAtcMessageModifyUM131.UpdateResponseMessage(message, data);
        if (mcdu.atsu.fansMode() === FansMode.FansA) {
          CDUAtcTextFansA.ShowPage1(mcdu, [message]);
        } else {
          CDUAtcTextFansB.ShowPage(mcdu, [message]);
        }
      }
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      if (CDUAtcMessageModifyUM131.CanUpdateMessage(data)) {
        CDUAtcMessageModifyUM131.UpdateResponseMessage(message, data);
        mcdu.atsu.updateMessage(message);
        CDUAtcMenu.ShowPage(mcdu);
      }
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
