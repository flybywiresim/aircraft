// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Register } from '@flybywiresim/fbw-sdk';
import { SimVarValueType, Subject, Subscription } from '@microsoft/msfs-sdk';
import { SdPages } from '@shared/EcamSystemPages';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

const CRZ_CONDITION_TIMER_DURATION = 60;
const ENG_CONDITION_TIMER_DURATION = 10;
const APU_CONDITION_TIMER_DURATION = 10;
const FCTL_CONDITION_TIMER_DURATION = 20;
const STS_DISPLAY_TIMER_DURATION = 3;
const ECAM_LIGHT_DELAY_ALL = 200;
const ECAM_ALL_CYCLE_DELAY = 3000;

export class FwsSystemDisplayLogic {
  private readonly subscriptions: Subscription[] = [];

  private readonly userSelectedPage = Subject.create<SdPages>(SdPages.None);
  private readonly currentPage = Subject.create<SdPages>(SdPages.Door);
  private readonly prevFailPage = Subject.create<SdPages>(SdPages.Door);
  private readonly pageWhenUnselected = Subject.create<SdPages>(SdPages.Door);

  private ecamCycleInterval: NodeJS.Timeout | null = null;
  private readonly startPageAllCycleRef = Subject.create<SdPages>(SdPages.None);

  private readonly ecamButtonLightDelayTimer = Subject.create(Number.MIN_SAFE_INTEGER);

  private readonly prevEcamAllButtonState = Subject.create(false);

  private readonly crzCondTimer = Subject.create(CRZ_CONDITION_TIMER_DURATION);

  private readonly ecamFCTLTimer = Subject.create(FCTL_CONDITION_TIMER_DURATION);

  private readonly mainEngineStarterOffTimer = Subject.create(-1);
  private readonly apuAboveThresholdTimer = Subject.create(-1);
  private readonly stsPressedTimer = Subject.create(-1);
  private readonly stsPrevPage = Subject.create(SdPages.None);

  private readonly apuRpm = Arinc429Register.empty();

  constructor(private fws: FwsCore) {}

