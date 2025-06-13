// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState } from 'react';
import { useUpdate, useSimVar, useArinc429Var } from '@flybywiresim/fbw-sdk';
import { EngPage } from './Pages/Eng/Eng';
import { BleedPage } from './Pages/Bleed/Bleed';
import { PressPage } from './Pages/Press/Press';
import { ElecPage } from './Pages/Elec/Elec';
import { HydPage } from './Pages/Hyd/Hyd';
import { FuelPage } from './Pages/Fuel/Fuel';
import { ApuPage } from './Pages/Apu/Apu';
import { CondPage } from './Pages/Cond/Cond';
import { DoorPage } from './Pages/Door/Door';
import { WheelPage } from './Pages/Wheel/Wheel';
import { FctlPage } from './Pages/Fctl/Fctl';
import { StatusPage } from './Pages/Status/Status';
import { CrzPage } from './Pages/Crz/Crz';

enum SdPages {
  None = -1,
  Eng = 0,
  Bleed = 1,
  Press = 2,
  Elec = 3,
  Hyd = 4,
  Fuel = 5,
  Apu = 6,
  Cond = 7,
  Door = 8,
  Wheel = 9,
  Fctl = 10,
  Crz = 11,
  Status = 12,
}

const CRZ_CONDITION_TIMER_DURATION = 60;
const ENG_CONDITION_TIMER_DURATION = 10;
const APU_CONDITION_TIMER_DURATION = 15;
const FCTL_CONDITION_TIMER_DURATION = 20;
const STS_DISPLAY_TIMER_DURATION = 3;
const ECAM_LIGHT_DELAY_ALL = 200;

