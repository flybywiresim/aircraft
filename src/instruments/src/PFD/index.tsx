import React, { useEffect, useState } from 'react';
import { Horizon } from './AttitudeIndicatorHorizon';
import { AttitudeIndicatorFixedUpper, AttitudeIndicatorFixedCenter } from './AttitudeIndicatorFixed';
import { LandingSystem } from './LandingSystemIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { AltitudeIndicatorOfftape, AltitudeIndicator } from './AltitudeIndicator';
import { AirspeedIndicatorOfftape, AirspeedIndicator } from './SpeedIndicator';
import { FMA } from './FMA';
import { getSimVar, setSimVar } from '../util.js';
import { LagFilter, RateLimiter } from './PFDUtils';
import { useSimVar } from '../Common/simVars';
import { render } from '../Common';
import './style.scss';
import { useInteractionEvent, useUpdate } from '../Common/hooks';
import { DisplayUnit } from '../Common/displayUnit';

const airspeedAccFilter = new LagFilter(1.2);
const airspeedAccRateLimiter = new RateLimiter(1.2, -1.2);
/* eslint-disable max-len */

const PFD = () => {
    const [dispIndex, setDispIndex] = useState(0);
    const [lsButtonPressed, setLsPressed] = useState(false);
    const [filteredAirspeedAcc, setAirspeedAcc] = useState(0);
    const [isAttExcessive, setAttExcessive] = useState(false);
    const [prevAirspeed, setPrevAirspeed] = useState(0);

    const [negPitch] = useSimVar('PLANE PITCH DEGREES', 'degrees');
    const pitch = -negPitch;
    const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees');

    const [unclampedAirspeed] = useSimVar('AIRSPEED INDICATED', 'knots');
    const clampedAirspeed = Math.max(unclampedAirspeed, 30);

    useEffect(() => {
        const url = document.getElementsByTagName('a32nx-pfd-element')[0].getAttribute('url') || '';
        setDispIndex(parseInt(url.substring(url.length - 1), 10));

        setLsPressed(!!getSimVar(`L:BTN_LS_${dispIndex}_FILTER_ACTIVE`, 'bool'));

        // for testing only
        setSimVar('L:A32NX_MachPreselVal', -1, 'mach');
        setSimVar('L:A32NX_SpeedPreselVal', -1, 'knots');
    }, []);

    useEffect(() => {
        if (!isAttExcessive && (pitch > 25 || pitch < -13 || Math.abs(roll) > 45)) {
            setAttExcessive(true);
        } else if (isAttExcessive && pitch < 22 && pitch > -10 && Math.abs(roll) < 40) {
            setAttExcessive(false);
        }
    }, [pitch, roll]);

    useInteractionEvent(`A320_Neo_PFD_BTN_LS_${dispIndex}`, () => {
        setSimVar(`L:BTN_LS_${dispIndex}_FILTER_ACTIVE`, !lsButtonPressed, 'bool');
        setLsPressed(!lsButtonPressed);
    });

    useUpdate((deltaTime) => {
        const airspeedAcc = (clampedAirspeed - prevAirspeed) / deltaTime * 1000;
        setPrevAirspeed(clampedAirspeed);
        const rateLimitedAirspeedAcc = airspeedAccRateLimiter.step(airspeedAcc, deltaTime / 1000);
        setAirspeedAcc(airspeedAccFilter.step(rateLimitedAirspeedAcc, deltaTime / 1000));
    });

    // We shouldn't use the normal simvar getters, and simplane here. But it should be fine for no, until we have a better
    // system for the target altitude/speeds etc. The Component will be updated anyways.
    const [armedVerticalBitmask] = useSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');
    const [activeVerticalMode] = useSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const isManaged = ((armedVerticalBitmask >> 1) & 1) || activeVerticalMode === 21 || activeVerticalMode === 20;
    const [targetAlt] = useSimVar(isManaged ? 'L:A32NX_AP_CSTN_ALT' : 'AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');

    const [speedMode] = useSimVar('AUTOPILOT SPEED SLOT INDEX', 'number');
    const isSelected = speedMode === 1;
    const [targetSpeed] = useSimVar(isSelected ? 'AUTOPILOT AIRSPEED HOLD VAR' : 'L:A32NX_SPEEDS_MANAGED_PFD', 'knots');

    const [FDActive] = useSimVar(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${dispIndex}`, 'Bool');

    const [showSelectedHeading] = useSimVar('L:A320_FCU_SHOW_SELECTED_HEADING', 'number');
    const [selectedHeadingVal] = useSimVar('AUTOPILOT HEADING LOCK DIR:1', 'degrees');
    let selectedHeading = NaN;
    if (showSelectedHeading) {
        selectedHeading = selectedHeadingVal;
    }

    const [ILSCourseVal] = useSimVar('NAV LOCALIZER:3', 'degrees');
    let ILSCourse = NaN;
    if (lsButtonPressed) {
        ILSCourse = ILSCourseVal;
    }

    return (
        <DisplayUnit
            electricitySimvar={dispIndex === 1 ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
            potentiometerIndex={dispIndex === 1 ? 88 : 90}
        >
            <svg className="pfd-svg" version="1.1" viewBox="0 0 158.75 158.75" xmlns="http://www.w3.org/2000/svg">
                <Horizon FDActive={FDActive} selectedHeading={selectedHeading} isAttExcessive={isAttExcessive} />
                <path
                    id="Mask1"
                    className="BackgroundFill"
                    d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
                />
                <HeadingTape />
                <AltitudeIndicator />
                <AirspeedIndicator airspeed={clampedAirspeed} airspeedAcc={filteredAirspeedAcc} />
                <path
                    id="Mask2"
                    className="BackgroundFill"
                    d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h15.609v85.473zm-113.33 0v-85.473h27.548v85.473z"
                />
                <LandingSystem LSButtonPressed={lsButtonPressed} />
                <AttitudeIndicatorFixedUpper />
                <AttitudeIndicatorFixedCenter FDActive={FDActive} isAttExcessive={isAttExcessive} />
                <VerticalSpeedIndicator />
                <HeadingOfftape ILSCourse={ILSCourse} selectedHeading={selectedHeading} />
                <AltitudeIndicatorOfftape targetAlt={targetAlt} altIsManaged={isManaged} />
                <AirspeedIndicatorOfftape airspeed={clampedAirspeed} airspeedAcc={filteredAirspeedAcc} targetSpeed={targetSpeed} speedIsManaged={!isSelected} />
                <FMA isAttExcessive={isAttExcessive} />
            </svg>
        </DisplayUnit>
    );
};

render(<PFD />);
