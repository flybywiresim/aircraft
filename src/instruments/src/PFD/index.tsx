import React, { Component } from 'react';
import { A320Failure, FailuresConsumer } from '@flybywiresim/failures';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Horizon } from './AttitudeIndicatorHorizon';
import { AttitudeIndicatorFixedUpper, AttitudeIndicatorFixedCenter } from './AttitudeIndicatorFixed';
import { LandingSystem } from './LandingSystemIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { AltitudeIndicatorOfftape, AltitudeIndicator } from './AltitudeIndicator';
import { AirspeedIndicatorOfftape, AirspeedIndicator, MachNumber } from './SpeedIndicator';
import { FMA } from './FMA';
import { getSimVar, setSimVar, renderTarget, createDeltaTimeCalculator } from '../util.js';
import { SmoothSin, LagFilter, RateLimiter } from './PFDUtils';
import { DisplayUnit } from '../Common/displayUnit';
import { render } from '../Common';
import './style.scss';

/* eslint-disable max-len */
// eslint-disable-next-line react/prefer-stateless-function
class PFD extends Component {
    private displayIndex: number;

    private deltaTime: number;

    private GetDeltaTime: () => number;

    private prevAirspeed: number;

    private VLs: number;

    private barTimer: number;

    private smoothFactor: number;

    private isAttExcessive: boolean;

    private AirspeedAccFilter: LagFilter;

    private AirspeedAccRateLimiter: RateLimiter;

    private LSButtonPressed: boolean;

    private failuresConsumer: FailuresConsumer;

    constructor(props: {}) {
        super(props);

        const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
        if (url) {
            this.displayIndex = parseInt(url.substring(url.length - 1), 10);
        }

        this.deltaTime = 0;
        this.GetDeltaTime = createDeltaTimeCalculator();
        this.prevAirspeed = 0;

        this.VLs = 0;

        this.barTimer = 10;

        this.smoothFactor = 0.5;

        this.isAttExcessive = false;

        this.AirspeedAccFilter = new LagFilter(1.2);
        this.AirspeedAccRateLimiter = new RateLimiter(1.2, -1.2);

        this.LSButtonPressed = false;

        this.failuresConsumer = new FailuresConsumer('A32NX');
        this.failuresConsumer.register(this.isCaptainSide() ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);
    }

    componentDidMount() {
        renderTarget.parentElement.addEventListener('update', () => {
            this.update(this.GetDeltaTime());
        });
        renderTarget.parentElement.addEventListener(`A320_Neo_PFD_BTN_LS_${this.displayIndex}`, () => {
            this.onLSButtonPressed();
        });
    }

    onLSButtonPressed() {
        this.LSButtonPressed = !this.LSButtonPressed;
        setSimVar(`L:BTN_LS_${this.displayIndex}_FILTER_ACTIVE`, this.LSButtonPressed, 'Bool');
    }

    getSupplier(knobValue: number) {
        const adirs3ToCaptain = 0;
        const adirs3ToFO = 2;

        if (this.isCaptainSide()) {
            return knobValue === adirs3ToCaptain ? 3 : 1;
        }
        return knobValue === adirs3ToFO ? 3 : 2;
    }

    isCaptainSide() {
        return this.displayIndex === 1;
    }

    smoothSpeeds(_dTime: number, _vls: number) {
        const seconds = _dTime / 1000;
        this.VLs = SmoothSin(this.VLs, _vls, this.smoothFactor, seconds);
    }

    update(_deltaTime: number) {
        this.deltaTime = _deltaTime;
        this.failuresConsumer.update();
        this.forceUpdate();
    }

