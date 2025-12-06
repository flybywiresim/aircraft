// @ts-strict-ignore
import { FansMode } from '@datalink/common';
import { CDUAtcClearanceReq } from './A320_Neo_CDU_ATC_ClearanceReq';
import { CDUAtcMenu } from './A320_Neo_CDU_ATC_Menu';
import { CDUAtcOceanicReq } from './A320_Neo_CDU_ATC_OceanicReq';
import { CDUAtcSpeedRequest } from './A320_Neo_CDU_ATC_SpeedReq';
import { CDUAtcContactRequest } from './FansA/A320_Neo_CDU_ATC_ContactRequest';
import { CDUAtcLatRequestFansA } from './FansA/A320_Neo_CDU_ATC_LatRequest';
import { CDUAtcProcedureRequest } from './FansA/A320_Neo_CDU_ATC_ProcedureRequest';
import { CDUAtcTextFansA } from './FansA/A320_Neo_CDU_ATC_Text';
import { CDUAtcVertRequestFansA } from './FansA/A320_Neo_CDU_ATC_VertRequest';
import { CDUAtcLatRequestFansB } from './FansB/A320_Neo_CDU_ATC_LatRequest';
import { CDUAtcVertRequestFansB } from './FansB/A320_Neo_CDU_ATC_VertRequest';
import { LegacyAtsuPageInterface, setKeyNotActiveLskActions } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAtcFlightReq {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCFlightRequest;

    let procedure = '';
    let freeText = '';
    let contact = '';
    let clearance = '';
    if (mcdu.atsu.fansMode() === FansMode.FansA) {
      procedure = '<PROCEDURE';
      freeText = '<FREE TEXT';
      contact = 'CONTACT>';
      clearance = 'CLEARANCE>';
    }

    mcdu.setTemplate([
      ['FLIGHT REQ'],
      [''],
      ['<LATERAL', 'VERTICAL>'],
      [''],
      ['<SPEED', contact],
      [''],
      [procedure, 'OCEANIC>'],
      [''],
      [freeText],
      [''],
      ['', clearance],
      ['\xa0ATC MENU'],
      ['<RETURN'],
    ]);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcLatRequestFansA.ShowPage1(mcdu);
      } else {
        CDUAtcLatRequestFansB.ShowPage(mcdu);
      }
    };

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = () => {
      CDUAtcSpeedRequest.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcProcedureRequest.ShowPage(mcdu);
      }
    };

    mcdu.leftInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[3] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcTextFansA.ShowPage1(mcdu);
      }
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtcMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[0] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcVertRequestFansA.ShowPage1(mcdu);
      } else {
        CDUAtcVertRequestFansB.ShowPage(mcdu);
      }
    };

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcContactRequest.ShowPage(mcdu);
      }
    };

    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = () => {
      CDUAtcOceanicReq.ShowPage1(mcdu);
    };

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcClearanceReq.ShowPage(mcdu, 'CLEARANCE');
      }
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
