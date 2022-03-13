import React, { useReducer, useState } from 'react';
import { A320Failure, FailuresConsumer } from '@flybywiresim/failures';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useInteractionEvent, useUpdate } from '@instruments/common/hooks';
import { getSupplier, isCaptainSide } from '@instruments/common/utils';
import { FmgcFlightPhase } from '@shared/flightphase';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, VerticalMode } from '@shared/autopilot';
import { Horizon } from './AttitudeIndicatorHorizon';
import { AttitudeIndicatorFixedUpper, AttitudeIndicatorFixedCenter } from './AttitudeIndicatorFixed';
import { LandingSystem } from './LandingSystemIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { AltitudeIndicatorOfftape, AltitudeIndicator } from './AltitudeIndicator';
import { AirspeedIndicatorOfftape, AirspeedIndicator, MachNumber } from './SpeedIndicator';
import { FMA } from './FMA';
import { getSimVar, setSimVar } from '../util.js';
import { SmoothSin, LagFilter, RateLimiter } from './PFDUtils';
import { DisplayUnit } from '../Common/displayUnit';
import { render } from '../Common';
import './style.scss';

export const PFD: React.FC = () => {
    const [displayIndex] = useState(() => {
        const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
        return url ? parseInt(url.substring(url.length - 1), 10) : 0;
    });

    const [failuresConsumer] = useState(() => {
        const consumer = new FailuresConsumer('A32NX');
        consumer.register(isCaptainSide(displayIndex) ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);

        return consumer;
    });

    const [previousAirspeed, setPreviousAirspeed] = useState(0);
    const [filteredAirspeedAcc, setfilteredAirspeedAcc] = useState(0);

    const [airspeedAccFilter] = useState(() => new LagFilter(1.6));
    const [airspeedAccRateLimiter] = useState(() => new RateLimiter(1.2, -1.2));

    const [isAttExcessive, setIsAttExcessive] = useState(false);

    const [lsButtonPressed, setLsButtonPressed] = useState(false);

    const [barTimer, setBarTimer] = useState(10);
    const [showSpeedBars, setShowSpeedBars] = useState(true);

    const inertialReferenceSource = getSupplier(displayIndex, getSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
    const airDataReferenceSource = getSupplier(displayIndex, getSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    const computedAirspeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_COMPUTED_AIRSPEED`);

    const [radioAltitudeFilter] = useState(() => new LagFilter(5));
    const [filteredRadioAltitude, setFilteredRadioAltitude] = useState(0);
    const radioAltitude1 = useArinc429Var('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioAltitude2 = useArinc429Var('L:A32NX_RA_2_RADIO_ALTITUDE');
    const [ownRadioAltitude, oppRadioAltitude] = isCaptainSide(displayIndex) ? [
        radioAltitude1, radioAltitude2,
    ] : [
        radioAltitude2, radioAltitude1,
    ];
    const ownRadioAltitudeHasData = !ownRadioAltitude.isFailureWarning() && !ownRadioAltitude.isNoComputedData();
    const oppRadioAltitudeHasData = !oppRadioAltitude.isFailureWarning() && !oppRadioAltitude.isNoComputedData();
    const chosenRadioAltitude = (
        // the own RA has no data and the opposite one has data
        (!ownRadioAltitudeHasData && oppRadioAltitudeHasData)
        // the own RA has FW and the opposite has NCD
        || ownRadioAltitude.isFailureWarning() && oppRadioAltitude.isNoComputedData()
    ) ? oppRadioAltitude : ownRadioAltitude;

    const isOnGround = getSimVar('SIM ON GROUND', 'Bool');

    const [vls, setVls] = useState(0);

    const [_, forceUpdate] = useReducer((x) => (x > Number.MAX_SAFE_INTEGER ? 0 : x + 1), 0);
    useUpdate((deltaTime) => {
        failuresConsumer.update();

        let clamped: number;
        if (computedAirspeed.isFailureWarning()) {
            clamped = NaN;
        } else if (computedAirspeed.isNoComputedData()) {
            clamped = 30;
        } else {
            clamped = computedAirspeed.value;
        }

        const airspeedAcc = (clamped - previousAirspeed) / deltaTime * 1000;
        setPreviousAirspeed(clamped);

        const filteredAirspeedAcc = airspeedAccFilter.step(airspeedAcc, deltaTime / 1000);
        setfilteredAirspeedAcc(airspeedAccRateLimiter.step(filteredAirspeedAcc, deltaTime / 1000));

        if (isOnGround) {
            setShowSpeedBars(false);
            setBarTimer(0);
        } else if (barTimer < 10) {
            setShowSpeedBars(false);
            setBarTimer(barTimer + (deltaTime / 1000));
        } else {
            setShowSpeedBars(true);
        }

        setVls(smoothSpeeds(deltaTime, vls, getSimVar('L:A32NX_SPEEDS_VLS', 'number')));

        setFilteredRadioAltitude(radioAltitudeFilter.step(chosenRadioAltitude.value, deltaTime / 1000));

        forceUpdate();
    });

    useInteractionEvent(`A320_Neo_PFD_BTN_LS_${displayIndex}`, () => {
        setLsButtonPressed(!lsButtonPressed);
        setSimVar(`L:BTN_LS_${displayIndex}_FILTER_ACTIVE`, !lsButtonPressed, 'Bool');
    });

    const pitch = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_PITCH`);
    const roll = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_ROLL`);

    if (!isAttExcessive && ((pitch.isNormalOperation() && (-pitch.value > 25 || -pitch.value < -13)) || (roll.isNormalOperation() && Math.abs(roll.value) > 45))) {
        setIsAttExcessive(true);
    } else if (isAttExcessive && pitch.isNormalOperation() && -pitch.value < 22 && -pitch.value > -10 && roll.isNormalOperation() && Math.abs(roll.value) < 40) {
        setIsAttExcessive(false);
    }

    const heading = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_HEADING`);
    const groundTrack = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_TRACK`);
    const fpa = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_FLIGHT_PATH_ANGLE`);
    const da = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_DRIFT_ANGLE`);

    const decisionHeight = getSimVar('L:AIRLINER_DECISION_HEIGHT', 'feet');

    const altitude = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_ALTITUDE`);

    // When available, the IR V/S has priority over the ADR barometric V/S.
    const inertialVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_VERTICAL_SPEED`);
    const barometricVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_BAROMETRIC_VERTICAL_SPEED`);
    const verticalSpeed = inertialVerticalSpeed.isNormalOperation() ? inertialVerticalSpeed : barometricVerticalSpeed;

    const mda = getSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');

    const fwcFlightPhase = getSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');
    const fmgcFlightPhase = getSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum');

    const pressureMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);
    const transAlt = getSimVar(fmgcFlightPhase <= 3 ? 'L:AIRLINER_TRANS_ALT' : 'L:AIRLINER_APPR_TRANS_ALT', 'number');
    const belowTransitionAltitude = transAlt !== 0 && (!altitude.isNoComputedData() && !altitude.isNoComputedData()) && altitude.value < transAlt;

    const mach = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_MACH`);

    const VMax = getSimVar('L:A32NX_SPEEDS_VMAX', 'number');

    const armedVerticalBitmask = getSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');
    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const armedLateralBitmask = getSimVar('L:A32NX_FMA_LATERAL_ARMED', 'number');
    const cstnAlt = getSimVar('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet');
    const altCstArmed = isArmed(armedVerticalBitmask, ArmedVerticalMode.ALT_CST);
    const clbArmed = isArmed(armedVerticalBitmask, ArmedVerticalMode.CLB);
    const navArmed = isArmed(armedLateralBitmask, ArmedLateralMode.NAV);
    const isManaged = !!(altCstArmed || activeVerticalMode === VerticalMode.ALT_CST_CPT || activeVerticalMode === VerticalMode.ALT_CST
         || (!!cstnAlt && [FmgcFlightPhase.Preflight, FmgcFlightPhase.Takeoff].includes(fmgcFlightPhase) && clbArmed && navArmed));
    const targetAlt = isManaged ? cstnAlt : Simplane.getAutoPilotDisplayedAltitudeLockValue();

    let targetSpeed: number | null;
    const isSelected = Simplane.getAutoPilotAirspeedSelected();
    const isMach = Simplane.getAutoPilotMachModeActive();
    if (isSelected) {
        if (isMach) {
            const holdValue = Simplane.getAutoPilotMachHoldValue();
            targetSpeed = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', holdValue === null ? undefined : holdValue);
        } else {
            targetSpeed = Simplane.getAutoPilotAirspeedHoldValue();
        }
    } else {
        targetSpeed = getSimVar('L:A32NX_SPEEDS_MANAGED_PFD', 'knots') || NaN;
    }

    const FDActive = getSimVar(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${displayIndex}`, 'Bool');

    let selectedHeading: number = NaN;
    if (getSimVar('L:A320_FCU_SHOW_SELECTED_HEADING', 'number')) {
        selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false) || 0;
    }

    let ILSCourse = -1;
    if (lsButtonPressed) {
        ILSCourse = getSimVar('L:A32NX_FM_LS_COURSE', 'number');
    }

    return (
        <DisplayUnit
            electricitySimvar={isCaptainSide(displayIndex) ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={isCaptainSide(displayIndex) ? 88 : 90}
            failed={failuresConsumer.isActive(isCaptainSide(displayIndex) ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay)}
        >
            <svg className="pfd-svg" version="1.1" viewBox="0 0 158.75 158.75" xmlns="http://www.w3.org/2000/svg">
                <Horizon
                    pitch={pitch}
                    roll={roll}
                    heading={heading}
                    FDActive={FDActive}
                    selectedHeading={selectedHeading}
                    isOnGround={isOnGround}
                    radioAltitude={chosenRadioAltitude}
                    filteredRadioAltitude={filteredRadioAltitude}
                    belowTransitionAltitude={belowTransitionAltitude}
                    decisionHeight={decisionHeight}
                    isAttExcessive={isAttExcessive}
                />
                <AttitudeIndicatorFixedCenter
                    pitch={pitch}
                    roll={roll}
                    fpa={fpa}
                    da={da}
                    isOnGround={isOnGround}
                    FDActive={FDActive}
                    isAttExcessive={isAttExcessive}
                />
                <path
                    id="Mask1"
                    className="BackgroundFill"
                    // eslint-disable-next-line max-len
                    d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
                />
                <HeadingTape heading={heading} />
                <AltitudeIndicator altitude={altitude} FWCFlightPhase={fwcFlightPhase} />
                <AirspeedIndicator
                    airspeed={computedAirspeed}
                    airspeedAcc={filteredAirspeedAcc}
                    FWCFlightPhase={fwcFlightPhase}
                    altitude={altitude}
                    VLs={vls}
                    VMax={VMax}
                    showBars={showSpeedBars}
                    onGround={isOnGround}
                />
                <path
                    id="Mask2"
                    className="BackgroundFill"
                    // eslint-disable-next-line max-len
                    d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h20.344v85.473zm-113.33 0v-85.473h27.548v85.473z"
                />
                <LandingSystem LSButtonPressed={lsButtonPressed} pitch={pitch} roll={roll} />
                <AttitudeIndicatorFixedUpper pitch={pitch} roll={roll} />
                <VerticalSpeedIndicator verticalSpeed={verticalSpeed} radioAltitude={chosenRadioAltitude} filteredRadioAltitude={filteredRadioAltitude} />
                <HeadingOfftape ILSCourse={ILSCourse} groundTrack={groundTrack} heading={heading} selectedHeading={selectedHeading} />
                <AltitudeIndicatorOfftape
                    altitude={altitude}
                    radioAltitude={chosenRadioAltitude}
                    filteredRadioAltitude={filteredRadioAltitude}
                    MDA={mda}
                    targetAlt={targetAlt}
                    altIsManaged={isManaged}
                    mode={pressureMode}
                />
                <AirspeedIndicatorOfftape airspeed={computedAirspeed} targetSpeed={targetSpeed} speedIsManaged={!isSelected} onGround={isOnGround} />
                <MachNumber mach={mach} onGround={isOnGround} />
                <FMA isAttExcessive={isAttExcessive} />
            </svg>
        </DisplayUnit>
    );
};

const smoothSpeeds = (deltaTime: number, vlsOrigin: number, vlsDestination: number) => {
    const seconds = deltaTime / 1000;
    return SmoothSin(vlsOrigin, vlsDestination, 0.5, seconds);
};

render(<PFD />);
