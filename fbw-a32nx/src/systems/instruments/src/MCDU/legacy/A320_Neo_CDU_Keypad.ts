// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUDataIndexPage } from '../legacy_pages/A320_Neo_CDU_DataIndexPage';
import { CDUDirectToPage } from '../legacy_pages/A320_Neo_CDU_DirectToPage';
import { CDUFlightPlanPage } from '../legacy_pages/A320_Neo_CDU_FlightPlanPage';
import { CDUInitPage } from '../legacy_pages/A320_Neo_CDU_InitPage';
import { CDUMenuPage } from '../legacy_pages/A320_Neo_CDU_MenuPage';
import { CDUNavRadioPage } from '../legacy_pages/A320_Neo_CDU_NavRadioPage';
import { CDUPerformancePage } from '../legacy_pages/A320_Neo_CDU_PerformancePage';
import { CDUProgressPage } from '../legacy_pages/A320_Neo_CDU_ProgressPage';
import { CDUSecFplnMain } from '../legacy_pages/A320_Neo_CDU_SecFplnMain';
import { CDUAtcMenu } from '../legacy_pages/atsu/A320_Neo_CDU_ATC_Menu';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class Keypad {
  private static readonly _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  public static readonly clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  public static readonly ovfyValue = '\u0394';

  private readonly _keys = {
    AIRPORT: () => this.mcdu.onAirport(),
    ATC: () => CDUAtcMenu.ShowPage(this.mcdu),
    DATA: () => CDUDataIndexPage.ShowPage1(this.mcdu),
    DIR: () => {
      this.mcdu.eraseTemporaryFlightPlan();
      CDUDirectToPage.ShowPage(this.mcdu);
    },
    FPLN: () => CDUFlightPlanPage.ShowPage(this.mcdu),
    FUEL: () => this.mcdu.goToFuelPredPage(FlightPlanIndex.Active),
    INIT: () => {
      if (this.mcdu.flightPhaseManager.phase === FmgcFlightPhase.Done) {
        this.mcdu.flightPhaseManager.changePhase(FmgcFlightPhase.Preflight);
      }
      CDUInitPage.ShowPage1(this.mcdu);
    },
    MENU: () => CDUMenuPage.ShowPage(this.mcdu),
    PERF: () => {
      if (this.mcdu.flightPhaseManager.phase === FmgcFlightPhase.Done) {
        this.mcdu.flightPhaseManager.changePhase(FmgcFlightPhase.Preflight);
      }
      CDUPerformancePage.ShowPage(this.mcdu, FlightPlanIndex.Active);
    },
    PROG: () => CDUProgressPage.ShowPage(this.mcdu),
    RAD: () => CDUNavRadioPage.ShowPage(this.mcdu),
    SEC: () => CDUSecFplnMain.ShowPage(this.mcdu),

    PREVPAGE: () => this.mcdu.onPrevPage(),
    NEXTPAGE: () => this.mcdu.onNextPage(),
    UP: () => this.mcdu.onUp(),
    DOWN: () => this.mcdu.onDown(),

    CLR: () => this.mcdu.onClr(),
    CLR_Held: () => this.mcdu.onClrHeld(),
    DIV: () => this.mcdu.onDiv(),
    DOT: () => this.mcdu.onDot(),
    OVFY: () => this.mcdu.onOvfy(),
    PLUSMINUS: () => this.mcdu.onPlusMinus(),
    SP: () => this.mcdu.onSp(),

    BRT: (side) => this.mcdu.onBrightnessKey(side, 1),
    DIM: (side) => this.mcdu.onBrightnessKey(side, -1),
  };

  constructor(private mcdu) {
    for (const letter of Keypad._AvailableKeys) {
      this._keys[letter] = () => this.mcdu.onLetterInput(letter);
    }
  }

  /**
   * Handle CDU key presses
   * @param {unknown} value
   * @param {'L' | 'R'} side
   * @returns true if handled
   */
  onKeyPress(value, side) {
    const action = this._keys[value];
    if (!action) {
      return false;
    }

    const cur = this.mcdu.page.Current;
    setTimeout(() => {
      if (this.mcdu.page.Current === cur) {
        action(side);
      }
    }, this.mcdu.getDelaySwitchPage());
    return true;
  }
}
