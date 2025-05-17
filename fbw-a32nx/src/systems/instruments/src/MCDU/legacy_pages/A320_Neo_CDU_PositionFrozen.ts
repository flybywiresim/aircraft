import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { CDUPositionMonitorPage } from './A320_Neo_CDU_PositionMonitorPage';
import { CDUSelectedNavaids } from './A320_Neo_CDU_SelectedNavaids';

export class CDUPosFrozen {
  static ShowPage(mcdu: LegacyFmsPageInterface, currPos) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PosFrozen;
    const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
    const hours = Math.floor(UTC_SECONDS / 3600) || 0;
    const minutes = Math.floor((UTC_SECONDS % 3600) / 60) || 0;
    const hhmm = `${hours.toString().padStart(2, '0') || '00'}${minutes.toString().padStart(2, '0') || '00'}`;
    mcdu.setTemplate([
      [`POSITION FROZEN AT ${hhmm}`],
      [''],
      ['{small}FMS1{end}', `${currPos}[color]green`],
      ['\xa0\xa0\xa0\xa0\xa0\xa03IRS/GPS'],
      ['{small}FMS2{end}', `${currPos}[color]green`],
      ['\xa0\xa0\xa0\xa0\xa0\xa03IRS/GPS'],
      ['{small}GPIRS{end}', `${currPos}[color]green`],
      [''],
      ['{small}MIX IRS{end}', `${currPos}[color]green`],
      ['\xa0\xa0IRS1', 'IRS3\xa0', '\xa0IRS2'],
      ['{small}NAV 0.0{end}[color]green', '{small}NAV 0.0{end}[color]green', '{small}NAV 0.0{end}[color]green'],
      ['', 'SEL\xa0'],
      ['{UNFREEZE[color]cyan', 'NAVAIDS>'],
    ]);

    mcdu.onLeftInput[5] = () => {
      CDUPositionMonitorPage.ShowPage(mcdu);
    };

    mcdu.onRightInput[5] = () => {
      CDUSelectedNavaids.ShowPage(mcdu);
    };
  }
}
