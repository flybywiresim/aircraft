// @ts-strict-ignore
// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  AtsuStatusCodes,
  CpdlcMessageContentType,
  CpdlcMessagesDownlink,
  FansMode,
  InputValidation,
} from '@datalink/common';
import { Keypad } from '../../legacy/A320_Neo_CDU_Keypad';
import { CDUAtcMenu } from './A320_Neo_CDU_ATC_Menu';
import { CDUAtcPositionReport } from './FansA/A320_Neo_CDU_ATC_PositionReport';
import { CDUAtcTextFansA } from './FansA/A320_Neo_CDU_ATC_Text';
import { CDUAtcTextFansB } from './FansB/A320_Neo_CDU_ATC_Text';
import { CDUAtcMessageModifyUM131 } from './MessageModify/A320_Neo_CDU_ATC_MessageModifyUM131';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { setKeyNotActiveLskActions } from './AtsuDatalinkPageUtils';

const ModifyLookupTable = {
  UM132: [
    {
      response: 'DM33',
      text: 'PRESENT POSITION',
      type: CpdlcMessageContentType.Position,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM133: [
    {
      response: 'DM32',
      text: 'PRESENT LEVEL',
      type: CpdlcMessageContentType.Level,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM134: [
    {
      response: 'DM34',
      text: 'PRESENT SPEED',
      type: CpdlcMessageContentType.Speed,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM135: [
    {
      response: 'DM38',
      text: 'ASSIGNED LEVEL',
      type: CpdlcMessageContentType.Level,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM136: [
    {
      response: 'DM39',
      text: 'ASSIGNED SPEED',
      type: CpdlcMessageContentType.Speed,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM137: [
    {
      response: 'DM45',
      text: 'ASSIGNED ROUTE',
      type: CpdlcMessageContentType.Freetext,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 6,
    },
  ],
  UM138: [
    {
      response: 'DM46',
      text: 'REPORTED TIME',
      type: CpdlcMessageContentType.Time,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM139: [
    {
      response: 'DM45',
      text: 'REPORTED WAYPOINT',
      type: CpdlcMessageContentType.Position,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM140: [
    {
      response: 'DM42',
      text: 'NEXT WAYPOINT',
      type: CpdlcMessageContentType.Position,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM141: [
    {
      response: 'DM43',
      text: 'NEXT WAYPOINT ETA',
      type: CpdlcMessageContentType.Time,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM142: [
    {
      response: 'DM44',
      text: 'ENSUING WAYPOINT',
      type: CpdlcMessageContentType.Position,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM144: [
    {
      response: 'DM47',
      text: 'PRESENT SQUAWK',
      type: CpdlcMessageContentType.Squawk,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM145: [
    {
      response: 'DM35',
      text: 'PRESENT HEADING',
      type: CpdlcMessageContentType.Degree,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 3,
    },
  ],
  UM146: [
    {
      response: 'DM36',
      text: 'PRESENT GROUND TRACK',
      type: CpdlcMessageContentType.Degree,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 3,
    },
  ],
  UM148: [
    {
      response: 'DM81',
      text: 'CAN %s AT',
      type: CpdlcMessageContentType.Time,
      textIndex: 0,
      valueIndex: 1,
      emptyLength: 5,
    },
    {
      response: 'DM67',
      text: 'CAN %s NOW',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
      freetext: 'WE CAN ACCEPT %s NOW',
    },
    {
      response: 'DM82',
      text: 'CANNOT %s',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
    },
  ],
  UM151: [
    {
      response: 'DM83',
      text: 'CAN %s AT',
      type: CpdlcMessageContentType.Time,
      textIndex: 0,
      valueIndex: 1,
      emptyLength: 5,
    },
    {
      response: 'DM67',
      text: 'CAN %s NOW',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
      freetext: 'WE CAN ACCEPT %s NOW',
    },
    {
      response: 'DM94',
      text: 'CANNOT %s',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
    },
  ],
  UM152: [
    {
      response: 'DM85',
      text: 'CAN %s AT',
      type: CpdlcMessageContentType.Time,
      textIndex: 0,
      valueIndex: 1,
      emptyLength: 5,
    },
    {
      response: 'DM67',
      text: 'CAN %s NOW',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
      freetext: 'WE CAN ACCEPT %s NOW',
    },
    {
      response: 'DM86',
      text: 'CANNOT %s',
      type: CpdlcMessageContentType.Unknown,
      textIndex: 0,
      valueIndex: null,
      emptyLength: 0,
    },
  ],
  UM181: [
    {
      response: 'DM67',
      text: 'DISTANCE TO %s',
      type: CpdlcMessageContentType.Distance,
      textIndex: 0,
      valueIndex: 0,
      emptyLength: 3,
      freetext: 'DISTANCE TO %s %v',
    },
  ],
  UM182: [
    {
      response: 'DM79',
      text: 'ATIS',
      type: CpdlcMessageContentType.Atis,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 1,
    },
  ],
  UM184: [
    {
      response: 'DM67',
      text: 'DISTANCE TO %s',
      type: CpdlcMessageContentType.Distance,
      textIndex: 1,
      valueIndex: 0,
      emptyLength: 3,
      freetext: 'DISTANCE TO %s IS %v',
    },
  ],
  UM228: [
    {
      response: 'DM104',
      text: 'ETA TO %s',
      type: CpdlcMessageContentType.Time,
      textIndex: 0,
      valueIndex: 0,
      emptyLength: 4,
    },
  ],
  UM231: [
    {
      response: 'DM106',
      text: 'PREFERRED LEVEL',
      type: CpdlcMessageContentType.Level,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
  UM232: [
    {
      response: 'DM109',
      text: 'TIME TO TOP OF DESCENT',
      type: CpdlcMessageContentType.Time,
      textIndex: null,
      valueIndex: 0,
      emptyLength: 5,
    },
  ],
};

export class CDUAtcMessageModify {
  static CreateDataBlock(message) {
    const lutEntry = ModifyLookupTable[message.Content[0].TypeId];

    return {
      value:
        message.Response.Content[0].Content.length > lutEntry[0].valueIndex &&
        message.Response.Content[0].TypeId !== 'DM67'
          ? message.Response.Content[0].Content[lutEntry[0].valueIndex].Value
          : '',
      modified: false,
      multiSelection: lutEntry.length > 1,
      selectedToggles: [false, false],
    };
  }

  static CreateDescriptionLine(message, entry) {
    if (entry.textIndex !== null) {
      return entry.text.replace('%s', message.Content[0].Content[entry.textIndex].Value);
    }
    return entry.text;
  }

  static CreateToggleBasedField(message, data, entry, index) {
    const text = CDUAtcMessageModify.CreateDescriptionLine(message, entry);

    if (data.selectedToggles[index - 1]) {
      return `{cyan}\xa0${text}{end}`;
    }
    return `{cyan}{{end}{white}${text}{end}`;
  }

  static CreateVisualization(
    message: { Content: { TypeId: string | number }[] },
    data: { selectedToggles: any[]; value: string; modified: any },
  ) {
    const lutEntry = ModifyLookupTable[message.Content[0].TypeId];
    const visualization: [string[], string, string] = [['', ''], '', ''];

    const color = !data.selectedToggles[0] && !data.selectedToggles[1] ? '{cyan}' : '{white}';
    visualization[0][0] = `${color}\xa0${CDUAtcMessageModify.CreateDescriptionLine(message, lutEntry[0])}{end}`;
    if (data.value !== '') {
      const prefix = !data.modified ? '{small}' : '';
      const suffix = !data.modified ? '{end}' : '';
      visualization[0][1] = `{cyan}${prefix}${data.value}${suffix}{end}`;
    } else {
      visualization[0][1] = `{amber}${'_'.repeat(lutEntry[0].emptyLength)}{end}`;
    }

    if (lutEntry.length > 1) {
      visualization[1] = CDUAtcMessageModify.CreateToggleBasedField(message, data, lutEntry[1], 1);
      visualization[2] = CDUAtcMessageModify.CreateToggleBasedField(message, data, lutEntry[2], 2);
    }

    return visualization;
  }

  static ValidateScratchpadValue(message, value) {
    const lutEntry = ModifyLookupTable[message.Content[0].TypeId];

    if (lutEntry[0].type === CpdlcMessageContentType.Position) {
      return InputValidation.validateScratchpadPosition(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Speed) {
      return InputValidation.validateScratchpadSpeed(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Level) {
      return InputValidation.validateScratchpadAltitude(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Time) {
      return InputValidation.validateScratchpadTime(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Freetext) {
      return AtsuStatusCodes.Ok;
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Squawk) {
      return InputValidation.validateScratchpadSquawk(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Degree) {
      return InputValidation.validateScratchpadDegree(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Atis) {
      return InputValidation.validateScratchpadAtis(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Distance) {
      return InputValidation.validateScratchpadDistance(value);
    }

    return AtsuStatusCodes.UnknownMessage;
  }

  static FormatScratchpadValue(message, value) {
    const lutEntry = ModifyLookupTable[message.Content[0].TypeId];

    if (lutEntry[0].type === CpdlcMessageContentType.Speed) {
      return InputValidation.formatScratchpadSpeed(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Level) {
      return InputValidation.formatScratchpadAltitude(value);
    }
    if (lutEntry[0].type === CpdlcMessageContentType.Distance) {
      return InputValidation.formatScratchpadDistance(value);
    }

    return value;
  }

  static CanUpdateMessage(data) {
    return data.value !== '' || data.selectedToggles[0] || data.selectedToggles[1];
  }

  static UpdateResponseMessage(message, data) {
    const lutEntry = ModifyLookupTable[message.Content[0].TypeId];

    let lutIndex = 0;
    if (data.selectedToggles[0]) {
      lutIndex = 1;
    } else if (data.selectedToggles[1]) {
      lutIndex = 2;
    }

    const newContent = CpdlcMessagesDownlink[lutEntry[lutIndex].response][1].deepCopy();
    if (newContent.TypeId === 'DM67') {
      let freetext = lutEntry[lutIndex].freetext;
      if (lutEntry[lutIndex].textIndex !== null) {
        freetext = freetext.replace('%s', message.Content[0].Content[lutEntry[lutIndex].textIndex].Value);
      }
      if (lutEntry[lutIndex].valueIndex !== null) {
        freetext = freetext.replace('%v', data.value);
      }
      newContent.Content[0].Value = freetext;
    } else if (newContent.TypeId === 'DM104') {
      newContent.Content[0].Value = message.Content[0].Content[lutEntry[lutIndex].textIndex].Value;
      newContent.Content[1].Value = data.value;
    } else {
      newContent.Content[lutEntry[lutIndex].valueIndex].Value = data.value;
      for (let i = 0; i < lutEntry[lutIndex].valueIndex; ++i) {
        newContent.Content[i].Value = message.Content[0].Content[lutEntry[lutIndex].textIndex + i].Value;
      }
    }

    message.Response.Content = [newContent];
  }

  static ShowPage(mcdu: LegacyAtsuPageInterface, message, data = null) {
    mcdu.page.Current = mcdu.page.ATCModify;

    if (message.Content[0].TypeId === 'UM147') {
      // modify the position report
      CDUAtcPositionReport.ShowPage1(mcdu, message);
      return;
    } else if (message.Content[0].TypeId === 'UM131') {
      // report persons on board and fuel remaining
      CDUAtcMessageModifyUM131.ShowPage(mcdu, message);
      return;
    }

    if (!data) {
      data = CDUAtcMessageModify.CreateDataBlock(message);
    }
    const visualization = CDUAtcMessageModify.CreateVisualization(message, data);

    let cancel = '\xa0CANCEL';
    let addText = 'ADD TEXT\xa0';
    let transfer = 'DCDU\xa0';
    if (CDUAtcMessageModify.CanUpdateMessage(data)) {
      cancel = '*CANCEL';
      addText = 'ADD TEXT>';
      transfer = 'DCDU*';
    }

    mcdu.setTemplate([
      ['MODIFY'],
      [data.multiSelection ? visualization[0][0] : ''],
      [data.multiSelection ? visualization[0][1] : ''],
      [!data.multiSelection ? visualization[0][0] : ''],
      [!data.multiSelection ? visualization[0][1] : ''],
      [''],
      [visualization[1]],
      [''],
      [visualization[2]],
      ['{cyan}\xa0PAGE{end}'],
      [`{cyan}${cancel}{end}`, `{white}${addText}{end}`],
      ['\xa0ATC MENU', '{cyan}XFR TO\xa0{end}'],
      ['<RETURN', `{cyan}${transfer}{end}`],
    ]);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = (value) => {
      if (data.multiSelection) {
        if (value === Keypad.clrValue) {
          data.modified = true;
          data.value = '';
        } else if (value) {
          const error = CDUAtcMessageModify.ValidateScratchpadValue(message, value);
          if (error === AtsuStatusCodes.Ok) {
            data.value = CDUAtcMessageModify.FormatScratchpadValue(message, value);
            data.modified = true;
          } else {
            mcdu.addNewAtsuMessage(error);
          }
        }
        CDUAtcMessageModify.ShowPage(mcdu, message, data);
      }
    };

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = (value) => {
      if (!data.multiSelection) {
        if (value === Keypad.clrValue) {
          data.modified = true;
          data.value = '';
        } else if (value) {
          const error = CDUAtcMessageModify.ValidateScratchpadValue(message, value);
          if (error === AtsuStatusCodes.Ok) {
            data.value = CDUAtcMessageModify.FormatScratchpadValue(message, value);
            data.modified = true;
          } else {
            mcdu.addNewAtsuMessage(error);
          }
        }
        CDUAtcMessageModify.ShowPage(mcdu, message, data);
      }
    };

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = (value) => {
      if (data.multiSelection) {
        if (value === Keypad.clrValue) {
          data.selectedToggles[0] = false;
        } else {
          data.selectedToggles[0] = true;
          data.selectedToggles[1] = false;
        }
        CDUAtcMessageModify.ShowPage(mcdu, message, data);
      }
    };

    mcdu.leftInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[3] = (value) => {
      if (data.multiSelection) {
        if (value === Keypad.clrValue) {
          data.selectedToggles[1] = false;
        } else {
          data.selectedToggles[0] = false;
          data.selectedToggles[1] = true;
        }
        CDUAtcMessageModify.ShowPage(mcdu, message, data);
      }
    };

    mcdu.leftInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[3] = (value) => {
      if (data.multiSelection) {
        if (value === Keypad.clrValue) {
          data.selectedToggles[1] = false;
        } else {
          data.selectedToggles[0] = false;
          data.selectedToggles[1] = true;
        }
        CDUAtcMessageModify.ShowPage(mcdu, message, data);
      }
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      if (CDUAtcMessageModify.CanUpdateMessage(data)) {
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

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      if (CDUAtcMessageModify.CanUpdateMessage(data)) {
        CDUAtcMessageModify.UpdateResponseMessage(message, data);
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
      if (CDUAtcMessageModify.CanUpdateMessage(data)) {
        CDUAtcMessageModify.UpdateResponseMessage(message, data);
        mcdu.atsu.updateMessage(message);
        CDUAtcMenu.ShowPage(mcdu);
      }
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