  update(deltaTime: number) {
    // FIXME convoluted, confusing logic, someone please, please, please re-write it from scratch
    // FIXME backup for ALL button needed when both FWS are failed
    const failPage = SimVar.GetSimVarValue('L:A32NX_ECAM_SFAIL', SimVarValueType.Enum);

    const ecamAllButtonPushed = SimVar.GetSimVarValue('L:A32NX_BTN_ALL', SimVarValueType.Bool);

    this.apuRpm.setFromSimVar('L:A32NX_APU_N');

    this.userSelectedPage.set(SimVar.GetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', SimVarValueType.Enum));

    if (this.ecamButtonLightDelayTimer.get() != Number.MIN_SAFE_INTEGER) {
      const t = this.ecamButtonLightDelayTimer.get();
      this.ecamButtonLightDelayTimer.set(t - deltaTime);
      if (this.ecamButtonLightDelayTimer.get() <= 0) {
        SimVar.SetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', SimVarValueType.Enum, this.currentPage.get());
        this.ecamButtonLightDelayTimer.set(Number.MIN_SAFE_INTEGER);
      }
    }
    if (ecamAllButtonPushed && !this.prevEcamAllButtonState.get()) {
      // if the ALL button was pressed for the first time, remember the start page
      this.startPageAllCycleRef.set(this.currentPage.get());
      this.ecamButtonLightDelayTimer.set(ECAM_LIGHT_DELAY_ALL);
      const nextPage = this.userSelectedPage.get() === SdPages.None ? SdPages.Eng : this.currentPage.get() + 1;
      this.currentPage.set(nextPage % SdPages.Crz);

      this.ecamCycleInterval = setInterval(() => {
        const currentPage = this.currentPage.get();
        if (currentPage !== this.startPageAllCycleRef.get()) {
          this.currentPage.set(currentPage === SdPages.Cb ? SdPages.Eng : currentPage + 1);
          this.ecamButtonLightDelayTimer.set(ECAM_LIGHT_DELAY_ALL);
        }
      }, ECAM_ALL_CYCLE_DELAY);
    } else if (!ecamAllButtonPushed && this.prevEcamAllButtonState.get()) {
      // ALL button released
      clearInterval(this.ecamCycleInterval);
      this.ecamCycleInterval = null;
    } else if (!ecamAllButtonPushed) {
      if (this.userSelectedPage.get() !== SdPages.Status) {
        this.stsPrevPage.set(this.userSelectedPage.get());
      }
      if (this.ecamButtonLightDelayTimer.get() === Number.MIN_SAFE_INTEGER) {
        if (this.userSelectedPage.get() !== -1) {
          this.currentPage.set(this.userSelectedPage.get());
        } else {
          this.currentPage.set(this.pageWhenUnselected.get());
        }
      }
      switch (this.fws.flightPhase.get()) {
        case 12:
        case 1:
          this.crzCondTimer.set(CRZ_CONDITION_TIMER_DURATION);
          this.pageWhenUnselected.set(SdPages.Door);
          // TODO: Emergency Generator Test displays ELEC
          // Needs system implementation (see A320_NEO_INTERIOR Component ID EMER_ELEC_PWR [LVar: L:A32NX_EMERELECPWR_GEN_TEST])
          this.checkApuPage(deltaTime);
          this.checkEnginePage(deltaTime);
          break;
        case 2: {
          const sidestickPosX = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_X', 'Number');
          const sidestickPosY = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_Y', 'Number');
          const rudderPos = SimVar.GetSimVarValue('RUDDER PEDAL POSITION', 'Position');
          const controlsMoved =
            Math.abs(sidestickPosX) > 0.05 || Math.abs(sidestickPosY) > 0.05 || Math.abs(rudderPos) > 0.2;

          this.pageWhenUnselected.set(SdPages.Wheel);
          // When controls are moved > threshold, show FCTL page for 20s
          if (controlsMoved) {
            this.pageWhenUnselected.set(SdPages.Fctl);
            this.ecamFCTLTimer.set(FCTL_CONDITION_TIMER_DURATION);
          } else if (this.ecamFCTLTimer.get() >= 0) {
            this.pageWhenUnselected.set(SdPages.Fctl);
            const prev = this.ecamFCTLTimer.get();
            this.ecamFCTLTimer.set(prev - deltaTime / 1000);
          }
          this.checkApuPage(deltaTime);
          this.checkEnginePage(deltaTime);
          break;
        }
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          this.pageWhenUnselected.set(SdPages.Eng);
          break;
        case 8:
        case 9:
        case 10:
        case 11: {
          const isGearExtended = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;
          const ToPowerSet =
            Math.max(
              SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'),
              SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number'),
            ) >= 35 &&
            SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent') > 15 &&
            SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent') > 15;
          const spoilerOrFlapsDeployed =
            SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'number') !== 0 ||
            SimVar.GetSimVarValue('L:A32NX_SPOILERS_HANDLE_POSITION', 'percent') !== 0;

          if (isGearExtended && this.fws.adrPressureAltitude.get() < 16000) {
            this.pageWhenUnselected.set(SdPages.Wheel);
            this.checkApuPage(deltaTime);
            this.checkEnginePage(deltaTime);
            break;
            // Else check for CRZ
          }

          if (spoilerOrFlapsDeployed || ToPowerSet) {
            if (this.crzCondTimer.get() <= 0) {
              this.pageWhenUnselected.set(SdPages.Crz);
              this.checkApuPage(deltaTime);
              this.checkEnginePage(deltaTime);
            } else {
              const prev = this.crzCondTimer.get();
              this.crzCondTimer.set(prev - deltaTime / 1000);
            }
          } else if (!spoilerOrFlapsDeployed && !ToPowerSet) {
            this.pageWhenUnselected.set(SdPages.Crz);
            this.checkApuPage(deltaTime);
            this.checkEnginePage(deltaTime);
          }
          break;
        }
        default:
          // Sometimes happens when loading in, in which case we have to initialise pageNameWhenUnselected here.
          this.pageWhenUnselected.set(SdPages.Door);
          break;
      }

      this.checkStsPage(deltaTime);

      if (failPage !== SdPages.None) {
        this.pageWhenUnselected.set(failPage);

        // Disable user selected page when new failure detected
        if (this.prevFailPage.get() !== failPage) {
          SimVar.SetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', SimVarValueType.Enum, SdPages.None);
          this.userSelectedPage.set(SdPages.None);
          this.currentPage.set(failPage);
        }
      }

      this.prevFailPage.set(failPage);
    }

    SimVar.SetSimVarValue('L:A32NX_ECAM_SD_PAGE_TO_SHOW', SimVarValueType.Enum, this.currentPage.get());

    this.prevEcamAllButtonState.set(ecamAllButtonPushed);
  }

