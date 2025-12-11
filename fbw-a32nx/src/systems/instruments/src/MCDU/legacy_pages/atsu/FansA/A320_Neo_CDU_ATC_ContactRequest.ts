// @ts-strict-ignore
import { AtsuStatusCodes, CpdlcMessage, CpdlcMessagesDownlink, InputValidation } from '@datalink/common';
import { Keypad } from '../../../legacy/A320_Neo_CDU_Keypad';
import { CDUAtcFlightReq } from '../A320_Neo_CDU_ATC_FlightReq';
import { CDUAtcTextFansA } from '../FansA/A320_Neo_CDU_ATC_Text';
import { NXSystemMessages } from '../../../messages/NXSystemMessages';
import { LegacyAtsuPageInterface, setKeyNotActiveLskActions } from '../../../legacy/LegacyAtsuPageInterface';

export class CDUAtcContactRequest {
  static CreateDataBlock(): any {
    return {
      requestContact: false,
    };
  }

  static CanSendData(data) {
    return data.requestContact;
  }

  static CreateRequest(mcdu: LegacyAtsuPageInterface, type, values = []) {
    const retval = new CpdlcMessage();
    retval.Station = mcdu.atsu.currentStation();
    retval.Content.push(CpdlcMessagesDownlink[type][1].deepCopy());

    for (let i = 0; i < values.length; ++i) {
      retval.Content[0].Content[i].Value = values[i];
    }

    return retval;
  }

  static CreateRequests(mcdu, data) {
    const retval = [];

    if (data.requestContact) {
      retval.push(CDUAtcContactRequest.CreateRequest(mcdu, 'DM20'));
    }

    return retval;
  }

  static ShowPage(mcdu: LegacyAtsuPageInterface, data = CDUAtcContactRequest.CreateDataBlock()) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCContactRequest;

    let requestContact = '{cyan}{{end}REQ VOICE CONTACT';
    if (data.altitude) {
      requestContact = '{cyan}\xa0REQ VOICE CONTACT{end]';
    }

    let text = 'ADD TEXT\xa0';
    let erase = '\xa0ERASE';
    let reqDisplay = 'DCDU\xa0[color]cyan';
    if (CDUAtcContactRequest.CanSendData(data)) {
      reqDisplay = 'DCDU*[color]cyan';
      text = 'ADD TEXT>';
      erase = '*ERASE';
    }

    mcdu.setTemplate([
      ['CONTACT REQ'],
      [''],
      [requestContact],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['\xa0ALL FIELDS'],
      [erase, text],
      ['\xa0FLIGHT REQ', 'XFR TO\xa0[color]cyan'],
      ['<RETURN', reqDisplay],
    ]);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = (value) => {
      if (value === Keypad.clrValue) {
        data.climb = null;
      } else if (value) {
        const error = InputValidation.validateScratchpadAltitude(value);
        if (error !== AtsuStatusCodes.Ok) {
          mcdu.addNewAtsuMessage(error);
        } else {
          data.climb = InputValidation.formatScratchpadAltitude(value);
        }
      }
      CDUAtcContactRequest.ShowPage(mcdu, data);
    };

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = (value) => {
      if (value === Keypad.clrValue) {
        data.altitude = null;
      } else if (value) {
        const error = InputValidation.validateScratchpadAltitude(value);
        if (error !== AtsuStatusCodes.Ok) {
          mcdu.addNewAtsuMessage(error);
        } else {
          data.altitude = InputValidation.formatScratchpadAltitude(value);
        }
      }
      CDUAtcContactRequest.ShowPage(mcdu, data);
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      CDUAtcContactRequest.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtcFlightReq.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      if (CDUAtcContactRequest.CanSendData(data)) {
        const messages = CDUAtcContactRequest.CreateRequests(mcdu, data);
        if (messages.length !== 0) {
          CDUAtcTextFansA.ShowPage1(mcdu, messages);
        }
      }
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      if (CDUAtcContactRequest.CanSendData(data)) {
        if (mcdu.atsu.currentStation() === '') {
          mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
        } else {
          const messages = CDUAtcContactRequest.CreateRequests(mcdu, data);
          if (messages.length !== 0) {
            mcdu.atsu.registerMessages(messages);
          }
          CDUAtcContactRequest.ShowPage(mcdu);
        }
      }
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
