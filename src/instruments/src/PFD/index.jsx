import ReactDOM from 'react-dom';
import { useState, Component } from 'react';
import { Horizon } from './AttitudeIndicatorHorizon.jsx';
import { AttitudeIndicatorFixedUpper, AttitudeIndicatorFixedCenter } from './AttitudeIndicatorFixed.jsx';
import { LandingSystem } from './LandingSystemIndicator.jsx';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator.jsx';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator.jsx';
import { AltitudeIndicatorOfftape, AltitudeIndicator } from './AltitudeIndicator.jsx';
import { AirspeedIndicatorOfftape, AirspeedIndicator } from './SpeedIndicator.jsx';
import {
    renderTarget,
    useInteractionEvent,
    useUpdate,
} from '../util.mjs';
import { SmoothSin } from './PFDUtils.jsx';
import './style.scss';

const AltModeSelected = () => {
    if (Simplane.getAutoPilotAltitudeManaged() && SimVar.GetSimVarValue('L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT', 'number') !== 0) {
        return false;
    }
    return true;
};

// eslint-disable-next-line react/prefer-stateless-function
class PFD extends Component {
    constructor(props) {
        super(props);

        const url = document.getElementsByTagName('a32nx-pfd-element')[0].getAttribute('url');
        this.dispIndex = parseInt(url.substring(url.length - 1), 10);

        this.deltaTime = 0;
        this.prevAirspeed = 0;

        this.VMax = 0;
        this.VLs = 0;
        this.VAlphaProt = 0;
        this.VAlphaLim = 0;
        this.VS = 0;

        this.smoothFactor = 0.5;

        this.LSButtonPressed = false;
    }

    componentDidMount() {
        renderTarget.parentElement.addEventListener('update', (event) => {
            this.update(event.detail);
        });
        renderTarget.parentElement.addEventListener(`A320_Neo_PFD_BTN_LS_${this.dispIndex}`, () => {
            this.onLSButtonPressed();
        });
    }

    onLSButtonPressed() {
        this.LSButtonPressed = !this.LSButtonPressed;
        SimVar.SetSimVarValue(`L:BTN_LS_${this.dispIndex}_FILTER_ACTIVE`, 'Bool', this.LSButtonPressed);
    }

    smoothSpeeds(_indicatedSpeed, _dTime, _maxSpeed, _vls, _vaprot, _valim, _vs) {
        const seconds = _dTime / 1000;
        this.VMax = SmoothSin(this.VMax, _maxSpeed, this.smoothFactor, seconds);
        this.VLs = SmoothSin(this.VLs, _vls, this.smoothFactor, seconds);
        this.VAlphaProt = SmoothSin(this.VAlphaProt, _vaprot, this.smoothFactor, seconds);
        this.VAlphaLim = SmoothSin(this.VAlphaLim, _valim, this.smoothFactor, seconds);
        this.VS = SmoothSin(this.VS, _vs, this.smoothFactor, seconds);
    }

    update(_deltaTime) {
        this.deltaTime = _deltaTime;
        this.forceUpdate();
    }

    render() {
        const pitch = -SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'degrees');
        const roll = SimVar.GetSimVarValue('PLANE BANK DEGREES', 'degrees');
        const heading = SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'degrees');

        const groundTrack = SimVar.GetSimVarValue('GPS GROUND MAGNETIC TRACK', 'degrees');

        const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');

        const radioAlt = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND MINUS CG', 'feet');
        const decisionHeight = SimVar.GetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet');

        const baroAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        const mda = SimVar.GetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');

        const FlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

        const pressureMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);

        const airspeed = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
        const airspeedAcc = (airspeed - this.prevAirspeed) / this.deltaTime * 1000;
        this.prevAirspeed = airspeed;
        const mach = SimVar.GetSimVarValue('AIRSPEED MACH', 'mach');

        const VS = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VS', 'number');
        const VMax = 0;
        const VLs = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');

        this.smoothSpeeds(airspeed, this.deltaTime, VMax, VLs, VS * 1.1, VS * 1.03, VS);

        let targetAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue();
        let isManaged = false;
        if (!AltModeSelected()) {
            const CSTAlt = SimVar.GetSimVarValue('L:A32NX_AP_CSTN_ALT', 'feet');
            if (Number.isFinite(CSTAlt)) {
                isManaged = true;
                targetAlt = CSTAlt;
            }
        }

        let targetSpeed = 0;
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const isMach = Simplane.getAutoPilotMachModeActive();
        if (isSelected) {
            if (isMach) {
                targetSpeed = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', Simplane.getAutoPilotMachHoldValue());
            } else {
                targetSpeed = Simplane.getAutoPilotAirspeedHoldValue();
            }
        } else if (isMach) {
            targetSpeed = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', Simplane.getAutoPilotManagedMachHoldValue());
        } else {
            targetSpeed = Simplane.getAutoPilotManagedAirspeedHoldValue();
        }

        const FDActive = SimVar.GetSimVarValue(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${this.dispIndex}`, 'Bool');

        let selectedHeading = NaN;
        if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number')) {
            selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false);
        }

        let ILSCourse = NaN;
        if (this.LSButtonPressed) {
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
                <AltitudeIndicator altitude={baroAlt} FWCFlightPhase={FlightPhase} />
                <AirspeedIndicator airspeed={airspeed} airspeedAcc={airspeedAcc} FWCFlightPhase={FlightPhase} altitude={baroAlt} VAlphaLim={this.VAlphaLim} VAlphaProt={this.VAlphaProt} VLs={this.VLs} />
                <path
                    id="Mask2"
                    className="BackgroundFill"
                    d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h15.609v85.473zm-113.33 0v-85.473h27.548v85.473z"
                />
                <LandingSystem LSButtonPressed={this.LSButtonPressed} />
                <AttitudeIndicatorFixedUpper />
                <AttitudeIndicatorFixedCenter isOnGround={isOnGround} FDActive={FDActive} />
                <VerticalSpeedIndicator radioAlt={radioAlt} />
                <HeadingOfftape ILSCourse={ILSCourse} heading={heading} selectedHeading={selectedHeading} />
                <AltitudeIndicatorOfftape altitude={baroAlt} radioAlt={radioAlt} MDA={mda} targetAlt={targetAlt} altIsManaged={isManaged} mode={pressureMode} />
                <AirspeedIndicatorOfftape airspeed={airspeed} mach={mach} airspeedAcc={airspeedAcc} targetSpeed={targetSpeed} speedIsManaged={!isSelected} />
            </svg>
        );
    }
}

ReactDOM.render(<PFD />, renderTarget);
