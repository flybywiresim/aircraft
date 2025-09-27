// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { CDUIRSStatus } from './A320_Neo_CDU_IRSStatus';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { Arinc429Register, RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { SimVarValueType } from '@microsoft/msfs-sdk';

export class CDUIRSMonitor {
  private static ir1MaintenanceWordVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_1_MAINT_WORD',
    SimVarValueType.Enum,
  );
  private static ir1MaintenanceWord = Arinc429Register.empty();
  private static ir2MaintenanceWordVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_2_MAINT_WORD',
    SimVarValueType.Enum,
  );
  private static ir2MaintenanceWord = Arinc429Register.empty();
  private static ir3MaintenanceWordVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_3_MAINT_WORD',
    SimVarValueType.Enum,
  );
  private static ir3MaintenanceWord = Arinc429Register.empty();

  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.IRSMonitor;

    this.populateAdiruMaintenanceWords();

    mcdu.setTemplate([
      ['IRS MONITOR'],
      [''],
      [`<IRS1\xa0{small}{green}${this.getAdiruStatusMessage(this.ir1MaintenanceWord)}{end}`],
      [`\xa0${this.getAdiruStateMessage(this.ir1MaintenanceWord)}[color]green`],
      [`<IRS2\xa0{small}{green}${this.getAdiruStatusMessage(this.ir2MaintenanceWord)}{end}`],
      [`\xa0${this.getAdiruStateMessage(this.ir2MaintenanceWord)}[color]green`],
      [`<IRS3\xa0{small}{green}${this.getAdiruStatusMessage(this.ir3MaintenanceWord)}{end}`],
      [`\xa0${this.getAdiruStateMessage(this.ir3MaintenanceWord)}[color]green`],
    ]);
    mcdu.leftInputDelay[0] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[0] = () => {
      CDUIRSStatus.ShowPage(mcdu, 1);
    };
    mcdu.leftInputDelay[1] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[1] = () => {
      CDUIRSStatus.ShowPage(mcdu, 2);
    };
    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[2] = () => {
      CDUIRSStatus.ShowPage(mcdu, 3);
    };

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.IRSMonitor) {
        CDUIRSMonitor.ShowPage(mcdu);
      }
    }, mcdu.PageTimeout.Slow);
  }

  static populateAdiruMaintenanceWords() {
    this.ir1MaintenanceWord.set(this.ir1MaintenanceWordVar.get());
    this.ir2MaintenanceWord.set(this.ir2MaintenanceWordVar.get());
    this.ir3MaintenanceWord.set(this.ir3MaintenanceWordVar.get());
  }

  static getAdiruStatusMessage(irMaintenanceWord: Arinc429Register): string {
    if (irMaintenanceWord.isInvalid()) {
      return '';
    }

    if (irMaintenanceWord.bitValueOr(9, false)) {
      return 'IR FAULT';
    }
    if (irMaintenanceWord.bitValueOr(13, false)) {
      return 'EXCESS MOTION';
    }

    if (irMaintenanceWord.bitValueOr(4, false)) {
      return 'ENTER HEADING';
    }

    return '';
  }

  static getAdiruStateMessage(irMaintenanceWord: Arinc429Register): string {
    if (irMaintenanceWord.isInvalid()) {
      return 'INVAL';
    }

    if (irMaintenanceWord.bitValue(3)) {
      const align1Min = irMaintenanceWord.bitValue(16);
      const align2Min = irMaintenanceWord.bitValue(17);
      const align4Min = irMaintenanceWord.bitValue(18);
      if (align1Min || align2Min || align4Min) {
        let timeToAlign = 0;
        if (align1Min) {
          timeToAlign += 1;
        }
        if (align2Min) {
          timeToAlign += 2;
        }
        if (align4Min) {
          timeToAlign += 4;
        }
        return 'ALIGN TTN ' + timeToAlign;
      } else {
        return 'NAV';
      }
    } else if (irMaintenanceWord.bitValue(2)) {
      return 'ATT';
    }

    return '';
  }
}
