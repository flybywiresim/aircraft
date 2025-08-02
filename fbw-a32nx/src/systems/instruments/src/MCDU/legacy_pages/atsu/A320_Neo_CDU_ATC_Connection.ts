// @ts-strict-ignore
import { FansMode } from '@datalink/common';
import { CDUAtcConnectionNotification } from './A320_Neo_CDU_ATC_ConnectionNotification';
import { CDUAtcConnectionStatus } from './A320_Neo_CDU_ATC_ConnectionStatus';
import { CDUAtcMaxUplinkDelay } from './A320_Neo_CDU_ATC_MaxUplinkDelay';
import { CDUAtcMenu } from './A320_Neo_CDU_ATC_Menu';
import { NXSystemMessages } from '../../messages/NXSystemMessages';
import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';

export class CDUAtcConnection {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCConnection;

    mcdu.setTemplate([
      ['\xa0CONNECTION'],
      [''],
      ['<NOTIFICATION'],
      [''],
      [''],
      ['\xa0CONNECTION'],
      ['<STATUS'],
      [''],
      [''],
      ['', 'MAX UPLINK\xa0'],
      ['', 'DELAY>'],
      ['\xa0ATC MENU'],
      ['<RETURN'],
    ]);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = () => {
      CDUAtcConnectionNotification.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      CDUAtcConnectionStatus.ShowPage(mcdu);
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
      if (mcdu.atsu.fansMode() === FansMode.FansA) {
        CDUAtcMaxUplinkDelay.ShowPage(mcdu);
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.keyNotActive);
      }
    };
  }
}
