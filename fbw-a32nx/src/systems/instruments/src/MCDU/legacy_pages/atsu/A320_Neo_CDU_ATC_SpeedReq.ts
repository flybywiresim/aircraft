// @ts-strict-ignore
import { AtsuStatusCodes, CpdlcMessage, CpdlcMessagesDownlink, FansMode, InputValidation } from '@datalink/common';
import { Keypad } from '../../legacy/A320_Neo_CDU_Keypad';
import { CDUAtcFlightReq } from './A320_Neo_CDU_ATC_FlightReq';
import { CDUAtcTextFansA } from './FansA/A320_Neo_CDU_ATC_Text';
import { NXSystemMessages } from '../../messages/NXSystemMessages';
import { LegacyAtsuPageInterface, setKeyNotActiveLskActions } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAtcSpeedRequest {
  static CreateDataBlock(): any {
    return {
      speed: null,
      whenSpeed: null,
    };
  }

  static CanSendData(data) {
    return data.speed || data.whenSpeed;
  }

  static CanEraseData(data) {
    return data.speed || data.whenSpeed;
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

  static CreateRequests(mcdu: LegacyAtsuPageInterface, data) {
    const retval = [];

    if (data.speed) {
      retval.push(CDUAtcSpeedRequest.CreateRequest(mcdu, 'DM18', [data.speed]));
    }
    if (data.whenSpeed) {
      retval.push(CDUAtcSpeedRequest.CreateRequest(mcdu, 'DM49', [data.whenSpeed]));
    }

    return retval;
  }

  static ShowPage(mcdu: LegacyAtsuPageInterface, data = CDUAtcSpeedRequest.CreateDataBlock()) {
    mcdu.clearDisplay();

    let speed = '[ ][color]cyan';
    if (data.speed) {
      speed = `${data.speed}[color]cyan`;
    }

    let speedWhenSmall = '';
    let speedWhen = '';
    if (mcdu.atsu.fansMode() === FansMode.FansA) {
      speedWhenSmall = '\xa0WHEN CAN WE EXPECT SPD';
      speedWhen = '[ ][color]cyan';
      if (data.whenSpeed) {
        speedWhen = `${data.whenSpeed}[color]cyan`;
      }
    }

    let text = 'ADD TEXT\xa0';
    let erase = '\xa0ERASE';
    let reqDisplay = 'DCDU\xa0[color]cyan';
    if (CDUAtcSpeedRequest.CanSendData(data)) {
      reqDisplay = 'DCDU*[color]cyan';
      text = 'ADD TEXT>';
    }
    if (CDUAtcSpeedRequest.CanEraseData(data)) {
      erase = '*ERASE';
    }

    mcdu.setTemplate([
      ['ATC SPEED REQ'],
      ['\xa0SPEED[color]white'],
      [speed],
      [speedWhenSmall],
      [speedWhen],
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
        data.speed = null;
      } else if (value) {
        const error = InputValidation.validateScratchpadSpeed(value);
        if (error === AtsuStatusCodes.Ok) {
          data.speed = InputValidation.formatScratchpadSpeed(value);
        } else {
          mcdu.addNewAtsuMessage(error);
        }
      }
      CDUAtcSpeedRequest.ShowPage(mcdu, data);
    };

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = (value) => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        if (value === Keypad.clrValue) {
          data.whenSpeed = null;
        } else if (value) {
          const error = InputValidation.validateScratchpadSpeed(value);
          if (error === AtsuStatusCodes.Ok) {
            data.whenSpeed = InputValidation.formatScratchpadSpeed(value);
          } else {
            mcdu.addNewAtsuMessage(error);
          }
        }
        CDUAtcSpeedRequest.ShowPage(mcdu, data);
      }
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      CDUAtcSpeedRequest.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtcFlightReq.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = (value) => {
      if (value === Keypad.clrValue) {
        data.offset = null;
      } else if (value) {
        const error = InputValidation.validateScratchpadOffset(value);
        if (error === AtsuStatusCodes.Ok) {
          data.offset = InputValidation.formatScratchpadOffset(value);
          data.offsetStart = null;
        } else {
          mcdu.addNewAtsuMessage(error);
        }
      }
      CDUAtcSpeedRequest.ShowPage(mcdu, data);
    };

    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = async (value) => {
      if (value === Keypad.clrValue) {
        data.weatherDeviation = null;
      } else if (value) {
        const error = InputValidation.validateScratchpadOffset(value);
        if (error === AtsuStatusCodes.Ok) {
          data.weatherDeviation = InputValidation.formatScratchpadOffset(value);
        } else {
          mcdu.addNewAtsuMessage(error);
        }
      }
      CDUAtcSpeedRequest.ShowPage(mcdu, data);
    };

    mcdu.rightInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[3] = (value) => {
      if (value === Keypad.clrValue) {
        data.backOnTrack = false;
      } else {
        data.backOnTrack = true;
      }
      CDUAtcSpeedRequest.ShowPage(mcdu, data);
    };

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      if (CDUAtcSpeedRequest.CanSendData(data)) {
        const messages = CDUAtcSpeedRequest.CreateRequests(mcdu, data);
        if (messages.length !== 0) {
          CDUAtcTextFansA.ShowPage1(mcdu, messages);
        }
      }
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      if (CDUAtcSpeedRequest.CanSendData(data)) {
        if (mcdu.atsu.currentStation() === '') {
          mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
        } else {
          const messages = CDUAtcSpeedRequest.CreateRequests(mcdu, data);
          if (messages.length !== 0) {
            mcdu.atsu.registerMessages(messages);
          }
          CDUAtcSpeedRequest.ShowPage(mcdu);
        }
      }
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
