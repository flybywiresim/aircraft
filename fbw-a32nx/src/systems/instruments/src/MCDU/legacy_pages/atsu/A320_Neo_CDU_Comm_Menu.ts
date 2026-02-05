import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { CDUAtsuMenu } from './A320_Neo_CDU_ATSU_Menu';

export class CDUCommMenu {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCCommMenu;
    mcdu.setTemplate([
      ['COMM MENU'],
      ['\xa0VHF3[color]inop', 'COMM\xa0[color]inop'],
      ['<DATA MODE[color]inop', 'CONFIG>[color]inop'],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['', 'MAINTENANCE>[color]inop'],
      [''],
      [''],
      ['\xa0ATC MENU', 'AUTO PRINT\xa0[color]inop'],
      ['<RETURN', 'SET ON\xa0[color]inop'],
    ]);

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtsuMenu.ShowPage(mcdu);
    };
  }
}