  private checkEnginePage = (deltaTime: number) => {
    const engModeSel = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'number');
    const eng1State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'number');
    const eng2State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'number');
    const eng3State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:3', 'number');
    const eng4State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:4', 'number');
    const oneEngOff = eng1State !== 1 || eng2State !== 1 || eng3State !== 1 || eng4State !== 1;

    if (engModeSel === 0 || (oneEngOff && engModeSel === 2) || this.mainEngineStarterOffTimer.get() >= 0) {
      // Show ENG until >10 seconds after both engines are fully started
      if (engModeSel === 0 || (oneEngOff && engModeSel === 2)) {
        this.mainEngineStarterOffTimer.set(ENG_CONDITION_TIMER_DURATION);
      } else if (this.mainEngineStarterOffTimer.get() >= 0) {
        const prevTimer = this.mainEngineStarterOffTimer.get();
        this.mainEngineStarterOffTimer.set(prevTimer - deltaTime / 1000);
      }
      this.pageWhenUnselected.set(SdPages.Eng);
    }
  };

  private checkApuPage = (deltaTime: number) => {
    const currentAPUMasterState = SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool');

    if (
      currentAPUMasterState &&
      this.apuRpm.isNormalOperation() &&
      (this.apuRpm.value <= 95 || this.apuAboveThresholdTimer.get() >= 0)
    ) {
      // Show APU on Lower ECAM until 15s after RPM > 95%
      if (this.apuAboveThresholdTimer.get() <= 0 && this.apuRpm.value <= 95) {
        this.apuAboveThresholdTimer.set(APU_CONDITION_TIMER_DURATION);
      } else if (this.apuRpm.value > 95) {
        const prev = this.apuAboveThresholdTimer.get();
        this.apuAboveThresholdTimer.set(prev - deltaTime / 1000);
      }
      this.pageWhenUnselected.set(SdPages.Apu);
    }
  };

  private checkStsPage = (deltaTime: number) => {
    const isStatusPageEmpty = this.fws.statusNormal.get();

    if (this.currentPage.get() !== SdPages.Status) {
      this.stsPressedTimer.set(STS_DISPLAY_TIMER_DURATION);
      return;
    }

    if (isStatusPageEmpty) {
      if (this.stsPressedTimer.get() > 0) {
        const prev = this.stsPressedTimer.get();
        this.stsPressedTimer.set(prev - deltaTime / 1000);
        this.pageWhenUnselected.set(SdPages.Status);
      } else {
        SimVar.SetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', this.stsPrevPage.get());
      }
    } else {
      this.stsPressedTimer.set(STS_DISPLAY_TIMER_DURATION);
    }
  };

  reset() {}

  destroy() {
    this.subscriptions.forEach((s) => s.destroy());
  }
}