    render() {
        const inertialReferenceSource = this.getSupplier(getSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'Enum'));
        const airDataReferenceSource = this.getSupplier(getSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));

        const pitch = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_PITCH`);
        const roll = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_ROLL`);

        if (!this.isAttExcessive && ((pitch.isNormal() && (-pitch.value > 25 || -pitch.value < -13)) || (roll.isNormal() && Math.abs(roll.value) > 45))) {
            this.isAttExcessive = true;
        } else if (this.isAttExcessive && pitch.isNormal() && -pitch.value < 22 && -pitch.value > -10 && roll.isNormal() && Math.abs(roll.value) < 40) {
            this.isAttExcessive = false;
        }

        const heading = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_HEADING`);
        const groundTrack = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_TRACK`);

        const isOnGround = getSimVar('SIM ON GROUND', 'Bool');

        const radioAlt = getSimVar('PLANE ALT ABOVE GROUND MINUS CG', 'feet');
        const decisionHeight = getSimVar('L:AIRLINER_DECISION_HEIGHT', 'feet');

        const altitude = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_ALTITUDE`);

        // When available, the IR V/S has priority over the ADR barometric V/S.
        const inertialVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_VERTICAL_SPEED`);
        const barometricVerticalSpeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_BAROMETRIC_VERTICAL_SPEED`);
        const verticalSpeed = inertialVerticalSpeed.isNormal() ? inertialVerticalSpeed : barometricVerticalSpeed;

        const mda = getSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');

        const FlightPhase = getSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

        // eslint-disable-next-line no-undef
        const pressureMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);

        const computedAirspeed = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_COMPUTED_AIRSPEED`);
        const clampedAirspeed = computedAirspeed.isNormal() ? Math.max(computedAirspeed.value, 30) : NaN;
        const airspeedAcc = (clampedAirspeed - this.prevAirspeed) / this.deltaTime * 1000;
        this.prevAirspeed = clampedAirspeed;

        const rateLimitedAirspeedAcc = this.AirspeedAccRateLimiter.step(airspeedAcc, this.deltaTime / 1000);
        const filteredAirspeedAcc = this.AirspeedAccFilter.step(rateLimitedAirspeedAcc, this.deltaTime / 1000);

        const mach = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_MACH`);

        const VMax = getSimVar('L:A32NX_SPEEDS_VMAX', 'number');
        const VLs = getSimVar('L:A32NX_SPEEDS_VLS', 'number');

        let showSpeedBars = true;
        if (isOnGround) {
            showSpeedBars = false;
            this.barTimer = 0;
        } else if (this.barTimer < 10) {
            showSpeedBars = false;
            this.barTimer += this.deltaTime / 1000;
        }

        this.smoothSpeeds(this.deltaTime, VLs);

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

        const FDActive = getSimVar(`AUTOPILOT FLIGHT DIRECTOR ACTIVE:${this.displayIndex}`, 'Bool');

        let selectedHeading: number = NaN;
        if (getSimVar('L:A320_FCU_SHOW_SELECTED_HEADING', 'number')) {
            selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false) || 0;
        }

        let ILSCourse = NaN;
        if (this.LSButtonPressed) {
            ILSCourse = getSimVar('NAV LOCALIZER:3', 'degrees');
        }

        return (
            <DisplayUnit
                electricitySimvar={this.isCaptainSide() ? 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED' : 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED'}
                potentiometerIndex={this.isCaptainSide() ? 88 : 90}
                failed={this.failuresConsumer.isActive(this.isCaptainSide() ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay)}
            >
                <svg className="pfd-svg" version="1.1" viewBox="0 0 158.75 158.75" xmlns="http://www.w3.org/2000/svg">
                    <Horizon pitch={pitch} roll={roll} heading={heading} FDActive={FDActive} selectedHeading={selectedHeading} isOnGround={isOnGround} radioAlt={radioAlt} decisionHeight={decisionHeight} isAttExcessive={this.isAttExcessive} deltaTime={this.deltaTime} />
                    <path
                        id="Mask1"
                        className="BackgroundFill"
                        d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
                    />
                    <HeadingTape heading={heading} />
                    <AltitudeIndicator altitude={altitude} FWCFlightPhase={FlightPhase} />
                    <AirspeedIndicator airspeed={clampedAirspeed} airspeedAcc={filteredAirspeedAcc} FWCFlightPhase={FlightPhase} altitude={altitude} VLs={this.VLs} VMax={VMax} showBars={showSpeedBars} />
                    <path
                        id="Mask2"
                        className="BackgroundFill"
                        d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h15.609v85.473zm-113.33 0v-85.473h27.548v85.473z"
                    />
                    <LandingSystem LSButtonPressed={this.LSButtonPressed} deltaTime={this.deltaTime} />
                    <AttitudeIndicatorFixedUpper pitch={pitch} roll={roll} />
                    <AttitudeIndicatorFixedCenter pitch={pitch} roll={roll} isOnGround={isOnGround} FDActive={FDActive} isAttExcessive={this.isAttExcessive} />
                    <VerticalSpeedIndicator radioAlt={radioAlt} verticalSpeed={verticalSpeed} />
                    <HeadingOfftape ILSCourse={ILSCourse} groundTrack={groundTrack} heading={heading} selectedHeading={selectedHeading} />
                    <AltitudeIndicatorOfftape altitude={altitude} radioAlt={radioAlt} MDA={mda} targetAlt={targetAlt} altIsManaged={isManaged} mode={pressureMode} />
                    <AirspeedIndicatorOfftape airspeed={clampedAirspeed} targetSpeed={targetSpeed} speedIsManaged={!isSelected} />
                    <MachNumber mach={mach} airspeedAcc={filteredAirspeedAcc} />
                    <FMA isAttExcessive={this.isAttExcessive} />
                </svg>
            </DisplayUnit>
        );
    }
}

render(<PFD />);
