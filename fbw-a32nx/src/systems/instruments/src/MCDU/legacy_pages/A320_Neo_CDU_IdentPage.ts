// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';

const DB_MONTHS = Object.freeze({
  '01': 'JAN',
  '02': 'FEB',
  '03': 'MAR',
  '04': 'APR',
  '05': 'MAY',
  '06': 'JUN',
  '07': 'JUL',
  '08': 'AUG',
  '09': 'SEP',
  '10': 'OCT',
  '11': 'NOV',
  '12': 'DEC',
});

function calculateActiveDate(dbIdent) {
  const effDay = dbIdent.effectiveFrom.substring(8);
  const effMonth = dbIdent.effectiveFrom.substring(5, 7);
  const expDay = dbIdent.effectiveTo.substring(8);
  const expMonth = dbIdent.effectiveTo.substring(5, 7);

  return `${effDay}${DB_MONTHS[effMonth]}-${expDay}${DB_MONTHS[expMonth]}`;
}

function calculateSecondDate(dbIdent) {
  const [effYear, effMonth, effDay] = dbIdent.effectiveFrom.split('-');
  const [expYear, expMonth, expDay] = dbIdent.effectiveTo.split('-');

  return `${effDay}${DB_MONTHS[effMonth]}${effYear}-${expDay}${DB_MONTHS[expMonth]}${expYear}`;
}

async function switchDataBase(mcdu: LegacyFmsPageInterface) {
  await mcdu.switchNavDatabase();
}

const ConfirmType = {
  NoConfirm: 0,
  DeleteStored: 1,
  SwitchDataBase: 2,
};

export class CDUIdentPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, confirmType = ConfirmType.NoConfirm) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.IdentPage;
    mcdu.activeSystem = 'FMGC';

    const stored = mcdu.dataManager.numberOfStoredElements();

    let storedTitleCell = '';
    let storedRoutesRunwaysCell = '';
    let storedWaypointsNavaidsCell = '';
    let storedDeleteCell = '';
    let secondaryDBSubLine = '';
    let secondaryDBTopLine = '';
    if (stored.routes + stored.runways + stored.waypoints + stored.navaids > 0) {
      storedTitleCell = 'STORED\xa0\xa0\xa0\xa0';
      storedRoutesRunwaysCell = `{green}${stored.routes
        .toFixed(0)
        .padStart(2, '0')}{end}{small}RTES{end}\xa0{green}${stored.runways
        .toFixed(0)
        .padStart(2, '0')}{end}{small}RWYS{end}`;
      storedWaypointsNavaidsCell = `{green}{big}${stored.waypoints
        .toFixed(0)
        .padStart(2, '0')}{end}{end}{small}WPTS{end}\xa0{green}{big}${stored.navaids
        .toFixed(0)
        .padStart(2, '0')}{end}{end}{small}NAVS{end}`;
      storedDeleteCell =
        confirmType === ConfirmType.DeleteStored ? '{amber}CONFIRM DEL*{end}' : '{cyan}DELETE ALL}{end}';

      // DELETE ALL
      mcdu.onRightInput[4] = () => {
        if (confirmType == ConfirmType.DeleteStored) {
          mcdu.dataManager.deleteAllStoredWaypoints().then((allDeleted) => {
            if (!allDeleted) {
              mcdu.setScratchpadMessage(NXSystemMessages.fplnElementRetained);
            }

            CDUIdentPage.ShowPage(mcdu);
          });
        } else {
          CDUIdentPage.ShowPage(mcdu, ConfirmType.DeleteStored);
        }
      };
    }

    const dbCycle = mcdu.getNavDatabaseIdent();
    const activeCycleDates = dbCycle === null ? '' : calculateActiveDate(dbCycle);
    const secondCycleDates = dbCycle === null ? '' : calculateSecondDate(dbCycle);
    const navSerial =
      dbCycle === null ? '' : `${dbCycle.provider.substring(0, 2).toUpperCase()}${dbCycle.airacCycle}0001`;

    // H4+ only confirm prompt + year on second dates
    secondaryDBTopLine =
      confirmType === ConfirmType.SwitchDataBase
        ? `{amber}{small}\xa0${secondCycleDates}{end}`
        : '\xa0SECOND\xa0NAV\xa0DATA\xa0BASE';
    secondaryDBSubLine =
      confirmType === ConfirmType.SwitchDataBase
        ? '{amber}{CANCEL\xa0\xa0\xa0SWAP\xa0\xa0CONFIRM*{end}'
        : `{small}{cyan}{${secondCycleDates}{end}{end}`;

    mcdu.leftInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onLeftInput[2] = () => {
      if (confirmType === ConfirmType.SwitchDataBase) {
        CDUIdentPage.ShowPage(mcdu);
      } else {
        CDUIdentPage.ShowPage(mcdu, ConfirmType.SwitchDataBase);
      }
    };

    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onRightInput[2] = () => {
      if (confirmType === ConfirmType.SwitchDataBase) {
        switchDataBase(mcdu).then(() => {
          CDUIdentPage.ShowPage(mcdu);
        });
      }
    };

    mcdu.setTemplate([
      ['A320-200\xa0\xa0\xa0\xa0'], //This aircraft code is correct and does not include the engine type.
      ['\xa0ENG'],
      ['LEAP-1A26[color]green'],
      ['\xa0ACTIVE NAV DATA BASE'],
      [`{cyan}\xa0${activeCycleDates}{end}`, `{green}${navSerial}{end}`],
      [secondaryDBTopLine],
      [secondaryDBSubLine],
      ['', storedTitleCell],
      ['', storedRoutesRunwaysCell],
      ['CHG CODE', storedWaypointsNavaidsCell],
      ['[\xa0][color]inop', storedDeleteCell],
      ['IDLE/PERF', 'SOFTWARE\xa0\xa0'],
      ['{small}{green}+0.0/+0.0{end}{end}', 'STATUS/XLOAD>[color]inop'],
    ]);
  }
}
