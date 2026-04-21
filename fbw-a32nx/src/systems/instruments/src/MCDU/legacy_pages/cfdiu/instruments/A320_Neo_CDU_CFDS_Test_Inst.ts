import { LegacyCfdiuPageInterface } from '../../../legacy/LegacyCfdiuPageInterface';
import { CDU_CFDS_Test_Inst_EIS_Menu } from './eis/A320_Neo_CDU_CFDS_Test_Inst_EIS_Menu';

export class CDUCfdsTestInst {
  static ShowPage(mcdu: LegacyCfdiuPageInterface) {
    mcdu.clearDisplay();
    mcdu.setTemplate([
      ['SYSTEM REPORT / TEST'],
      ['', '', 'INST'],
      ['{inop}<ECAM 1{end}', '{inop}CFDIU>{end}'],
      [''],
      ['{inop}<ECAM 2{end}', 'EIS 1>'],
      [''],
      ['{inop}<DFDRS{end}', 'EIS 2>'],
      [''],
      ['', 'EIS 3>'],
      [''],
      [''],
      [''],
      ['<RETURN[color]cyan'],
    ]);

    mcdu.rightInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[1] = () => {
      CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 1);
    };
    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = () => {
      CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 2);
    };
    mcdu.rightInputDelay[3] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[3] = () => {
      CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 3);
    };
  }
}
