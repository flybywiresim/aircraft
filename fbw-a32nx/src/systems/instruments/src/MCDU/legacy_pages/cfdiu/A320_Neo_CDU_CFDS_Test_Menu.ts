import { A320_Neo_CDU_MainDisplay } from '../A320_Neo_CDU_MainDisplay';
import { CDUCfdsMainMenu } from './A320_Neo_CDU_CFDS_Menu';
import { CDUCfdsTestInst } from './instruments/A320_Neo_CDU_CFDS_Test_Inst';

export class CDUCfdsTestMenu {
  static ShowPage(mcdu: A320_Neo_CDU_MainDisplay) {
    mcdu.clearDisplay();
    mcdu.setTemplate([
      ['SYSTEM REPORT / TEST   }'],
      [''],
      ['<AIRCOND[color]inop', 'F/CTL>[color]inop'],
      [''],
      ['<AFS[color]inop', 'FUEL>[color]inop'],
      [''],
      ['<COM[color]inop', 'ICE&RAIN>[color]inop'],
      [''],
      ['<ELEC[color]inop', 'INST>'],
      [''],
      ['<FIRE PROT[color]inop', 'L/G>[color]inop'],
      [''],
      ['<RETURN[color]cyan', 'NAV>[color]inop'],
    ]);

    mcdu.rightInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[3] = () => {
      CDUCfdsTestInst.ShowPage(mcdu);
    };

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUCfdsMainMenu.ShowPage(mcdu);
    };

    // PAGE SWITCHING
    mcdu.onPrevPage = () => {
      CDUCfdsTestMenu.ShowPage2(mcdu);
    };
    mcdu.onNextPage = () => {
      CDUCfdsTestMenu.ShowPage2(mcdu);
    };
  }

  static ShowPage2(mcdu: A320_Neo_CDU_MainDisplay) {
    mcdu.clearDisplay();
    mcdu.setTemplate([
      ['SYSTEM REPORT / TEST   }'],
      [''],
      ['<PNEU[color]inop', 'ENG>[color]inop'],
      [''],
      ['<APU[color]inop', 'TOILET>[color]inop'],
      [''],
      ['<INFO SYS[color]inop', 'INERTING>[color]inop'],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['<RETURN[color]cyan'],
    ]);

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDUCfdsMainMenu.ShowPage(mcdu);
    };

    // PAGE SWITCHING
    mcdu.onPrevPage = () => {
      CDUCfdsTestMenu.ShowPage(mcdu);
    };
    mcdu.onNextPage = () => {
      CDUCfdsTestMenu.ShowPage(mcdu);
    };
  }
}
