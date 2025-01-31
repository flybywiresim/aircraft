import { CDUCfdsTestMenu } from './A320_Neo_CDU_CFDS_Test_Menu';
import { LegacyCfdiuPageInterface } from '../../legacy/LegacyCfdiuPageInterface';
import { CDUCfdsAvionicsMenu } from './A320_Neo_CDU_CFDS_Avionics_Menu';

export class CDUCfdsMainMenu {
  static ShowPage(mcdu: LegacyCfdiuPageInterface) {
    mcdu.clearDisplay();
    mcdu.activeSystem = 'CFDS';
    mcdu.setTemplate([
      ['CFDS', '1', '2'],
      [''],
      ['<LAST LEG REPORT[color]inop'],
      [''],
      ['<LAST LEG ECAM REPORT[color]inop'],
      [''],
      ['<PREVIOUS LEGS REPORT[color]inop'],
      [''],
      ['<AVIONICS STATUS'],
      [''],
      ['<SYSTEM REPORT / TEST'],
      ['', '', 'POST'],
      ['*SEND[color]cyan', 'PRINT*[color]inop', 'FLT REP'],
    ]);

    mcdu.leftInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[3] = () => {
      CDUCfdsAvionicsMenu.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[4] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[4] = () => {
      CDUCfdsTestMenu.ShowPage(mcdu);
    };

    // PAGE SWITCHING
    mcdu.onPrevPage = () => {
      CDUCfdsMainMenu.ShowPage2(mcdu);
    };
    mcdu.onNextPage = () => {
      CDUCfdsMainMenu.ShowPage2(mcdu);
    };
  }

  static ShowPage2(mcdu: LegacyCfdiuPageInterface) {
    mcdu.clearDisplay();

    mcdu.setTemplate([
      ['CFDS', '2', '2'],
      [''],
      ['<GMT/DATE INIT[color]inop'],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['<PFR FILTER PROGRAM[color]inop'],
      [''],
      ['<PASSWORD CHANGE[color]inop'],
      [''],
      [''],
    ]);

    // PAGE SWITCHING
    mcdu.onPrevPage = () => {
      CDUCfdsMainMenu.ShowPage(mcdu);
    };
    mcdu.onNextPage = () => {
      CDUCfdsMainMenu.ShowPage(mcdu);
    };
  }
}
