import ReactDOM from 'react-dom';
import { useState } from 'react';
import { Horizon } from './AttitudeIndicatorHorizon.jsx';
import { AttitudeIndicatorFixedUpper, AttitudeIndicatorFixedCenter } from './AttitudeIndicatorFixed.jsx';
import { LandingSystem } from './LandingSystemIndicator.jsx';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator.jsx';
import { HeadingOfftape, HeadingTape } from "./HeadingIndicator.jsx";
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
} from '../util.mjs';
import './style.scss';

function PFD() {
    const [update, setUpdate] = useState(false);

    useUpdate((deltaTime) => {
        setUpdate(!update);
    });

    const [LSButtonPressed, setLSButtonPressed] = useState(false);

    const dispIndex = 1;

    useInteractionEvent(`A320_Neo_PFD_BTN_LS_${dispIndex}`, () => {
        const currentState = SimVar.GetSimVarValue(`L:BTN_LS_${dispIndex}_FILTER_ACTIVE`, 'Bool');
        setLSButtonPressed(!currentState);
        SimVar.SetSimVarValue(`L:BTN_LS_${dispIndex}_FILTER_ACTIVE`, 'number', !currentState ? 1 : 0);
    });

    const pitch = -SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'degrees');
    const roll = SimVar.GetSimVarValue('PLANE BANK DEGREES', 'degrees');
    const heading = SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'degrees');

    const groundTrack = SimVar.GetSimVarValue('GPS GROUND MAGNETIC TRACK', 'degrees');

    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');

    const radioAlt = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND MINUS CG', 'feet');
    const decisionHeight = SimVar.GetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet');

    const FDActive = SimVar.GetSimVarValue(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${dispIndex}`, 'Bool');

    let selectedHeading = NaN;
    if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number')) {
        selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false);
    }

    let ILSCourse = NaN;
    if (LSButtonPressed) {
        ILSCourse = SimVar.GetSimVarValue('NAV LOCALIZER:3', 'degrees');
    }

    return (
        <svg className="pfd-svg" version="1.1" viewBox="0 0 158.75 158.75" xmlns="http://www.w3.org/2000/svg">
            <Horizon pitch={pitch} roll={roll} heading={heading} FDActive={FDActive} selectedHeading={selectedHeading} isOnGround={isOnGround} radioAlt={radioAlt} decisionHeight={decisionHeight} />
            <path
                id="Mask1"
                className="BackgroundFill"
                d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
            />
            <HeadingTape heading={heading} groundTrack={groundTrack} ILSCourse={ILSCourse} />
            <path id="SpeedTapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" className="TapeBackground" />
            <path id="AltTapeBackground" d="m130.85 123.56h-13.096v-85.473h13.096z" className="TapeBackground" />
            <path
                id="Mask2"
                className="BackgroundFill"
                d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h15.609v85.473zm-113.33 0v-85.473h27.548v85.473z"
            />
            <LandingSystem LSButtonPressed={LSButtonPressed} />
            <AttitudeIndicatorFixedUpper />
            <AttitudeIndicatorFixedCenter isOnGround={isOnGround} FDActive={FDActive} />
            <VerticalSpeedIndicator radioAlt={radioAlt} />
            <HeadingOfftape ILSCourse={ILSCourse} heading={heading} selectedHeading={selectedHeading} />
        </svg>
    );
}

ReactDOM.render(<PFD />, renderTarget);
