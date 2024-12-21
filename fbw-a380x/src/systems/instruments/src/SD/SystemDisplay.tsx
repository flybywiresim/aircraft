// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useRef, useState } from 'react';
// import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { DisplayUnitID, LegacyCdsDisplayUnit } from '@instruments/common/LegacyCdsDisplayUnit';

// import { getSimVar } from '../util';
import { SdPages } from '@shared/EcamSystemPages';
import { EngPage } from './Pages/Engine/EngPage';
import { BleedPage } from './Pages/Bleed/BleedPage';
import { HydPage } from './Pages/Hyd/HydPage';
import { PressPage } from './Pages/Press/PressPage';
import { ElecAcPage } from './Pages/ElecAc/ElecAcPage';
import { FuelPage } from './Pages/FuelPage';
import { CbPage } from './Pages/CbPage';
import { ApuPage } from './Pages/Apu/ApuPage';
import { CondPage } from './Pages/Cond/CondPage';
import { DoorPage } from './Pages/Doors/DoorPage';
import { ElecDcPage } from './Pages/ElecDc/ElecDcPage';
import { WheelPage } from './Pages/Wheel/WheelPage';
import { FctlPage } from './Pages/Fctl/FctlPage';
// import { VideoPage } from './Pages/VideoPage';
import { CruisePage } from './Pages/Cruise/CruisePage';
import { StatusPage } from './Pages/Status/StatusPage';

import { StatusArea } from './StatusArea';

import '../index.scss';
import { useArinc429Var, useUpdate } from '@flybywiresim/fbw-sdk';

const CRZ_CONDITION_TIMER_DURATION = 60;
const ENG_CONDITION_TIMER_DURATION = 10;
const APU_CONDITION_TIMER_DURATION = 10;
const FCTL_CONDITION_TIMER_DURATION = 20;
const STS_DISPLAY_TIMER_DURATION = 3;
const ECAM_LIGHT_DELAY_ALL = 200;
const ECAM_ALL_CYCLE_DELAY = 3000;

export const SystemDisplay = () => {
  const [currentPage, setCurrentPage] = useState(SdPages.Door);
  const [prevFailPage, setPrevFailPage] = useState(SdPages.Eng);
  const [ecamCycleInterval, setEcamCycleInterval] = useState(-1);
  const [ecamButtonLightDelayTimer, setEcamButtonLightDelayTimer] = useState(Number.MIN_SAFE_INTEGER);
  const [failPage] = useSimVar('L:A32NX_ECAM_SFAIL', 'Enum', 300);

  const [prevEcamAllButtonState, setPrevEcamAllButtonState] = useState(false);

  const [pageWhenUnselected, setPageWhenUnselected] = useState(SdPages.Door);

  const [ecamAllButtonPushed] = useSimVar('L:A32NX_BTN_ALL', 'Bool', 100);
  const startPageAllCycleRef = useRef(-1);
  const [fwcFlightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 500);
  const [crzCondTimer, setCrzCondTimer] = useState(CRZ_CONDITION_TIMER_DURATION);
  const [ecamFCTLTimer, setEcamFCTLTimer] = useState(FCTL_CONDITION_TIMER_DURATION);
  const [mainEngineStarterOffTimer, setMainEngineStarterOffTimer] = useState(-1);
  const [apuAboveThresholdTimer, setApuAboveThresholdTimer] = useState(-1);
  const [stsPressedTimer, setStsPressedTimer] = useState(-1);
  const [stsPrevPage, setStsPrevPage] = useState(-1);
  const [statusNormal] = useSimVar('L:A32NX_STATUS_NORMAL', 'number', 1000);
  const apuRpm = useArinc429Var('L:A32NX_APU_N', 100);

  const baroCorrectedAltitude1 = useArinc429Var('L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1', 300);

  const [page, setPage] = useSimVar('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', 50);

  const checkEnginePage = (deltaTime: number) => {
    const engModeSel = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'number');
    const eng1State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'number');
    const eng2State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'number');
    const eng3State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:3', 'number');
    const eng4State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:4', 'number');
    const oneEngOff = eng1State !== 1 || eng2State !== 1 || eng3State !== 1 || eng4State !== 1;

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
    const isStatusPageEmpty = statusNormal === 1;

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
      // if the ALL button was pressed for the first time, remember the start page
      startPageAllCycleRef.current = currentPage;
      setCurrentPage((prev) => {
        setEcamButtonLightDelayTimer(ECAM_LIGHT_DELAY_ALL);
        prev = page === SdPages.None ? SdPages.Eng : prev + 1;
        // wrap around to SdPages.Eng when reaching SdPages.Crz
        return prev % SdPages.Crz;
      });
      setEcamCycleInterval(
        // interval to cycle through pages when ALL button is held
        setInterval(() => {
          setCurrentPage((prev) => {
            // if the ALL button did a full circle back to the page it started, do not advance pages anymore
            if (prev === startPageAllCycleRef.current) {
              return prev;
            }
            // C/B page should be last page so index should not exceed SdPages.Crz
            prev = prev === SdPages.Cb ? SdPages.Eng : prev + 1;
            setEcamButtonLightDelayTimer(ECAM_LIGHT_DELAY_ALL);
            return prev;
          });
        }, ECAM_ALL_CYCLE_DELAY) as unknown as number,
      );
    } else if (!ecamAllButtonPushed && prevEcamAllButtonState) {
      // ALL button released
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
        case 12:
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
        case 6:
        case 7:
          setPageWhenUnselected(SdPages.Eng);
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

  // make sure this is in line with the enum in EcamSystemPages.ts
  const PAGES = {
    0: <EngPage />,
    1: <ApuPage />,
    2: <BleedPage />,
    3: <CondPage />,
    4: <PressPage />,
    5: <DoorPage />,
    6: <ElecAcPage />,
    7: <ElecDcPage />,
    8: <FuelPage />,
    9: <WheelPage />,
    10: <HydPage />,
    11: <FctlPage />,
    12: <CbPage />,
    13: <CruisePage />,
    14: <StatusPage />,
    15: <CruisePage />, // TODO video page
  };

  return (
    <LegacyCdsDisplayUnit displayUnitId={DisplayUnitID.Sd} hideBootTestScreens={true}>
      <g>
        {PAGES[currentPage]}
        <StatusArea />
      </g>
    </LegacyCdsDisplayUnit>
  );
};
