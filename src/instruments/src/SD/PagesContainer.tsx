import React, { useState } from 'react';
import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { useArinc429Var } from '@instruments/common/arinc429';
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

export const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState(8);
    const [prevFailPage, setPrevFailPage] = useState(0);
    const [ecamCycleInterval, setEcamCycleInterval] = useState(-1);
    const [failPage] = useSimVar('L:A32NX_ECAM_SFAIL', 'Enum', 300);

    const [prevEcamAllButtonState, setPrevEcamAllButtonState] = useState(false);

    const [pageWhenUnselected, setPageWhenUnselected] = useState(8);

    const [ecamAllButtonPushed] = useSimVar('L:A32NX_ECAM_ALL_Push_IsDown', 'Bool', 100);
    const [fwcFlightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', 500);
    const [crzCondTimer, setCrzCondTimer] = useState(60);
    const [ecamFCTLTimer, setEcamFCTLTimer] = useState(20);
    const [mainEngineStarterOffTimer, setMainEngineStarterOffTimer] = useState(-1);
    const [apuAboveThresholdTimer, setApuAboveThresholdTimer] = useState(-1);
    const apuRpm = useArinc429Var('L:A32NX_APU_N', 100);

    const altitude = useArinc429Var('L:A32NX_ADIRS_ADR_1_ALTITUDE', 300);

    const [page, setPage] = useSimVar('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', 50);

    const checkEnginePage = (deltaTime: number) => {
        const engModeSel = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'number');
        const eng1State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'number');
        const eng2State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'number');
        const oneEngOff = eng1State !== 1 || eng2State !== 1;

        if (engModeSel === 0 || (oneEngOff && engModeSel === 2) || mainEngineStarterOffTimer >= 0) {
            // Show ENG until >10 seconds after both engines are fully started
            if (engModeSel === 0 || (oneEngOff && engModeSel === 2)) {
                setMainEngineStarterOffTimer(10);
            } else if (mainEngineStarterOffTimer >= 0) {
                setMainEngineStarterOffTimer((prev) => prev - deltaTime / 1000);
            }
            setPageWhenUnselected(0);
        }
    };

    const checkApuPage = (deltaTime) => {
        const currentAPUMasterState = SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool');

        if (currentAPUMasterState && apuRpm.isNormalOperation() && (apuRpm.value <= 95 || apuAboveThresholdTimer >= 0)) {
            // Show APU on Lower ECAM until 15s after RPM > 95%
            if (apuAboveThresholdTimer <= 0 && apuRpm.value <= 95) {
                setApuAboveThresholdTimer(15);
            } else if (apuRpm.value > 95) {
                setApuAboveThresholdTimer((prev) => prev - deltaTime / 1000);
            }
            setPageWhenUnselected(6);
        }
    };

    const updateCallback = (deltaTime) => {
        if (ecamAllButtonPushed && !prevEcamAllButtonState) { // button press
            setPage((prev) => (prev + 1) % 12);
            setCurrentPage((prev) => (prev + 1) % 12);
            setEcamCycleInterval(setInterval(() => {
                setCurrentPage((prev) => {
                    setPage((prev + 1) % 12);
                    return (prev + 1) % 12;
                });
            }, 1000) as unknown as number);
        } else if (!ecamAllButtonPushed && prevEcamAllButtonState) { // button release
            clearInterval(ecamCycleInterval);
        } else if (!ecamAllButtonPushed) {
            const newPage = page;
            if (newPage !== -1) {
                setCurrentPage(newPage);
            } else {
                setCurrentPage(pageWhenUnselected);
            }

            switch (fwcFlightPhase) {
            case 10:
            case 1:
                setCrzCondTimer(60);
                setPageWhenUnselected(8);
                // TODO: Emergency Generator Test displays ELEC
                // Needs system implementation (see A320_NEO_INTERIOR Component ID EMER_ELEC_PWR [LVar: L:A32NX_EMERELECPWR_GEN_TEST])
                checkApuPage(deltaTime);
                checkEnginePage(deltaTime);
                break;
            case 2:
                const sidestickPosX = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_X', 'Number');
                const sidestickPosY = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_Y', 'Number');
                const rudderPos = SimVar.GetSimVarValue('RUDDER PEDAL POSITION', 'Position');
                const controlsMoved = Math.abs(sidestickPosX) > 0.05 || Math.abs(sidestickPosY) > 0.05 || Math.abs(rudderPos) > 0.2;

                setPageWhenUnselected(9);
                // When controls are moved > threshold, show FCTL page for 20s
                if (controlsMoved) {
                    setPageWhenUnselected(10);
                    setEcamFCTLTimer(20);
                } else if (ecamFCTLTimer >= 0) {
                    setPageWhenUnselected(10);
                    setEcamFCTLTimer((prev) => prev - deltaTime / 1000);
                }
                checkApuPage(deltaTime);
                checkEnginePage(deltaTime);
                break;
            case 3:
            case 4:
            case 5:
                setPageWhenUnselected(0);
                break;
            case 6:
            case 7:
            case 8:
            case 9:
                const isGearExtended = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;
                const ToPowerSet = Math.max(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'),
                    SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number')) >= 35 && SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent') > 15
                    && SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent') > 15;
                const spoilerOrFlapsDeployed = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'number') !== 0
                || SimVar.GetSimVarValue('L:A32NX_SPOILERS_HANDLE_POSITION', 'percent') !== 0;

                if (isGearExtended && (altitude.value < 16000)) {
                    setPageWhenUnselected(9);
                    checkApuPage(deltaTime);
                    checkEnginePage(deltaTime);
                    break;
                    // Else check for CRZ
                }

                if ((spoilerOrFlapsDeployed || ToPowerSet)) {
                    if (crzCondTimer <= 0) {
                        setPageWhenUnselected(12);
                        checkApuPage(deltaTime);
                        checkEnginePage(deltaTime);
                    } else {
                        setCrzCondTimer((prev) => prev - deltaTime / 1000);
                    }
                } else if (!spoilerOrFlapsDeployed && !ToPowerSet) {
                    setPageWhenUnselected(12);
                    checkApuPage(deltaTime);
                    checkEnginePage(deltaTime);
                }
                break;
            default:
                // Sometimes happens when loading in, in which case we have to initialise pageNameWhenUnselected here.
                setPageWhenUnselected(8);
                break;
            }

            if (failPage !== -1) {
                setPageWhenUnselected(failPage);

                // Disable user selected page when new failure detected
                if (prevFailPage !== failPage) {
                    setCurrentPage(-1);
                    setPage(-1);
                }
            }

            // switch page when desired page was changed, or new Failure detected
            if ((pageWhenUnselected !== newPage && page === -1) || (prevFailPage !== failPage)) {
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
        11: <StatusPage />,
        12: <CrzPage />,
    };

    return pages[currentPage] || <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};
