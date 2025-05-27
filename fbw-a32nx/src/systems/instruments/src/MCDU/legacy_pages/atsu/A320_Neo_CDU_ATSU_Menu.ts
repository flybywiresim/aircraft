import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { CDUAocMenu } from './A320_Neo_CDU_AOC_Menu';
import { CDUAtcMenu } from './A320_Neo_CDU_ATC_Menu';
import { CDUAtsuDatalinkStatus } from './A320_Neo_CDU_ATSU_DatalinkStatus';
import { CDUCommMenu } from './A320_Neo_CDU_Comm_Menu';

export class CDUAtsuMenu {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATSUMenu;
    mcdu.activeSystem = 'ATSU';

    const display = [
      ['ATSU DATALINK'],
      [''],
      ['<ATC MENU'],
      [''],
      ['', 'AOC MENU>'],
      [''],
      [''],
      [''],
      [''],
      ['', 'DATALINK\xa0'],
      ['', 'STATUS>'],
      [''],
      ['', 'COMM MENU>'],
    ];
    mcdu.setTemplate(display);

    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = () => {
      CDUAtcMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = () => {
      CDUAocMenu.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[4] = () => {
      CDUAtsuDatalinkStatus.ShowPage(mcdu);
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[5] = () => {
      CDUCommMenu.ShowPage(mcdu);
    };
  }
}
