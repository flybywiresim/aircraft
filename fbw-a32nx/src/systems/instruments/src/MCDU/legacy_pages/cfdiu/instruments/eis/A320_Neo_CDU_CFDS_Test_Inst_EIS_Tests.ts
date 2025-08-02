// @ts-strict-ignore
import { LegacyCfdiuPageInterface } from '../../../../legacy/LegacyCfdiuPageInterface';
import { CDU_CFDS_Test_Inst_EIS_Menu } from './A320_Neo_CDU_CFDS_Test_Inst_EIS_Menu';
import { CDU_CFDS_Test_Inst_EIS_Tests_Display } from './A320_Neo_CDU_CFDS_Test_Inst_EIS_Tests_Display';

export class CDU_CFDS_Test_Inst_EIS_Tests {
  static ShowPage(mcdu: LegacyCfdiuPageInterface, eisIndex) {
    mcdu.clearDisplay();
    SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, 'Enum', 1);
    const title = 'EIS ( DMC ' + eisIndex + ' )';
    mcdu.setTemplate([
      [title],
      ['', '', 'TEST'],
      [''],
      [''],
      ['<SYSTEM TEST[color]inop'],
      [''],
      ['<DISPLAY TEST'],
      [''],
      ['<I/P TEST[color]inop'],
      [''],
      ['<SYSTEM TEST RESULT[color]inop'],
      [''],
      ['<RETURN[color]cyan'],
    ]);

    mcdu.onUnload = () => SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, 'Enum', 0);

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      CDU_CFDS_Test_Inst_EIS_Tests_Display.ShowPage(mcdu, eisIndex);
    };
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, eisIndex);
    };
  }
}
