// @ts-strict-ignore
import { FansMode } from '@datalink/common';
import { CDUAtcAtisMenu } from './A320_Neo_CDU_ATC_AtisMenu';
import { CDUAtcClearanceReq } from './A320_Neo_CDU_ATC_ClearanceReq';
import { CDUAtcConnection } from './A320_Neo_CDU_ATC_Connection';
import { CDUAtcFlightReq } from './A320_Neo_CDU_ATC_FlightReq';
import { CDUAtcMessageModify } from './A320_Neo_CDU_ATC_MessageModify';
import { CDUAtcMessageMonitoring } from './A320_Neo_CDU_ATC_MessageMonitoring';
import { CDUAtcMessagesRecord } from './A320_Neo_CDU_ATC_MessagesRecord';
import { CDUAtsuMenu } from './A320_Neo_CDU_ATSU_Menu';
import { CDUAtcEmergencyFansA } from './FansA/A320_Neo_CDU_ATC_Emergency';
import { CDUAtcUsualRequestFansA } from './FansA/A320_Neo_CDU_ATC_UsualRequest';
import { CDUAtcEmergencyFansB } from './FansB/A320_Neo_CDU_ATC_Emergency';
import { CDUAtcUsualRequestFansB } from './FansB/A320_Neo_CDU_ATC_UsualRequest';
import { NXSystemMessages } from '../../messages/NXSystemMessages';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAtcMenu {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCMenu;
    mcdu.activeSystem = 'ATSU';

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.ATCMenu) {
        CDUAtcMenu.ShowPage(mcdu);
      }
    }, mcdu.PageTimeout.Slow);

    let modif = '';
    if (mcdu.atsu.modificationMessage) {
      modif = 'MODIFY>';
    }

    mcdu.setTemplate([
      ['ATC MENU'],
      [''],
      ['<FLIGHT REQ', 'USUAL REQ>'],
      [''],
      ['<GROUND REQ', 'D-ATIS>'],
      [''],
      ['<MSG RECORD', 'REPORTS>'],
      [''],
      ['<MONITORED MSG', modif],
      [''],
      ['<CONNECTION'],
      ['\xa0ATSU DLK'],
      ['<RETURN', 'EMER MENU>[color]amber'],
    ]);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = () => {
      CDUAtcFlightReq.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = () => {
      CDUAtcClearanceReq.ShowPage(mcdu, 'GROUND');
    };

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      CDUAtcMessagesRecord.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[3] = () => {
      CDUAtcMessageMonitoring.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      CDUAtcConnection.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtsuMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[0] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcUsualRequestFansA.ShowPage(mcdu);
      } else {
        CDUAtcUsualRequestFansB.ShowPage(mcdu);
      }
    };

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = () => {
      CDUAtcAtisMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcAtisMenu.ShowPage(mcdu);
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.keyNotActive);
      }
    };

    mcdu.rightInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[3] = () => {
      if (mcdu.atsu.modificationMessage) {
        CDUAtcMessageModify.ShowPage(mcdu, mcdu.atsu.modificationMessage);
      }
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcEmergencyFansA.ShowPage1(mcdu);
      } else {
        CDUAtcEmergencyFansB.ShowPage(mcdu);
      }
    };
  }
}
