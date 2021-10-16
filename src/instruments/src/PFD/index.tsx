import React, { useReducer, useState } from 'react';
import { A320Failure, FailuresConsumer } from '@flybywiresim/failures';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useInteractionEvent, useUpdate } from '@instruments/common/hooks';
import { Horizon } from './AttitudeIndicatorHorizon';
import {
    AttitudeIndicatorFixedUpper,
    AttitudeIndicatorFixedCenter,
    AttitudeIndicatorFixedCenterFail,
} from './AttitudeIndicatorFixed';
import { LandingSystem } from './LandingSystemIndicator';
import { VerticalSpeedIndicator, VerticalSpeedIndicatorFail } from './VerticalSpeedIndicator';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { AltitudeIndicatorOfftape, AltitudeIndicator, AltitudeIndicatorOfftapeFail } from './AltitudeIndicator';
import {
    AirspeedIndicatorOfftape,
    AirspeedIndicator,
    MachNumber,
    AirspeedIndicatorFail,
    AirspeedIndicatorOfftapeFail,
} from './SpeedIndicator';
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
    const [clampedAirspeed, setClampedAirspeed] = useState(0);
    const [filteredAirspeedAcc, setfilteredAirspeedAcc] = useState(0);

    const [airspeedAccFilter] = useState(() => new LagFilter(1.2));
    const [airspeedAccRateLimiter] = useState(() => new RateLimiter(1.2, -1.2));

    const [isAttExcessive, setIsAttExcessive] = useState(false);

    const [lsButtonPressed, setLsButtonPressed] = useState(false);

    const [barTimer, setBarTimer] = useState(10);
    const [showSpeedBars, setShowSpeedBars] = useState(true);

    const inertialReferenceSource = getSupplier(displayIndex, getSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
    const airDataReferenceSource = getSupplier(displayIndex, getSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    const computedAirspeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_COMPUTED_AIRSPEED`);

    const isOnGround = getSimVar('SIM ON GROUND', 'Bool');

    const [vls, setVls] = useState(0);

    const [_, forceUpdate] = useReducer((x) => (x > Number.MAX_SAFE_INTEGER ? 0 : x + 1), 0);
    useUpdate((deltaTime) => {
        failuresConsumer.update();

        const clamped = computedAirspeed.isNormalOperation() ? Math.max(computedAirspeed.value, 30) : NaN;
        const airspeedAcc = (clamped - previousAirspeed) / deltaTime * 1000;
        setPreviousAirspeed(clamped);
        setClampedAirspeed(Number.isNaN(clamped) ? NaN : Number(clamped.toFixed(1)));

        const rateLimitedAirspeedAcc = airspeedAccRateLimiter.step(airspeedAcc, deltaTime / 1000);
        setfilteredAirspeedAcc(airspeedAccFilter.step(rateLimitedAirspeedAcc, deltaTime / 1000));

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

    const radioAlt = getSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'feet');

    const decisionHeight = getSimVar('L:AIRLINER_DECISION_HEIGHT', 'feet');

    const altitude = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_ALTITUDE`);

    // When available, the IR V/S has priority over the ADR barometric V/S.
    const inertialVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_VERTICAL_SPEED`);
    const barometricVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_BAROMETRIC_VERTICAL_SPEED`);
    const verticalSpeed = inertialVerticalSpeed.isNormalOperation() ? inertialVerticalSpeed : barometricVerticalSpeed;

    const mda = getSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');

    const FlightPhase = getSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

    const pressureMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);

    const mach = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_MACH`);

    const fixedMach = Number(mach.value.toFixed(3));

    const VMax = getSimVar('L:A32NX_SPEEDS_VMAX', 'number');
    const fixedVMax = Number(VMax.toFixed(1));

    const armedVerticalBitmask = getSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');
    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const armedLateralBitmask = getSimVar('L:A32NX_FMA_LATERAL_ARMED', 'number');
    const fmgcFlightPhase = getSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum');
    const cstnAlt = getSimVar('L:A32NX_AP_CSTN_ALT', 'feet');
    const altArmed = (armedVerticalBitmask >> 1) & 1;
    const clbArmed = (armedVerticalBitmask >> 2) & 1;
    const navArmed = (armedLateralBitmask >> 0) & 1;
    const isManaged = !!(altArmed || activeVerticalMode === 21 || activeVerticalMode === 20 || (!!cstnAlt && fmgcFlightPhase < 2 && clbArmed && navArmed));
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
                    radioAlt={radioAlt}
                    decisionHeight={decisionHeight}
                    isAttExcessive={isAttExcessive}
                />
                <path
                    id="Mask1"
                    className="BackgroundFill"
                    // eslint-disable-next-line max-len
                    d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
                />
                <HeadingTape heading={heading} />
                <AltitudeIndicator altitude={altitude} FWCFlightPhase={FlightPhase} />

                {!Number.isNaN(clampedAirspeed) ? (
                    <AirspeedIndicator
                        airspeed={clampedAirspeed}
                        airspeedAcc={Number(filteredAirspeedAcc.toFixed(3))}
                        FWCFlightPhase={FlightPhase}
                        altitude={altitude}
                        VLs={vls}
                        VMax={fixedVMax}
                        showBars={showSpeedBars}
                    />
                ) : (
                    <AirspeedIndicatorFail />
                )}

                <path
                    id="Mask2"
                    className="BackgroundFill"
                    // eslint-disable-next-line max-len
                    d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h15.609v85.473zm-113.33 0v-85.473h27.548v85.473z"
                />
                <LandingSystem LSButtonPressed={lsButtonPressed} />

                {pitch.isNormalOperation() && roll.isNormalOperation() && (
                    <AttitudeIndicatorFixedUpper />
                )}

                {pitch.isNormalOperation() && roll.isNormalOperation() ? (
                    <AttitudeIndicatorFixedCenter isOnGround={isOnGround} FDActive={FDActive} isAttExcessive={isAttExcessive} />
                ) : (
                    <AttitudeIndicatorFixedCenterFail />
                )}

                {verticalSpeed.isNormalOperation() ? (
                    <VerticalSpeedIndicator radioAlt={Math.round(radioAlt)} verticalSpeed={Math.round(verticalSpeed.value)} />
                ) : (
                    <VerticalSpeedIndicatorFail />
                )}

                <HeadingOfftape selectedHeading={selectedHeading} inertialReferenceSource={inertialReferenceSource} />

                {altitude.isNormalOperation() ? (
                    <AltitudeIndicatorOfftape
                        altitude={altitude.value}
                        radioAlt={radioAlt}
                        MDA={mda}
                        targetAlt={targetAlt}
                        altIsManaged={isManaged}
                        mode={pressureMode}
                    />
                ) : (
                    <AltitudeIndicatorOfftapeFail />
                )}

                {!Number.isNaN(clampedAirspeed) ? (
                    <AirspeedIndicatorOfftape
                        airspeed={clampedAirspeed}
                        targetSpeed={targetSpeed}
                        speedIsManaged={!isSelected}
                    />
                ) : (
                    <AirspeedIndicatorOfftapeFail />
                )}

                {mach.isNormalOperation() ? (
                    <MachNumber mach={fixedMach} />
                ) : (
                    <text id="MachFailText" className="Blink9Seconds FontLargest StartAlign Red" x="5.4257932" y="136.88908">MACH</text>
                )}

                <FMA isAttExcessive={isAttExcessive} />
            </svg>
        </DisplayUnit>
    );
};

const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
    const adirs3ToCaptain = 0;
    const adirs3ToFO = 2;

    if (isCaptainSide(displayIndex)) {
        return knobValue === adirs3ToCaptain ? 3 : 1;
    }
    return knobValue === adirs3ToFO ? 3 : 2;
};

const smoothSpeeds = (deltaTime: number, vlsOrigin: number, vlsDestination: number) => {
    const seconds = deltaTime / 1000;
    return SmoothSin(vlsOrigin, vlsDestination, 0.5, seconds);
};

render(<PFD />);
