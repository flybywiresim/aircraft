// @ts-strict-ignore
import { LegacyCfdiuPageInterface } from '../../../../legacy/LegacyCfdiuPageInterface';
import { CDU_CFDS_Test_Inst_EIS_Tests } from './A320_Neo_CDU_CFDS_Test_Inst_EIS_Tests';

export class CDU_CFDS_Test_Inst_EIS_Tests_Display {
  static ShowPage(mcdu: LegacyCfdiuPageInterface, eisIndex) {
    mcdu.clearDisplay();
    SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, 'Enum', 2);
    const title = 'EIS ( DMC ' + eisIndex + ' )';
    mcdu.setTemplate([
      [title],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['', '', 'DISPLAY TEST'],
      [''],
      ['', '', 'IN'],
      [''],
      ['', '', 'PROGRESS '],
      [''],
      ['<RETURN[color]cyan'],
    ]);

    mcdu.onUnload = () => SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, 'Enum', 0);

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      CDU_CFDS_Test_Inst_EIS_Tests.ShowPage(mcdu, eisIndex);
    };
  }
}