export const PagesContainer = () => {
  const [currentPage, setCurrentPage] = useState(SdPages.Door);
  const [prevFailPage, setPrevFailPage] = useState(SdPages.Eng);
  const [ecamCycleInterval, setEcamCycleInterval] = useState(-1);
  const [ecamButtonLightDelayTimer, setEcamButtonLightDelayTimer] = useState(Number.MIN_SAFE_INTEGER);
  const [failPage] = useSimVar('L:A32NX_ECAM_SFAIL', 'Enum', 300);

  const [prevEcamAllButtonState, setPrevEcamAllButtonState] = useState(false);

  const [pageWhenUnselected, setPageWhenUnselected] = useState(SdPages.Door);

  const [ecamAllButtonPushed] = useSimVar('L:A32NX_ECP_DISCRETE_OUT_ALL', 'Bool', 20);
  const [fwcFlightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 500);
  const [crzCondTimer, setCrzCondTimer] = useState(CRZ_CONDITION_TIMER_DURATION);
  const [ecamFCTLTimer, setEcamFCTLTimer] = useState(FCTL_CONDITION_TIMER_DURATION);
  const [mainEngineStarterOffTimer, setMainEngineStarterOffTimer] = useState(-1);
  const [apuAboveThresholdTimer, setApuAboveThresholdTimer] = useState(-1);
  const [stsPressedTimer, setStsPressedTimer] = useState(-1);
  const [stsPrevPage, setStsPrevPage] = useState(-1);
  const [normalStatusLine] = useSimVar('L:A32NX_STATUS_LEFT_LINE_8', 'number', 100);
  const apuRpm = useArinc429Var('L:A32NX_APU_N', 100);

  const baroCorrectedAltitude1 = useArinc429Var('L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1', 300);

  const [page, setPage] = useSimVar('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', 50);

  const checkEnginePage = (deltaTime: number) => {
    const engModeSel = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'number');
    const eng1State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'number');
    const eng2State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'number');
    const oneEngOff = eng1State !== 1 || eng2State !== 1;

    if (engModeSel === 0 || (oneEngOff && engModeSel === 2) || mainEngineStarterOffTimer >= 0) {
      // Show ENG until >10 seconds after both engines are fully started
      if (engModeSel === 0 || (oneEngOff && engModeSel === 2)) {
        setMainEngineStarterOffTimer(ENG_CONDITION_TIMER_DURATION);
      } else if (mainEngineStarterOffTimer >= 0) {
        setMainEngineStarterOffTimer((prev) => prev - deltaTime / 1000);
      }
      setPageWhenUnselected(SdPages.Eng);
    }
  };

  const checkApuPage = (deltaTime) => {
    const currentAPUMasterState = SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool');

    if (currentAPUMasterState && apuRpm.isNormalOperation() && (apuRpm.value <= 95 || apuAboveThresholdTimer >= 0)) {
      // Show APU on Lower ECAM until 15s after RPM > 95%
      if (apuAboveThresholdTimer <= 0 && apuRpm.value <= 95) {
        setApuAboveThresholdTimer(APU_CONDITION_TIMER_DURATION);
      } else if (apuRpm.value > 95) {
        setApuAboveThresholdTimer((prev) => prev - deltaTime / 1000);
      }
      setPageWhenUnselected(SdPages.Apu);
    }
  };

  const checkStsPage = (deltaTime) => {
    const isStatusPageEmpty = normalStatusLine === 1;

    if (currentPage !== SdPages.Status) {
      return;
    }

    if (isStatusPageEmpty) {
      if (stsPressedTimer > 0) {
        setStsPressedTimer((prev) => prev - deltaTime / 1000);
        setPageWhenUnselected(SdPages.Status);
      } else {
        SimVar.SetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', stsPrevPage);
      }
    } else {
      setPageWhenUnselected(SdPages.Status);
      setStsPressedTimer(STS_DISPLAY_TIMER_DURATION);
    }
  };

  const updateCallback = (deltaTime) => {
    if (ecamButtonLightDelayTimer != Number.MIN_SAFE_INTEGER) {
      setEcamButtonLightDelayTimer((t) => t - deltaTime);
      if (ecamButtonLightDelayTimer <= 0) {
        setPage(currentPage);

        setEcamButtonLightDelayTimer(Number.MIN_SAFE_INTEGER);
      }
    }
    if (ecamAllButtonPushed && !prevEcamAllButtonState) {
      // button press
      setCurrentPage((prev) => {
        prev = page === SdPages.None ? SdPages.Eng : prev + 1;
        setEcamButtonLightDelayTimer(ECAM_LIGHT_DELAY_ALL);
        return prev % 11;
      });
      setEcamCycleInterval(
        setInterval(() => {
          setCurrentPage((prev) => {
            prev = Math.min(prev + 1, SdPages.Fctl);
            setEcamButtonLightDelayTimer(ECAM_LIGHT_DELAY_ALL);
            return prev;
          });
        }, 3000) as unknown as number,
      );
    } else if (!ecamAllButtonPushed && prevEcamAllButtonState) {
      // button release
      clearInterval(ecamCycleInterval);
    } else if (!ecamAllButtonPushed) {
      if (currentPage !== SdPages.Status) {
        setStsPrevPage(currentPage);
      }
      const newPage = page;
      if (ecamButtonLightDelayTimer === Number.MIN_SAFE_INTEGER) {
        if (newPage !== -1) {
          setCurrentPage(newPage);
        } else {
          setCurrentPage(pageWhenUnselected);
        }
      }
      switch (fwcFlightPhase) {
        case 10:
        case 1:
          setCrzCondTimer(CRZ_CONDITION_TIMER_DURATION);
          setPageWhenUnselected(SdPages.Door);
          // TODO: Emergency Generator Test displays ELEC
          // Needs system implementation (see A320_NEO_INTERIOR Component ID EMER_ELEC_PWR [LVar: L:A32NX_EMERELECPWR_GEN_TEST])
          checkApuPage(deltaTime);
          checkEnginePage(deltaTime);
          break;
        case 2: {
          const sidestickPosX = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_X', 'Number');
          const sidestickPosY = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_Y', 'Number');
          const rudderPos = SimVar.GetSimVarValue('RUDDER PEDAL POSITION', 'Position');
          const controlsMoved =
            Math.abs(sidestickPosX) > 0.05 || Math.abs(sidestickPosY) > 0.05 || Math.abs(rudderPos) > 0.2;

          setPageWhenUnselected(SdPages.Wheel);
          // When controls are moved > threshold, show FCTL page for 20s
          if (controlsMoved) {
            setPageWhenUnselected(SdPages.Fctl);
            setEcamFCTLTimer(FCTL_CONDITION_TIMER_DURATION);
          } else if (ecamFCTLTimer >= 0) {
            setPageWhenUnselected(SdPages.Fctl);
            setEcamFCTLTimer((prev) => prev - deltaTime / 1000);
          }
          checkApuPage(deltaTime);
          checkEnginePage(deltaTime);
          break;
        }
        case 3:
        case 4:
        case 5:
          setPageWhenUnselected(SdPages.Eng);
          break;
        case 6:
        case 7:
        case 8:
        case 9: {
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

          if (isGearExtended && baroCorrectedAltitude1.value < 16000) {
            setPageWhenUnselected(SdPages.Wheel);
            checkApuPage(deltaTime);
            checkEnginePage(deltaTime);
            break;
            // Else check for CRZ
          }

          if (spoilerOrFlapsDeployed || ToPowerSet) {
            if (crzCondTimer <= 0) {
              setPageWhenUnselected(SdPages.Crz);
              checkApuPage(deltaTime);
              checkEnginePage(deltaTime);
            } else {
              setCrzCondTimer((prev) => prev - deltaTime / 1000);
            }
          } else if (!spoilerOrFlapsDeployed && !ToPowerSet) {
            setPageWhenUnselected(SdPages.Crz);
            checkApuPage(deltaTime);
            checkEnginePage(deltaTime);
          }
          break;
        }
        default:
          // Sometimes happens when loading in, in which case we have to initialise pageNameWhenUnselected here.
          setPageWhenUnselected(SdPages.Door);
          break;
      }

      if (newPage === SdPages.Status && currentPage !== newPage) {
        setStsPressedTimer(STS_DISPLAY_TIMER_DURATION);
      }
      checkStsPage(deltaTime);

      if (failPage !== SdPages.None) {
        setPageWhenUnselected(failPage);

        // Disable user selected page when new failure detected
        if (prevFailPage !== failPage) {
          setPage(SdPages.None);
        }
      }

      // switch page when new Failure detected
      if (prevFailPage !== failPage) {
        setCurrentPage(pageWhenUnselected);
      }

      setPrevFailPage(failPage);
    }
    setPrevEcamAllButtonState(ecamAllButtonPushed);
  };

  useUpdate(updateCallback);

  const pages = {
    0: <EngPage />,
    1: <BleedPage />,
    2: <PressPage />,
    3: <ElecPage />,
    4: <HydPage />,
    5: <FuelPage />,
    6: <ApuPage />,
    7: <CondPage />,
    8: <DoorPage />,
    9: <WheelPage />,
    10: <FctlPage />,
    11: <CrzPage />,
    12: <StatusPage />,
  };

  return (
    pages[currentPage] || (
      <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">
        invalid page
      </text>
    )
  );
};
