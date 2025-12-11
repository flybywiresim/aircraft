import { LegacyAtsuPageInterface, setKeyNotActiveLskActions } from '../../../legacy/LegacyAtsuPageInterface';
import { CDUAtcMenu } from '../A320_Neo_CDU_ATC_Menu';

export class CDUAtcEmergencyFansB {
  static ShowPage(mcdu: LegacyAtsuPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ATCEmergency;

    mcdu.setTemplate([
      ['{amber}EMERGENCY{end}'],
      ['', 'EMERG ADS-C:OFF\xa0'],
      ['', '{inop}SET ON*{end}'],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['\xa0ATC MENU'],
      ['<RETURN'],
    ]);

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUAtcMenu.ShowPage(mcdu);
    };
    setKeyNotActiveLskActions(mcdu);
  }
}
